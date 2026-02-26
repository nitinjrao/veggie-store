import { Request, Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';

export const getPaymentSummary = async (req: Request, res: Response) => {
  const days = Math.max(1, parseInt(req.query.days as string) || 30);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [payments, ordersByStatus] = await Promise.all([
    prisma.payment.findMany({
      where: { receivedAt: { gte: since } },
      select: { amount: true, method: true },
    }),
    prisma.fridgePickupOrder.groupBy({
      by: ['paymentStatus'],
      _count: { _all: true },
    }),
  ]);

  let totalCollected = new Decimal(0);
  const byMethod: Record<string, Decimal> = { CASH: new Decimal(0), UPI: new Decimal(0) };

  for (const p of payments) {
    totalCollected = totalCollected.add(p.amount);
    byMethod[p.method] = byMethod[p.method].add(p.amount);
  }

  const statusCounts: Record<string, number> = {
    UNPAID: 0,
    PARTIAL: 0,
    PAID: 0,
    OVERPAID: 0,
  };

  for (const group of ordersByStatus) {
    statusCounts[group.paymentStatus] = group._count._all;
  }

  res.json({
    totalCollected,
    byMethod,
    ordersByStatus: statusCounts,
  });
};
