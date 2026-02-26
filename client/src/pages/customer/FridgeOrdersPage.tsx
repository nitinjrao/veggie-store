import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Box, MapPin } from 'lucide-react';
import Header from '../../components/common/Header';
import { getErrorMessage } from '../../utils/error';
import { fridgeService } from '../../services/fridgeService';
import type { FridgePickupOrder } from '../../types';
import {
  FRIDGE_ORDER_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from '../../utils/statusStyles';

export default function FridgeOrdersPage() {
  const [orders, setOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fridgeService
      .getMyPickupOrders({ page, limit: 10 })
      .then((data: { orders: FridgePickupOrder[]; totalPages: number }) => {
        if (!cancelled) {
          setOrders(data.orders);
          setTotalPages(data.totalPages);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
        ) : error ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary-green hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">No pickup orders yet</h2>
            <p className="text-text-muted mb-8">
              Browse a fridge and place your first pickup order!
            </p>
            <Link
              to="/fridge"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
            >
              Browse Fridges
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
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${FRIDGE_ORDER_STATUS_STYLES[order.status]}`}
                    >
                      {FRIDGE_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  {/* Fridge info */}
                  {order.refrigerator && (
                    <div className="flex items-center gap-2 mb-3 text-xs text-text-muted">
                      <Box className="w-3.5 h-3.5" />
                      <span>{order.refrigerator.name}</span>
                      {order.refrigerator.location && (
                        <>
                          <MapPin className="w-3 h-3 ml-1" />
                          <span>{order.refrigerator.location.name}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Item emojis */}
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </span>
                      <span
                        className={`text-xs font-medium ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
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
