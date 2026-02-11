import { ShoppingCart, Plus, Minus, Heart } from 'lucide-react';
import type { Vegetable } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useFavoriteStore } from '../../stores/favoriteStore';
import { useAuthStore } from '../../stores/authStore';

interface VegetableCardProps {
  vegetable: Vegetable;
}

export default function VegetableCard({ vegetable }: VegetableCardProps) {
  const price = vegetable.prices[0];
  const pricePerKg = price?.pricePerKg ? parseFloat(price.pricePerKg) : null;
  const pricePerPacket = price?.pricePerPacket ? parseFloat(price.pricePerPacket) : null;
  const pricePerPiece = price?.pricePerPiece ? parseFloat(price.pricePerPiece) : null;
  const pricePerBundle = price?.pricePerBundle ? parseFloat(price.pricePerBundle) : null;
  const packetWeight = price?.packetWeight ? parseFloat(price.packetWeight) : null;

  const cartItem = useCartStore((s) => s.items.find((i) => i.vegetableId === vegetable.id));
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userRole = useAuthStore((s) => s.user?.role);
  const isFav = useFavoriteStore((s) => s.ids.has(vegetable.id));
  const toggleFav = useFavoriteStore((s) => s.toggle);

  const showFav = isAuthenticated && userRole === 'customer';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 p-4 flex flex-col relative overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/0 to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {showFav && (
        <button
          onClick={() => toggleFav(vegetable.id)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm transition-all active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isFav ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-300 hover:text-red-400'
            }`}
          />
        </button>
      )}

      {/* Emoji with float animation on hover */}
      <div className="text-4xl text-center mb-2 py-2 group-hover:animate-float transition-transform">
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
        {pricePerKg !== null && (
          <p className="text-base font-bold text-primary-green-dark">
            ₹{pricePerKg}<span className="text-xs font-medium text-text-muted">/kg</span>
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
        {pricePerBundle !== null && (
          <p className="text-xs text-text-muted">₹{pricePerBundle}/bundle</p>
        )}
      </div>

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
            onClick={() => addItem(vegetable)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all active:scale-[0.97]"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
