import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

export const adminListCustomers = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const where: any = {};
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
        _count: { select: { orders: true } },
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
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: { select: { items: true } },
        },
      },
      _count: { select: { orders: true, favorites: true } },
    },
  });

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  // Calculate total spend
  const totalSpend = await prisma.order.aggregate({
    where: { customerId: id, status: { not: 'CANCELLED' } },
    _sum: { totalAmount: true },
  });

  res.json({
    ...customer,
    totalSpend: totalSpend._sum.totalAmount?.toString() ?? '0',
  });
};
