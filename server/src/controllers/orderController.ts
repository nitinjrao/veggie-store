import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        vegetableId: z.string().uuid(),
        quantity: z.number().positive(),
        unit: z.enum(['KG', 'GRAM', 'PIECE', 'BUNCH', 'PACKET', 'BUNDLE']),
      })
    )
    .min(1, 'At least one item is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
});

async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `VG-${dateStr}-`;

  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${seq.toString().padStart(3, '0')}`;
}

export const placeOrder = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { items, address, notes } = placeOrderSchema.parse(req.body);

  const order = await prisma.$transaction(async (tx) => {
    // Fetch all vegetables with current prices
    const vegetableIds = items.map((i) => i.vegetableId);
    const vegetables = await tx.vegetable.findMany({
      where: { id: { in: vegetableIds } },
      include: { prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 } },
    });

    const vegMap = new Map(vegetables.map((v) => [v.id, v]));

    // Validate and compute line items
    let totalAmount = new Decimal(0);
    const orderItems: {
      vegetableId: string;
      quantity: Decimal;
      unit: 'KG' | 'GRAM' | 'PIECE' | 'BUNCH' | 'PACKET' | 'BUNDLE';
      unitPrice: Decimal;
      totalPrice: Decimal;
      stockDeductKg: Decimal;
    }[] = [];

    for (const item of items) {
      const veg = vegMap.get(item.vegetableId);
      if (!veg) {
        throw new ApiError(400, `Vegetable not found: ${item.vegetableId}`);
      }
      if (!veg.available) {
        throw new ApiError(400, `${veg.name} is currently unavailable`);
      }

      const price = veg.prices[0];
      if (!price) {
        throw new ApiError(400, `No price set for ${veg.name}`);
      }

      let unitPrice: Decimal;
      let stockDeductKg: Decimal;

      switch (item.unit) {
        case 'KG':
          if (!price.pricePerKg) throw new ApiError(400, `${veg.name} is not sold by KG`);
          unitPrice = price.pricePerKg;
          stockDeductKg = new Decimal(item.quantity);
          break;
        case 'GRAM':
          if (!price.pricePerKg) throw new ApiError(400, `${veg.name} is not sold by weight`);
          unitPrice = price.pricePerKg.div(1000);
          stockDeductKg = new Decimal(item.quantity).div(1000);
          break;
        case 'PIECE':
          if (!price.pricePerPiece) throw new ApiError(400, `${veg.name} is not sold by piece`);
          unitPrice = price.pricePerPiece;
          // Estimate ~0.5kg per piece for stock
          stockDeductKg = new Decimal(item.quantity).mul(0.5);
          break;
        case 'PACKET':
          if (!price.pricePerPacket) throw new ApiError(400, `${veg.name} is not sold by packet`);
          unitPrice = price.pricePerPacket;
          stockDeductKg = price.packetWeight
            ? new Decimal(item.quantity).mul(price.packetWeight)
            : new Decimal(item.quantity).mul(0.5);
          break;
        case 'BUNDLE':
          if (!price.pricePerBundle) throw new ApiError(400, `${veg.name} is not sold by bundle`);
          unitPrice = price.pricePerBundle;
          stockDeductKg = new Decimal(item.quantity).mul(0.5);
          break;
        default:
          if (!price.pricePerKg) throw new ApiError(400, `${veg.name} has no applicable price`);
          unitPrice = price.pricePerKg;
          stockDeductKg = new Decimal(item.quantity);
      }

      // Check stock
      if (veg.stockKg.lessThan(stockDeductKg)) {
        throw new ApiError(400, `Insufficient stock for ${veg.name}. Available: ${veg.stockKg}kg`);
      }

      const lineTotal = unitPrice.mul(item.quantity);
      totalAmount = totalAmount.add(lineTotal);

      orderItems.push({
        vegetableId: item.vegetableId,
        quantity: new Decimal(item.quantity),
        unit: item.unit,
        unitPrice,
        totalPrice: lineTotal,
        stockDeductKg,
      });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount,
        address,
        notes,
        items: {
          create: orderItems.map(({ stockDeductKg: _, ...oi }) => oi),
        },
      },
      include: {
        items: { include: { vegetable: { include: { category: true, prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } } },
      },
    });

    // Deduct stock and create inventory logs
    for (const oi of orderItems) {
      await tx.vegetable.update({
        where: { id: oi.vegetableId },
        data: { stockKg: { decrement: oi.stockDeductKg } },
      });

      await tx.inventoryLog.create({
        data: {
          vegetableId: oi.vegetableId,
          orderId: created.id,
          changeType: 'SALE',
          quantity: oi.stockDeductKg.negated(),
          notes: `Order ${created.orderNumber}`,
        },
      });
    }

    return created;
  });

  res.status(201).json(order);
};

export const getMyOrders = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId },
      include: {
        items: { include: { vegetable: { include: { category: true, prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { customerId } }),
  ]);

  res.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const getOrderById = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { vegetable: { include: { category: true, prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 } } } } },
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.customerId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }

  res.json(order);
};
