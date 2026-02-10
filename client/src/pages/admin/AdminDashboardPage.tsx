import { useAuthStore } from '../../stores/authStore';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-2">Dashboard</h1>
      <p className="text-text-muted">Welcome back, {user?.name || 'Admin'}!</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-text-muted">Total Vegetables</h3>
          <p className="text-3xl font-bold text-text-dark mt-1">20</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-text-muted">Categories</h3>
          <p className="text-3xl font-bold text-text-dark mt-1">6</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-text-muted">Orders Today</h3>
          <p className="text-3xl font-bold text-text-dark mt-1">0</p>
        </div>
      </div>
    </div>
  );
}
