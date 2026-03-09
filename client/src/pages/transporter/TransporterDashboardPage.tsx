import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  PackageCheck,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
  HandMetal,
  CheckCircle2,
  Package,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transporterService } from '../../services/transporterService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import type { FridgePickupOrder } from '../../types';

interface DashboardStats {
  assignedToday: number;
  pickedUpToday: number;
  deliveredToday: number;
  pendingPickup: number;
}

export default function TransporterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [availableOrders, setAvailableOrders] = useState<FridgePickupOrder[]>([]);
  const [myOrders, setMyOrders] = useState<FridgePickupOrder[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [dashData, available, mine, delivered] = await Promise.all([
        transporterService.getDashboard(),
        transporterService.getAvailableOrders(),
        transporterService.getMyOrders('active'),
        transporterService.getMyOrders('completed'),
      ]);
      setStats(dashData);
      setAvailableOrders(Array.isArray(available) ? available : []);
      setMyOrders(Array.isArray(mine) ? mine : []);
      setDeliveredOrders(
        Array.isArray(delivered) ? delivered.filter((o: FridgePickupOrder) => o.status === 'DELIVERED') : []
      );
    } catch (err) {
      console.error('Failed to load transporter data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleClaim = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await transporterService.claimOrder(orderId);
      toast.success('Order claimed');
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickup = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await transporterService.markPickedUp(orderId);
      toast.success('Order marked as picked up');
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await transporterService.deliverOrder(orderId);
      toast.success('Order delivered');
      loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Split active orders into ready-for-pickup and in-transit
  const readyOrders = myOrders.filter((o) => o.status !== 'PICKED_UP');
  const inTransitOrders = myOrders.filter((o) => o.status === 'PICKED_UP');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            Transporter Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-1">Claim orders, manage pickups & deliveries</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-purple-600 transition-colors px-3 py-2 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-100"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="To Pick Up"
          value={stats?.pendingPickup ?? 0}
          icon={Package}
          gradient="from-amber-500 to-orange-500"
          highlight={(stats?.pendingPickup ?? 0) > 0}
        />
        <StatCard
          label="In Transit"
          value={inTransitOrders.length}
          icon={Truck}
          gradient="from-blue-500 to-indigo-600"
          highlight={inTransitOrders.length > 0}
        />
        <StatCard
          label="Delivered Today"
          value={stats?.deliveredToday ?? 0}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-green-600"
        />
        <StatCard
          label="Assigned Today"
          value={stats?.assignedToday ?? 0}
          icon={Clock}
          gradient="from-purple-500 to-violet-600"
        />
      </div>

      {/* In Transit Orders */}
      {inTransitOrders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-dark flex items-center gap-2 mb-3">
            <Truck className="w-4 h-4 text-blue-500" />
            In Transit
            <span className="text-xs font-normal text-text-muted">({inTransitOrders.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {inTransitOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel="Deliver"
                actionColor="bg-green-600 hover:bg-green-700"
                onAction={() => handleDeliver(order.id)}
                loading={actionLoading === order.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ready for Pickup */}
      {readyOrders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-dark flex items-center gap-2 mb-3">
            <HandMetal className="w-4 h-4 text-purple-500" />
            Ready for Pickup
            <span className="text-xs font-normal text-text-muted">({readyOrders.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readyOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel="Mark Picked Up"
                actionColor="bg-emerald-600 hover:bg-emerald-700"
                onAction={() => handlePickup(order.id)}
                loading={actionLoading === order.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Delivered Today */}
      {deliveredOrders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-text-dark flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Delivered Today
            <span className="text-xs font-normal text-text-muted">({deliveredOrders.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deliveredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel=""
                actionColor=""
                onAction={() => {}}
                loading={false}
                hideAction
              />
            ))}
          </div>
        </section>
      )}

      {/* Available Orders */}
      <section>
        <h2 className="text-sm font-bold text-text-dark flex items-center gap-2 mb-3">
          <PackageCheck className="w-4 h-4 text-amber-500" />
          Available Orders
          <span className="text-xs font-normal text-text-muted">({availableOrders.length})</span>
        </h2>
        {availableOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Truck className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-text-dark">No orders available</p>
            <p className="text-xs text-text-muted mt-1">
              All ready orders are assigned. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actionLabel="Claim Order"
                actionColor="bg-purple-600 hover:bg-purple-700"
                onAction={() => handleClaim(order.id)}
                loading={actionLoading === order.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-card p-4 overflow-hidden ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
      }`}
    >
      {highlight && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-sm`}
      >
        <Icon className="w-[18px] h-[18px] text-white" />
      </div>
      <p className="text-[22px] font-bold text-text-dark tracking-tight leading-none">{value}</p>
      <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mt-1.5">
        {label}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  actionLabel,
  actionColor,
  onAction,
  loading,
  hideAction,
}: {
  order: FridgePickupOrder;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  loading: boolean;
  hideAction?: boolean;
}) {
  const itemsSummary = order.items
    .slice(0, 3)
    .map((item) => `${item.vegetable?.emoji || '🥬'} ${item.vegetable?.name}`)
    .join(', ');
  const moreItems = order.items.length > 3 ? ` +${order.items.length - 3} more` : '';
  const isFridgePickup = order.orderType === 'FRIDGE_PICKUP';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 hover:shadow-card-hover transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-text-dark">{order.orderNumber}</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-text-muted">
              {isFridgePickup ? 'Fridge' : 'Home'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {order.customer?.name || order.customer?.phone || 'Customer'}
          </p>
        </div>
        <span className="text-sm font-bold text-text-dark">
          {'\u20B9'}
          {Number(order.totalAmount).toLocaleString('en-IN')}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
        {isFridgePickup ? (
          <>
            <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="truncate">
              {order.refrigerator?.name}
              {order.refrigerator?.location?.name && ` - ${order.refrigerator.location.name}`}
            </span>
          </>
        ) : (
          <>
            <Home className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span className="truncate">{order.address?.text || 'Home Delivery'}</span>
          </>
        )}
      </div>

      {/* Items */}
      <p className="text-xs text-text-muted mb-1 truncate">
        {itemsSummary}
        {moreItems && <span className="text-text-muted">{moreItems}</span>}
      </p>
      <p className="text-[10px] text-text-muted mb-3">
        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        {order.readyAt && (
          <>
            {' '}
            <span className="mx-1">&middot;</span> Ready {formatDateTime(order.readyAt)}
          </>
        )}
      </p>

      {/* Action */}
      {!hideAction && (
        <button
          onClick={onAction}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${actionColor}`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              {actionLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}
