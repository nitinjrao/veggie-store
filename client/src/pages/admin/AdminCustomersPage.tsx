import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface CustomerListItem {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listCustomers({
        page,
        search: search.trim() || undefined,
      });
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => loadCustomers(), 300);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-6">Customers</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Orders</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/customers/${c.id}`}
                        className="font-medium text-primary-green hover:underline"
                      >
                        {c.name || 'N/A'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{c.phone}</td>
                    <td className="px-4 py-3">{c._count.orders}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-text-muted">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-text-muted">{total} customer{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-muted">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
