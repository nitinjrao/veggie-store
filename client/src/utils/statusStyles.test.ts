import {
  FRIDGE_ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
} from './statusStyles';

// ---------------------------------------------------------------------------
// FRIDGE_ORDER_STATUS_STYLES
// ---------------------------------------------------------------------------

describe('FRIDGE_ORDER_STATUS_STYLES', () => {
  const expectedStatuses = ['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'] as const;

  it('contains exactly 6 fridge order status keys', () => {
    expect(Object.keys(FRIDGE_ORDER_STATUS_STYLES)).toHaveLength(6);
  });

  it.each(expectedStatuses)('has key "%s"', (status) => {
    expect(FRIDGE_ORDER_STATUS_STYLES).toHaveProperty(status);
  });

  it.each(expectedStatuses)('value for "%s" is a non-empty string', (status) => {
    const value = FRIDGE_ORDER_STATUS_STYLES[status];
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('PENDING style contains yellow class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.PENDING).toContain('yellow');
  });

  it('CONFIRMED style contains blue class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.CONFIRMED).toContain('blue');
  });

  it('READY style contains emerald class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.READY).toContain('emerald');
  });

  it('PICKED_UP style contains green class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.PICKED_UP).toContain('green');
  });

  it('DELIVERED style contains teal class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.DELIVERED).toContain('teal');
  });

  it('CANCELLED style contains red class', () => {
    expect(FRIDGE_ORDER_STATUS_STYLES.CANCELLED).toContain('red');
  });
});

// ---------------------------------------------------------------------------
// PAYMENT_STATUS_STYLES
// ---------------------------------------------------------------------------

describe('PAYMENT_STATUS_STYLES', () => {
  const expectedStatuses = ['UNPAID', 'PARTIAL', 'PAID', 'OVERPAID'] as const;

  it('contains exactly 4 payment status keys', () => {
    expect(Object.keys(PAYMENT_STATUS_STYLES)).toHaveLength(4);
  });

  it.each(expectedStatuses)('has key "%s"', (status) => {
    expect(PAYMENT_STATUS_STYLES).toHaveProperty(status);
  });

  it.each(expectedStatuses)('value for "%s" is a non-empty string', (status) => {
    const value = PAYMENT_STATUS_STYLES[status];
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('UNPAID style contains red class', () => {
    expect(PAYMENT_STATUS_STYLES.UNPAID).toContain('red');
  });

  it('PARTIAL style contains yellow class', () => {
    expect(PAYMENT_STATUS_STYLES.PARTIAL).toContain('yellow');
  });

  it('PAID style contains green class', () => {
    expect(PAYMENT_STATUS_STYLES.PAID).toContain('green');
  });

  it('OVERPAID style contains blue class', () => {
    expect(PAYMENT_STATUS_STYLES.OVERPAID).toContain('blue');
  });
});

// ---------------------------------------------------------------------------
// FRIDGE_ORDER_STATUS_LABELS
// ---------------------------------------------------------------------------

describe('FRIDGE_ORDER_STATUS_LABELS', () => {
  const expectedStatuses = ['PENDING', 'CONFIRMED', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED'] as const;

  it('contains exactly 6 fridge order status label keys', () => {
    expect(Object.keys(FRIDGE_ORDER_STATUS_LABELS)).toHaveLength(6);
  });

  it.each(expectedStatuses)('has key "%s"', (status) => {
    expect(FRIDGE_ORDER_STATUS_LABELS).toHaveProperty(status);
  });

  it.each(expectedStatuses)('value for "%s" is a non-empty string', (status) => {
    const value = FRIDGE_ORDER_STATUS_LABELS[status];
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('maps PENDING to "Pending"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.PENDING).toBe('Pending');
  });

  it('maps CONFIRMED to "Confirmed"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.CONFIRMED).toBe('Confirmed');
  });

  it('maps READY to "Ready"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.READY).toBe('Ready');
  });

  it('maps PICKED_UP to "Picked Up"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.PICKED_UP).toBe('Picked Up');
  });

  it('maps DELIVERED to "Delivered"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.DELIVERED).toBe('Delivered');
  });

  it('maps CANCELLED to "Cancelled"', () => {
    expect(FRIDGE_ORDER_STATUS_LABELS.CANCELLED).toBe('Cancelled');
  });
});
