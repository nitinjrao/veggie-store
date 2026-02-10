import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { OrderStatus } from '../../types';

interface CustomerDetail {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  createdAt: string;
  totalSpend: string;
  _count: { orders: number; favorites: number };
  orders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: string;
    createdAt: string;
    _count: { items: number };
  }[];
}

const statusColor: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminService
      .getCustomer(id)
      .then(setCustomer)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  if (!customer) {
    return <div className="text-center py-12 text-text-muted">Customer not found</div>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate('/admin/customers')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-2xl">{customer.name || 'N/A'}</h1>
            <p className="text-text-muted">{customer.phone}</p>
            {customer.address && <p className="text-sm text-text-muted mt-1">{customer.address}</p>}
          </div>
          <a
            href={whatsappLink(customer.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition self-start"
          >
            <Phone className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-text-dark">{customer._count.orders}</p>
            <p className="text-xs text-text-muted">Orders</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-text-dark">₹{customer.totalSpend}</p>
            <p className="text-xs text-text-muted">Total Spend</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-text-dark">{customer._count.favorites}</p>
            <p className="text-xs text-text-muted">Favorites</p>
          </div>
        </div>

        <p className="text-xs text-text-muted mt-4">Member since {formatDate(customer.createdAt)}</p>
      </div>

      {/* Order History */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-text-dark">Order History</h2>
        </div>
        {customer.orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-text-muted text-sm">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.orders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="text-sm font-medium text-primary-green hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-text-muted">
                    {formatDate(order.createdAt)} &middot; {order._count.items} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">₹{order.totalAmount}</p>
                  <span
                    className={`inline-block text-xs px-1.5 py-0.5 rounded-full ${
                      statusColor[order.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
