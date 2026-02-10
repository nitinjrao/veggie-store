import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { AdminOrder } from '../../services/adminService';
import type { OrderStatus } from '../../types';

const STATUS_FLOW: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const statusColor: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-700 border-blue-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700 border-purple-200',
  DELIVERED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    adminService
      .getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.response?.data?.error || 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!id || !order) return;
    if (
      status === 'CANCELLED' &&
      !confirm('Cancel this order? Stock will be restored to inventory.')
    )
      return;

    setUpdating(true);
    setError('');
    try {
      const updated = await adminService.updateOrderStatus(id, status);
      setOrder(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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

  const isFinal = order.status === 'CANCELLED' || order.status === 'DELIVERED';
  const currentIdx = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-text-muted">{formatDate(order.createdAt)}</p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
            statusColor[order.status]
          }`}
        >
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Status Progress */}
      {!isFinal && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="font-medium text-text-dark mb-4">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s, idx) => (
              <button
                key={s}
                onClick={() => handleStatusUpdate(s)}
                disabled={updating || idx <= currentIdx}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  idx <= currentIdx
                    ? 'bg-gray-100 text-text-muted cursor-not-allowed'
                    : idx === currentIdx + 1
                      ? 'bg-primary-green text-white hover:bg-primary-green-dark'
                      : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                } disabled:opacity-50`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={updating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            >
              Cancel Order
            </button>
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
                      {item.quantity} {item.unit} x ₹{item.unitPrice}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-sm">₹{item.totalPrice}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 mt-3 border-t border-gray-200">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="font-medium text-text-dark mb-3">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{order.customer?.name || 'N/A'}</p>
              <p className="text-text-muted">{order.customer?.phone}</p>
              {order.customer?.address && (
                <p className="text-text-muted">{order.customer.address}</p>
              )}
              <a
                href={whatsappLink(order.customer?.phone || '')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {(order.address || order.notes) && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="font-medium text-text-dark mb-3">Delivery Details</h2>
              <div className="space-y-2 text-sm">
                {order.address && (
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Address</p>
                    <p>{order.address}</p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">Notes</p>
                    <p>{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
