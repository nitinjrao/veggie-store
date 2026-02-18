import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

const MAX_ADDRESSES = 10;

const createSchema = z.object({
  label: z.string().min(1).max(50),
  text: z.string().min(1).max(500),
  isDefault: z.boolean().optional(),
});

const updateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  text: z.string().min(1).max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const listAddresses = async (req: Request, res: Response) => {
  const customerId = req.user!.id;

  const addresses = await prisma.address.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(addresses);
};

export const createAddress = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const data = createSchema.parse(req.body);

  const count = await prisma.address.count({ where: { customerId } });
  if (count >= MAX_ADDRESSES) {
    throw new ApiError(400, `Maximum ${MAX_ADDRESSES} addresses allowed`);
  }

  // First address is automatically default
  const isDefault = count === 0 ? true : data.isDefault ?? false;

  let address;
  if (isDefault && count > 0) {
    address = await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.create({
        data: { customerId, label: data.label, text: data.text, isDefault: true },
      });
    });
  } else {
    address = await prisma.address.create({
      data: { customerId, label: data.label, text: data.text, isDefault },
    });
  }

  res.status(201).json(address);
};

export const updateAddress = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const id = req.params.id as string;
  const data = updateSchema.parse(req.body);

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.customerId !== customerId) {
    throw new ApiError(404, 'Address not found');
  }

  let address;
  if (data.isDefault) {
    address = await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.update({ where: { id }, data });
    });
  } else {
    address = await prisma.address.update({ where: { id }, data });
  }

  res.json(address);
};

export const deleteAddress = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.customerId !== customerId) {
    throw new ApiError(404, 'Address not found');
  }

  await prisma.address.delete({ where: { id } });

  // If deleted was default, promote the newest remaining
  if (existing.isDefault) {
    const newest = await prisma.address.findFirst({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
    if (newest) {
      await prisma.address.update({
        where: { id: newest.id },
        data: { isDefault: true },
      });
    }
  }

  res.json({ message: 'Address deleted' });
};
