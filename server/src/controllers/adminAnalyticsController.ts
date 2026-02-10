import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getSalesData = async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Daily revenue and order counts
  const dailyData = await prisma.$queryRaw<
    { date: Date; revenue: string; order_count: string }[]
  >`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*)::text as order_count
    FROM orders
    WHERE created_at >= ${startDate}
      AND status != 'CANCELLED'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  res.json(
    dailyData.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      revenue: parseFloat(d.revenue),
      orders: parseInt(d.order_count),
    }))
  );
};

export const getTopProducts = async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
  const limit = Math.min(20, Math.max(5, parseInt(req.query.limit as string) || 10));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const topProducts = await prisma.$queryRaw<
    { id: string; name: string; emoji: string | null; total_quantity: string; total_revenue: string; order_count: string }[]
  >`
    SELECT
      v.id,
      v.name,
      v.emoji,
      COALESCE(SUM(oi.quantity), 0)::text as total_quantity,
      COALESCE(SUM(oi.total_price), 0)::text as total_revenue,
      COUNT(DISTINCT o.id)::text as order_count
    FROM order_items oi
    JOIN vegetables v ON v.id = oi.vegetable_id
    JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at >= ${startDate}
      AND o.status != 'CANCELLED'
    GROUP BY v.id, v.name, v.emoji
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `;

  res.json(
    topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      totalQuantity: parseFloat(p.total_quantity),
      totalRevenue: parseFloat(p.total_revenue),
      orderCount: parseInt(p.order_count),
    }))
  );
};

export const getSalesSummary = async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);

  const [current, previous, statusBreakdown] = await Promise.all([
    prisma.order.aggregate({
      where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: prevStartDate, lt: startDate },
        status: { not: 'CANCELLED' },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true,
    }),
  ]);

  const currentRevenue = Number(current._sum.totalAmount ?? 0);
  const previousRevenue = Number(previous._sum.totalAmount ?? 0);
  const revenueChange =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

  const currentOrders = current._count;
  const previousOrders = previous._count;
  const ordersChange =
    previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

  res.json({
    revenue: currentRevenue,
    revenueChange: Math.round(revenueChange * 10) / 10,
    orders: currentOrders,
    ordersChange: Math.round(ordersChange * 10) / 10,
    avgOrderValue: currentOrders > 0 ? Math.round((currentRevenue / currentOrders) * 100) / 100 : 0,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count,
    })),
  });
};

export const exportSalesCsv = async (req: Request, res: Response) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      customer: { select: { name: true, phone: true } },
      items: { include: { vegetable: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const rows = [
    ['Order Number', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Status'].join(','),
  ];

  for (const order of orders) {
    const itemNames = order.items.map((i) => i.vegetable.name).join('; ');
    rows.push(
      [
        order.orderNumber,
        order.createdAt.toISOString().slice(0, 10),
        `"${(order.customer?.name || 'N/A').replace(/"/g, '""')}"`,
        order.customer?.phone || '',
        `"${itemNames.replace(/"/g, '""')}"`,
        order.totalAmount.toString(),
        order.status,
      ].join(',')
    );
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=sales-${days}d.csv`);
  res.send(rows.join('\n'));
};
