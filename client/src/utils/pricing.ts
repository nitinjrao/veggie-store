import type { UnitType } from '../types';

export const UNIT_LABELS: Record<UnitType, string> = {
  KG: 'Kg',
  GRAM: 'Gram',
  PIECE: 'Piece',
  PACKET: 'Packet',
  BUNDLE: 'Bundle',
  BUNCH: 'Bunch',
};

export function getAvailableUnits(vegetable: { prices: { pricePerKg: string | null; pricePerPiece: string | null; pricePerPacket: string | null; pricePerBundle: string | null; pricePerBunch: string | null }[] }): UnitType[] {
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
