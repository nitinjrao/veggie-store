import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, RefrigeratorStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/getUser';

const assignProducerSchema = z.object({
  staffId: z.string().min(1),
});

const createFridgeSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1),
});

const updateFridgeSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  locationId: z.string().min(1).optional(),
});

const inventoryItemSchema = z.object({
  vegetableId: z.string().min(1),
  quantityAvailable: z.number().min(0),
  minimumThreshold: z.number().min(0),
});

const updateInventorySchema = z.array(inventoryItemSchema).min(1);

export const listFridges = async (req: Request, res: Response) => {
  const locationId = req.query.locationId as string | undefined;
  const status = req.query.status as string | undefined;

  const where: Prisma.RefrigeratorWhereInput = {};

  if (locationId) {
    where.locationId = locationId;
  }

  if (status) {
    where.status = status as RefrigeratorStatus;
  }

  const fridges = await prisma.refrigerator.findMany({
    where,
    include: {
      location: { select: { id: true, name: true, address: true } },
      _count: { select: { inventory: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(fridges);
};

export const createFridge = async (req: Request, res: Response) => {
  const data = createFridgeSchema.parse(req.body);

  const location = await prisma.location.findUnique({ where: { id: data.locationId } });
  if (!location) {
    throw new ApiError(400, 'Location not found');
  }

  const fridge = await prisma.refrigerator.create({
    data: {
      locationId: data.locationId,
      name: data.name,
    },
    include: {
      location: { select: { id: true, name: true, address: true } },
      _count: { select: { inventory: true } },
    },
  });
  res.status(201).json(fridge);
};

export const getFridge = async (req: Request, res: Response) => {
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
              prices: { orderBy: { effectiveFrom: 'desc' as const }, take: 1 },
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

export const updateFridge = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateFridgeSchema.parse(req.body);

  const existing = await prisma.refrigerator.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  if (data.locationId) {
    const location = await prisma.location.findUnique({ where: { id: data.locationId } });
    if (!location) {
      throw new ApiError(400, 'Location not found');
    }
  }

  const updated = await prisma.refrigerator.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      status: data.status ?? undefined,
      locationId: data.locationId ?? undefined,
    },
    include: {
      location: { select: { id: true, name: true, address: true } },
      _count: { select: { inventory: true } },
    },
  });
  res.json(updated);
};

export const deleteFridge = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.refrigerator.findUnique({
    where: { id },
    include: { _count: { select: { pickupOrders: true } } },
  });
  if (!existing) {
    throw new ApiError(404, 'Refrigerator not found');
  }
  if (existing._count.pickupOrders > 0) {
    throw new ApiError(
      400,
      `Cannot delete: ${existing._count.pickupOrders} pickup order(s) reference this refrigerator`
    );
  }

  await prisma.refrigerator.delete({ where: { id } });
  res.status(204).send();
};

export const updateInventory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const items = updateInventorySchema.parse(req.body);

  const fridge = await prisma.refrigerator.findUnique({ where: { id } });
  if (!fridge) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  const user = getAuthUser(req);

  const result = await prisma.$transaction(async (tx) => {
    const inventoryResults = [];

    for (const item of items) {
      // Get current inventory to calculate change
      const current = await tx.refrigeratorInventory.findUnique({
        where: {
          refrigeratorId_vegetableId: {
            refrigeratorId: id,
            vegetableId: item.vegetableId,
          },
        },
      });

      const previousQuantity = current?.quantityAvailable?.toNumber() ?? 0;
      const quantityChange = item.quantityAvailable - previousQuantity;

      // Upsert inventory row
      const inventory = await tx.refrigeratorInventory.upsert({
        where: {
          refrigeratorId_vegetableId: {
            refrigeratorId: id,
            vegetableId: item.vegetableId,
          },
        },
        update: {
          quantityAvailable: item.quantityAvailable,
          minimumThreshold: item.minimumThreshold,
          lastUpdatedAt: new Date(),
        },
        create: {
          refrigeratorId: id,
          vegetableId: item.vegetableId,
          quantityAvailable: item.quantityAvailable,
          minimumThreshold: item.minimumThreshold,
        },
      });

      // Create transaction record for the change
      if (quantityChange !== 0) {
        await tx.refrigeratorTransaction.create({
          data: {
            refrigeratorId: id,
            vegetableId: item.vegetableId,
            quantity: quantityChange,
            type: 'ADJUSTMENT',
            userId: user.id,
            userRole: user.role,
            note: `Inventory adjusted from ${previousQuantity} to ${item.quantityAvailable}`,
          },
        });
      }

      inventoryResults.push(inventory);
    }

    return inventoryResults;
  });

  res.json(result);
};

export const getLowStockAlerts = async (_req: Request, res: Response) => {
  const allInventory = await prisma.refrigeratorInventory.findMany({
    include: {
      refrigerator: {
        include: {
          location: { select: { id: true, name: true } },
        },
      },
      vegetable: { select: { id: true, name: true, emoji: true } },
    },
  });

  const alerts = allInventory
    .filter((item) => item.quantityAvailable.lessThan(item.minimumThreshold))
    .map((item) => ({
      id: item.id,
      quantityAvailable: item.quantityAvailable,
      minimumThreshold: item.minimumThreshold,
      refrigeratorId: item.refrigerator.id,
      refrigeratorName: item.refrigerator.name,
      locationId: item.refrigerator.location.id,
      locationName: item.refrigerator.location.name,
      vegetableId: item.vegetable.id,
      vegetableName: item.vegetable.name,
      vegetableEmoji: item.vegetable.emoji,
    }))
    .sort(
      (a, b) =>
        a.locationName.localeCompare(b.locationName) ||
        a.refrigeratorName.localeCompare(b.refrigeratorName) ||
        a.vegetableName.localeCompare(b.vegetableName)
    );

  res.json(alerts);
};

// ─── Producer Assignment ─────────────────────────────────────────────

export const getFridgeProducers = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const assignments = await prisma.producerFridgeAssignment.findMany({
    where: { refrigeratorId: id },
    include: {
      staffUser: {
        select: { id: true, name: true, email: true, phone: true, active: true },
      },
    },
  });

  res.json(assignments.map((a) => a.staffUser));
};

export const assignProducerToFridge = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { staffId } = assignProducerSchema.parse(req.body);

  // Validate staff is a PRODUCER
  const staff = await prisma.staffUser.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new ApiError(404, 'Staff user not found');
  }
  if (staff.role !== 'PRODUCER') {
    throw new ApiError(400, 'Staff user must be a PRODUCER');
  }

  // Validate fridge exists
  const fridge = await prisma.refrigerator.findUnique({ where: { id } });
  if (!fridge) {
    throw new ApiError(404, 'Refrigerator not found');
  }

  await prisma.producerFridgeAssignment.upsert({
    where: {
      staffUserId_refrigeratorId: {
        staffUserId: staffId,
        refrigeratorId: id,
      },
    },
    create: {
      staffUserId: staffId,
      refrigeratorId: id,
    },
    update: {},
  });

  res.status(201).json({ message: 'Producer assigned' });
};

export const unassignProducerFromFridge = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const staffId = req.params.staffId as string;

  await prisma.producerFridgeAssignment.deleteMany({
    where: { refrigeratorId: id, staffUserId: staffId },
  });

  res.json({ message: 'Producer unassigned' });
};
