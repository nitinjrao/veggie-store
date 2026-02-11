import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { orderService } from '../../services/orderService';
import type { UnitType } from '../../types';
import Header from '../../components/common/Header';
import { getAvailableUnits, UNIT_LABELS } from '../../utils/pricing';

export default function CartPage() {
  const { items, removeItem, incrementItem, decrementItem, updateUnit, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockError, setStockError] = useState('');

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await orderService.placeOrder({
        items: items.map((item) => ({
          vegetableId: item.vegetableId,
          quantity: item.quantity,
          unit: item.unit,
        })),
        address: address || undefined,
        notes: notes || undefined,
      });

      clearCart();
      navigate(`/orders/${order.id}/confirmation`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      setError(msg);
      toast.error(msg);

      // Parse stock error to highlight the affected item
      const stockMatch = msg.match(/Insufficient stock for (.+?)\./);
      if (stockMatch) {
        setStockError(stockMatch[1]);
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-text-dark mb-2">Your cart is empty</h2>
          <p className="text-text-muted mb-8">Add some fresh vegetables to get started!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
          >
            Browse Vegetables
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-dark mb-6">
          Shopping Cart
          <span className="ml-2 text-sm font-normal text-text-muted">
            ({items.length} item{items.length !== 1 ? 's' : ''})
          </span>
        </h1>

        <div className="space-y-3 mb-8 stagger-children">
          {items.map((item) => {
            const availableUnits = getAvailableUnits(item.vegetable);
            const isStockError = stockError === item.vegetable.name;
            return (
              <div
                key={item.vegetableId}
                className={`bg-white rounded-2xl border shadow-card p-4 flex items-center gap-4 group hover:shadow-card-hover transition-all duration-200 ${isStockError ? 'border-red-300 bg-red-50/50 ring-1 ring-red-200' : 'border-gray-100'}`}
              >
                <span className="text-3xl shrink-0 group-hover:animate-bounce-gentle">{item.vegetable.emoji || '🥬'}</span>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-text-dark">{item.vegetable.name}</h3>
                  {isStockError && (
                    <p className="text-xs text-red-600 font-medium mt-0.5 animate-fade-in">
                      Insufficient stock — try reducing quantity
                    </p>
                  )}
                  {item.vegetable.nameHindi && (
                    <p className="text-xs text-text-muted font-hindi">{item.vegetable.nameHindi}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateUnit(item.vegetableId, e.target.value as UnitType)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-green/40 transition-all"
                    >
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {UNIT_LABELS[u]}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementItem(item.vegetableId)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-all active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => incrementItem(item.vegetableId)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-green text-white hover:shadow-glow-green transition-all active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-primary-green-dark">
                    ₹{item.totalPrice.toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.vegetableId)}
                    className="mt-1 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-4 animate-fade-in-up">
          <h2 className="font-bold text-text-dark">Delivery Details</h2>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your delivery address..."
              rows={2}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-muted">Total ({items.length} items)</span>
              <span className="font-bold text-2xl text-text-dark">₹{total.toFixed(2)}</span>
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 text-red-600 text-sm animate-fade-in">{error}</div>
            )}

            {isAuthenticated ? (
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-green text-white font-bold text-base hover:shadow-glow-green transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Place Order
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            ) : (
              <Link
                to="/login"
                className="w-full py-3.5 rounded-xl bg-gradient-green text-white font-bold text-base hover:shadow-glow-green transition-all block text-center active:scale-[0.98]"
              >
                Login to Order
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
