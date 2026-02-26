import { Outlet, Navigate, Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Menu, X, ShoppingCart, Package } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useInitialize } from '../../hooks/useInitialize';
import { useState, useMemo } from 'react';

const STAFF_ROLES = ['producer', 'supplier', 'transporter'] as const;

const roleConfig: Record<string, { label: string; basePath: string; badgeColor: string }> = {
  producer: { label: 'Producer', basePath: '/producer', badgeColor: 'bg-amber-100 text-amber-700' },
  supplier: { label: 'Supplier', basePath: '/supplier', badgeColor: 'bg-blue-100 text-blue-700' },
  transporter: {
    label: 'Transporter',
    basePath: '/transporter',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
};

export default function StaffLayout() {
  useInitialize();
  const { isAuthenticated, user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = user?.role as string;
  const config = roleConfig[userRole];

  const navItems = useMemo(() => {
    if (!config) return [];
    const items = [{ to: config.basePath, label: 'Dashboard', icon: LayoutDashboard, end: true }];
    if (userRole === 'producer') {
      items.push(
        { to: `${config.basePath}/orders`, label: 'Orders', icon: ShoppingCart, end: false },
        { to: `${config.basePath}/fridges`, label: 'Fridges', icon: Package, end: false }
      );
    }
    return items;
  }, [config, userRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !STAFF_ROLES.includes(userRole as (typeof STAFF_ROLES)[number])) {
    return <Navigate to="/staff/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={config.basePath}
              className="font-heading font-bold text-lg text-gradient-green"
            >
              Sampada Greens
            </Link>

            {/* Role badge */}
            <span
              className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeColor}`}
            >
              {config.label}
            </span>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-0.5 ml-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-green-50 text-primary-green shadow-sm'
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

          <div className="flex items-center gap-2">
            {/* Role badge on mobile */}
            <span
              className={`sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.badgeColor}`}
            >
              {config.label}
            </span>
            <span className="text-sm text-text-muted hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-text-muted transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-14 right-0 w-56 bg-white border-l border-gray-100 shadow-xl p-3 space-y-1 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
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
            <div className="border-t border-gray-100 pt-2 mt-2">
              <span className="block px-3 py-1 text-xs text-text-muted">{user?.name}</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
