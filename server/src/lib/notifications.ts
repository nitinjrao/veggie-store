import { NotificationType } from '@prisma/client';
import { prisma } from './prisma';

export async function createNotification(
  customerId: string,
  orderId: string | null,
  type: NotificationType,
  title: string,
  message: string
) {
  return prisma.notification.create({
    data: {
      customerId,
      orderId,
      type,
      title,
      message,
    },
  });
}
