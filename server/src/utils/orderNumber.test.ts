import { generateFridgeOrderNumber } from './orderNumber';

// Mock prisma to avoid real DB calls
vi.mock('../lib/prisma', () => ({
  prisma: {
    fridgePickupOrder: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

describe('generateFridgeOrderNumber', () => {
  const mockFindFirst = prisma.fridgePickupOrder.findFirst as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates order number with sequence 001 when no existing orders', async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await generateFridgeOrderNumber();

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(result).toBe(`FP-${today}-001`);
  });

  it('increments sequence based on last existing order', async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    mockFindFirst.mockResolvedValue({ orderNumber: `FP-${today}-005` });

    const result = await generateFridgeOrderNumber();

    expect(result).toBe(`FP-${today}-006`);
  });

  it('pads sequence number to 3 digits', async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    mockFindFirst.mockResolvedValue({ orderNumber: `FP-${today}-009` });

    const result = await generateFridgeOrderNumber();

    expect(result).toBe(`FP-${today}-010`);
  });

  it('calls findFirst with correct prefix and orderBy', async () => {
    mockFindFirst.mockResolvedValue(null);

    await generateFridgeOrderNumber();

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { orderNumber: { startsWith: `FP-${today}-` } },
      orderBy: { orderNumber: 'desc' },
    });
  });

  it('handles sequence rollover past 999', async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    mockFindFirst.mockResolvedValue({ orderNumber: `FP-${today}-999` });

    const result = await generateFridgeOrderNumber();

    expect(result).toBe(`FP-${today}-1000`);
  });
});
