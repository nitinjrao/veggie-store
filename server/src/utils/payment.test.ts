import { Decimal } from '@prisma/client/runtime/library';
import { computePaymentStatus } from './payment';

describe('computePaymentStatus', () => {
  it('returns UNPAID when paidAmount is 0', () => {
    const result = computePaymentStatus(new Decimal(0), new Decimal(100));
    expect(result).toBe('UNPAID');
  });

  it('returns PARTIAL when paidAmount is less than totalAmount', () => {
    const result = computePaymentStatus(new Decimal(50), new Decimal(100));
    expect(result).toBe('PARTIAL');
  });

  it('returns PAID when paidAmount equals totalAmount', () => {
    const result = computePaymentStatus(new Decimal(100), new Decimal(100));
    expect(result).toBe('PAID');
  });

  it('returns OVERPAID when paidAmount exceeds totalAmount', () => {
    const result = computePaymentStatus(new Decimal(150), new Decimal(100));
    expect(result).toBe('OVERPAID');
  });

  it('returns UNPAID when both amounts are 0', () => {
    const result = computePaymentStatus(new Decimal(0), new Decimal(0));
    expect(result).toBe('UNPAID');
  });

  it('handles decimal values for PARTIAL', () => {
    const result = computePaymentStatus(new Decimal('49.99'), new Decimal('100.00'));
    expect(result).toBe('PARTIAL');
  });

  it('handles decimal values for PAID', () => {
    const result = computePaymentStatus(new Decimal('99.99'), new Decimal('99.99'));
    expect(result).toBe('PAID');
  });

  it('handles decimal values for OVERPAID', () => {
    const result = computePaymentStatus(new Decimal('100.01'), new Decimal('100.00'));
    expect(result).toBe('OVERPAID');
  });

  it('handles very small paid amount as PARTIAL', () => {
    const result = computePaymentStatus(new Decimal('0.01'), new Decimal('1000'));
    expect(result).toBe('PARTIAL');
  });
});
