import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';
import Header from '../../components/common/Header';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    orderService
      .getOrderById(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse space-y-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
            <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-text-muted">Order not found.</p>
          <Link to="/" className="text-primary-green hover:underline mt-2 inline-block">
            Go back to shop
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <CheckCircle className="w-16 h-16 text-primary-green mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-dark mb-2">Order Placed!</h1>
        <p className="text-text-muted mb-1">
          Your order <span className="font-semibold text-text-dark">{order.orderNumber}</span> has been placed successfully.
        </p>
        <p className="text-text-muted mb-8">We'll confirm it shortly.</p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-left mb-6">
          <h2 className="font-semibold text-text-dark mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.vegetable.emoji || '🥬'}</span>
                  <span className="text-sm text-text-dark">
                    {item.vegetable.name} x {parseFloat(item.quantity)} {item.unit.toLowerCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold text-text-dark">
                  ₹{parseFloat(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
            <span className="font-semibold text-text-dark">Total</span>
            <span className="font-bold text-lg text-primary-green-dark">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3 rounded-lg border border-gray-200 text-text-dark text-sm font-medium hover:bg-gray-50 transition"
          >
            View Order History
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-lg bg-primary-green text-white text-sm font-medium hover:bg-primary-green-dark transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </>
  );
}
