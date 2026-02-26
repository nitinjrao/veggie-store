import { useState, useEffect, useCallback } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { producerService } from '../../services/producerService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import { FRIDGE_ORDER_STATUS_STYLES, FRIDGE_ORDER_STATUS_LABELS } from '../../utils/statusStyles';
import type { FridgePickupOrder } from '../../types';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'READY', label: 'Ready' },
];

export default function ProducerOrdersPage() {
  const [orders, setOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await producerService.getPendingOrders();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirm = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await producerService.confirmOrder(orderId);
      toast.success('Order confirmed');
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await producerService.markOrderReady(orderId);
      toast.success('Order marked as ready');
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-text-dark">Orders</h1>
        <button
          onClick={() => {
            setLoading(true);
            loadOrders();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-text-muted hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              statusFilter === tab.value
                ? 'bg-primary-green text-white'
                : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-text-dark">{order.orderNumber}</p>
                <p className="text-xs text-text-muted">
                  {order.customer?.name || order.customer?.phone} &middot;{' '}
                  {formatDateTime(order.createdAt)}
                </p>
                <p className="text-xs text-text-muted">
                  {order.refrigerator?.name}
                  {order.refrigerator?.location && ` — ${order.refrigerator.location.name}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">
                  {'\u20B9'}
                  {order.totalAmount}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${FRIDGE_ORDER_STATUS_STYLES[order.status]}`}
                >
                  {FRIDGE_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {order.items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 text-xs"
                >
                  <span>{item.vegetable?.emoji || '🥬'}</span>
                  <span className="font-medium">{item.vegetable?.name}</span>
                  <span className="text-text-muted">
                    {item.quantity} {item.unit}
                  </span>
                </span>
              ))}
            </div>
            {order.status === 'PENDING' && (
              <button
                onClick={() => handleConfirm(order.id)}
                disabled={actionLoading === order.id}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {actionLoading === order.id ? 'Confirming...' : 'Confirm Order'}
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => handleMarkReady(order.id)}
                disabled={actionLoading === order.id}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {actionLoading === order.id ? 'Updating...' : 'Mark Ready'}
              </button>
            )}
            {order.status === 'READY' && (
              <div className="text-center py-1.5 text-xs text-emerald-600 font-medium">
                Waiting for customer pickup
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-text-muted">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
