import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, UnitType, Vegetable } from '../types';
import { getUnitPrice, getDefaultUnit, getDefaultQuantity, getStep } from '../utils/pricing';

interface CartState {
  items: CartItem[];
  addItem: (vegetable: Vegetable, unit?: UnitType) => void;
  removeItem: (vegetableId: string) => void;
  updateQuantity: (vegetableId: string, quantity: number) => void;
  updateUnit: (vegetableId: string, unit: UnitType) => void;
  incrementItem: (vegetableId: string) => void;
  decrementItem: (vegetableId: string) => void;
  clearCart: () => void;
  addItemsFromOrder: (items: { vegetable: Vegetable; quantity: number; unit: UnitType }[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (vegetable: Vegetable, preferredUnit?: UnitType) => {
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
          set({ items: newItems });
        } else {
          const unit = preferredUnit ?? getDefaultUnit(vegetable);
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
          set({ items: newItems });
        }
      },

      removeItem: (vegetableId: string) => {
        const newItems = get().items.filter((i) => i.vegetableId !== vegetableId);
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
        set({ items: newItems });
      },

      updateUnit: (vegetableId: string, unit: UnitType) => {
        const newItems = get().items.map((i) => {
          if (i.vegetableId !== vegetableId) return i;
          const unitPrice = getUnitPrice(i.vegetable, unit);
          const quantity = getDefaultQuantity(unit);
          return {
            ...i,
            unit,
            unitPrice,
            quantity,
            totalPrice: +(quantity * unitPrice).toFixed(2),
          };
        });
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
        set({ items: [] });
      },

      addItemsFromOrder: (orderItems) => {
        const { items } = get();
        const newItems = [...items];

        for (const oi of orderItems) {
          const existing = newItems.find((i) => i.vegetableId === oi.vegetable.id);
          if (existing) {
            existing.quantity = oi.quantity;
            existing.unit = oi.unit;
            existing.unitPrice = getUnitPrice(oi.vegetable, oi.unit);
            existing.totalPrice = +(oi.quantity * existing.unitPrice).toFixed(2);
          } else {
            const unitPrice = getUnitPrice(oi.vegetable, oi.unit);
            newItems.push({
              vegetableId: oi.vegetable.id,
              vegetable: oi.vegetable,
              quantity: oi.quantity,
              unit: oi.unit,
              unitPrice,
              totalPrice: +(oi.quantity * unitPrice).toFixed(2),
            });
          }
        }

        set({ items: newItems });
      },
    }),
    { name: 'cart' }
  )
);
