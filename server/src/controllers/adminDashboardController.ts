import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const [
    totalVegetables,
    totalCategories,
    ordersToday,
    lowStockItems,
    recentOrders,
    pendingOrderCount,
    confirmedOrderCount,
    readyOrderCount,
    revenueToday,
    totalCustomers,
    totalActiveFridges,
    totalActiveStaff,
    fridgesWithDetails,
    staffActivity,
    staleOrders,
    unassignedFridges,
    totalRevenue,
    pickedUpToday,
    transporterActivity,
    unassignedReadyOrders,
  ] = await Promise.all([
    // Existing counts
    prisma.vegetable.count({ where: { available: true } }),
    prisma.category.count(),
    prisma.fridgePickupOrder.count({ where: { createdAt: { gte: today } } }),

    // Low stock vegetables
    prisma.$queryRaw<
      {
        id: string;
        name: string;
        emoji: string | null;
        stock_kg: Prisma.Decimal;
        min_stock_alert: Prisma.Decimal;
      }[]
    >`
        SELECT id, name, emoji, stock_kg, min_stock_alert
        FROM vegetables
        WHERE available = true AND stock_kg <= min_stock_alert
        ORDER BY stock_kg ASC
        LIMIT 10
      `,

    // Recent orders (expanded to 8)
    prisma.fridgePickupOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        customer: { select: { name: true, phone: true } },
        refrigerator: { include: { location: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),

    // Order status counts
    prisma.fridgePickupOrder.count({ where: { status: 'PENDING' } }),
    prisma.fridgePickupOrder.count({ where: { status: 'CONFIRMED' } }),
    prisma.fridgePickupOrder.count({ where: { status: 'READY' } }),

    // Revenue today
    prisma.fridgePickupOrder.aggregate({
      where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),

    // Total customers
    prisma.customer.count(),

    // Active fridges count
    prisma.refrigerator.count({ where: { status: 'ACTIVE' } }),

    // Active staff count
    prisma.staffUser.count({ where: { active: true } }),

    // Fridge health: each fridge with inventory counts, assigned producers, and order stats
    prisma.refrigerator.findMany({
      where: { status: 'ACTIVE' },
      include: {
        location: { select: { name: true } },
        assignedProducers: {
          include: { staffUser: { select: { id: true, name: true } } },
        },
        inventory: {
          select: {
            quantityAvailable: true,
            minimumThreshold: true,
          },
        },
        pickupOrders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'READY'] },
          },
          select: { status: true },
        },
        _count: { select: { inventory: true } },
      },
      orderBy: { name: 'asc' },
    }),

    // Staff activity: producers with today's order actions
    prisma.staffUser.findMany({
      where: { active: true, role: 'PRODUCER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedFridges: {
          select: { refrigerator: { select: { name: true } } },
        },
        assignedFridgeOrders: {
          where: {
            OR: [{ confirmedAt: { gte: today } }, { readyAt: { gte: today } }],
          },
          select: {
            status: true,
            confirmedAt: true,
            readyAt: true,
          },
        },
      },
    }),

    // Stale pending orders (> 30 min)
    prisma.fridgePickupOrder.count({
      where: {
        status: 'PENDING',
        createdAt: { lt: thirtyMinAgo },
      },
    }),

    // Fridges with no producer assigned
    prisma.refrigerator.findMany({
      where: {
        status: 'ACTIVE',
        assignedProducers: { none: {} },
      },
      select: { id: true, name: true },
    }),

    // Total revenue (all time)
    prisma.fridgePickupOrder.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),

    // Orders picked up today
    prisma.fridgePickupOrder.count({
      where: {
        status: 'PICKED_UP',
        pickedUpAt: { gte: today },
      },
    }),

    // Transporter activity
    prisma.staffUser.findMany({
      where: { active: true, role: 'TRANSPORTER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedFridgeOrders: {
          where: {
            pickedUpAt: { gte: today },
          },
          select: {
            status: true,
            pickedUpAt: true,
          },
        },
      },
    }),

    // Unassigned ready orders (READY with no transporter assigned)
    prisma.fridgePickupOrder.count({
      where: {
        status: 'READY',
        OR: [
          { assignedToId: null },
          { assignedTo: { role: 'PRODUCER' } },
        ],
      },
    }),
  ]);

  // Process fridge health data
  const fridgeHealth = fridgesWithDetails.map((fridge) => {
    const totalItems = fridge.inventory.length;
    const lowStockCount = fridge.inventory.filter(
      (inv) => Number(inv.quantityAvailable) <= Number(inv.minimumThreshold)
    ).length;
    const totalStock = fridge.inventory.reduce(
      (sum, inv) => sum + Number(inv.quantityAvailable),
      0
    );
    const pendingOrders = fridge.pickupOrders.filter((o) => o.status === 'PENDING').length;
    const confirmedOrders = fridge.pickupOrders.filter((o) => o.status === 'CONFIRMED').length;
    const readyOrders = fridge.pickupOrders.filter((o) => o.status === 'READY').length;

    let health: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (fridge.assignedProducers.length === 0 || totalItems === 0) {
      health = 'critical';
    } else if (lowStockCount > 0 || pendingOrders > 3) {
      health = 'warning';
    }

    return {
      id: fridge.id,
      name: fridge.name,
      location: fridge.location?.name || '',
      totalItems,
      lowStockCount,
      totalStock: Math.round(totalStock * 10) / 10,
      producers: fridge.assignedProducers.map((p) => ({
        id: p.staffUser.id,
        name: p.staffUser.name,
      })),
      pendingOrders,
      confirmedOrders,
      readyOrders,
      health,
    };
  });

  // Process staff activity
  const staffActivityData = staffActivity.map((staff) => {
    const ordersConfirmedToday = staff.assignedFridgeOrders.filter(
      (o) => o.confirmedAt && new Date(o.confirmedAt) >= today
    ).length;
    const ordersReadyToday = staff.assignedFridgeOrders.filter(
      (o) => o.readyAt && new Date(o.readyAt) >= today
    ).length;

    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      assignedFridges: staff.assignedFridges.map((f) => f.refrigerator.name),
      ordersConfirmedToday,
      ordersReadyToday,
      totalActionsToday: ordersConfirmedToday + ordersReadyToday,
    };
  });

  // Process transporter activity
  const transporterActivityData = transporterActivity.map((staff) => {
    const pickupsToday = staff.assignedFridgeOrders.filter(
      (o) => o.pickedUpAt && new Date(o.pickedUpAt) >= today
    ).length;

    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      pickupsToday,
    };
  });

  // Build attention items
  const attentionItems: { type: string; message: string; severity: 'critical' | 'warning' }[] = [];

  if (staleOrders > 0) {
    attentionItems.push({
      type: 'stale_orders',
      message: `${staleOrders} order${staleOrders > 1 ? 's' : ''} pending for over 30 minutes`,
      severity: 'critical',
    });
  }

  if (unassignedFridges.length > 0) {
    attentionItems.push({
      type: 'unassigned_fridges',
      message: `${unassignedFridges.length} fridge${unassignedFridges.length > 1 ? 's' : ''} with no producer assigned`,
      severity: 'critical',
    });
  }

  const criticalLowStock = lowStockItems.filter((item) => Number(item.stock_kg) === 0).length;
  if (criticalLowStock > 0) {
    attentionItems.push({
      type: 'out_of_stock',
      message: `${criticalLowStock} vegetable${criticalLowStock > 1 ? 's' : ''} completely out of stock`,
      severity: 'critical',
    });
  }

  const fridgeLowStock = fridgeHealth.filter((f) => f.lowStockCount > 0).length;
  if (fridgeLowStock > 0) {
    attentionItems.push({
      type: 'fridge_low_stock',
      message: `${fridgeLowStock} fridge${fridgeLowStock > 1 ? 's' : ''} with low stock items`,
      severity: 'warning',
    });
  }

  if (unassignedReadyOrders > 0) {
    attentionItems.push({
      type: 'unassigned_ready_orders',
      message: `${unassignedReadyOrders} ready order${unassignedReadyOrders > 1 ? 's' : ''} without a transporter`,
      severity: 'warning',
    });
  }

  res.json({
    totalVegetables,
    totalCategories,
    ordersToday,
    pendingOrderCount,
    confirmedOrderCount,
    readyOrderCount,
    revenueToday: revenueToday._sum.totalAmount?.toString() || '0',
    totalRevenue: totalRevenue._sum.totalAmount?.toString() || '0',
    pickedUpToday,
    totalCustomers,
    totalActiveFridges,
    totalActiveStaff,
    lowStockItems: lowStockItems.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      stockKg: item.stock_kg.toString(),
      minStockAlert: item.min_stock_alert.toString(),
    })),
    recentOrders,
    fridgeHealth,
    staffActivity: staffActivityData,
    transporterActivity: transporterActivityData,
    attentionItems,
  });
};
