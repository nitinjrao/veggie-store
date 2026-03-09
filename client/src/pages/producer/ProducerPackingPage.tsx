import { useState, useEffect, useCallback } from 'react';
import { Layers, Package, RefreshCw, CheckCircle2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { producerService } from '../../services/producerService';
import { getErrorMessage } from '../../utils/error';
import { formatDateTime } from '../../utils/formatting';
import type { FridgePickupOrder } from '../../types';

interface CumulativeItem {
  vegetable: { id: string; name: string; emoji: string | null };
  unit: string;
  totalQuantity: number;
  orderCount: number;
}

type TabType = 'cumulative' | 'assembly';

const WEIGHT_CLASSES: { key: string; label: string; color: string }[] = [
  { key: 'Heavy Items', label: 'Heavy Items', color: 'border-red-200 bg-red-50' },
  { key: 'Medium Items', label: 'Medium Items', color: 'border-orange-200 bg-orange-50' },
  { key: 'Light Items', label: 'Light Items', color: 'border-blue-200 bg-blue-50' },
  { key: 'Delicate Items', label: 'Delicate Items', color: 'border-purple-200 bg-purple-50' },
];

export default function ProducerPackingPage() {
  const [tab, setTab] = useState<TabType>('cumulative');
  const [cumulativeData, setCumulativeData] = useState<CumulativeItem[]>([]);
  const [assemblyOrders, setAssemblyOrders] = useState<FridgePickupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [cumulative, assembly] = await Promise.all([
        producerService.getCumulativeView(),
        producerService.getAssemblyView(),
      ]);
      setCumulativeData(Array.isArray(cumulative) ? cumulative : cumulative.items || []);
      const orders = Array.isArray(assembly) ? assembly : assembly.orders || [];
      setAssemblyOrders(orders);
    } catch (err) {
      console.error('Failed to load packing data:', err);
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

  const toggleCheck = (orderId: string, itemId: string) => {
    setCheckedItems((prev) => {
      const orderSet = new Set(prev[orderId] || []);
      if (orderSet.has(itemId)) {
        orderSet.delete(itemId);
      } else {
        orderSet.add(itemId);
      }
      return { ...prev, [orderId]: orderSet };
    });
  };

  // Group cumulative items by weight class header if provided, else show flat
  const groupedCumulative = (() => {
    const groups: Record<string, CumulativeItem[]> = {};
    for (const item of cumulativeData) {
      // The backend may include a weightClass field; otherwise fall back to ungrouped
      const key = (item as CumulativeItem & { weightClass?: string }).weightClass || 'All Items';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  })();

  const hasWeightClasses = Object.keys(groupedCumulative).some((k) =>
    WEIGHT_CLASSES.some((wc) => wc.key === k)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Packing Station</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Cumulative view and order assembly for packing
          </p>
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

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6">
        <button
          onClick={() => setTab('cumulative')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'cumulative'
              ? 'bg-primary-green text-white'
              : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Cumulative View
        </button>
        <button
          onClick={() => setTab('assembly')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'assembly'
              ? 'bg-primary-green text-white'
              : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Order Assembly
        </button>
      </div>

      {/* Cumulative View */}
      {tab === 'cumulative' && (
        <div>
          {cumulativeData.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary-green" />
              </div>
              <p className="text-text-dark font-medium">No items to pack</p>
              <p className="text-text-muted text-sm mt-1">
                There are no confirmed orders requiring packing.
              </p>
            </div>
          ) : hasWeightClasses ? (
            <div className="space-y-6">
              {WEIGHT_CLASSES.map((wc) => {
                const items = groupedCumulative[wc.key];
                if (!items || items.length === 0) return null;
                return (
                  <div key={wc.key}>
                    <h3 className="text-sm font-semibold text-text-dark mb-2">{wc.label}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item) => (
                        <div
                          key={item.vegetable.id}
                          className={`rounded-xl border p-4 ${wc.color}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {item.vegetable.emoji || '\uD83E\uDD6C'}
                            </span>
                            <span className="font-medium text-text-dark text-sm">
                              {item.vegetable.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-text-dark">
                              {item.totalQuantity} {item.unit}
                            </span>
                            <span className="text-xs text-text-muted">
                              {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Show ungrouped items if any */}
              {Object.entries(groupedCumulative)
                .filter(([key]) => !WEIGHT_CLASSES.some((wc) => wc.key === key))
                .map(([key, items]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-text-dark mb-2">{key}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item) => (
                        <div
                          key={item.vegetable.id}
                          className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {item.vegetable.emoji || '\uD83E\uDD6C'}
                            </span>
                            <span className="font-medium text-text-dark text-sm">
                              {item.vegetable.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-text-dark">
                              {item.totalQuantity} {item.unit}
                            </span>
                            <span className="text-xs text-text-muted">
                              {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cumulativeData.map((item) => (
                <div
                  key={item.vegetable.id}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.vegetable.emoji || '\uD83E\uDD6C'}</span>
                    <span className="font-medium text-text-dark text-sm">
                      {item.vegetable.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-text-dark">
                      {item.totalQuantity} {item.unit}
                    </span>
                    <span className="text-xs text-text-muted">
                      {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Assembly */}
      {tab === 'assembly' && (
        <div>
          {assemblyOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-primary-green" />
              </div>
              <p className="text-text-dark font-medium">No orders to assemble</p>
              <p className="text-text-muted text-sm mt-1">
                All confirmed orders have been marked as ready.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assemblyOrders.map((order) => {
                const orderChecked = checkedItems[order.id] || new Set();
                const allChecked =
                  order.items.length > 0 && orderChecked.size === order.items.length;
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl border p-4 transition ${
                      allChecked ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-text-dark">{order.orderNumber}</p>
                        <p className="text-xs text-text-muted">
                          {order.customer?.name || order.customer?.phone}
                          {' \u00B7 '}
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-bold">
                        {'\u20B9'}
                        {order.totalAmount}
                      </span>
                    </div>

                    {/* Item checklist */}
                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item) => {
                        const isChecked = orderChecked.has(item.id);
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                              isChecked ? 'bg-emerald-50' : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleCheck(order.id, item.id)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <span className="text-sm">{item.vegetable?.emoji || '\uD83E\uDD6C'}</span>
                            <span
                              className={`text-sm font-medium flex-1 ${
                                isChecked ? 'line-through text-text-muted' : 'text-text-dark'
                              }`}
                            >
                              {item.vegetable?.name}
                            </span>
                            <span className="text-xs text-text-muted">
                              {item.quantity} {item.unit}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={actionLoading === order.id}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {actionLoading === order.id ? 'Updating...' : 'Mark Ready'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
