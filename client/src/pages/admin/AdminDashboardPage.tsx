import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Grid3X3, ShoppingCart, AlertTriangle, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { adminService } from '../../services/adminService';
import type { DashboardStats } from '../../services/adminService';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 shimmer rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-24 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Vegetables',
      value: stats?.totalVegetables ?? 0,
      icon: Package,
      color: 'bg-green-50 text-primary-green',
      link: '/admin/vegetables',
    },
    {
      label: 'Categories',
      value: stats?.totalCategories ?? 0,
      icon: Grid3X3,
      color: 'bg-blue-50 text-blue-600',
      link: '/admin/categories',
    },
    {
      label: 'Orders Today',
      value: stats?.ordersToday ?? 0,
      icon: ShoppingCart,
      color: 'bg-orange-50 text-orange-600',
      link: '/admin/orders',
    },
    {
      label: 'Low Stock',
      value: stats?.lowStockItems?.length ?? 0,
      icon: AlertTriangle,
      color: 'bg-amber-50 text-amber-600',
      link: '/admin/vegetables',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-text-dark mb-1">
          Welcome back, {user?.name || 'Admin'}
        </h1>
        <p className="text-text-muted text-sm flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary-green" />
          Here's what's happening with your store today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className="group bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover p-5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-green group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-2xl font-bold text-text-dark">{card.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-dark flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Alerts
            </h2>
            <Link
              to="/admin/vegetables"
              className="text-xs text-primary-green hover:underline font-medium"
            >
              View All
            </Link>
          </div>
          {stats?.lowStockItems?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-green" />
              </div>
              <p className="text-sm text-text-muted">All stocks healthy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.lowStockItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{item.emoji || '🥬'}</span>
                    <span className="text-sm font-medium text-text-dark">{item.name}</span>
                  </div>
                  <span className="text-sm text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
                    {Number(item.stockKg).toFixed(1)} kg
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-text-dark flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              Recent Orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs text-primary-green hover:underline font-medium"
            >
              View All
            </Link>
          </div>
          {stats?.recentOrders?.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-50 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-text-muted">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentOrders?.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-text-dark group-hover:text-primary-green transition-colors">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-text-muted">
                      {order.customer?.name || order.customer?.phone} &middot; {order._count.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-dark">₹{order.totalAmount}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyles[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
