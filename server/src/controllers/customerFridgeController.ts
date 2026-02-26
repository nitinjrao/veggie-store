import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/getUser';
import { parsePagination } from '../utils/pagination';
import { generateFridgeOrderNumber } from '../utils/orderNumber';

// ─── Schemas ────────────────────────────────────────────────────────

const placePickupOrderSchema = z.object({
  refrigeratorId: z.string().uuid(),
  items: z
    .array(
      z.object({
        vegetableId: z.string().uuid(),
        quantity: z.number().positive(),
        unit: z.enum(['KG', 'GRAM', 'PIECE', 'BUNCH', 'PACKET', 'BUNDLE']),
      })
    )
    .min(1, 'At least one item is required'),
});

const markPaidSchema = z.object({
  method: z.enum(['CASH', 'UPI']),
  reference: z.string().optional(),
});

// ─── Controllers ────────────────────────────────────────────────────

export const listLocations = async (_req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    where: { active: true },
    include: {
      refrigerators: {
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.json(locations);
};

export const getFridgeInventory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fridge = await prisma.refrigerator.findUnique({
    where: { id },
    include: {
      location: true,
      inventory: {
        where: { quantityAvailable: { gt: 0 } },
        include: {
          vegetable: {
            include: {
              category: true,
              prices: {
                orderBy: { effectiveFrom: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!fridge) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  res.json(fridge);
};

export const placePickupOrder = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const { refrigeratorId, items } = placePickupOrderSchema.parse(req.body);

  const order = await prisma.$transaction(async (tx) => {
    // 1. Validate fridge exists and is ACTIVE
    const fridge = await tx.refrigerator.findUnique({ where: { id: refrigeratorId } });
    if (!fridge) {
      throw new ApiError(404, 'Refrigerator not found');
    }
    if (fridge.status !== 'ACTIVE') {
      throw new ApiError(400, 'Refrigerator is not currently active');
    }

    // 2. Fetch all vegetables with current prices
    const vegetableIds = items.map((i) => i.vegetableId);
    const vegetables = await tx.vegetable.findMany({
      where: { id: { in: vegetableIds } },
      include: { prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 } },
    });

    const vegMap = new Map(vegetables.map((v) => [v.id, v]));

    // 3. Validate and compute line items
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

      const price = veg.prices[0];
      if (!price) {
        throw new ApiError(400, `No price set for ${veg.name}`);
      }

      if (!veg.available) {
        throw new ApiError(400, `${veg.name} is currently unavailable`);
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
        case 'BUNCH':
          if (!price.pricePerBunch) throw new ApiError(400, `${veg.name} is not sold by bunch`);
          unitPrice = price.pricePerBunch;
          stockDeductKg = new Decimal(item.quantity).mul(0.5);
          break;
        default:
          if (!price.pricePerKg) throw new ApiError(400, `${veg.name} has no applicable price`);
          unitPrice = price.pricePerKg;
          stockDeductKg = new Decimal(item.quantity);
      }

      // Check main vegetable stock
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

    // 4. Generate order number
    const orderNumber = await generateFridgeOrderNumber();

    // 5. Create FridgePickupOrder + FridgePickupItems
    const created = await tx.fridgePickupOrder.create({
      data: {
        orderNumber,
        customerId,
        refrigeratorId,
        totalAmount,
        items: {
          create: orderItems.map(({ stockDeductKg: _, ...oi }) => oi),
        },
      },
      include: {
        items: {
          include: {
            vegetable: {
              include: {
                category: true,
                prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
              },
            },
          },
        },
        refrigerator: { include: { location: true } },
      },
    });

    // 6. Deduct main vegetable stock and create inventory logs
    for (const oi of orderItems) {
      await tx.vegetable.update({
        where: { id: oi.vegetableId },
        data: { stockKg: { decrement: oi.stockDeductKg } },
      });

      await tx.inventoryLog.create({
        data: {
          vegetableId: oi.vegetableId,
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

export const getMyPickupOrders = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string }, 10);

  const [orders, total] = await Promise.all([
    prisma.fridgePickupOrder.findMany({
      where: { customerId },
      include: {
        items: {
          include: {
            vegetable: {
              include: {
                category: true,
                prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
              },
            },
          },
        },
        refrigerator: { include: { location: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.fridgePickupOrder.count({ where: { customerId } }),
  ]);

  res.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const getPickupOrder = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          vegetable: {
            include: {
              category: true,
              prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
            },
          },
        },
      },
      refrigerator: { include: { location: true } },
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, 'Pickup order not found');
  }

  if (order.customerId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }

  res.json(order);
};

export const markPickupOrderPaid = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const id = req.params.id as string;
  const { method, reference } = markPaidSchema.parse(req.body);

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });

  if (!order) {
    throw new ApiError(404, 'Pickup order not found');
  }

  if (order.customerId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }

  if (order.paymentStatus === 'PAID') {
    throw new ApiError(400, 'Order is already marked as paid');
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: {
      paidAmount: order.totalAmount,
      paymentStatus: 'PAID',
    },
    include: {
      items: {
        include: {
          vegetable: {
            include: {
              category: true,
              prices: { orderBy: { effectiveFrom: 'desc' }, take: 1 },
            },
          },
        },
      },
      refrigerator: { include: { location: true } },
    },
  });

  res.json({
    ...updated,
    customerPaymentMethod: method,
    customerPaymentRef: reference ?? null,
  });
};
