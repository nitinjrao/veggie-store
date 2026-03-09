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
  refrigeratorId: z.string().uuid().optional(),
  orderType: z.enum(['FRIDGE_PICKUP', 'HOME_DELIVERY']).default('FRIDGE_PICKUP'),
  addressId: z.string().uuid().optional(),
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
  screenshotUrl: z.string().optional(),
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
  const { refrigeratorId, orderType, addressId, items } = placePickupOrderSchema.parse(req.body);

  // Validate based on order type
  if (orderType === 'FRIDGE_PICKUP' && !refrigeratorId) {
    throw new ApiError(400, 'refrigeratorId is required for fridge pickup orders');
  }
  if (orderType === 'HOME_DELIVERY' && !addressId) {
    throw new ApiError(400, 'addressId is required for home delivery orders');
  }

  // Validate mandatory profile fields before placing order
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { _count: { select: { addresses: true } } },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  if (!customer.whatsapp || customer.whatsapp.trim() === '') {
    throw new ApiError(400, 'WhatsApp number is required before placing an order. Please update your profile.');
  }

  if (customer._count.addresses === 0) {
    throw new ApiError(400, 'At least one address is required before placing an order. Please add an address.');
  }

  const order = await prisma.$transaction(async (tx) => {
    // 1. Validate fridge (for FRIDGE_PICKUP) or address (for HOME_DELIVERY)
    if (orderType === 'FRIDGE_PICKUP') {
      const fridge = await tx.refrigerator.findUnique({ where: { id: refrigeratorId! } });
      if (!fridge) {
        throw new ApiError(404, 'Refrigerator not found');
      }
      if (fridge.status !== 'ACTIVE') {
        throw new ApiError(400, 'Refrigerator is not currently active');
      }
    }

    if (orderType === 'HOME_DELIVERY') {
      const address = await tx.address.findUnique({ where: { id: addressId! } });
      if (!address) {
        throw new ApiError(404, 'Address not found');
      }
      if (address.customerId !== customerId) {
        throw new ApiError(403, 'Address does not belong to this customer');
      }
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

      // Check warehouse stock
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
        orderType,
        refrigeratorId: orderType === 'FRIDGE_PICKUP' ? refrigeratorId! : null,
        addressId: orderType === 'HOME_DELIVERY' ? addressId! : null,
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
        address: true,
      },
    });

    // 6. Deduct warehouse stock and create inventory logs
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
  const { method, reference, screenshotUrl } = markPaidSchema.parse(req.body);

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

  const updateData: Record<string, unknown> = {
    paidAmount: order.totalAmount,
    paymentStatus: 'PAID',
  };

  // Store screenshot URL and payment info in notes for admin visibility
  const paymentInfo = [
    `Payment: ${method}`,
    reference ? `Ref: ${reference}` : null,
    screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  if (paymentInfo) {
    updateData.notes = order.notes ? `${order.notes}\n${paymentInfo}` : paymentInfo;
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: updateData,
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
    customerScreenshotUrl: screenshotUrl ?? null,
  });
};

// ─── Payment screenshot upload ──────────────────────────────────────

export const uploadPaymentScreenshot = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });

  if (!order) {
    throw new ApiError(404, 'Pickup order not found');
  }

  if (order.customerId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }

  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot upload screenshot for a cancelled order');
  }

  if (!req.file) {
    throw new ApiError(400, 'Screenshot file is required');
  }

  const screenshotUrl = `/uploads/${req.file.filename}`;

  res.json({ screenshotUrl });
};

// ─── Profile completeness check ─────────────────────────────────────

export const getProfileCompleteness = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { _count: { select: { addresses: true } } },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const whatsappSet = !!customer.whatsapp && customer.whatsapp.trim() !== '';
  const hasAddress = customer._count.addresses > 0;

  res.json({
    whatsappSet,
    hasAddress,
    canOrder: whatsappSet && hasAddress,
  });
};
