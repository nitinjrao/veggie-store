import { ShoppingCart, Plus, Minus } from 'lucide-react';
import type { Vegetable } from '../../types';
import { useCartStore } from '../../stores/cartStore';

interface VegetableCardProps {
  vegetable: Vegetable;
}

export default function VegetableCard({ vegetable }: VegetableCardProps) {
  const price = vegetable.prices[0];
  const pricePerKg = price?.pricePerKg ? parseFloat(price.pricePerKg) : null;
  const pricePerPacket = price?.pricePerPacket ? parseFloat(price.pricePerPacket) : null;
  const pricePerPiece = price?.pricePerPiece ? parseFloat(price.pricePerPiece) : null;
  const packetWeight = price?.packetWeight ? parseFloat(price.packetWeight) : null;

  const cartItem = useCartStore((s) => s.items.find((i) => i.vegetableId === vegetable.id));
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4 flex flex-col">
      <div className="text-4xl text-center mb-3">{vegetable.emoji || '🥬'}</div>
      <h3 className="font-semibold text-sm text-text-dark">{vegetable.name}</h3>
      {vegetable.nameHindi && (
        <p className="text-xs text-text-muted font-hindi">{vegetable.nameHindi}</p>
      )}

      <div className="mt-auto pt-3 space-y-1">
        {pricePerKg !== null && (
          <p className="text-sm font-semibold text-primary-green-dark">
            ₹{pricePerKg}/kg
          </p>
        )}
        {pricePerPacket !== null && (
          <p className="text-xs text-text-muted">
            ₹{pricePerPacket}/packet{packetWeight ? ` (${packetWeight}kg)` : ''}
          </p>
        )}
        {pricePerPiece !== null && (
          <p className="text-xs text-text-muted">₹{pricePerPiece}/piece</p>
        )}
      </div>

      {cartItem ? (
        <div className="mt-3 flex items-center justify-between gap-2 py-1">
          <button
            onClick={() => decrementItem(vegetable.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-text-dark transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-dark">
            {cartItem.quantity} {cartItem.unit.toLowerCase()}
          </span>
          <button
            onClick={() => incrementItem(vegetable.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-green hover:bg-primary-green-dark text-white transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => addItem(vegetable)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-green text-white text-sm font-medium hover:bg-primary-green-dark transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      )}
    </div>
  );
}
