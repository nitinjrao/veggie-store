import {
  UNIT_LABELS,
  getAvailableUnits,
  getUnitPrice,
  getDefaultUnit,
  getDefaultQuantity,
  getStep,
} from './pricing';
import type { UnitType } from '../types';

// ---------------------------------------------------------------------------
// Helpers to build vegetable-like objects used by the pricing functions
// ---------------------------------------------------------------------------

function makeVeg(
  overrides: Partial<{
    pricePerKg: string | null;
    pricePerPiece: string | null;
    pricePerPacket: string | null;
    pricePerBundle: string | null;
    pricePerBunch: string | null;
  }> = {}
) {
  return {
    prices: [
      {
        pricePerKg: null,
        pricePerPiece: null,
        pricePerPacket: null,
        pricePerBundle: null,
        pricePerBunch: null,
        ...overrides,
      },
    ],
  };
}

const emptyVeg = { prices: [] as never[] };

// ---------------------------------------------------------------------------
// UNIT_LABELS
// ---------------------------------------------------------------------------

describe('UNIT_LABELS', () => {
  it('contains all 6 unit types', () => {
    const expectedKeys: UnitType[] = ['KG', 'GRAM', 'PIECE', 'PACKET', 'BUNDLE', 'BUNCH'];
    expect(Object.keys(UNIT_LABELS).sort()).toEqual(expectedKeys.sort());
  });

  it('maps each key to the correct human-readable label', () => {
    expect(UNIT_LABELS.KG).toBe('Kg');
    expect(UNIT_LABELS.GRAM).toBe('Gram');
    expect(UNIT_LABELS.PIECE).toBe('Piece');
    expect(UNIT_LABELS.PACKET).toBe('Packet');
    expect(UNIT_LABELS.BUNDLE).toBe('Bundle');
    expect(UNIT_LABELS.BUNCH).toBe('Bunch');
  });
});

// ---------------------------------------------------------------------------
// getAvailableUnits
// ---------------------------------------------------------------------------

describe('getAvailableUnits', () => {
  it('returns ["KG"] when prices array is empty', () => {
    expect(getAvailableUnits(emptyVeg)).toEqual(['KG']);
  });

  it('returns ["KG"] when all price fields are null', () => {
    expect(getAvailableUnits(makeVeg())).toEqual(['KG']);
  });

  it('returns KG and GRAM when only pricePerKg is set', () => {
    const veg = makeVeg({ pricePerKg: '100' });
    expect(getAvailableUnits(veg)).toEqual(['KG', 'GRAM']);
  });

  it('returns only PIECE when only pricePerPiece is set', () => {
    const veg = makeVeg({ pricePerPiece: '25' });
    expect(getAvailableUnits(veg)).toEqual(['PIECE']);
  });

  it('returns only PACKET when only pricePerPacket is set', () => {
    const veg = makeVeg({ pricePerPacket: '50' });
    expect(getAvailableUnits(veg)).toEqual(['PACKET']);
  });

  it('returns only BUNDLE when only pricePerBundle is set', () => {
    const veg = makeVeg({ pricePerBundle: '80' });
    expect(getAvailableUnits(veg)).toEqual(['BUNDLE']);
  });

  it('returns only BUNCH when only pricePerBunch is set', () => {
    const veg = makeVeg({ pricePerBunch: '30' });
    expect(getAvailableUnits(veg)).toEqual(['BUNCH']);
  });

  it('returns multiple units when several prices are set', () => {
    const veg = makeVeg({ pricePerKg: '100', pricePerPiece: '25' });
    expect(getAvailableUnits(veg)).toEqual(['KG', 'GRAM', 'PIECE']);
  });

  it('returns all units when every price field is set', () => {
    const veg = makeVeg({
      pricePerKg: '100',
      pricePerPiece: '25',
      pricePerPacket: '50',
      pricePerBundle: '80',
      pricePerBunch: '30',
    });
    expect(getAvailableUnits(veg)).toEqual(['KG', 'GRAM', 'PIECE', 'PACKET', 'BUNDLE', 'BUNCH']);
  });
});

// ---------------------------------------------------------------------------
// getUnitPrice
// ---------------------------------------------------------------------------

