import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const orderInclude = {
  customer: { select: { id: true, name: true, phone: true, address: true } },
  items: {
    include: {
      vegetable: {
        include: {
          category: true,
          prices: { orderBy: { effectiveFrom: 'desc' as const }, take: 1 },
        },
      },
    },
  },
};

export const adminListOrders = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search?.trim()) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const adminGetOrder = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  res.json(order);
};

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

export const adminUpdateOrderStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = updateStatusSchema.parse(req.body);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot update a cancelled order');
  }

  if (order.status === 'DELIVERED') {
    throw new ApiError(400, 'Cannot update a delivered order');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Restore inventory on cancel
    if (status === 'CANCELLED') {
      for (const item of order.items) {
        // Estimate stock to restore based on unit
        let restoreKg: Decimal;
        if (item.unit === 'KG') {
          restoreKg = item.quantity;
        } else if (item.unit === 'GRAM') {
          restoreKg = item.quantity.div(1000);
        } else if (item.unit === 'PACKET') {
          restoreKg = item.quantity.mul(0.5); // approximate
        } else if (item.unit === 'BUNCH') {
          restoreKg = item.quantity.mul(0.5); // approximate
        } else if (item.unit === 'PIECE') {
          restoreKg = item.quantity.mul(0.5);
        } else {
          restoreKg = item.quantity;
        }

        await tx.vegetable.update({
          where: { id: item.vegetableId },
          data: { stockKg: { increment: restoreKg } },
        });

        await tx.inventoryLog.create({
          data: {
            vegetableId: item.vegetableId,
            orderId: order.id,
            changeType: 'ADJUSTMENT',
            quantity: restoreKg,
            notes: `Cancelled order ${order.orderNumber}`,
          },
        });
      }
    }

    return tx.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  });

  res.json(updated);
};
