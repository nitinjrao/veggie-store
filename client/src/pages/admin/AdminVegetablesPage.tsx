import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import type { Vegetable } from '../../types';

export default function AdminVegetablesPage() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadVegetables();
  }, []);

  const loadVegetables = async () => {
    try {
      const data = await adminService.listVegetables();
      setVegetables(data);
    } catch (err) {
      console.error('Failed to load vegetables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vegetable?')) return;
    setDeleting(id);
    try {
      await adminService.deleteVegetable(id);
      setVegetables((prev) => prev.filter((v) => v.id !== id));
      toast.success('Vegetable removed');
    } catch (err) {
      toast.error('Failed to delete vegetable');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = vegetables.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.nameHindi?.toLowerCase().includes(search.toLowerCase()) ||
      v.nameKannada?.toLowerCase().includes(search.toLowerCase())
  );

  const getPrice = (v: Vegetable) => {
    const price = v.prices?.[0];
    if (!price) return '-';
    if (price.pricePerKg) return `₹${price.pricePerKg}/kg`;
    if (price.pricePerPiece) return `₹${price.pricePerPiece}/pc`;
    return '-';
  };

  const getStock = (v: Vegetable) => {
    const stock = Number(v.stockKg ?? 0);
    const min = Number(v.minStockAlert ?? 5);
    const isLow = stock <= min;
    return { stock, isLow };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Vegetables</h1>
        <Link
          to="/admin/vegetables/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Vegetable
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search vegetables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Vegetable</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Category</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Price</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((v) => {
                const { stock, isLow } = getStock(v);
                return (
                  <tr key={v.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{v.emoji || '🥬'}</span>
                        <div>
                          <p className="font-medium text-text-dark">{v.name}</p>
                          {v.nameHindi && (
                            <p className="text-xs text-text-muted font-hindi">{v.nameHindi}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{v.category?.name || '-'}</td>
                    <td className="px-4 py-3">{getPrice(v)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        <span className={isLow ? 'text-amber-600 font-medium' : ''}>
                          {stock} kg
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {v.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/vegetables/${v.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deleting === v.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    No vegetables found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
