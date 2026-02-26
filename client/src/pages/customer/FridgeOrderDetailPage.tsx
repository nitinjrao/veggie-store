import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Box, MapPin, CreditCard, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../../components/common/Header';
import { fridgeService } from '../../services/fridgeService';
import { getErrorMessage } from '../../utils/error';
import type { FridgePickupOrder } from '../../types';
import {
  FRIDGE_ORDER_STATUS_STYLES,
  FRIDGE_ORDER_STATUS_LABELS,
  PAYMENT_STATUS_STYLES,
} from '../../utils/statusStyles';

export default function FridgeOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<FridgePickupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mark as paid modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [payReference, setPayReference] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fridgeService
      .getPickupOrder(id)
      .then(setOrder)
      .catch((err: unknown) => {
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkPaid = async () => {
    if (!id) return;
    setPaying(true);
    try {
      const updated = await fridgeService.markOrderPaid(id, {
        method: payMethod,
        reference: payReference.trim() || undefined,
      });
      setOrder(updated);
      setShowPayModal(false);
      setPayReference('');
      toast.success('Payment recorded!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Link to="/orders" className="text-primary-green hover:underline">
            Back to Orders
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Pay modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark text-lg">Mark as Paid</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Payment Method
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPayMethod('UPI')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      payMethod === 'UPI'
                        ? 'border-primary-green bg-green-50 text-primary-green'
                        : 'border-gray-200 text-text-muted hover:bg-gray-50'
                    }`}
                  >
                    UPI
                  </button>
                  <button
                    onClick={() => setPayMethod('CASH')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      payMethod === 'CASH'
                        ? 'border-primary-green bg-green-50 text-primary-green'
                        : 'border-gray-200 text-text-muted hover:bg-gray-50'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Reference (optional)
                </label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="Transaction ID or note..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-text-muted">Amount</span>
                <span className="font-bold text-text-dark">
                  ₹{parseFloat(order.totalAmount).toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleMarkPaid}
                disabled={paying}
                className="w-full py-3 rounded-xl bg-gradient-green text-white font-bold hover:shadow-glow-green transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-dark mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-dark">{order.orderNumber}</h1>
            <p className="text-sm text-text-muted">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${FRIDGE_ORDER_STATUS_STYLES[order.status]}`}
            >
              {FRIDGE_ORDER_STATUS_LABELS[order.status]}
            </span>
            <span
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${PAYMENT_STATUS_STYLES[order.paymentStatus]}`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Fridge + location info */}
        {order.refrigerator && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-green-50/70 border border-green-100">
            <Box className="w-5 h-5 text-primary-green shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-dark">{order.refrigerator.name}</p>
              {order.refrigerator.location && (
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order.refrigerator.location.name} &mdash; {order.refrigerator.location.address}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-text-dark mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.vegetable.emoji || '🥬'}</span>
                  <div>
                    <p className="text-sm font-medium text-text-dark">{item.vegetable.name}</p>
                    <p className="text-xs text-text-muted">
                      {parseFloat(item.quantity)} {item.unit.toLowerCase()} x ₹
                      {parseFloat(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-text-dark">
                  ₹{parseFloat(item.totalPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
            <span className="font-semibold text-text-dark">Total</span>
            <span className="font-bold text-lg text-primary-green-dark">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-text-dark mb-3">Payment</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Amount</span>
              <span className="font-medium text-text-dark">
                ₹{parseFloat(order.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Paid Amount</span>
              <span className="font-medium text-text-dark">
                ₹{parseFloat(order.paidAmount).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Balance</span>
              <span className="font-medium text-text-dark">
                ₹{(parseFloat(order.totalAmount) - parseFloat(order.paidAmount)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment history */}
          {order.payments && order.payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-text-muted mb-2">Payment History</h3>
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50"
                  >
                    <div>
                      <span className="font-medium text-text-dark">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </span>
                      <span className="text-text-muted ml-2">{payment.method}</span>
                      {payment.reference && (
                        <span className="text-text-muted ml-1 text-xs">({payment.reference})</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mark as paid button */}
        {order.paymentStatus === 'UNPAID' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => setShowPayModal(true)}
            className="w-full py-3 rounded-xl border-2 border-primary-green text-primary-green font-semibold flex items-center justify-center gap-2 hover:bg-green-50 transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-4 h-4" />
            Mark as Paid
          </button>
        )}
      </div>
    </>
  );
}
