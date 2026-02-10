import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const vegetableInclude = {
  category: true,
  prices: {
    orderBy: { effectiveFrom: 'desc' as const },
    take: 1,
  },
};

export const getFavorites = async (req: Request, res: Response) => {
  const customerId = req.user!.id;

  const favorites = await prisma.favorite.findMany({
    where: { customerId },
    include: { vegetable: { include: vegetableInclude } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(favorites.map((f) => f.vegetable));
};

export const getFavoriteIds = async (req: Request, res: Response) => {
  const customerId = req.user!.id;

  const favorites = await prisma.favorite.findMany({
    where: { customerId },
    select: { vegetableId: true },
  });

  res.json(favorites.map((f) => f.vegetableId));
};

export const addFavorite = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const vegetableId = req.params.vegetableId as string;

  const vegetable = await prisma.vegetable.findUnique({ where: { id: vegetableId } });
  if (!vegetable) {
    throw new ApiError(404, 'Vegetable not found');
  }

  await prisma.favorite.upsert({
    where: { customerId_vegetableId: { customerId, vegetableId } },
    update: {},
    create: { customerId, vegetableId },
  });

  res.status(201).json({ message: 'Added to favorites' });
};

export const removeFavorite = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const vegetableId = req.params.vegetableId as string;

  await prisma.favorite.deleteMany({
    where: { customerId, vegetableId },
  });

  res.json({ message: 'Removed from favorites' });
};
