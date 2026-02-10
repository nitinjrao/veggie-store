import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
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
          <div className="space-y-4">
            <div className="w-20 h-20 shimmer rounded-full mx-auto" />
            <div className="h-6 shimmer rounded-lg w-48 mx-auto" />
            <div className="h-4 shimmer rounded-lg w-32 mx-auto" />
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
          <p className="text-text-muted">Order not found.</p>
          <Link to="/" className="text-primary-green hover:underline mt-2 inline-block font-medium">
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
        {/* Success animation */}
        <div className="animate-bounce-gentle mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-50 flex items-center justify-center shadow-glow-green">
            <CheckCircle className="w-10 h-10 text-primary-green" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-dark mb-2 animate-fade-in">Order Placed!</h1>
        <p className="text-text-muted mb-1 animate-fade-in">
          Your order <span className="font-bold text-text-dark">{order.orderNumber}</span> has been placed successfully.
        </p>
        <p className="text-text-muted mb-8 animate-fade-in">We'll confirm it shortly.</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 text-left mb-6 animate-fade-in-up">
          <h2 className="font-bold text-text-dark mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.vegetable.emoji || '🥬'}</span>
                  <span className="text-sm text-text-dark">
                    {item.vegetable.name} x {parseFloat(item.quantity)} {item.unit.toLowerCase()}
                  </span>
                </div>
                <span className="text-sm font-bold text-text-dark">
                  ₹{parseFloat(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-text-dark">Total</span>
            <span className="font-bold text-xl text-gradient-green">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-center animate-fade-in-up">
          <Link
            to="/orders"
            className="px-6 py-3 rounded-xl border border-gray-200 text-text-dark text-sm font-medium hover:bg-gray-50 transition-all active:scale-95"
          >
            View Order History
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all active:scale-95"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
