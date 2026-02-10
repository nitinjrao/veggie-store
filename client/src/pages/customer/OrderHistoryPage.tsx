import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderService } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types';
import Header from '../../components/common/Header';

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
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
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex justify-between mb-3">
                  <div className="h-4 shimmer rounded-lg w-32" />
                  <div className="h-5 shimmer rounded-full w-20" />
                </div>
                <div className="h-3 shimmer rounded-lg w-48 mb-2" />
                <div className="h-3 shimmer rounded-lg w-24" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">No orders yet</h2>
            <p className="text-text-muted mb-8">Start shopping to see your orders here!</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
            >
              Browse Vegetables
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 stagger-children">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-text-dark">{order.orderNumber}</h3>
                      <p className="text-xs text-text-muted mt-0.5">
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
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    {order.items.slice(0, 5).map((item) => (
                      <span key={item.id} className="text-lg" title={item.vegetable.name}>
                        {item.vegetable.emoji || '🥬'}
                      </span>
                    ))}
                    {order.items.length > 5 && (
                      <span className="text-xs text-text-muted ml-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        +{order.items.length - 5}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary-green-dark">
                        ₹{parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-green group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Previous
                </button>
                <span className="px-4 py-2.5 text-sm text-text-muted flex items-center">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
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
