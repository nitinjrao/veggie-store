import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalVegetables, totalCategories, ordersToday, lowStockItems, recentOrders] =
    await Promise.all([
      prisma.vegetable.count({ where: { available: true } }),
      prisma.category.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.$queryRaw<
        { id: string; name: string; emoji: string | null; stock_kg: Prisma.Decimal; min_stock_alert: Prisma.Decimal }[]
      >`
        SELECT id, name, emoji, stock_kg, min_stock_alert
        FROM vegetables
        WHERE available = true AND stock_kg <= min_stock_alert
        ORDER BY stock_kg ASC
        LIMIT 10
      `,
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { name: true, phone: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

  res.json({
    totalVegetables,
    totalCategories,
    ordersToday,
    lowStockItems: lowStockItems.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      stockKg: item.stock_kg.toString(),
      minStockAlert: item.min_stock_alert.toString(),
    })),
    recentOrders,
  });
};
