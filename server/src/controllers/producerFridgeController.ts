import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/getUser';

// ─── List all ACTIVE fridges ──────────────────────────────────────────

export const listFridges = async (_req: Request, res: Response) => {
  const fridges = await prisma.refrigerator.findMany({
    where: { status: 'ACTIVE' },
    include: {
      location: { select: { id: true, name: true, address: true } },
      _count: { select: { inventory: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json(fridges);
};

// ─── Get a specific fridge's full inventory ───────────────────────────

export const getFridgeInventory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const fridge = await prisma.refrigerator.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true, address: true } },
      inventory: {
        include: {
          vegetable: {
            select: {
              id: true,
              name: true,
              emoji: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { lastUpdatedAt: 'desc' },
      },
    },
  });

  if (!fridge) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  res.json(fridge);
};

// ─── Load vegetables into a fridge ────────────────────────────────────

const loadFridgeSchema = z.object({
  items: z
    .array(
      z.object({
        vegetableId: z.string().uuid(),
        quantity: z.number().positive(),
        note: z.string().optional(),
      })
    )
    .min(1, 'At least one item is required'),
});

export const loadFridge = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { items } = loadFridgeSchema.parse(req.body);

  // Verify the fridge exists
  const fridge = await prisma.refrigerator.findUnique({ where: { id } });
  if (!fridge) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  if (fridge.status !== 'ACTIVE') {
    throw new ApiError(400, 'Refrigerator is not active');
  }

  const user = getAuthUser(req);
  const userId = user.id;

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      // Validate the vegetable exists
      const vegetable = await tx.vegetable.findUnique({
        where: { id: item.vegetableId },
      });
      if (!vegetable) {
        throw new ApiError(404, `Vegetable not found: ${item.vegetableId}`);
      }

      // Upsert the inventory row (increment quantityAvailable)
      await tx.refrigeratorInventory.upsert({
        where: {
          refrigeratorId_vegetableId: {
            refrigeratorId: id,
            vegetableId: item.vegetableId,
          },
        },
        create: {
          refrigeratorId: id,
          vegetableId: item.vegetableId,
          quantityAvailable: new Decimal(item.quantity),
          lastUpdatedAt: new Date(),
        },
        update: {
          quantityAvailable: { increment: new Decimal(item.quantity) },
          lastUpdatedAt: new Date(),
        },
      });

      // Create a transaction record
      await tx.refrigeratorTransaction.create({
        data: {
          refrigeratorId: id,
          vegetableId: item.vegetableId,
          quantity: new Decimal(item.quantity),
          type: 'LOAD',
          userId,
          userRole: 'producer',
          note: item.note || null,
        },
      });
    }
  });

  // Return the updated inventory for this fridge
  const updatedFridge = await prisma.refrigerator.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true, address: true } },
      inventory: {
        include: {
          vegetable: {
            select: {
              id: true,
              name: true,
              emoji: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { lastUpdatedAt: 'desc' },
      },
    },
  });

  res.json(updatedFridge);
};

// ─── Get producer's own transactions ──────────────────────────────────

