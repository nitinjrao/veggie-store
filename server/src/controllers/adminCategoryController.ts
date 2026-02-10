import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const categorySchema = z.object({
  name: z.string().min(1),
  nameHindi: z.string().optional(),
  nameKannada: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
});

export const adminListCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { vegetables: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(categories);
};

export const adminCreateCategory = async (req: Request, res: Response) => {
  const data = categorySchema.parse(req.body);

  const existing = await prisma.category.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(400, 'Category with this name already exists');
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      nameHindi: data.nameHindi,
      nameKannada: data.nameKannada,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { _count: { select: { vegetables: true } } },
  });
  res.status(201).json(category);
};

export const adminUpdateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = categorySchema.partial().parse(req.body);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.category.findUnique({ where: { name: data.name } });
    if (duplicate) {
      throw new ApiError(400, 'Category with this name already exists');
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      nameHindi: data.nameHindi ?? undefined,
      nameKannada: data.nameKannada ?? undefined,
      image: data.image ?? undefined,
      sortOrder: data.sortOrder ?? undefined,
    },
    include: { _count: { select: { vegetables: true } } },
  });
  res.json(updated);
};

export const adminDeleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { vegetables: true } } },
  });
  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }
  if (existing._count.vegetables > 0) {
    throw new ApiError(400, `Cannot delete: ${existing._count.vegetables} vegetable(s) in this category`);
  }

  await prisma.category.delete({ where: { id } });
  res.status(204).send();
};
