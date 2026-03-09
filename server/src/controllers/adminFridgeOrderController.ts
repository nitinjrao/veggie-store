import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, FridgeOrderStatus, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { parsePagination } from '../utils/pagination';
import { getAuthUser } from '../utils/getUser';
import { computePaymentStatus } from '../utils/payment';
import { createNotification } from '../lib/notifications';

const fridgeOrderInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  refrigerator: {
    include: {
      location: { select: { id: true, name: true, address: true } },
    },
  },
  address: { select: { id: true, label: true, text: true } },
  items: {
    include: {
      vegetable: { select: { id: true, name: true, emoji: true } },
    },
  },
  payments: {
    include: {
      loggedBy: { select: { id: true, name: true } },
    },
    orderBy: { receivedAt: 'desc' as const },
  },
  assignedTo: { select: { id: true, name: true } },
};

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED']),
  notes: z.string().optional(),
});

const logPaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'UPI']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const listFridgeOrders = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const refrigeratorId = req.query.refrigeratorId as string | undefined;
  const status = req.query.status as string | undefined;
  const paymentStatus = req.query.paymentStatus as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Prisma.FridgePickupOrderWhereInput = {};

  if (refrigeratorId) {
    where.refrigeratorId = refrigeratorId;
  }

  if (status && status !== 'ALL') {
    where.status = status as FridgeOrderStatus;
  }

  if (paymentStatus && paymentStatus !== 'ALL') {
    where.paymentStatus = paymentStatus as PaymentStatus;
  }

  if (search?.trim()) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.fridgePickupOrder.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        refrigerator: {
          include: {
            location: { select: { id: true, name: true } },
          },
        },
        address: { select: { id: true, label: true, text: true } },
        items: {
          include: {
            vegetable: { select: { id: true, name: true, emoji: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.fridgePickupOrder.count({ where }),
  ]);

  res.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const getFridgeOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: fridgeOrderInclude,
  });

  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  res.json(order);
};

