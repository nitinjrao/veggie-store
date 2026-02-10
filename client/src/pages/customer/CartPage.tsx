import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { orderService } from '../../services/orderService';
import type { UnitType } from '../../types';
import Header from '../../components/common/Header';

const UNIT_OPTIONS: { value: UnitType; label: string }[] = [
  { value: 'KG', label: 'Kg' },
  { value: 'GRAM', label: 'Gram' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'PACKET', label: 'Packet' },
];

function getAvailableUnits(vegetable: { prices: { pricePerKg: string | null; pricePerPiece: string | null; pricePerPacket: string | null }[] }): UnitType[] {
  const price = vegetable.prices[0];
  if (!price) return ['KG'];
  const units: UnitType[] = [];
  if (price.pricePerKg) {
    units.push('KG');
    units.push('GRAM');
  }
  if (price.pricePerPiece) units.push('PIECE');
  if (price.pricePerPacket) units.push('PACKET');
  return units.length > 0 ? units : ['KG'];
}

export default function CartPage() {
  const { items, removeItem, incrementItem, decrementItem, updateUnit, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-text-dark mb-2">Your cart is empty</h2>
          <p className="text-text-muted mb-6">Add some fresh vegetables to get started!</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-green text-white font-medium hover:bg-primary-green-dark transition"
          >
            Browse Vegetables
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-dark mb-6">Shopping Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const availableUnits = getAvailableUnits(item.vegetable);
            return (
              <div
                key={item.vegetableId}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <span className="text-3xl shrink-0">{item.vegetable.emoji || '🥬'}</span>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-text-dark">{item.vegetable.name}</h3>
                  {item.vegetable.nameHindi && (
                    <p className="text-xs text-text-muted font-hindi">{item.vegetable.nameHindi}</p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateUnit(item.vegetableId, e.target.value as UnitType)}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary-green"
                    >
                      {UNIT_OPTIONS.filter((u) => availableUnits.includes(u.value)).map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => decrementItem(item.vegetableId)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => incrementItem(item.vegetableId)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-green hover:bg-primary-green-dark text-white transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary-green-dark">
                    ₹{item.totalPrice.toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.vegetableId)}
                    className="mt-1 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-text-dark">Delivery Details</h2>

          <div>
            <label className="block text-sm text-text-muted mb-1">Delivery Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your delivery address..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-muted">Items ({items.length})</span>
              <span className="font-bold text-lg text-text-dark">₹{total.toFixed(2)}</span>
            </div>

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            {isAuthenticated ? (
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            ) : (
              <Link
                to="/login"
                className="w-full py-3 rounded-lg bg-primary-green text-white font-semibold hover:bg-primary-green-dark transition block text-center"
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
