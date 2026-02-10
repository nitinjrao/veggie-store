import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useInitialize } from '../../hooks/useInitialize';

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
          <Link to="/admin" className="font-heading font-bold text-lg text-primary-green">
            Veggie Store Admin
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-dark"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
