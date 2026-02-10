import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
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

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    orderService
      .getMyOrders(page)
      .then((data) => {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-text-dark mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-5 bg-gray-200 rounded w-20" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-text-dark mb-2">No orders yet</h2>
            <p className="text-text-muted mb-6">Start shopping to see your orders here!</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-green text-white font-medium hover:bg-primary-green-dark transition"
            >
              Browse Vegetables
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-text-dark">{order.orderNumber}</h3>
                      <p className="text-xs text-text-muted">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {order.items.slice(0, 4).map((item) => (
                      <span key={item.id} className="text-lg" title={item.vegetable.name}>
                        {item.vegetable.emoji || '🥬'}
                      </span>
                    ))}
                    {order.items.length > 4 && (
                      <span className="text-xs text-text-muted ml-1">
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-primary-green-dark">
                      ₹{parseFloat(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
