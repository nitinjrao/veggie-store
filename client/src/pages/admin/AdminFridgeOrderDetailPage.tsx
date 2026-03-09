import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Plus,
  Minus,
  CreditCard,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  User,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Camera,
  X,
  Package,
  Truck,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import type { FridgePickupOrder, PaymentMethod, Payment } from '../../types';
import { formatDateTime } from '../../utils/formatting';
import { getErrorMessage } from '../../utils/error';
import {
  FRIDGE_ORDER_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from '../../utils/statusStyles';

interface PaymentFormData {
  amount: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
}

export default function AdminFridgeOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<FridgePickupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Staff (producers + transporters) for assign dropdown
  const [assignableStaff, setAssignableStaff] = useState<StaffMember[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Payment state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: '',
    method: 'CASH',
    reference: '',
    notes: '',
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [payScreenshotFile, setPayScreenshotFile] = useState<File | null>(null);
  const [payScreenshotPreview, setPayScreenshotPreview] = useState<string | null>(null);
  const payFileInputRef = useRef<HTMLInputElement>(null);

  // Modification state
  const [modifications, setModifications] = useState<
    Record<string, { quantity: number; remove: boolean; removalReason: string }>
  >({});
  const [showRemoveInput, setShowRemoveInput] = useState<string | null>(null);
  const [modifying, setModifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await adminService.getFridgeOrder(id!);
      setOrder(data);
      // Load producers + transporters for assignment
      Promise.all([
        adminService.listStaff({ role: 'PRODUCER' }).catch(() => []),
        adminService.listStaff({ role: 'TRANSPORTER' }).catch(() => []),
      ])
        .then(([prodRes, transRes]) => {
          const prods = Array.isArray(prodRes) ? prodRes : prodRes.staff || [];
          const trans = Array.isArray(transRes) ? transRes : transRes.staff || [];
          setAssignableStaff(
            [...prods, ...trans].filter((s: StaffMember) => s.active !== false)
          );
        })
        .catch(() => {});
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!id || !order) return;

    if (status === 'CANCELLED') {
      const hasPayments = (order.payments?.length ?? 0) > 0;
      const msg = hasPayments
        ? 'This order has payments recorded. Cancel anyway? Fridge inventory will be restored if it was confirmed.'
        : 'Cancel this pickup order?';
      if (!confirm(msg)) return;
    }

    setUpdating(true);
    setError('');
    try {
      const updated = await adminService.updateFridgeOrderStatus(id, status);
      setOrder(updated);
      toast.success(
        status === 'CANCELLED'
          ? 'Order cancelled'
          : `Order marked as ${(FRIDGE_ORDER_STATUS_LABELS as Record<string, string>)[status] || status.replace(/_/g, ' ').toLowerCase()}`
      );
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setError(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (staffId: string) => {
    if (!id) return;
    setAssigning(true);
    try {
      const updated = await adminService.assignFridgeOrder(id, staffId);
      setOrder(updated);
      toast.success('Order assigned');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const handlePayScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPayScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPayScreenshot = () => {
    setPayScreenshotFile(null);
    setPayScreenshotPreview(null);
    if (payFileInputRef.current) payFileInputRef.current.value = '';
  };

  const openPaymentForm = () => {
    const total = parseFloat(order?.totalAmount || '0');
    const paid = parseFloat(order?.paidAmount || '0');
    const remaining = Math.max(0, total - paid);
    setPaymentForm({
      amount: remaining > 0 ? remaining.toString() : '',
      method: 'CASH',
      reference: '',
      notes: '',
    });
    setShowPaymentForm(true);
  };

  const handleLogPayment = async () => {
    if (!id || !order) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingPayment(true);
    try {
      const payData = {
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      };
      if (payScreenshotFile) {
        await adminService.uploadFridgePaymentScreenshot(id, payScreenshotFile, payData);
      } else {
        await adminService.logFridgePayment(id, payData);
      }
      toast.success('Payment logged');
      setShowPaymentForm(false);
      clearPayScreenshot();
      const updatedOrder = await adminService.getFridgeOrder(id);
      setOrder(updatedOrder);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPayment(false);
    }
  };

  const getModifiedQuantity = (itemId: string, originalQty: number) => {
    return modifications[itemId]?.quantity ?? originalQty;
  };

  const isItemRemoved = (itemId: string) => {
    return modifications[itemId]?.remove ?? false;
  };

  const handleDecreaseQuantity = (itemId: string, currentQty: number) => {
    const mod = modifications[itemId] || { quantity: currentQty, remove: false, removalReason: '' };
    const step = currentQty >= 1 ? 0.5 : 0.25;
    const newQty = Math.max(step, mod.quantity - step);
    setModifications((prev) => ({ ...prev, [itemId]: { ...mod, quantity: +newQty.toFixed(3) } }));
  };

  const handleRemoveItem = (itemId: string) => {
    const mod = modifications[itemId] || { quantity: 0, remove: false, removalReason: '' };
    setModifications((prev) => ({
      ...prev,
      [itemId]: { ...mod, remove: true },
    }));
    setShowRemoveInput(itemId);
  };

  const handleUndoRemove = (itemId: string) => {
    setModifications((prev) => {
      const copy = { ...prev };
      if (copy[itemId]) {
        copy[itemId] = { ...copy[itemId], remove: false, removalReason: '' };
      }
      return copy;
    });
    setShowRemoveInput(null);
  };

  const handleConfirmWithModifications = async () => {
    if (!id || !order) return;
    const items = order.items
      .map((item) => {
        const mod = modifications[item.id];
        if (!mod) return null;
        if (mod.remove) {
          return { itemId: item.id, remove: true, removalReason: mod.removalReason || undefined };
        }
        const originalQty = parseFloat(item.quantity);
        if (mod.quantity < originalQty) {
          return { itemId: item.id, quantity: mod.quantity };
        }
        return null;
      })
      .filter(Boolean) as { itemId: string; quantity?: number; remove?: boolean; removalReason?: string }[];

    if (items.length === 0) {
      toast.error('No modifications to apply');
      return;
    }

    setModifying(true);
    try {
      const updated = await adminService.modifyOrder(id, items);
      setOrder(updated);
      setModifications({});
      setShowRemoveInput(null);
      toast.success('Order confirmed with modifications');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setModifying(false);
    }
  };

  const hasModifications = Object.keys(modifications).some((itemId) => {
    const mod = modifications[itemId];
    if (mod.remove) return true;
    const item = order?.items.find((i) => i.id === itemId);
    if (item && mod.quantity < parseFloat(item.quantity)) return true;
    return false;
  });

  const modifiedTotal = order?.items.reduce((sum, item) => {
    if (isItemRemoved(item.id)) return sum;
    const qty = getModifiedQuantity(item.id, parseFloat(item.quantity));
    return sum + qty * parseFloat(item.unitPrice);
  }, 0);

  const whatsappLink = (phone: string) =>
    `https://wa.me/91${phone.replace(/\D/g, '').replace(/^91/, '')}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">{error || 'Order not found'}</p>
      </div>
    );
  }

  const isFinal = order.status === 'CANCELLED' || order.status === 'PICKED_UP';
  const customer = order.customer;
  const payments: Payment[] = order.payments || [];

  // Status timeline
  const timeline = [
    { label: 'Placed', time: order.createdAt, icon: Clock, active: true },
    {
      label: 'Confirmed',
      time: order.confirmedAt,
      icon: CheckCircle2,
      active: !!order.confirmedAt,
    },
    { label: 'Ready', time: order.readyAt, icon: PackageCheck, active: !!order.readyAt },
    {
      label: order.status === 'CANCELLED' ? 'Cancelled' : 'Picked Up',
      time: order.status === 'CANCELLED' ? order.cancelledAt : order.pickedUpAt,
      icon: order.status === 'CANCELLED' ? XCircle : CheckCircle2,
      active: !!(order.pickedUpAt || order.cancelledAt),
      isCancelled: order.status === 'CANCELLED',
    },
  ];

  return (
    <div>
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{error}</p>
              {error.toLowerCase().includes('insufficient') && (
                <div className="mt-3">
                  <p className="text-xs text-amber-700 mb-2">
                    Update the vegetable stock first, then come back to confirm this order.
                  </p>
                  <Link
                    to="/admin/vegetables"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition"
                  >
                    Manage Stock
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-2xl">{order.orderNumber}</h1>
            {order.orderType === 'HOME_DELIVERY' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <Truck className="w-3.5 h-3.5" />
                Home Delivery
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Package className="w-3.5 h-3.5" />
                Fridge Pickup
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
            FRIDGE_ORDER_STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {FRIDGE_ORDER_STATUS_LABELS[order.status] || order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <h2 className="font-medium text-text-dark mb-4">Order Timeline</h2>
        <div className="flex items-start gap-0">
          {timeline.map((step, i) => {
            const StepIcon = step.icon;
            const isLast = i === timeline.length - 1;
            return (
              <div key={step.label} className={`flex-1 ${!isLast ? '' : ''}`}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.isCancelled
                        ? 'bg-red-100 text-red-600'
                        : step.active
                          ? 'bg-primary-green text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 ${
                        timeline[i + 1]?.active ? 'bg-primary-green' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-1.5 pr-2">
                  <p
                    className={`text-xs font-medium ${step.active ? 'text-text-dark' : 'text-gray-400'}`}
                  >
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-[10px] text-text-muted">{formatDateTime(step.time)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Actions + Assign */}
      {!isFinal && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="font-medium text-text-dark mb-4">Actions</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {order.status === 'PENDING' && (
              <button
                onClick={() => handleStatusUpdate('CONFIRMED')}
                disabled={updating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                Confirm Order
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button
                onClick={() => handleStatusUpdate('READY')}
                disabled={updating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                Mark Ready
              </button>
            )}
            {order.status === 'READY' && (
              <button
                onClick={() => handleStatusUpdate('PICKED_UP')}
                disabled={updating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-green text-white hover:bg-primary-green-dark transition disabled:opacity-50"
              >
                Mark Picked Up
              </button>
            )}
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>

          {/* Assign to staff */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <User className="w-4 h-4" />
              Assigned to:
            </div>
            {assignableStaff.length > 0 ? (
              <select
                value={order.assignedToId || ''}
                onChange={(e) => {
                  if (e.target.value) handleAssign(e.target.value);
                }}
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {assignableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-text-muted">
                {order.assignedTo?.name || 'No staff available'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-text-dark mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => {
              const originalQty = parseFloat(item.quantity);
              const currentQty = getModifiedQuantity(item.id, originalQty);
              const removed = isItemRemoved(item.id);
              const wasModified = item.originalQuantity && item.originalQuantity !== item.quantity;
              const isPending = order.status === 'PENDING';
              const hasLocalMod = modifications[item.id] && (removed || currentQty < originalQty);
              const itemTotal = removed ? 0 : currentQty * parseFloat(item.unitPrice);

              return (
                <div
                  key={item.id}
                  className={`py-2 border-b border-gray-50 last:border-0 ${removed ? 'opacity-50' : ''} ${item.isRemoved ? 'opacity-40 line-through' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.vegetable?.emoji || '🥬'}</span>
                      <div>
                        <p className="font-medium text-sm">
                          {item.vegetable?.name}
                          {item.isRemoved && (
                            <span className="ml-2 text-xs text-red-500 font-normal">Removed</span>
                          )}
                        </p>
                        <p className="text-xs text-text-muted">
                          {hasLocalMod ? currentQty.toFixed(1) : item.quantity} {item.unit} x{' '}
                          {'\u20B9'}
                          {item.unitPrice}
                          {wasModified && !item.isRemoved && (
                            <span className="ml-1 text-amber-600">
                              (Original: {item.originalQuantity})
                            </span>
                          )}
                        </p>
                        {item.removalReason && (
                          <p className="text-xs text-red-500 mt-0.5">
                            Reason: {item.removalReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && !item.isRemoved && !removed && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDecreaseQuantity(item.id, originalQty)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-medium w-10 text-center">
                            {hasLocalMod ? currentQty.toFixed(1) : originalQty.toFixed(1)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {isPending && removed && (
                        <button
                          onClick={() => handleUndoRemove(item.id)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Undo
                        </button>
                      )}
                      <p className="font-medium text-sm w-16 text-right">
                        {'\u20B9'}
                        {hasLocalMod ? itemTotal.toFixed(2) : item.totalPrice}
                      </p>
                    </div>
                  </div>
                  {/* Removal reason input */}
                  {showRemoveInput === item.id && removed && (
                    <div className="mt-2 ml-9">
                      <input
                        type="text"
                        placeholder="Reason for removal (optional)"
                        value={modifications[item.id]?.removalReason || ''}
                        onChange={(e) =>
                          setModifications((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], removalReason: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green"
                        autoFocus
                      />
                    </div>
                  )}
                  {/* Show "Original: X" label when locally modified */}
                  {hasLocalMod && !removed && (
                    <p className="text-[10px] text-amber-600 ml-9 mt-0.5">
                      Original: {originalQty} {item.unit}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-4 mt-3 border-t border-gray-200">
            <span className="font-medium">Total</span>
            <div className="text-right">
              {hasModifications && modifiedTotal !== undefined && (
                <span className="text-sm text-text-muted line-through mr-2">
                  {'\u20B9'}
                  {order.totalAmount}
                </span>
              )}
              <span className="text-lg font-bold">
                {'\u20B9'}
                {hasModifications && modifiedTotal !== undefined
                  ? modifiedTotal.toFixed(2)
                  : order.totalAmount}
              </span>
            </div>
          </div>
          {/* Confirm with Modifications button */}
          {order.status === 'PENDING' && hasModifications && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={handleConfirmWithModifications}
                disabled={modifying}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition disabled:opacity-50"
              >
                {modifying ? 'Applying...' : 'Confirm with Modifications'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-medium text-text-dark mb-3">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{customer?.name || 'N/A'}</p>
              <p className="text-text-muted">{customer?.phone}</p>
              {customer?.phone && (
                <a
                  href={whatsappLink(customer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Fridge / Delivery Location Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            {order.orderType === 'HOME_DELIVERY' ? (
              <>
                <h2 className="font-medium text-text-dark mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Delivery Address
                </h2>
                <div className="space-y-2 text-sm">
                  {order.address ? (
                    <>
                      <p className="font-medium">{order.address.label}</p>
                      <p className="text-text-muted">{order.address.text}</p>
                    </>
                  ) : (
                    <p className="text-text-muted">Address not available</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="font-medium text-text-dark mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Pickup Location
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{order.refrigerator?.name}</p>
                  <p className="text-text-muted">{order.refrigerator?.location?.name}</p>
                  <p className="text-text-muted">{order.refrigerator?.location?.address}</p>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-medium text-text-dark mb-3">Notes</h2>
              <p className="text-sm text-text-muted">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-text-muted" />
            <h2 className="font-medium text-text-dark">Payment</h2>
            {order.paymentStatus && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  PAYMENT_STATUS_STYLES[order.paymentStatus] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {order.paymentStatus}
              </span>
            )}
          </div>
          {!showPaymentForm && (
            <button
              onClick={openPaymentForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Log Payment
            </button>
          )}
        </div>

        {/* Payment Progress */}
        {(() => {
          const total = parseFloat(order.totalAmount || '0');
          const paid = parseFloat(order.paidAmount || '0');
          const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
          return (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-text-muted">
                  Paid:{' '}
                  <span className="font-medium text-text-dark">
                    {'\u20B9'}
                    {paid.toFixed(2)}
                  </span>
                </span>
                <span className="text-text-muted">
                  Total:{' '}
                  <span className="font-medium text-text-dark">
                    {'\u20B9'}
                    {total.toFixed(2)}
                  </span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-500' : 'bg-gray-200'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="border border-gray-100 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Method *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              {paymentForm.method === 'UPI' && (
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Reference</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, reference: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                    placeholder="UPI transaction ID"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                  placeholder="Optional notes"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-text-dark mb-1">Screenshot</label>
                <input
                  ref={payFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePayScreenshotSelect}
                  className="hidden"
                />
                {payScreenshotPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={payScreenshotPreview}
                      alt="Screenshot preview"
                      className="h-20 rounded-lg border border-gray-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearPayScreenshot}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => payFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-text-muted flex items-center gap-1.5 hover:border-primary-green hover:text-primary-green transition"
                  >
                    <Camera className="w-4 h-4" />
                    Attach Screenshot
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogPayment}
                disabled={savingPayment}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
              >
                {savingPayment ? 'Saving...' : 'Save Payment'}
              </button>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Payment List */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
              Payment History
            </h3>
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-gray-50 hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-2.5">
                  {p.screenshotUrl && (
                    <button
                      onClick={() => window.open(p.screenshotUrl!, '_blank')}
                      className="flex-shrink-0"
                    >
                      <img
                        src={p.screenshotUrl}
                        alt="Payment screenshot"
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </button>
                  )}
                  <div>
                    <p className="text-sm font-medium text-text-dark">
                      {'\u20B9'}
                      {parseFloat(p.amount).toFixed(2)}
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.method === 'UPI'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {p.method}
                      </span>
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDateTime(p.receivedAt || p.createdAt)}
                      {p.loggedBy?.name && ` - by ${p.loggedBy.name}`}
                      {p.reference && ` - Ref: ${p.reference}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {payments.length === 0 && !showPaymentForm && (
          <p className="text-sm text-text-muted text-center py-2">No payments recorded yet.</p>
        )}
      </div>
    </div>
  );
}
