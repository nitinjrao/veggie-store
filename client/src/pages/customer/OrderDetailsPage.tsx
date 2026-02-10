import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types';
import Header from '../../components/common/Header';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    orderService
      .getOrderById(id)
      .then(setOrder)
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load order');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link to="/orders" className="text-primary-green hover:underline">
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-dark mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">{order.orderNumber}</h1>
            <p className="text-sm text-text-muted">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-text-dark mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.vegetable.emoji || '🥬'}</span>
                  <div>
                    <p className="text-sm font-medium text-text-dark">{item.vegetable.name}</p>
                    <p className="text-xs text-text-muted">
                      {parseFloat(item.quantity)} {item.unit.toLowerCase()} x ₹{parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
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

        {(order.address || order.notes) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            {order.address && (
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-text-dark mb-1">Delivery Address</h3>
                <p className="text-sm text-text-muted">{order.address}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <h3 className="text-sm font-semibold text-text-dark mb-1">Notes</h3>
                <p className="text-sm text-text-muted">{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
