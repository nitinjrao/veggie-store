import { useState, useEffect } from 'react';
import { Tag, Plus, Minus } from 'lucide-react';
import { vegetableService } from '../../services/vegetableService';
import type { Vegetable } from '../../types';
import { useCartStore } from '../../stores/cartStore';

export default function DealsSection() {
  const [featured, setFeatured] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vegetableService
      .getFeatured()
      .then(setFeatured)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deals = featured.filter((v) => {
    const price = v.prices[0];
    if (!price?.originalPricePerKg || !price?.pricePerKg) return false;
    return parseFloat(price.originalPricePerKg) > parseFloat(price.pricePerKg);
  });

  if (loading) {
    return (
      <div className="deals-section">
        <div className="deals-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="deal-card">
              <div className="w-14 h-14 shimmer rounded-full mx-auto mb-2" />
              <div className="h-3 shimmer rounded w-16 mx-auto mb-1.5" />
              <div className="h-4 shimmer rounded w-12 mx-auto mb-2" />
              <div className="h-8 shimmer rounded-lg w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (deals.length === 0) return null;

  return (
    <div className="deals-section">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-orange-500" />
        <h2 className="font-heading font-semibold text-sm text-text-dark tracking-wide uppercase">Today's Deals</h2>
      </div>

      <div className="deals-grid">
        {deals.map((veg) => (
          <DealCard key={veg.id} vegetable={veg} />
        ))}
      </div>
    </div>
  );
}

function DealCard({ vegetable }: { vegetable: Vegetable }) {
  const price = vegetable.prices[0];
  const selling = price?.pricePerKg ? parseFloat(price.pricePerKg) : 0;
  const original = price?.originalPricePerKg ? parseFloat(price.originalPricePerKg) : 0;
  const discount = original > selling ? Math.round(((original - selling) / original) * 100) : 0;

  const cartItem = useCartStore((s) => s.items.find((i) => i.vegetableId === vegetable.id));
  const addItem = useCartStore((s) => s.addItem);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  return (
    <div className="deal-card group">
      {/* Emoji */}
      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform duration-200">
        <span className="text-3xl">{vegetable.emoji || '🥬'}</span>
      </div>

      {/* Name */}
      <p className="text-xs font-medium text-text-dark leading-tight line-clamp-1 mb-1">{vegetable.name}</p>

      {/* Discount */}
      <span className="text-[10px] font-bold text-orange-600 leading-none mb-1.5">{discount}% OFF</span>

      {/* Price */}
      <div className="flex items-baseline justify-center gap-1 mb-2.5">
        <span className="font-bold text-sm text-primary-green-dark leading-none">₹{selling}</span>
        <span className="text-[10px] text-text-muted/60 line-through leading-none">₹{original}</span>
      </div>

      {/* Cart */}
      {cartItem ? (
        <div className="w-full flex items-center justify-between bg-green-50 rounded-lg px-1 py-0.5">
          <button onClick={() => decrementItem(vegetable.id)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm text-text-dark active:scale-90 transition-all">
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-bold text-primary-green-dark">{cartItem.quantity} {cartItem.unit.toLowerCase()}</span>
          <button onClick={() => incrementItem(vegetable.id)} className="w-6 h-6 flex items-center justify-center rounded-md bg-gradient-green text-white active:scale-90 transition-all">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => addItem(vegetable, 'KG')}
          className="deal-add-btn"
        >
          ADD
        </button>
      )}
    </div>
  );
}
