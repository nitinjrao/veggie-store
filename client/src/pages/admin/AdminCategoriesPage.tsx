import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import type { AdminCategory, CategoryFormData } from '../../services/adminService';

const emptyForm: CategoryFormData = {
  name: '',
  nameHindi: '',
  nameKannada: '',
  sortOrder: 0,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await adminService.listCategories();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (cat: AdminCategory) => {
    setForm({
      name: cat.name,
      nameHindi: cat.nameHindi || '',
      nameKannada: cat.nameKannada || '',
      sortOrder: cat.sortOrder,
    });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminService.updateCategory(editingId, form);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success('Category updated');
      } else {
        const created = await adminService.createCategory(form);
        setCategories((prev) => [...prev, created]);
        toast.success('Category created');
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Only empty categories can be deleted.')) return;
    setDeleting(id);
    try {
      await adminService.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 animate-in fade-in slide-in-from-top-2">
          <h2 className="font-medium text-text-dark mb-4">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name (English) *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. Leafy Greens"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name (Hindi)</label>
              <input
                type="text"
                value={form.nameHindi || ''}
                onChange={(e) => setForm((f) => ({ ...f, nameHindi: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name (Kannada)</label>
              <input
                type="text"
                value={form.nameKannada || ''}
                onChange={(e) => setForm((f) => ({ ...f, nameKannada: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-muted w-10">#</th>
              <th className="text-left px-4 py-3 font-medium text-text-muted">Category</th>
              <th className="text-left px-4 py-3 font-medium text-text-muted">Hindi</th>
              <th className="text-left px-4 py-3 font-medium text-text-muted">Kannada</th>
              <th className="text-center px-4 py-3 font-medium text-text-muted">Items</th>
              <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50/50 group">
                <td className="px-4 py-3 text-text-muted">
                  <div className="flex items-center gap-1">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                    {cat.sortOrder}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-text-dark">{cat.name}</td>
                <td className="px-4 py-3 text-text-muted font-hindi">{cat.nameHindi || '-'}</td>
                <td className="px-4 py-3 text-text-muted">{cat.nameKannada || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                    {cat._count.vegetables}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleting === cat.id || cat._count.vegetables > 0}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title={cat._count.vegetables > 0 ? 'Cannot delete: has vegetables' : 'Delete category'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                  No categories yet. Click "Add Category" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
