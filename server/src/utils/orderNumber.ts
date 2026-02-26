import { prisma } from '../lib/prisma';

interface OrderModel {
  findFirst: (args: {
    where: { orderNumber: { startsWith: string } };
    orderBy: { orderNumber: 'desc' };
  }) => Promise<{ orderNumber: string } | null>;
}

async function generateSequentialNumber(prefix: string, model: OrderModel): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const fullPrefix = `${prefix}${dateStr}-`;

  const lastOrder = await model.findFirst({
    where: { orderNumber: { startsWith: fullPrefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let seq = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }

  return `${fullPrefix}${seq.toString().padStart(3, '0')}`;
}

export function generateFridgeOrderNumber(): Promise<string> {
  return generateSequentialNumber('FP-', prisma.fridgePickupOrder as unknown as OrderModel);
}
