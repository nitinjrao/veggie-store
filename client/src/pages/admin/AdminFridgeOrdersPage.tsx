import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Zap, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import type { FridgeOrderStatus, PaymentStatus, Location, Refrigerator } from '../../types';
import { formatDateTime } from '../../utils/formatting';
import { getErrorMessage } from '../../utils/error';
import {
  FRIDGE_ORDER_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from '../../utils/statusStyles';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'READY', label: 'Ready' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Payments' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
];

interface FridgeOrderListItem {
  id: string;
  orderNumber: string;
  orderType?: 'FRIDGE_PICKUP' | 'HOME_DELIVERY';
  status: FridgeOrderStatus;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  customer?: { id: string; name: string | null; phone: string };
  refrigerator?: Refrigerator & { location?: Location };
  address?: { label: string; text: string };
  assignedTo?: { id: string; name: string } | null;
  _count?: { items: number };
}

export default function AdminFridgeOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<FridgeOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get('paymentStatus') || 'ALL');
  const [fridgeFilter, setFridgeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [quickConfirming, setQuickConfirming] = useState<string | null>(null);

  // Supporting data
  const [fridges, setFridges] = useState<Refrigerator[]>([]);

  useEffect(() => {
    adminService
      .listFridges()
      .then((data) => {
        setFridges(Array.isArray(data) ? data : data.fridges || []);
      })
      .catch(() => {});
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
      if (fridgeFilter) params.refrigeratorId = fridgeFilter;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.listFridgeOrders(params);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load fridge orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, fridgeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  // Auto-refresh every 30s to pick up status changes from producer/transporter
  useEffect(() => {
    const interval = setInterval(() => loadOrders(), 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Keep URL query params in sync with filters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (paymentFilter !== 'ALL') params.paymentStatus = paymentFilter;
    setSearchParams(params, { replace: true });
  }, [statusFilter, paymentFilter, setSearchParams]);

  const handleFilterChange = () => {
    setPage(1);
  };

  const handleQuickConfirm = async (orderId: string) => {
    setQuickConfirming(orderId);
    try {
      await adminService.quickConfirmOrder(orderId);
      toast.success('Order confirmed');
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setQuickConfirming(null);
    }
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by order #, customer name or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
          <select
            value={fridgeFilter}
            onChange={(e) => {
              setFridgeFilter(e.target.value);
              handleFilterChange();
            }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
          >
            <option value="">All Fridges</option>
            {fridges.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} {f.location ? `(${f.location.name})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  statusFilter === opt.value
                    ? 'bg-primary-green text-white'
                    : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setPaymentFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  paymentFilter === opt.value
                    ? 'bg-primary-green text-white'
                    : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Order #</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden md:table-cell">
                    Fridge / Address
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden lg:table-cell">
                    Assigned
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50/50 ${order.status === 'PENDING' ? 'border-l-4 border-l-yellow-400' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-medium text-primary-green hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-dark">{order.customer?.name || 'N/A'}</p>
                      <p className="text-xs text-text-muted">{order.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {order.orderType === 'HOME_DELIVERY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Truck className="w-3 h-3" />
                          Delivery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <Package className="w-3 h-3" />
                          Pickup
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                      {order.orderType === 'HOME_DELIVERY' ? (
                        <div>
                          <p className="font-medium text-text-dark text-xs">
                            {order.address?.label || 'Address'}
                          </p>
                          <p className="text-xs truncate max-w-[180px]">{order.address?.text}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-text-dark text-xs">
                            {order.refrigerator?.name}
                          </p>
                          <p className="text-xs">{order.refrigerator?.location?.name}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {'\u20B9'}
                      {order.totalAmount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          FRIDGE_ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {FRIDGE_ORDER_STATUS_LABELS[order.status] ||
                          order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted hidden lg:table-cell">
                      {order.assignedTo?.name || <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          PAYMENT_STATUS_STYLES[order.paymentStatus] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs hidden sm:table-cell">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickConfirm(order.id);
                          }}
                          disabled={quickConfirming === order.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap"
                        >
                          <Zap className="w-3 h-3" />
                          {quickConfirming === order.id ? 'Confirming...' : 'Quick Confirm'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-text-muted">
                      No fridge orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-text-muted">
              {total} order{total !== 1 ? 's' : ''} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-muted">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
