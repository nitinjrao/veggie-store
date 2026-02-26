import type { UnitType } from '../types';

export const UNIT_LABELS: Record<UnitType, string> = {
  KG: 'Kg',
  GRAM: 'Gram',
  PIECE: 'Piece',
  PACKET: 'Packet',
  BUNDLE: 'Bundle',
  BUNCH: 'Bunch',
};

export function getAvailableUnits(vegetable: {
  prices: {
    pricePerKg: string | null;
    pricePerPiece: string | null;
    pricePerPacket: string | null;
    pricePerBundle: string | null;
    pricePerBunch: string | null;
  }[];
}): UnitType[] {
  const price = vegetable.prices[0];
  if (!price) return ['KG'];
  const units: UnitType[] = [];
  if (price.pricePerKg) {
    units.push('KG');
    units.push('GRAM');
  }
  if (price.pricePerPiece) units.push('PIECE');
  if (price.pricePerPacket) units.push('PACKET');
  if (price.pricePerBundle) units.push('BUNDLE');
  if (price.pricePerBunch) units.push('BUNCH');
  return units.length > 0 ? units : ['KG'];
}

export function getUnitPrice(
  vegetable: {
    prices: {
      pricePerKg: string | null;
      pricePerPiece: string | null;
      pricePerPacket: string | null;
      pricePerBundle: string | null;
      pricePerBunch: string | null;
    }[];
  },
  unit: UnitType
): number {
  const price = vegetable.prices[0];
  if (!price) return 0;
  switch (unit) {
    case 'KG':
      return price.pricePerKg ? parseFloat(price.pricePerKg) : 0;
    case 'GRAM':
      return price.pricePerKg ? parseFloat(price.pricePerKg) / 1000 : 0;
    case 'PIECE':
      return price.pricePerPiece ? parseFloat(price.pricePerPiece) : 0;
    case 'PACKET':
      return price.pricePerPacket ? parseFloat(price.pricePerPacket) : 0;
    case 'BUNDLE':
      return price.pricePerBundle ? parseFloat(price.pricePerBundle) : 0;
    case 'BUNCH':
      return price.pricePerBunch ? parseFloat(price.pricePerBunch) : 0;
    default:
      return price.pricePerKg ? parseFloat(price.pricePerKg) : 0;
  }
}

export function getDefaultUnit(vegetable: {
  prices: {
    pricePerKg: string | null;
    pricePerPiece: string | null;
    pricePerPacket: string | null;
    pricePerBundle: string | null;
    pricePerBunch: string | null;
  }[];
}): UnitType {
  const price = vegetable.prices[0];
  if (!price) return 'KG';
  if (price.pricePerKg) return 'KG';
  if (price.pricePerPiece) return 'PIECE';
  if (price.pricePerPacket) return 'PACKET';
  if (price.pricePerBundle) return 'BUNDLE';
  if (price.pricePerBunch) return 'BUNCH';
  return 'KG';
}

export function getDefaultQuantity(unit: UnitType): number {
  switch (unit) {
    case 'KG':
      return 0.5;
    case 'GRAM':
      return 250;
    case 'PIECE':
      return 1;
    case 'PACKET':
      return 1;
    case 'BUNDLE':
      return 1;
    case 'BUNCH':
      return 1;
    default:
      return 1;
  }
}

export function getStep(unit: UnitType): number {
  switch (unit) {
    case 'KG':
      return 0.5;
    case 'GRAM':
      return 50;
    case 'PIECE':
      return 1;
    case 'PACKET':
      return 1;
    case 'BUNDLE':
      return 1;
    case 'BUNCH':
      return 1;
    default:
      return 1;
  }
}
