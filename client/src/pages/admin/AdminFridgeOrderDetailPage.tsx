import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Plus,
  CreditCard,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  User,
  AlertTriangle,
  ArrowRight,
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

  // Producers for assign dropdown
  const [producers, setProducers] = useState<StaffMember[]>([]);
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

  useEffect(() => {
    if (!id) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await adminService.getFridgeOrder(id!);
      setOrder(data);
      // Load all producers for assignment
      adminService
        .listStaff({ role: 'PRODUCER' })
        .then((res) => {
          const staff = Array.isArray(res) ? res : res.staff || [];
          setProducers(staff.filter((p: StaffMember) => p.active !== false));
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
      await adminService.logFridgePayment(id, {
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success('Payment logged');
      setShowPaymentForm(false);
      const updatedOrder = await adminService.getFridgeOrder(id);
      setOrder(updatedOrder);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPayment(false);
    }
  };

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
          <h1 className="font-heading font-bold text-2xl">{order.orderNumber}</h1>
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

          {/* Assign to producer */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm text-text-muted">
              <User className="w-4 h-4" />
              Assigned to:
            </div>
            {producers.length > 0 ? (
              <select
                value={order.assignedToId || ''}
                onChange={(e) => {
                  if (e.target.value) handleAssign(e.target.value);
                }}
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {producers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-text-muted">
                {order.assignedTo?.name || 'No producers assigned to this fridge'}
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
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.vegetable?.emoji || '🥬'}</span>
                  <div>
                    <p className="font-medium text-sm">{item.vegetable?.name}</p>
                    <p className="text-xs text-text-muted">
                      {item.quantity} {item.unit} x {'\u20B9'}
                      {item.unitPrice}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-sm">
                  {'\u20B9'}
                  {item.totalPrice}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-3 border-t border-gray-200">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold">
              {'\u20B9'}
              {order.totalAmount}
            </span>
          </div>
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

          {/* Fridge / Location Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-medium text-text-dark mb-3">Pickup Location</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.refrigerator?.name}</p>
              <p className="text-text-muted">{order.refrigerator?.location?.name}</p>
              <p className="text-text-muted">{order.refrigerator?.location?.address}</p>
            </div>
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
