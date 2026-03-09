import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { getAuthUser } from '../utils/getUser';
import { parsePagination } from '../utils/pagination';

export const getNotifications = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const { page, limit, skip } = parsePagination(req.query as { page?: string; limit?: string });

  const where = { customerId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  res.json({
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};

export const markAsRead = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;
  const id = req.params.id as string;

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.customerId !== customerId) {
    throw new ApiError(403, 'Access denied');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json(updated);
};

export const getUnreadCount = async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const customerId = user.id;

  const count = await prisma.notification.count({
    where: { customerId, isRead: false },
  });

  res.json({ count });
};
