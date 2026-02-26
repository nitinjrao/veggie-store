import {
  FRIDGE_ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
} from '../../utils/statusStyles';
import type { PaymentStatus } from '../../types';

type StatusType = 'order' | 'fridgeOrder' | 'payment';

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

const styleMap = {
  order: FRIDGE_ORDER_STATUS_STYLES,
  fridgeOrder: FRIDGE_ORDER_STATUS_STYLES,
  payment: PAYMENT_STATUS_STYLES,
} as const;

const labelMap = {
  order: FRIDGE_ORDER_STATUS_LABELS,
  fridgeOrder: FRIDGE_ORDER_STATUS_LABELS,
  payment: { UNPAID: 'Unpaid', PARTIAL: 'Partial', PAID: 'Paid', OVERPAID: 'Overpaid' } as Record<
    PaymentStatus,
    string
  >,
} as const;

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  const styles = (styleMap[type] as Record<string, string>)[status] || 'bg-gray-100 text-gray-700';
  const label = (labelMap[type] as Record<string, string>)[status] || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles} ${className}`}
    >
      {label}
    </span>
  );
}
