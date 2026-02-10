import { create } from 'zustand';
import type { CartItem, UnitType, Vegetable } from '../types';

function getUnitPrice(vegetable: Vegetable, unit: UnitType): number {
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
    default:
      return price.pricePerKg ? parseFloat(price.pricePerKg) : 0;
  }
}

function getDefaultUnit(vegetable: Vegetable): UnitType {
  const price = vegetable.prices[0];
  if (!price) return 'KG';
  if (price.pricePerKg) return 'KG';
  if (price.pricePerPiece) return 'PIECE';
  if (price.pricePerPacket) return 'PACKET';
  return 'KG';
}

function getDefaultQuantity(unit: UnitType): number {
  switch (unit) {
    case 'KG': return 0.5;
    case 'GRAM': return 250;
    case 'PIECE': return 1;
    case 'PACKET': return 1;
    default: return 1;
  }
}

function getStep(unit: UnitType): number {
  switch (unit) {
    case 'KG': return 0.5;
    case 'GRAM': return 50;
    case 'PIECE': return 1;
    case 'PACKET': return 1;
    default: return 1;
  }
}

function persistCart(items: CartItem[]) {
  localStorage.setItem('cart', JSON.stringify(items));
}

interface CartState {
  items: CartItem[];
  addItem: (vegetable: Vegetable) => void;
  removeItem: (vegetableId: string) => void;
  updateQuantity: (vegetableId: string, quantity: number) => void;
  updateUnit: (vegetableId: string, unit: UnitType) => void;
  incrementItem: (vegetableId: string) => void;
  decrementItem: (vegetableId: string) => void;
  clearCart: () => void;
  initialize: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (vegetable: Vegetable) => {
    const { items } = get();
    const existing = items.find((i) => i.vegetableId === vegetable.id);
    if (existing) {
      const step = getStep(existing.unit);
      const newQty = existing.quantity + step;
      const newItems = items.map((i) =>
        i.vegetableId === vegetable.id
          ? { ...i, quantity: newQty, totalPrice: +(newQty * i.unitPrice).toFixed(2) }
          : i
      );
      persistCart(newItems);
      set({ items: newItems });
    } else {
      const unit = getDefaultUnit(vegetable);
      const quantity = getDefaultQuantity(unit);
      const unitPrice = getUnitPrice(vegetable, unit);
      const newItem: CartItem = {
        vegetableId: vegetable.id,
        vegetable,
        quantity,
        unit,
        unitPrice,
        totalPrice: +(quantity * unitPrice).toFixed(2),
      };
      const newItems = [...items, newItem];
      persistCart(newItems);
      set({ items: newItems });
    }
  },

  removeItem: (vegetableId: string) => {
    const newItems = get().items.filter((i) => i.vegetableId !== vegetableId);
    persistCart(newItems);
    set({ items: newItems });
  },

  updateQuantity: (vegetableId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(vegetableId);
      return;
    }
    const newItems = get().items.map((i) =>
      i.vegetableId === vegetableId
        ? { ...i, quantity, totalPrice: +(quantity * i.unitPrice).toFixed(2) }
        : i
    );
    persistCart(newItems);
    set({ items: newItems });
  },

  updateUnit: (vegetableId: string, unit: UnitType) => {
    const newItems = get().items.map((i) => {
      if (i.vegetableId !== vegetableId) return i;
      const unitPrice = getUnitPrice(i.vegetable, unit);
      const quantity = getDefaultQuantity(unit);
      return { ...i, unit, unitPrice, quantity, totalPrice: +(quantity * unitPrice).toFixed(2) };
    });
    persistCart(newItems);
    set({ items: newItems });
  },

  incrementItem: (vegetableId: string) => {
    const item = get().items.find((i) => i.vegetableId === vegetableId);
    if (!item) return;
    const step = getStep(item.unit);
    get().updateQuantity(vegetableId, +(item.quantity + step).toFixed(3));
  },

  decrementItem: (vegetableId: string) => {
    const item = get().items.find((i) => i.vegetableId === vegetableId);
    if (!item) return;
    const step = getStep(item.unit);
    const newQty = +(item.quantity - step).toFixed(3);
    if (newQty <= 0) {
      get().removeItem(vegetableId);
    } else {
      get().updateQuantity(vegetableId, newQty);
    }
  },

  clearCart: () => {
    localStorage.removeItem('cart');
    set({ items: [] });
  },

  initialize: () => {
    const cartStr = localStorage.getItem('cart');
    if (cartStr) {
      try {
        const items = JSON.parse(cartStr) as CartItem[];
        set({ items });
      } catch {
        localStorage.removeItem('cart');
      }
    }
  },
}));
