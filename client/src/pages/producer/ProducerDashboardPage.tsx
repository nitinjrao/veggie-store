import { useState, useEffect, useCallback } from 'react';
import {
  Package, Clock, CheckCircle2, PackageCheck, RefreshCw,
  ShoppingCart, Truck, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { producerService } from '../../services/producerService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import {
  FRIDGE_ORDER_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
} from '../../utils/statusStyles';
import type { FridgePickupOrder } from '../../types';

interface ProcurementItem {
  vegetable: { id: string; name: string; emoji: string | null };
  unit: string;
  totalQuantity: number;
  orderCount: number;
  pendingQty: number;
  confirmedQty: number;
}

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'READY', label: 'Ready' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ProducerDashboardPage() {
  const [procurement, setProcurement] = useState<ProcurementItem[]>([]);
  const [allOrders, setAllOrders] = useState<FridgePickupOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    // Fetch independently so one failure doesn't block the others
    const results = await Promise.allSettled([
      producerService.getProcurementView(),
      producerService.getAllOrders(), // Always fetch all, filter on client
    ]);
    if (results[0].status === 'fulfilled') {
      const d = results[0].value;
      setProcurement(Array.isArray(d) ? d : []);
    } else {
      console.error('Procurement failed:', results[0].reason);
    }
    if (results[1].status === 'fulfilled') {
      const d = results[1].value;
      setAllOrders(Array.isArray(d) ? d : d.orders || []);
    } else {
      console.error('Orders failed:', results[1].reason);
      toast.error(getErrorMessage(results[1].reason));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter orders on the client
  const orders = statusFilter === 'ALL'
    ? allOrders
    : allOrders.filter(o => o.status === statusFilter);

  const handleConfirm = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await producerService.confirmOrder(orderId);
      toast.success('Order confirmed');
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
      toast.success('Order marked as ready');
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

  // Derive counts from all orders (covers both FRIDGE_PICKUP and HOME_DELIVERY)
  const totalPending = allOrders.filter(o => o.status === 'PENDING').length;
  const totalConfirmed = allOrders.filter(o => o.status === 'CONFIRMED').length;
  const totalReady = allOrders.filter(o => o.status === 'READY').length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Producer Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Procure, pack, and manage orders</p>
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
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Procurement Table */}
      {procurement.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-primary-green" />
            <h2 className="font-bold text-text-dark">Procurement List</h2>
            <span className="text-xs text-text-muted ml-1">
              (from {totalPending + totalConfirmed} active orders)
            </span>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Total vegetables needed for home delivery orders (pending + confirmed). Procure these first, then pack per order. Fridge stock is filled weekly — not per order.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-text-muted">Vegetable</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted">Total Needed</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Pending</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted hidden sm:table-cell">Confirmed</th>
                  <th className="text-right px-4 py-2.5 font-medium text-text-muted">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {procurement.map((item) => (
                  <tr key={`${item.vegetable.id}-${item.unit}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.vegetable.emoji || '🥬'}</span>
                        <span className="font-medium text-text-dark">{item.vegetable.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-bold text-text-dark">
                        {item.totalQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      {item.pendingQty > 0 ? (
                        <span className="text-yellow-700">{item.pendingQty} {item.unit}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      {item.confirmedQty > 0 ? (
                        <span className="text-blue-700">{item.confirmedQty} {item.unit}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-text-muted">
                      {item.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {procurement.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-primary-green mx-auto mb-2" />
          <p className="text-sm text-text-muted">No vegetables to procure — no active orders</p>
        </div>
      )}

      {/* All Orders */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-primary-green" />
          <h2 className="font-bold text-text-dark">All Orders</h2>
          <span className="text-xs text-text-muted ml-1">({orders.length})</span>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.value
                  ? 'bg-primary-green text-white'
                  : 'bg-gray-50 border border-gray-200 text-text-muted hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-xl border p-4 ${
                order.status === 'PENDING'
                  ? 'border-yellow-200 bg-yellow-50/30'
                  : order.status === 'CONFIRMED'
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text-dark">{order.orderNumber}</p>
                    {order.orderType === 'HOME_DELIVERY' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                        <Truck className="w-2.5 h-2.5" />
                        Delivery
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <Package className="w-2.5 h-2.5" />
                        Pickup
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    {order.customer?.name || order.customer?.phone} &middot;{' '}
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {order.orderType === 'HOME_DELIVERY'
                      ? (order.address as { label: string; text: string } | undefined)?.text || 'Home Delivery'
                      : `${order.refrigerator?.name || ''}${order.refrigerator?.location ? ` — ${order.refrigerator.location.name}` : ''}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{'\u20B9'}{order.totalAmount}</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      FRIDGE_ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {FRIDGE_ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {order.items.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-gray-100 text-xs"
                  >
                    <span>{item.vegetable?.emoji || '🥬'}</span>
                    <span className="font-medium">{item.vegetable?.name}</span>
                    <span className="text-text-muted">{item.quantity} {item.unit}</span>
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              {order.status === 'PENDING' && (
                <button
                  onClick={() => handleConfirm(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full mt-1 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {actionLoading === order.id ? 'Confirming...' : 'Confirm Order'}
                </button>
              )}
              {order.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleMarkReady(order.id)}
                  disabled={actionLoading === order.id}
                  className="w-full mt-1 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {actionLoading === order.id ? 'Updating...' : 'Mark Ready'}
                </button>
              )}
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-text-muted">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
