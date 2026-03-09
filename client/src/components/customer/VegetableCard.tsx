import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Heart } from 'lucide-react';
import type { Vegetable, UnitType } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useFavoriteStore } from '../../stores/favoriteStore';
import { useAuthStore } from '../../stores/authStore';
import { getAvailableUnits, UNIT_LABELS } from '../../utils/pricing';

interface VegetableCardProps {
  vegetable: Vegetable;
}

function getDisplayPrice(vegetable: Vegetable, unit: UnitType): number | null {
  const price = vegetable.prices[0];
  if (!price) return null;
  switch (unit) {
    case 'KG':
    case 'GRAM':
      return price.pricePerKg ? parseFloat(price.pricePerKg) : null;
    case 'PIECE':
      return price.pricePerPiece ? parseFloat(price.pricePerPiece) : null;
    case 'PACKET':
      return price.pricePerPacket ? parseFloat(price.pricePerPacket) : null;
    case 'BUNDLE':
      return price.pricePerBundle ? parseFloat(price.pricePerBundle) : null;
    case 'BUNCH':
      return price.pricePerBunch ? parseFloat(price.pricePerBunch) : null;
    default:
      return null;
  }
}

function getUnitSuffix(unit: UnitType): string {
  switch (unit) {
    case 'KG':
      return '/kg';
    case 'GRAM':
      return '/kg';
    case 'PIECE':
      return '/piece';
    case 'PACKET':
      return '/packet';
    case 'BUNDLE':
      return '/bundle';
    case 'BUNCH':
      return '/bunch';
    default:
      return '';
  }
}

export default function VegetableCard({ vegetable }: VegetableCardProps) {
  const price = vegetable.prices[0];
  const packetWeight = price?.packetWeight ? parseFloat(price.packetWeight) : null;

  const availableUnits = getAvailableUnits(vegetable);
  // For the pill selector, collapse KG+GRAM into just KG since GRAM is a sub-unit
  const selectableUnits = availableUnits.filter((u) => u !== 'GRAM');
  const hasMultipleUnits = selectableUnits.length > 1;

  const [selectedUnit, setSelectedUnit] = useState<UnitType>(selectableUnits[0] || 'KG');

  const cartItem = useCartStore((s) => s.items.find((i) => i.vegetableId === vegetable.id));
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);
  const isFav = useFavoriteStore((s) => s.ids.has(vegetable.id));
  const toggleFav = useFavoriteStore((s) => s.toggle);

  const showFav = isAuthenticated && userRole === 'customer';

  const displayPrice = getDisplayPrice(vegetable, selectedUnit);
  const unitSuffix = getUnitSuffix(selectedUnit);

  // MRP / discount calculation
  const originalPrice = price?.originalPricePerKg ? parseFloat(price.originalPricePerKg) : null;
  const sellingPrice = price?.pricePerKg ? parseFloat(price.pricePerKg) : null;
  const discountPercent =
    originalPrice && sellingPrice && originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : null;
  const showDiscount = discountPercent && (selectedUnit === 'KG' || selectedUnit === 'GRAM');

  return (
    <div className="group bg-white rounded-2xl border border-gray-100/80 shadow-card hover:shadow-card-hover transition-all duration-300 p-4 flex flex-col relative overflow-hidden">
      {/* Discount badge */}
      {showDiscount && (
        <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold tracking-wide shadow-sm">
          {discountPercent}% OFF
        </span>
      )}

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/0 to-green-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {showFav && (
        <button
          onClick={() => toggleFav(vegetable.id)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-300 hover:text-red-400'
            }`}
          />
        </button>
      )}

      {/* Emoji */}
      <div
        className={`text-4xl sm:text-5xl text-center mb-2 py-2 group-hover:animate-float transition-transform ${vegetable.name === 'Radish' ? 'grayscale brightness-150' : ''}`}
      >
        {vegetable.emoji || '🥬'}
      </div>

      {/* Names */}
      <h3 className="font-semibold text-sm text-text-dark leading-tight">{vegetable.name}</h3>
      {vegetable.nameHindi && (
        <p className="text-xs text-text-muted font-hindi mt-0.5">{vegetable.nameHindi}</p>
      )}
      {vegetable.nameKannada && (
        <p className="text-xs text-text-muted mt-0.5">{vegetable.nameKannada}</p>
      )}

      {/* Price section */}
      <div className="mt-auto pt-3 space-y-0.5 relative z-10">
        {displayPrice !== null && (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-base font-bold text-primary-green-dark">
              ₹{displayPrice}
              <span className="text-xs font-medium text-text-muted ml-0.5">{unitSuffix}</span>
            </p>
            {showDiscount && originalPrice && (
              <span className="text-xs text-text-muted line-through">₹{originalPrice}</span>
            )}
          </div>
        )}
        {selectedUnit === 'KG' && price?.pricePerPacket && packetWeight && (
          <p className="text-xs text-text-muted">
            ₹{parseFloat(price.pricePerPacket)}/packet ({packetWeight}kg)
          </p>
        )}
      </div>

      {/* Unit selector pills */}
      {hasMultipleUnits && !cartItem && (
        <div className="flex gap-1 mt-2 relative z-10">
          {selectableUnits.map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedUnit === unit
                  ? 'bg-primary-green-dark text-white shadow-sm'
                  : 'bg-gray-100 text-text-muted hover:bg-gray-200'
              }`}
            >
              {UNIT_LABELS[unit]}
            </button>
          ))}
        </div>
      )}

      {/* Cart controls */}
      <div className="relative z-10">
        {cartItem ? (
          <div className="mt-3 flex items-center justify-between gap-2 bg-green-50 rounded-xl px-2 py-1.5 animate-scale-in">
            <button
              onClick={() => decrementItem(vegetable.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-gray-50 text-text-dark transition-all shadow-sm active:scale-90"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold text-primary-green-dark min-w-[60px] text-center">
              {cartItem.quantity} {cartItem.unit.toLowerCase()}
            </span>
            <button
              onClick={() => incrementItem(vegetable.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-green hover:shadow-glow-green text-white transition-all active:scale-90"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => addItem(vegetable, selectedUnit)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-semibold hover:shadow-glow-green transition-all active:scale-[0.97]"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