export const updateFridgeOrderStatus = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;
  const { status, notes } = updateStatusSchema.parse(req.body);

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: {
      items: {
        include: { vegetable: { select: { id: true, name: true } } },
      },
    },
  });
  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  // Terminal states: cannot transition out of CANCELLED or DELIVERED
  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot update a cancelled order');
  }
  if (order.status === 'DELIVERED') {
    throw new ApiError(400, 'Cannot update a delivered order');
  }

  // Validate state transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['READY', 'CANCELLED'],
    READY: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['DELIVERED', 'CANCELLED'],
  };

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${status}`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Record<string, unknown> = { status };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status === 'CONFIRMED') {
      // Deduct from main vegetable stock
      for (const item of order.items) {
        const vegetable = await tx.vegetable.findUnique({
          where: { id: item.vegetableId },
        });

        if (!vegetable) {
          throw new ApiError(400, `Vegetable not found`);
        }

        // Convert quantity to KG for stock deduction
        let deductKg = item.quantity;
        if (item.unit === 'GRAM') {
          deductKg = item.quantity.div(1000);
        }

        if (vegetable.stockKg.lessThan(deductKg)) {
          const vegName = item.vegetable?.name || vegetable.name;
          throw new ApiError(
            400,
            `Insufficient stock for "${vegName}". Available: ${vegetable.stockKg} kg, Required: ${deductKg} kg.`
          );
        }

        await tx.vegetable.update({
          where: { id: item.vegetableId },
          data: { stockKg: { decrement: deductKg } },
        });
      }

      updateData.confirmedAt = new Date();

      // If the user is a producer, assign them
      if (user.role === 'producer') {
        updateData.assignedToId = user.id;
      }
    }

    if (status === 'READY') {
      updateData.readyAt = new Date();
    }

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    }

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (status === 'CANCELLED') {
      // If was CONFIRMED or READY, restore main vegetable stock
      if (order.status === 'CONFIRMED' || order.status === 'READY') {
        for (const item of order.items) {
          let restoreKg = item.quantity;
          if (item.unit === 'GRAM') {
            restoreKg = item.quantity.div(1000);
          }

          await tx.vegetable.update({
            where: { id: item.vegetableId },
            data: { stockKg: { increment: restoreKg } },
          });
        }
      }

      updateData.cancelledAt = new Date();
    }

    return tx.fridgePickupOrder.update({
      where: { id },
      data: updateData,
      include: fridgeOrderInclude,
    });
  });

  res.json(updated);
};

export const logFridgePayment = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;
  const data = logPaymentSchema.parse(req.body);

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  let warning: string | undefined;
  if (data.method === 'UPI' && !data.reference) {
    warning = 'UPI payment logged without a reference number';
  }

  // Handle optional screenshot upload
  const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        fridgePickupOrderId: id,
        amount: data.amount,
        method: data.method,
        reference: data.reference ?? null,
        screenshotUrl,
        notes: data.notes ?? null,
        loggedById: user.id,
      },
      include: {
        loggedBy: { select: { id: true, name: true } },
      },
    });

    // Recalculate paidAmount from all payments
    const aggregate = await tx.payment.aggregate({
      where: { fridgePickupOrderId: id },
      _sum: { amount: true },
    });

    const paidAmount = aggregate._sum?.amount ?? new Decimal(0);
    const paymentStatus = computePaymentStatus(paidAmount, order.totalAmount);

    const updatedOrder = await tx.fridgePickupOrder.update({
      where: { id },
      data: { paidAmount, paymentStatus },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        refrigerator: {
          include: {
            location: { select: { id: true, name: true } },
          },
        },
      },
    });

    return { payment, order: updatedOrder };
  });

  res.status(201).json({
    ...result,
    ...(warning ? { warning } : {}),
  });
};

// ─── Assign order to a staff member ──────────────────────────────────

const assignOrderSchema = z.object({
  staffId: z.string().min(1),
});

export const assignFridgeOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { staffId } = assignOrderSchema.parse(req.body);

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  // Validate staff exists and is a PRODUCER or TRANSPORTER
  const staff = await prisma.staffUser.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new ApiError(404, 'Staff user not found');
  }
  if (!['PRODUCER', 'TRANSPORTER'].includes(staff.role)) {
    throw new ApiError(400, 'Staff user must be a PRODUCER or TRANSPORTER');
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: { assignedToId: staffId },
    include: fridgeOrderInclude,
  });

  res.json(updated);
};

// ─── Pending order counts per fridge ─────────────────────────────────

export const getFridgePendingCounts = async (_req: Request, res: Response) => {
  const groups = await prisma.fridgePickupOrder.groupBy({
    by: ['refrigeratorId', 'status'],
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
    },
    _count: { id: true },
  });

  const counts: Record<string, { pending: number; confirmed: number; ready: number }> = {};

  for (const group of groups) {
    const fridgeId = group.refrigeratorId;
    if (!fridgeId) continue;
    if (!counts[fridgeId]) {
      counts[fridgeId] = { pending: 0, confirmed: 0, ready: 0 };
    }
    const statusKey = group.status.toLowerCase() as 'pending' | 'confirmed' | 'ready';
    counts[fridgeId][statusKey] = group._count.id;
  }

  res.json(counts);
};

// ─── Active orders for a specific fridge ─────────────────────────────

export const getFridgeActiveOrders = async (req: Request, res: Response) => {
  const fridgeId = req.params.fridgeId as string;

  const orders = await prisma.fridgePickupOrder.findMany({
    where: {
      refrigeratorId: fridgeId,
      status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
};

// ─── Modify order (partial confirmation) ─────────────────────────────

const modifyOrderSchema = z.object({
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().positive().optional(),
      remove: z.boolean().optional(),
      removalReason: z.string().optional(),
    })
  ),
});

export const modifyOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { items } = modifyOrderSchema.parse(req.body);

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'Only PENDING orders can be modified');
  }

  const updated = await prisma.$transaction(async (tx) => {
    for (const mod of items) {
      const item = order.items.find((i) => i.id === mod.itemId);
      if (!item) {
        throw new ApiError(400, `Order item not found: ${mod.itemId}`);
      }

      const updateData: Record<string, unknown> = {};

      // Save original quantity if not already saved
      if (item.originalQuantity === null) {
        updateData.originalQuantity = item.quantity;
      }

      if (mod.remove) {
        updateData.isRemoved = true;
        if (mod.removalReason) {
          updateData.removalReason = mod.removalReason;
        }
      } else if (mod.quantity !== undefined) {
        const newQty = new Decimal(mod.quantity);
        updateData.quantity = newQty;
        updateData.totalPrice = item.unitPrice.mul(newQty);
      }

      await tx.fridgePickupItem.update({
        where: { id: mod.itemId },
        data: updateData,
      });
    }

    // Recalculate totalAmount from non-removed items
    const allItems = await tx.fridgePickupItem.findMany({
      where: { pickupOrderId: id },
    });

    const totalAmount = allItems
      .filter((i) => !i.isRemoved)
      .reduce((sum, i) => sum.add(i.totalPrice), new Decimal(0));

    return tx.fridgePickupOrder.update({
      where: { id },
      data: {
        totalAmount,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
      include: fridgeOrderInclude,
    });
  });

  // Create notification for the customer
  await createNotification(
    order.customerId,
    order.id,
    'ORDER_MODIFIED',
    'Order Modified & Confirmed',
    `Your order ${order.orderNumber} has been modified and confirmed.`
  );

  res.json(updated);
};

// ─── Quick confirm order (one-click) ─────────────────────────────────

export const quickConfirmOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });

  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'Only PENDING orders can be confirmed');
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    },
    include: fridgeOrderInclude,
  });

  await createNotification(
    order.customerId,
    order.id,
    'ORDER_CONFIRMED',
    'Order Confirmed',
    `Your order ${order.orderNumber} has been confirmed.`
  );

  res.json(updated);
};
