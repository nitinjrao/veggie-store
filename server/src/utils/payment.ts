import { Decimal } from '@prisma/client/runtime/library';

export function computePaymentStatus(paidAmount: Decimal, totalAmount: Decimal) {
  if (paidAmount.equals(0)) return 'UNPAID' as const;
  if (paidAmount.lessThan(totalAmount)) return 'PARTIAL' as const;
  if (paidAmount.equals(totalAmount)) return 'PAID' as const;
  return 'OVERPAID' as const;
}
