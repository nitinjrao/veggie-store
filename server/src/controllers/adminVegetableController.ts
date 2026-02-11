import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const vegetableInclude = {
  category: true,
  prices: {
    orderBy: { effectiveFrom: 'desc' as const },
    take: 1,
  },
};

const createVegetableSchema = z.object({
  name: z.string().min(1),
  nameHindi: z.string().optional(),
  nameKannada: z.string().optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  categoryId: z.string().uuid(),
  available: z.boolean().optional(),
  stockKg: z.number().nonnegative().optional(),
  minStockAlert: z.number().nonnegative().optional(),
  price: z
    .object({
      pricePerKg: z.number().nonnegative().optional(),
      pricePerPiece: z.number().nonnegative().optional(),
      pricePerPacket: z.number().nonnegative().optional(),
      pricePerBundle: z.number().nonnegative().optional(),
      packetWeight: z.number().nonnegative().optional(),
    })
    .optional(),
});

const updateVegetableSchema = createVegetableSchema.partial();

export const adminListVegetables = async (_req: Request, res: Response) => {
  const vegetables = await prisma.vegetable.findMany({
    include: vegetableInclude,
    orderBy: { name: 'asc' },
  });
  res.json(vegetables);
};

export const adminCreateVegetable = async (req: Request, res: Response) => {
  const data = createVegetableSchema.parse(req.body);

  const vegetable = await prisma.$transaction(async (tx) => {
    const created = await tx.vegetable.create({
      data: {
        name: data.name,
        nameHindi: data.nameHindi,
        nameKannada: data.nameKannada,
        emoji: data.emoji,
        description: data.description,
        image: data.image,
        categoryId: data.categoryId,
        available: data.available ?? true,
        stockKg: data.stockKg ?? 0,
        minStockAlert: data.minStockAlert ?? 5,
      },
    });

    if (data.price) {
      await tx.price.create({
        data: {
          vegetableId: created.id,
          pricePerKg: data.price.pricePerKg,
          pricePerPiece: data.price.pricePerPiece,
          pricePerPacket: data.price.pricePerPacket,
          pricePerBundle: data.price.pricePerBundle,
          packetWeight: data.price.packetWeight,
        },
      });
    }

    return tx.vegetable.findUniqueOrThrow({
      where: { id: created.id },
      include: vegetableInclude,
    });
  });

  res.status(201).json(vegetable);
};

export const adminUpdateVegetable = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateVegetableSchema.parse(req.body);

  const existing = await prisma.vegetable.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Vegetable not found');
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.vegetable.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        nameHindi: data.nameHindi ?? undefined,
        nameKannada: data.nameKannada ?? undefined,
        emoji: data.emoji ?? undefined,
        description: data.description ?? undefined,
        image: data.image ?? undefined,
        categoryId: data.categoryId ?? undefined,
        available: data.available ?? undefined,
        stockKg: data.stockKg ?? undefined,
        minStockAlert: data.minStockAlert ?? undefined,
      },
    });

    if (data.price) {
      const latestPrice = await tx.price.findFirst({
        where: { vegetableId: id },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (latestPrice) {
        // Record price history for pricePerKg changes
        const oldPriceKg = latestPrice.pricePerKg ? Number(latestPrice.pricePerKg) : null;
        const newPriceKg = data.price.pricePerKg ?? null;
        if (newPriceKg !== null && oldPriceKg !== newPriceKg) {
          await tx.priceHistory.create({
            data: {
              vegetableId: id,
              oldPrice: oldPriceKg,
              newPrice: newPriceKg,
            },
          });
        }

        await tx.price.update({
          where: { id: latestPrice.id },
          data: {
            pricePerKg: data.price.pricePerKg ?? undefined,
            pricePerPiece: data.price.pricePerPiece ?? undefined,
            pricePerPacket: data.price.pricePerPacket ?? undefined,
            pricePerBundle: data.price.pricePerBundle ?? undefined,
            packetWeight: data.price.packetWeight ?? undefined,
          },
        });
      } else {
        await tx.price.create({
          data: {
            vegetableId: id,
            pricePerKg: data.price.pricePerKg,
            pricePerPiece: data.price.pricePerPiece,
            pricePerPacket: data.price.pricePerPacket,
            pricePerBundle: data.price.pricePerBundle,
            packetWeight: data.price.packetWeight,
          },
        });

        // Record initial price
        if (data.price.pricePerKg) {
          await tx.priceHistory.create({
            data: {
              vegetableId: id,
              oldPrice: null,
              newPrice: data.price.pricePerKg,
            },
          });
        }
      }
    }

    return tx.vegetable.findUniqueOrThrow({
      where: { id },
      include: vegetableInclude,
    });
  });

  res.json(updated);
};

const bulkStockSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      stockKg: z.number().nonnegative(),
    })
  ),
});

export const adminBulkUpdateStock = async (req: Request, res: Response) => {
  const { updates } = bulkStockSchema.parse(req.body);

  await prisma.$transaction(
    updates.map((u) =>
      prisma.vegetable.update({
        where: { id: u.id },
        data: { stockKg: u.stockKg },
      })
    )
  );

  const vegetables = await prisma.vegetable.findMany({
    include: vegetableInclude,
    orderBy: { name: 'asc' },
  });

  res.json(vegetables);
};

export const adminUploadImage = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
};

export const adminGetPriceHistory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const history = await prisma.priceHistory.findMany({
    where: { vegetableId: id },
    orderBy: { changedAt: 'desc' },
    take: 50,
  });

  res.json(history);
};

export const adminDeleteVegetable = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.vegetable.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Vegetable not found');
  }

  await prisma.vegetable.update({
    where: { id },
    data: { available: false },
  });

  res.status(204).send();
};

