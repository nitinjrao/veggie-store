import { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ChevronRight,
  ClipboardCheck,
  X,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { transporterService } from '../../services/transporterService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import type { FridgePickupOrder, FridgePickupItem } from '../../types';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
] as const;

type TabValue = (typeof TABS)[number]['value'];

interface ChecklistItem {
  id: string;
  vegetableName: string;
  emoji: string;
  quantity: string;
  unit: string;
}

export default function TransporterOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('active');
  const [orders, setOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checklistModal, setChecklistModal] = useState<{
    orderId: string;
    orderNumber: string;
    items: ChecklistItem[];
  } | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [checklistLoading, setChecklistLoading] = useState(false);

  const loadOrders = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      try {
        const data = await transporterService.getMyOrders(activeTab);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, [loadOrders]);

  const handlePickup = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await transporterService.markPickedUp(orderId);
      toast.success('Order marked as picked up');
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenChecklist = async (order: FridgePickupOrder) => {
    setChecklistLoading(true);
    try {
      const data = await transporterService.getLoadingChecklist(order.id);
      const items: ChecklistItem[] = Array.isArray(data.items)
        ? data.items.map((i: { id: string; name: string; emoji: string; quantity: string; unit: string }) => ({
            id: i.id,
            vegetableName: i.name,
            emoji: i.emoji || '',
            quantity: i.quantity,
            unit: i.unit,
          }))
        : order.items
            .filter((i: FridgePickupItem) => !i.isRemoved)
            .map((i: FridgePickupItem) => ({
              id: i.id,
              vegetableName: i.vegetable?.name || 'Unknown',
              emoji: i.vegetable?.emoji || '',
              quantity: i.quantity,
              unit: i.unit,
            }));
      setChecklistModal({ orderId: order.id, orderNumber: order.orderNumber, items });
      setCheckedItems(new Set());
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleToggleCheck = (itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleConfirmDelivery = async () => {
    if (!checklistModal) return;
    setActionLoading(checklistModal.orderId);
    try {
      await transporterService.deliverOrder(checklistModal.orderId);
      toast.success('Order delivered successfully');
      setChecklistModal(null);
      setCheckedItems(new Set());
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectDeliver = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await transporterService.deliverOrder(orderId);
      toast.success('Order marked as delivered');
      loadOrders();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const allChecked =
    checklistModal != null &&
    checklistModal.items.length > 0 &&
    checkedItems.size === checklistModal.items.length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            My Orders
          </h1>
          <p className="text-text-muted text-sm mt-1">Your assigned pickup orders</p>
        </div>
        <button
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-purple-600 transition-colors px-3 py-2 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-100"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-white text-text-dark shadow-sm'
                : 'text-text-muted hover:text-text-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center">
            <Truck className="w-7 h-7 text-purple-400" />
          </div>
          <p className="text-sm font-semibold text-text-dark">
            {activeTab === 'active'
              ? 'No active pickups'
              : activeTab === 'in_transit'
                ? 'No orders in transit'
                : 'No completed orders'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {activeTab === 'active'
              ? 'Claim orders from the dashboard to get started'
              : activeTab === 'in_transit'
                ? 'Picked up orders will appear here'
                : 'Completed orders will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              showAction={activeTab !== 'completed'}
              onPickup={() => handlePickup(order.id)}
              onLoadAndVerify={() => handleOpenChecklist(order)}
              onDirectDeliver={() => handleDirectDeliver(order.id)}
              loading={actionLoading === order.id}
              checklistLoading={checklistLoading}
            />
          ))}
        </div>
      )}

      {/* Loading Checklist Modal */}
      {checklistModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setChecklistModal(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl animate-fade-in max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-text-dark flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-purple-500" />
                  Loading Checklist
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Order {checklistModal.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setChecklistModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {checklistModal.items.map((item) => {
                const isChecked = checkedItems.has(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCheck(item.id)}
                      className="w-5 h-5 rounded-md border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
                    />
                    <span className="text-lg flex-shrink-0">{item.emoji || '🥬'}</span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          isChecked ? 'text-green-700' : 'text-text-dark'
                        }`}
                      >
                        {item.vegetableName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    {isChecked && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
                  </label>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs text-text-muted text-center mb-3">
                {checkedItems.size} of {checklistModal.items.length} items verified
              </p>
              <button
                onClick={handleConfirmDelivery}
                disabled={!allChecked || actionLoading === checklistModal.orderId}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading === checklistModal.orderId ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Delivery
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  showAction,
  onPickup,
  onLoadAndVerify,
  onDirectDeliver,
  loading,
  checklistLoading,
}: {
  order: FridgePickupOrder;
  showAction: boolean;
  onPickup: () => void;
  onLoadAndVerify: () => void;
  onDirectDeliver: () => void;
  loading: boolean;
  checklistLoading: boolean;
}) {
  const isPickedUp = order.status === 'PICKED_UP';
  const isDelivered = order.status === 'DELIVERED';
  const isFridgePickup = order.orderType === 'FRIDGE_PICKUP';

  const statusIcon = isDelivered ? (
    <CheckCircle2 className="w-5 h-5 text-white" />
  ) : isPickedUp ? (
    <Truck className="w-5 h-5 text-white" />
  ) : (
    <Package className="w-5 h-5 text-white" />
  );

  const statusGradient = isDelivered
    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
    : isPickedUp
      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
      : 'bg-gradient-to-br from-purple-500 to-violet-600';

  const borderColor = isDelivered
    ? 'border-green-100'
    : isPickedUp
      ? 'border-blue-100'
      : 'border-gray-100';

  return (
    <div
      className={`bg-white rounded-2xl border shadow-card p-4 transition-all ${borderColor}`}
    >
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusGradient}`}
        >
          {statusIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-text-dark">{order.orderNumber}</p>
              {isPickedUp && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  In Transit
                </span>
              )}
              {isDelivered && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  Delivered
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-text-dark flex-shrink-0">
              {'\u20B9'}
              {Number(order.totalAmount).toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs text-text-muted mt-0.5">
            {order.customer?.name || order.customer?.phone || 'Customer'}
          </p>

          {/* Location / Address */}
          {isFridgePickup ? (
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
              <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="truncate">
                {order.refrigerator?.name}
                {order.refrigerator?.location?.name && ` - ${order.refrigerator.location.name}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1.5">
              <Home className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span className="truncate">
                {order.address?.text || 'Home Delivery'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[11px] text-text-muted mt-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 text-[10px] font-medium">
              {isFridgePickup ? 'Fridge Pickup' : 'Home Delivery'}
            </span>
            <span>
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
            {order.readyAt && <span>Ready {formatDateTime(order.readyAt)}</span>}
            {order.pickedUpAt && <span>Picked up {formatDateTime(order.pickedUpAt)}</span>}
            {order.deliveredAt && <span>Delivered {formatDateTime(order.deliveredAt)}</span>}
          </div>
        </div>
      </div>

      {/* Actions for active orders */}
      {showAction && !isPickedUp && !isDelivered && (
        <button
          onClick={onPickup}
          disabled={loading}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              Mark Picked Up
            </>
          )}
        </button>
      )}

      {/* Delivery actions for PICKED_UP orders */}
      {showAction && isPickedUp && (
        <>
          {isFridgePickup ? (
            <button
              onClick={onLoadAndVerify}
              disabled={loading || checklistLoading}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50"
            >
              {loading || checklistLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  Load &amp; Verify
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onDirectDeliver}
              disabled={loading}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Delivered
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
