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

export const listVegetables = async (_req: Request, res: Response) => {
  const vegetables = await prisma.vegetable.findMany({
    where: { available: true },
    include: vegetableInclude,
    orderBy: { name: 'asc' },
  });
  res.json(vegetables);
};

export const getVegetableById = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const vegetable = await prisma.vegetable.findUnique({
    where: { id },
    include: vegetableInclude,
  });

  if (!vegetable) {
    throw new ApiError(404, 'Vegetable not found');
  }

  res.json(vegetable);
};

export const listCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: { vegetables: true },
      },
    },
  });
  res.json(categories);
};

export const getVegetablesByCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const vegetables = await prisma.vegetable.findMany({
    where: { categoryId: id as string, available: true },
    include: vegetableInclude,
    orderBy: { name: 'asc' },
  });

  res.json(vegetables);
};

export const searchVegetables = async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query.trim()) {
    res.json([]);
    return;
  }

  const vegetables = await prisma.vegetable.findMany({
    where: {
      available: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { nameHindi: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: vegetableInclude,
    orderBy: { name: 'asc' },
  });

  res.json(vegetables);
};
