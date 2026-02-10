import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Grid3X3, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { adminService } from '../../services/adminService';
import type { DashboardStats } from '../../services/adminService';

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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-2">Dashboard</h1>
      <p className="text-text-muted">Welcome back, {user?.name || 'Admin'}!</p>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-green" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Vegetables</h3>
              <p className="text-2xl font-bold text-text-dark">{stats?.totalVegetables ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Categories</h3>
              <p className="text-2xl font-bold text-text-dark">{stats?.totalCategories ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Orders Today</h3>
              <p className="text-2xl font-bold text-text-dark">{stats?.ordersToday ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted">Low Stock</h3>
              <p className="text-2xl font-bold text-text-dark">
                {stats?.lowStockItems?.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Orders */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-text-dark">Low Stock Alerts</h2>
            <Link
              to="/admin/vegetables"
              className="text-xs text-primary-green hover:underline"
            >
              View All
            </Link>
          </div>
          {stats?.lowStockItems?.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">All stocks healthy</p>
          ) : (
            <div className="space-y-3">
              {stats?.lowStockItems?.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji || '🥬'}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-amber-600 font-medium">
                    {Number(item.stockKg).toFixed(1)} kg left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-medium text-text-dark mb-4">Recent Orders</h2>
          {stats?.recentOrders?.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats?.recentOrders?.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-text-muted">
                      {order.customer?.name || order.customer?.phone} &middot;{' '}
                      {order._count.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{order.totalAmount}</p>
                    <span
                      className={`inline-block text-xs px-1.5 py-0.5 rounded-full ${
                        order.status === 'DELIVERED'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
