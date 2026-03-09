import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/getUser';
import { createNotification } from '../lib/notifications';

// ─── Dashboard stats ─────────────────────────────────────────────────

export const getMyDashboard = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [assignedToday, pickedUpToday, deliveredToday, pendingPickup, inTransit] =
    await Promise.all([
      prisma.fridgePickupOrder.count({
        where: { assignedToId: user.id, createdAt: { gte: today } },
      }),
      prisma.fridgePickupOrder.count({
        where: {
          assignedToId: user.id,
          status: 'PICKED_UP',
          pickedUpAt: { gte: today },
        },
      }),
      prisma.fridgePickupOrder.count({
        where: {
          assignedToId: user.id,
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
      }),
      prisma.fridgePickupOrder.count({
        where: { assignedToId: user.id, status: 'READY' },
      }),
      prisma.fridgePickupOrder.count({
        where: { assignedToId: user.id, status: 'PICKED_UP' },
      }),
    ]);

  res.json({ assignedToday, pickedUpToday, deliveredToday, pendingPickup, inTransit });
};

// ─── Available orders (READY, no transporter assigned) ───────────────

export const getAvailableOrders = async (_req: Request, res: Response) => {
  const orders = await prisma.fridgePickupOrder.findMany({
    where: {
      status: 'READY',
      OR: [
        { assignedToId: null },
        {
          assignedTo: { role: 'PRODUCER' },
        },
      ],
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
      assignedTo: { select: { id: true, name: true, role: true } },
    },
    orderBy: { readyAt: 'asc' },
  });

  res.json(orders);
};

// ─── My orders (assigned to this transporter) ────────────────────────

export const getMyOrders = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const filter = req.query.filter as string | undefined;

  let statusFilter: Record<string, unknown>;
  if (filter === 'completed') {
    statusFilter = { status: { in: ['PICKED_UP', 'DELIVERED'] } };
  } else if (filter === 'in_transit') {
    statusFilter = { status: 'PICKED_UP' as const };
  } else {
    statusFilter = { status: 'READY' as const };
  }

  const orders = await prisma.fridgePickupOrder.findMany({
    where: {
      assignedToId: user.id,
      ...statusFilter,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.json(orders);
};

// ─── Claim an order ──────────────────────────────────────────────────

export const claimOrder = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'READY') {
    throw new ApiError(400, 'Only READY orders can be claimed');
  }

  // Check if already assigned to another transporter
  if (order.assignedToId) {
    const assignee = await prisma.staffUser.findUnique({
      where: { id: order.assignedToId },
    });
    if (assignee?.role === 'TRANSPORTER') {
      throw new ApiError(400, 'Order is already assigned to a transporter');
    }
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: { assignedToId: user.id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
    },
  });

  res.json(updated);
};

// ─── Mark order as picked up ─────────────────────────────────────────

export const markPickedUp = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'READY') {
    throw new ApiError(400, 'Only READY orders can be marked as picked up');
  }

  if (order.assignedToId !== user.id) {
    throw new ApiError(403, 'You can only mark orders assigned to you');
  }

  const updated = await prisma.fridgePickupOrder.update({
    where: { id },
    data: {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
      items: {
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
    },
  });

  res.json(updated);
};

// ─── Mark order as delivered (with fridge inventory auto-load) ───────

export const deliverOrder = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: {
      items: {
        where: { isRemoved: false },
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status !== 'PICKED_UP') {
    throw new ApiError(400, 'Only PICKED_UP orders can be marked as delivered');
  }

  if (order.assignedToId !== user.id) {
    throw new ApiError(403, 'You can only deliver orders assigned to you');
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update order status
    const deliveredOrder = await tx.fridgePickupOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        refrigerator: {
          include: {
            location: { select: { id: true, name: true, address: true } },
          },
        },
        items: {
          include: {
            vegetable: { select: { id: true, name: true, emoji: true } },
          },
        },
      },
    });

    // 2. For FRIDGE_PICKUP orders, auto-update fridge inventory
    if (order.orderType === 'FRIDGE_PICKUP' && order.refrigeratorId) {
      for (const item of order.items) {
        // Upsert refrigerator inventory (increment quantityAvailable)
        await tx.refrigeratorInventory.upsert({
          where: {
            refrigeratorId_vegetableId: {
              refrigeratorId: order.refrigeratorId,
              vegetableId: item.vegetableId,
            },
          },
          create: {
            refrigeratorId: order.refrigeratorId,
            vegetableId: item.vegetableId,
            quantityAvailable: item.quantity,
          },
          update: {
            quantityAvailable: { increment: item.quantity },
            lastUpdatedAt: new Date(),
          },
        });

        // Create transaction record
        await tx.refrigeratorTransaction.create({
          data: {
            refrigeratorId: order.refrigeratorId,
            vegetableId: item.vegetableId,
            quantity: item.quantity,
            type: 'LOAD',
            userId: user.id,
            userRole: 'TRANSPORTER',
            note: `Order ${order.orderNumber} delivered`,
          },
        });
      }
    }

    return deliveredOrder;
  });

  // 3. Notify customer
  await createNotification(
    order.customerId,
    order.id,
    'ORDER_READY',
    'Order Delivered',
    `Your order ${order.orderNumber} has been delivered.`
  );

  res.json(updated);
};

// ─── Loading checklist ──────────────────────────────────────────────

export const getLoadingChecklist = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const id = req.params.id as string;

  const order = await prisma.fridgePickupOrder.findUnique({
    where: { id },
    include: {
      items: {
        where: { isRemoved: false },
        include: {
          vegetable: { select: { id: true, name: true, emoji: true } },
        },
      },
      refrigerator: {
        include: {
          location: { select: { id: true, name: true, address: true } },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.assignedToId !== user.id) {
    throw new ApiError(403, 'You can only view checklist for orders assigned to you');
  }

  if (order.status !== 'PICKED_UP') {
    throw new ApiError(400, 'Loading checklist is only available for PICKED_UP orders');
  }

  res.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    refrigerator: order.refrigerator,
    items: order.items.map((item) => ({
      id: item.id,
      vegetableId: item.vegetableId,
      name: item.vegetable.name,
      emoji: item.vegetable.emoji,
      quantity: item.quantity,
      unit: item.unit,
    })),
  });
};
