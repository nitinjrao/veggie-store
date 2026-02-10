import { Outlet, Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Share2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useInitialize } from '../../hooks/useInitialize';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/vegetables', label: 'Vegetables', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/admin/share', label: 'Share', icon: Share2, end: false },
];

export default function AdminLayout() {
  useInitialize();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/admin" className="font-heading font-bold text-lg text-primary-green">
              Veggie Store Admin
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-green-50 text-primary-green'
                        : 'text-text-muted hover:bg-gray-50 hover:text-text-dark'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-dark"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="sm:hidden bg-white border-b border-gray-100 px-4 py-2 flex gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-green-50 text-primary-green'
                  : 'text-text-muted hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