export const getMyTransactions = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const userId = user.id;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = { userId };

  const [transactions, total] = await Promise.all([
    prisma.refrigeratorTransaction.findMany({
      where,
      include: {
        vegetable: { select: { id: true, name: true, emoji: true } },
        refrigerator: {
          select: {
            id: true,
            name: true,
            location: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.refrigeratorTransaction.count({ where }),
  ]);

  res.json({
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

// ─── Order Summary: assigned fridges with order counts per status ────

export const getOrderSummary = async (req: Request, res: Response) => {
  const user = getAuthUser(req);

  // Find fridges assigned to this producer
  const assignments = await prisma.producerFridgeAssignment.findMany({
    where: { staffUserId: user.id },
    include: {
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
    },
  });

  const fridgeIds = assignments.map((a) => a.refrigeratorId);

  // Count orders by status for assigned fridges
  const groups = await prisma.fridgePickupOrder.groupBy({
    by: ['refrigeratorId', 'status'],
    where: {
      refrigeratorId: { in: fridgeIds },
      status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
    },
    _count: { id: true },
  });

  const countsByFridge: Record<string, { pending: number; confirmed: number; ready: number }> = {};
  for (const fridgeId of fridgeIds) {
    countsByFridge[fridgeId] = { pending: 0, confirmed: 0, ready: 0 };
  }
  for (const group of groups) {
    const statusKey = group.status.toLowerCase() as 'pending' | 'confirmed' | 'ready';
    countsByFridge[group.refrigeratorId][statusKey] = group._count.id;
  }

  const result = assignments.map((a) => ({
    fridge: {
      id: a.refrigerator.id,
      name: a.refrigerator.name,
      location: a.refrigerator.location,
    },
    counts: countsByFridge[a.refrigeratorId],
  }));

  res.json(result);
};

// ─── Pending Orders: PENDING + CONFIRMED orders for assigned fridges ─

export const getPendingOrders = async (req: Request, res: Response) => {
  const user = getAuthUser(req);

  // Get assigned fridge IDs
  const assignments = await prisma.producerFridgeAssignment.findMany({
    where: { staffUserId: user.id },
    select: { refrigeratorId: true },
  });

  const assignedFridgeIds = assignments.map((a) => a.refrigeratorId);

  const orders = await prisma.fridgePickupOrder.findMany({
    where: {
      refrigeratorId: { in: assignedFridgeIds },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(orders);
};

// ─── Confirm Order: PENDING → CONFIRMED ─────────────────────────────

export const confirmOrder = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(400, `Cannot confirm order: current status is ${order.status}`);
  }

  // Validate producer is assigned to this fridge
  const assignment = await prisma.producerFridgeAssignment.findUnique({
    where: {
      staffUserId_refrigeratorId: {
        staffUserId: user.id,
        refrigeratorId: order.refrigeratorId,
      },
    },
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned to this fridge');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Deduct from main vegetable stock
    for (const item of order.items) {
      const vegetable = await tx.vegetable.findUnique({
        where: { id: item.vegetableId },
      });

      if (!vegetable) {
        throw new ApiError(400, 'Vegetable not found');
      }

      // Convert quantity to KG for stock deduction
      let deductKg = item.quantity;
      if (item.unit === 'GRAM') {
        deductKg = item.quantity.div(1000);
      }

      if (vegetable.stockKg.lessThan(deductKg)) {
        throw new ApiError(
          400,
          `Insufficient stock for "${vegetable.name}". Available: ${vegetable.stockKg} kg, Required: ${deductKg} kg.`
        );
      }

      await tx.vegetable.update({
        where: { id: item.vegetableId },
        data: { stockKg: { decrement: deductKg } },
      });
    }

    return tx.fridgePickupOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        assignedToId: user.id,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            vegetable: { select: { id: true, name: true, emoji: true } },
          },
        },
        refrigerator: {
          include: {
            location: { select: { id: true, name: true, address: true } },
          },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  });

  res.json(updated);
};

// ─── Mark Order Ready: CONFIRMED → READY ────────────────────────────

export const markOrderReady = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });

  if (!order) {
    throw new ApiError(404, 'Fridge pickup order not found');
  }

  if (order.status !== 'CONFIRMED') {
    throw new ApiError(400, `Cannot mark order as ready: current status is ${order.status}`);
  }

  // Validate producer is assigned to this fridge
  const assignment = await prisma.producerFridgeAssignment.findUnique({
    where: {
      staffUserId_refrigeratorId: {
        staffUserId: user.id,
        refrigeratorId: order.refrigeratorId,
      },
    },
  });

  if (!assignment) {
    throw new ApiError(403, 'You are not assigned to this fridge');
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: {
      status: 'READY',
      readyAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  res.json(updated);
};
