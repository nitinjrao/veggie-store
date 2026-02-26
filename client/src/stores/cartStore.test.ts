import { useCartStore } from './cartStore';
import type { Vegetable } from '../types';

/**
 * Creates a valid Vegetable mock with sensible defaults.
 * By default the vegetable has a KG price of "50".
 */
function makeVegetable(overrides: Partial<Vegetable> = {}): Vegetable {
  return {
    id: 'veg-1',
    name: 'Tomato',
    nameHindi: 'Tamatar',
    nameKannada: null,
    image: null,
    emoji: null,
    description: null,
    available: true,
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Vegetables',
      nameHindi: null,
      image: null,
      sortOrder: 1,
    },
    prices: [
      {
        id: 'price-1',
        vegetableId: 'veg-1',
        pricePerKg: '50',
        pricePerPiece: null,
        pricePerPacket: null,
        pricePerBundle: null,
        pricePerBunch: null,
        packetWeight: null,
        effectiveFrom: '2026-01-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  // -------------------------------------------------------
  // 1. Starts with empty cart
  // -------------------------------------------------------
  it('starts with an empty cart', () => {
    const { items } = useCartStore.getState();
    expect(items).toEqual([]);
  });

  // -------------------------------------------------------
  // 2. addItem -- adds a new item with default unit/quantity
  // -------------------------------------------------------
  it('addItem adds a new item with default unit and quantity', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);

    const item = items[0];
    // Default unit for a vegetable with pricePerKg should be KG
    expect(item.unit).toBe('KG');
    // Default quantity for KG is 0.5
    expect(item.quantity).toBe(0.5);
    // Unit price = 50 (pricePerKg)
    expect(item.unitPrice).toBe(50);
    // Total price = 0.5 * 50 = 25
    expect(item.totalPrice).toBe(25);
    expect(item.vegetableId).toBe('veg-1');
    expect(item.vegetable).toEqual(veg);
  });

  // -------------------------------------------------------
  // 3. addItem -- increments existing item by step
  // -------------------------------------------------------
  it('addItem increments quantity of an existing item by its step', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);
    useCartStore.getState().addItem(veg);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    // KG step = 0.5, so after two addItem calls: 0.5 + 0.5 = 1.0
    expect(items[0].quantity).toBe(1.0);
    // Total price = 1.0 * 50 = 50
    expect(items[0].totalPrice).toBe(50);
  });

  // -------------------------------------------------------
  // 4. addItem -- with a preferred unit
  // -------------------------------------------------------
  it('addItem uses the preferred unit when provided', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg, 'GRAM');

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].unit).toBe('GRAM');
    // Default quantity for GRAM is 250
    expect(items[0].quantity).toBe(250);
    // GRAM unit price = pricePerKg / 1000 = 50 / 1000 = 0.05
    expect(items[0].unitPrice).toBe(0.05);
    // Total = 250 * 0.05 = 12.5
    expect(items[0].totalPrice).toBe(12.5);
  });

  // -------------------------------------------------------
  // 5. removeItem -- removes the item
  // -------------------------------------------------------
  it('removeItem removes the item from cart', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);
    expect(useCartStore.getState().items).toHaveLength(1);

    useCartStore.getState().removeItem('veg-1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // -------------------------------------------------------
  // 6. removeItem -- no-op for non-existent id
  // -------------------------------------------------------
  it('removeItem is a no-op when the id does not exist', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().removeItem('non-existent');
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  // -------------------------------------------------------
  // 7. updateQuantity -- updates quantity and totalPrice
  // -------------------------------------------------------
  it('updateQuantity updates quantity and recalculates totalPrice', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().updateQuantity('veg-1', 3);

    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(3);
    // totalPrice = 3 * 50 = 150
    expect(item.totalPrice).toBe(150);
  });

  // -------------------------------------------------------
  // 8. updateQuantity -- removes item if quantity <= 0
  // -------------------------------------------------------
  it('updateQuantity removes item when quantity is 0', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().updateQuantity('veg-1', 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQuantity removes item when quantity is negative', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().updateQuantity('veg-1', -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // -------------------------------------------------------
  // 9. updateUnit -- changes unit and recalculates
  // -------------------------------------------------------
  it('updateUnit changes unit, resets quantity to default for new unit, and recalculates price', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5

    useCartStore.getState().updateUnit('veg-1', 'GRAM');

    const item = useCartStore.getState().items[0];
    expect(item.unit).toBe('GRAM');
    // Default quantity for GRAM is 250
    expect(item.quantity).toBe(250);
    // GRAM unit price = 50 / 1000 = 0.05
    expect(item.unitPrice).toBe(0.05);
    // totalPrice = 250 * 0.05 = 12.5
    expect(item.totalPrice).toBe(12.5);
  });

  // -------------------------------------------------------
  // 10. incrementItem -- increases quantity by step
  // -------------------------------------------------------
  it('incrementItem increases quantity by the unit step', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5

    useCartStore.getState().incrementItem('veg-1');

    const item = useCartStore.getState().items[0];
    // 0.5 + 0.5 (KG step) = 1.0
    expect(item.quantity).toBe(1.0);
    expect(item.totalPrice).toBe(50);
  });

  // -------------------------------------------------------
  // 11. incrementItem -- no-op for non-existent id
  // -------------------------------------------------------
  it('incrementItem is a no-op when the id does not exist', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().incrementItem('non-existent');

    // Cart remains unchanged
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(0.5);
  });

  // -------------------------------------------------------
  // 12. decrementItem -- decreases quantity by step
  // -------------------------------------------------------
  it('decrementItem decreases quantity by the unit step', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5
    // First, increment to get qty = 1.0 so we can decrement without removal
    useCartStore.getState().incrementItem('veg-1');
    expect(useCartStore.getState().items[0].quantity).toBe(1.0);

    useCartStore.getState().decrementItem('veg-1');

    const item = useCartStore.getState().items[0];
    // 1.0 - 0.5 = 0.5
    expect(item.quantity).toBe(0.5);
    expect(item.totalPrice).toBe(25);
  });

  // -------------------------------------------------------
  // 13. decrementItem -- removes item if quantity goes to 0 or below
  // -------------------------------------------------------
  it('decrementItem removes the item when quantity reaches 0', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5

    // Decrementing by step 0.5 from qty 0.5 => 0, should remove
    useCartStore.getState().decrementItem('veg-1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('decrementItem is a no-op when the id does not exist', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg);

    useCartStore.getState().decrementItem('non-existent');
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(0.5);
  });

  // -------------------------------------------------------
  // 14. clearCart -- empties everything
  // -------------------------------------------------------
  it('clearCart empties all items', () => {
    const veg1 = makeVegetable({ id: 'veg-1' });
    const veg2 = makeVegetable({ id: 'veg-2', name: 'Potato' });
    useCartStore.getState().addItem(veg1);
    useCartStore.getState().addItem(veg2);
    expect(useCartStore.getState().items).toHaveLength(2);

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // -------------------------------------------------------
  // 15. addItemsFromOrder -- adds new items
  // -------------------------------------------------------
  it('addItemsFromOrder adds new items to an empty cart', () => {
    const veg1 = makeVegetable({ id: 'veg-1' });
    const veg2 = makeVegetable({ id: 'veg-2', name: 'Potato' });

    useCartStore.getState().addItemsFromOrder([
      { vegetable: veg1, quantity: 2, unit: 'KG' },
      { vegetable: veg2, quantity: 3, unit: 'KG' },
    ]);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);

    const item1 = items.find((i) => i.vegetableId === 'veg-1')!;
    expect(item1.quantity).toBe(2);
    expect(item1.unit).toBe('KG');
    expect(item1.unitPrice).toBe(50);
    expect(item1.totalPrice).toBe(100);

    const item2 = items.find((i) => i.vegetableId === 'veg-2')!;
    expect(item2.quantity).toBe(3);
    expect(item2.totalPrice).toBe(150);
  });

  // -------------------------------------------------------
  // 16. addItemsFromOrder -- updates existing items
  // -------------------------------------------------------
  it('addItemsFromOrder updates existing items in the cart', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5, total 25

    // Now add from order with different quantity and unit
    useCartStore.getState().addItemsFromOrder([{ vegetable: veg, quantity: 5, unit: 'KG' }]);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    expect(items[0].unit).toBe('KG');
    expect(items[0].unitPrice).toBe(50);
    expect(items[0].totalPrice).toBe(250);
  });

  // -------------------------------------------------------
  // Additional edge-case tests for thorough coverage
  // -------------------------------------------------------
  it('addItemsFromOrder mixes adding new and updating existing items', () => {
    const veg1 = makeVegetable({ id: 'veg-1' });
    const veg2 = makeVegetable({ id: 'veg-2', name: 'Potato' });

    // Add veg1 first
    useCartStore.getState().addItem(veg1); // KG, qty 0.5

    // Add from order: update veg1, add veg2
    useCartStore.getState().addItemsFromOrder([
      { vegetable: veg1, quantity: 3, unit: 'KG' },
      { vegetable: veg2, quantity: 1, unit: 'KG' },
    ]);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);

    const item1 = items.find((i) => i.vegetableId === 'veg-1')!;
    expect(item1.quantity).toBe(3);
    expect(item1.totalPrice).toBe(150);

    const item2 = items.find((i) => i.vegetableId === 'veg-2')!;
    expect(item2.quantity).toBe(1);
    expect(item2.totalPrice).toBe(50);
  });

  it('addItem defaults to PIECE when vegetable only has pricePerPiece', () => {
    const veg = makeVegetable({
      id: 'veg-piece',
      prices: [
        {
          id: 'price-2',
          vegetableId: 'veg-piece',
          pricePerKg: null,
          pricePerPiece: '10',
          pricePerPacket: null,
          pricePerBundle: null,
          pricePerBunch: null,
          packetWeight: null,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    useCartStore.getState().addItem(veg);

    const item = useCartStore.getState().items[0];
    expect(item.unit).toBe('PIECE');
    // Default quantity for PIECE is 1
    expect(item.quantity).toBe(1);
    expect(item.unitPrice).toBe(10);
    expect(item.totalPrice).toBe(10);
  });

  it('incrementItem works correctly for PIECE unit (step = 1)', () => {
    const veg = makeVegetable({
      id: 'veg-piece',
      prices: [
        {
          id: 'price-2',
          vegetableId: 'veg-piece',
          pricePerKg: null,
          pricePerPiece: '10',
          pricePerPacket: null,
          pricePerBundle: null,
          pricePerBunch: null,
          packetWeight: null,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    useCartStore.getState().addItem(veg); // PIECE, qty 1
    useCartStore.getState().incrementItem('veg-piece');

    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(2);
    expect(item.totalPrice).toBe(20);
  });

  it('updateUnit on a non-existent item does not add it', () => {
    useCartStore.getState().updateUnit('non-existent', 'GRAM');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQuantity on a non-existent item does not add it', () => {
    useCartStore.getState().updateQuantity('non-existent', 5);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('addItemsFromOrder with GRAM unit calculates price correctly', () => {
    const veg = makeVegetable();

    useCartStore.getState().addItemsFromOrder([{ vegetable: veg, quantity: 500, unit: 'GRAM' }]);

    const item = useCartStore.getState().items[0];
    expect(item.unit).toBe('GRAM');
    // GRAM unit price = 50 / 1000 = 0.05
    expect(item.unitPrice).toBe(0.05);
    // Total = 500 * 0.05 = 25
    expect(item.totalPrice).toBe(25);
  });

  it('multiple increments accumulate correctly', () => {
    const veg = makeVegetable();
    useCartStore.getState().addItem(veg); // KG, qty 0.5

    useCartStore.getState().incrementItem('veg-1'); // 1.0
    useCartStore.getState().incrementItem('veg-1'); // 1.5
    useCartStore.getState().incrementItem('veg-1'); // 2.0

    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(2.0);
    expect(item.totalPrice).toBe(100);
  });

  it('addItem increments existing item even when preferred unit is passed', () => {
    const veg = makeVegetable();
    // First add with default (KG)
    useCartStore.getState().addItem(veg);
    // Second add with preferred unit -- but item already exists, so it increments
    useCartStore.getState().addItem(veg, 'GRAM');

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    // The existing item's unit stays KG and quantity increments by KG step (0.5)
    expect(items[0].unit).toBe('KG');
    expect(items[0].quantity).toBe(1.0);
  });
});