describe('getUnitPrice', () => {
  it('returns 0 when prices array is empty', () => {
    expect(getUnitPrice(emptyVeg, 'KG')).toBe(0);
  });

  it('returns pricePerKg for KG unit', () => {
    const veg = makeVeg({ pricePerKg: '120.50' });
    expect(getUnitPrice(veg, 'KG')).toBeCloseTo(120.5);
  });

  it('returns pricePerKg / 1000 for GRAM unit', () => {
    const veg = makeVeg({ pricePerKg: '200' });
    expect(getUnitPrice(veg, 'GRAM')).toBeCloseTo(0.2);
  });

  it('returns pricePerPiece for PIECE unit', () => {
    const veg = makeVeg({ pricePerPiece: '15' });
    expect(getUnitPrice(veg, 'PIECE')).toBe(15);
  });

  it('returns pricePerPacket for PACKET unit', () => {
    const veg = makeVeg({ pricePerPacket: '45.75' });
    expect(getUnitPrice(veg, 'PACKET')).toBeCloseTo(45.75);
  });

  it('returns pricePerBundle for BUNDLE unit', () => {
    const veg = makeVeg({ pricePerBundle: '60' });
    expect(getUnitPrice(veg, 'BUNDLE')).toBe(60);
  });

  it('returns pricePerBunch for BUNCH unit', () => {
    const veg = makeVeg({ pricePerBunch: '30' });
    expect(getUnitPrice(veg, 'BUNCH')).toBe(30);
  });

  it('returns 0 for KG when pricePerKg is null', () => {
    expect(getUnitPrice(makeVeg(), 'KG')).toBe(0);
  });

  it('returns 0 for GRAM when pricePerKg is null', () => {
    expect(getUnitPrice(makeVeg(), 'GRAM')).toBe(0);
  });

  it('returns 0 for PIECE when pricePerPiece is null', () => {
    expect(getUnitPrice(makeVeg(), 'PIECE')).toBe(0);
  });

  it('returns 0 for PACKET when pricePerPacket is null', () => {
    expect(getUnitPrice(makeVeg(), 'PACKET')).toBe(0);
  });

  it('returns 0 for BUNDLE when pricePerBundle is null', () => {
    expect(getUnitPrice(makeVeg(), 'BUNDLE')).toBe(0);
  });

  it('returns 0 for BUNCH when pricePerBunch is null', () => {
    expect(getUnitPrice(makeVeg(), 'BUNCH')).toBe(0);
  });

  it('falls back to pricePerKg for an unknown unit (default case)', () => {
    const veg = makeVeg({ pricePerKg: '100' });
    // Force an unknown unit string through the type system
    expect(getUnitPrice(veg, 'UNKNOWN' as UnitType)).toBe(100);
  });

  it('returns 0 for an unknown unit when pricePerKg is null', () => {
    expect(getUnitPrice(makeVeg(), 'UNKNOWN' as UnitType)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getDefaultUnit
// ---------------------------------------------------------------------------

describe('getDefaultUnit', () => {
  it('returns KG when prices array is empty', () => {
    expect(getDefaultUnit(emptyVeg)).toBe('KG');
  });

  it('returns KG when pricePerKg is set', () => {
    expect(getDefaultUnit(makeVeg({ pricePerKg: '100' }))).toBe('KG');
  });

  it('returns PIECE when only pricePerPiece is set', () => {
    expect(getDefaultUnit(makeVeg({ pricePerPiece: '25' }))).toBe('PIECE');
  });

  it('returns PACKET when only pricePerPacket is set', () => {
    expect(getDefaultUnit(makeVeg({ pricePerPacket: '50' }))).toBe('PACKET');
  });

  it('returns BUNDLE when only pricePerBundle is set', () => {
    expect(getDefaultUnit(makeVeg({ pricePerBundle: '80' }))).toBe('BUNDLE');
  });

  it('returns BUNCH when only pricePerBunch is set', () => {
    expect(getDefaultUnit(makeVeg({ pricePerBunch: '30' }))).toBe('BUNCH');
  });

  it('returns KG when all price fields are null (fallback)', () => {
    expect(getDefaultUnit(makeVeg())).toBe('KG');
  });

  it('prefers KG over other units when multiple prices are set', () => {
    const veg = makeVeg({ pricePerKg: '100', pricePerPiece: '25', pricePerBunch: '30' });
    expect(getDefaultUnit(veg)).toBe('KG');
  });

  it('prefers PIECE over PACKET/BUNDLE/BUNCH when KG is absent', () => {
    const veg = makeVeg({ pricePerPiece: '25', pricePerPacket: '50', pricePerBunch: '30' });
    expect(getDefaultUnit(veg)).toBe('PIECE');
  });
});

// ---------------------------------------------------------------------------
// getDefaultQuantity
// ---------------------------------------------------------------------------

describe('getDefaultQuantity', () => {
  it('returns 0.5 for KG', () => {
    expect(getDefaultQuantity('KG')).toBe(0.5);
  });

  it('returns 250 for GRAM', () => {
    expect(getDefaultQuantity('GRAM')).toBe(250);
  });

  it('returns 1 for PIECE', () => {
    expect(getDefaultQuantity('PIECE')).toBe(1);
  });

  it('returns 1 for PACKET', () => {
    expect(getDefaultQuantity('PACKET')).toBe(1);
  });

  it('returns 1 for BUNDLE', () => {
    expect(getDefaultQuantity('BUNDLE')).toBe(1);
  });

  it('returns 1 for BUNCH', () => {
    expect(getDefaultQuantity('BUNCH')).toBe(1);
  });

  it('returns 1 for an unknown unit (default case)', () => {
    expect(getDefaultQuantity('OTHER' as UnitType)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getStep
// ---------------------------------------------------------------------------

describe('getStep', () => {
  it('returns 0.5 for KG', () => {
    expect(getStep('KG')).toBe(0.5);
  });

  it('returns 50 for GRAM', () => {
    expect(getStep('GRAM')).toBe(50);
  });

  it('returns 1 for PIECE', () => {
    expect(getStep('PIECE')).toBe(1);
  });

  it('returns 1 for PACKET', () => {
    expect(getStep('PACKET')).toBe(1);
  });

  it('returns 1 for BUNDLE', () => {
    expect(getStep('BUNDLE')).toBe(1);
  });

  it('returns 1 for BUNCH', () => {
    expect(getStep('BUNCH')).toBe(1);
  });

  it('returns 1 for an unknown unit (default case)', () => {
    expect(getStep('OTHER' as UnitType)).toBe(1);
  });
});
