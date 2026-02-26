import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { parsePagination } from '../utils/pagination';

export const adminListCustomers = async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });
  const search = req.query.search as string | undefined;

  const where: Prisma.CustomerWhereInput = {};
  if (search?.trim()) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { fridgePickupOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  res.json({
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const adminGetCustomer = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      fridgePickupOrders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          refrigerator: { include: { location: true } },
          _count: { select: { items: true } },
        },
      },
      _count: { select: { fridgePickupOrders: true, favorites: true } },
    },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Calculate total spend
  const totalSpend = await prisma.fridgePickupOrder.aggregate({
    where: { customerId: id, status: { not: 'CANCELLED' } },
    _sum: { totalAmount: true },
  });

  res.json({
    ...customer,
    totalSpend: totalSpend._sum.totalAmount?.toString() ?? '0',
  });
};
