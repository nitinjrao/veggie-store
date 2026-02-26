import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const createLocationSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  active: z.boolean().optional(),
});

export const listLocations = async (_req: Request, res: Response) => {
  const locations = await prisma.location.findMany({
    include: { _count: { select: { refrigerators: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(locations);
};

export const createLocation = async (req: Request, res: Response) => {
  const data = createLocationSchema.parse(req.body);

  const existing = await prisma.location.findUnique({ where: { name: data.name } });
  if (existing) {
    throw new ApiError(400, 'Location with this name already exists');
  }

  const location = await prisma.location.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    include: { _count: { select: { refrigerators: true } } },
  });
  res.status(201).json(location);
};

export const getLocation = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      refrigerators: {
        include: { _count: { select: { inventory: true } } },
      },
    },
  });

  if (!location) {
    throw new ApiError(404, 'Location not found');
  }

  res.json(location);
};

export const updateLocation = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const data = updateLocationSchema.parse(req.body);

  const existing = await prisma.location.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, 'Location not found');
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.location.findUnique({ where: { name: data.name } });
    if (duplicate) {
      throw new ApiError(400, 'Location with this name already exists');
    }
  }

  const updated = await prisma.location.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      address: data.address ?? undefined,
      latitude: data.latitude !== undefined ? data.latitude : undefined,
      longitude: data.longitude !== undefined ? data.longitude : undefined,
      active: data.active ?? undefined,
    },
    include: { _count: { select: { refrigerators: true } } },
  });
  res.json(updated);
};

export const deleteLocation = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.location.findUnique({
    where: { id },
    include: { _count: { select: { refrigerators: true } } },
  });
  if (!existing) {
    throw new ApiError(404, 'Location not found');
  }
  if (existing._count.refrigerators > 0) {
    throw new ApiError(
      400,
      `Cannot delete: ${existing._count.refrigerators} refrigerator(s) reference this location`
    );
  }

  await prisma.location.delete({ where: { id } });
  res.status(204).send();
};
