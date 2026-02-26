import { useState, useEffect, useCallback } from 'react';
import { Package, Clock, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { producerService } from '../../services/producerService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import { FRIDGE_ORDER_STATUS_STYLES, FRIDGE_ORDER_STATUS_LABELS } from '../../utils/statusStyles';
import type { FridgePickupOrder } from '../../types';

interface FridgeSummary {
  fridge: { id: string; name: string; location?: { id: string; name: string; address: string } };
  counts: { pending: number; confirmed: number; ready: number };
}

export default function ProducerDashboardPage() {
  const [summary, setSummary] = useState<FridgeSummary[]>([]);
  const [orders, setOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [summaryData, ordersData] = await Promise.all([
        producerService.getOrderSummary(),
        producerService.getPendingOrders(),
      ]);
      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : ordersData.orders || []);
    } catch (err) {
      console.error('Failed to load producer data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleConfirm = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await producerService.confirmOrder(orderId);
      toast.success('Order confirmed — inventory deducted');
      loadData();
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
      toast.success('Order marked as ready for pickup');
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const totalPending = summary.reduce((s, f) => s + f.counts.pending, 0);
  const totalConfirmed = summary.reduce((s, f) => s + f.counts.confirmed, 0);
  const totalReady = summary.reduce((s, f) => s + f.counts.ready, 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Producer Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Manage orders for your assigned fridges</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-text-muted hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-yellow-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-xs font-medium text-text-muted">Pending</span>
          </div>
          <p className="text-2xl font-bold text-text-dark">{totalPending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-text-muted">Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-text-dark">{totalConfirmed}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-text-muted">Ready</span>
          </div>
          <p className="text-2xl font-bold text-text-dark">{totalReady}</p>
        </div>
      </div>

      {/* Fridge Summary */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="font-medium text-text-dark mb-3">Your Fridges</h2>
          <div className="space-y-2">
            {summary.map((s) => (
              <div
                key={s.fridge.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-dark">{s.fridge.name}</p>
                  <p className="text-xs text-text-muted">{s.fridge.location?.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.counts.pending > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {s.counts.pending} pending
                    </span>
                  )}
                  {s.counts.confirmed > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {s.counts.confirmed} confirmed
                    </span>
                  )}
                  {s.counts.ready > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {s.counts.ready} ready
                    </span>
                  )}
                  {s.counts.pending === 0 && s.counts.confirmed === 0 && s.counts.ready === 0 && (
                    <span className="text-xs text-text-muted">No active orders</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-text-muted text-sm">No fridges assigned to you yet.</p>
          <p className="text-text-muted text-xs mt-1">Ask an admin to assign you to a fridge.</p>
        </div>
      )}

      {/* Pending Orders - Need Confirmation */}
      {pendingOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-medium text-text-dark mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Needs Confirmation ({pendingOrders.length})
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-yellow-200 p-4">
                <div className="flex items-center justify-between mb-3">
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
                <button
                  onClick={() => handleConfirm(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading === order.id ? 'Confirming...' : 'Confirm Order'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Orders - Ready to Prepare */}
      {confirmedOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="font-medium text-text-dark mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            Being Prepared ({confirmedOrders.length})
          </h2>
          <div className="space-y-3">
            {confirmedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
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
                <button
                  onClick={() => handleMarkReady(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {actionLoading === order.id ? 'Updating...' : 'Mark Ready for Pickup'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no orders */}
      {pendingOrders.length === 0 && confirmedOrders.length === 0 && summary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-primary-green" />
          </div>
          <p className="text-text-dark font-medium">All caught up!</p>
          <p className="text-text-muted text-sm mt-1">No orders need your attention right now.</p>
        </div>
      )}
    </div>
  );
}
