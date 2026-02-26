import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Layers, ArrowUpDown, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
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
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
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
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Categories</h1>
          <p className="text-sm text-text-muted mt-1">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-green text-white rounded-xl hover:bg-primary-green-dark transition shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Inline Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-green" />
            </div>
            <h2 className="font-heading font-bold text-lg text-text-dark">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Name (English) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition"
                placeholder="e.g. Leafy Greens"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Name (Hindi)
              </label>
              <input
                type="text"
                value={form.nameHindi || ''}
                onChange={(e) => setForm((f) => ({ ...f, nameHindi: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition"
                placeholder="Hindi name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1.5">
                Name (Kannada)
              </label>
              <input
                type="text"
                value={form.nameKannada || ''}
                onChange={(e) => setForm((f) => ({ ...f, nameKannada: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition"
                placeholder="Kannada name"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-green text-white rounded-xl hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-text-muted hover:bg-gray-50 hover:text-text-dark transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 py-16 px-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-primary-green" />
          </div>
          <h3 className="font-heading font-bold text-lg text-text-dark mb-2">No categories yet</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Categories help organize your vegetables into groups. Create your first category to get
            started.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-green text-white rounded-xl hover:bg-primary-green-dark transition text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create First Category
          </button>
        </div>
      )}

      {/* Category Cards Grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
            >
              {/* Card Top: Name + Actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base text-text-dark truncate">
                    {cat.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-green-50 text-text-muted hover:text-primary-green transition"
                    title="Edit category"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleting === cat.id || cat._count.vegetables > 0}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={
                      cat._count.vegetables > 0
                        ? 'Cannot delete: has vegetables'
                        : 'Delete category'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Multilingual Names */}
              <div className="space-y-1 mb-4">
                {cat.nameHindi && (
                  <p className="text-sm text-text-muted font-hindi">
                    <span className="text-xs text-gray-400 mr-1.5">HI</span>
                    {cat.nameHindi}
                  </p>
                )}
                {cat.nameKannada && (
                  <p className="text-sm text-text-muted">
                    <span className="text-xs text-gray-400 mr-1.5">KN</span>
                    {cat.nameKannada}
                  </p>
                )}
                {!cat.nameHindi && !cat.nameKannada && (
                  <p className="text-xs text-gray-300 italic">No translations added</p>
                )}
              </div>

              {/* Card Footer: Item Count + Sort Order */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-primary-green text-xs font-medium">
                  <Leaf className="w-3 h-3" />
                  {cat._count.vegetables} {cat._count.vegetables === 1 ? 'item' : 'items'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <ArrowUpDown className="w-3 h-3" />#{cat.sortOrder}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
