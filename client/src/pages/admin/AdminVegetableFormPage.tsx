import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Minus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import type { Category } from '../../types';
import type { VegetableFormData, PriceHistoryItem } from '../../services/adminService';

export default function AdminVegetableFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState<VegetableFormData>({
    name: '',
    nameHindi: '',
    nameKannada: '',
    emoji: '',
    description: '',
    categoryId: '',
    available: true,
    stockKg: 0,
    minStockAlert: 5,
    price: {
      pricePerKg: undefined,
      pricePerPiece: undefined,
      pricePerPacket: undefined,
      packetWeight: undefined,
    },
  });

  useEffect(() => {
    adminService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) return;
    adminService.getPriceHistory(id).then(setPriceHistory).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminService
      .listVegetables()
      .then((vegs) => {
        const veg = vegs.find((v) => v.id === id);
        if (!veg) {
          setError('Vegetable not found');
          return;
        }
        if (veg.image) setImagePreview(veg.image);
        const price = veg.prices?.[0];
        setForm({
          name: veg.name,
          nameHindi: veg.nameHindi || '',
          nameKannada: veg.nameKannada || '',
          emoji: veg.emoji || '',
          description: veg.description || '',
          categoryId: veg.categoryId,
          available: veg.available,
          stockKg: Number(veg.stockKg ?? 0),
          minStockAlert: Number(veg.minStockAlert ?? 5),
          price: {
            pricePerKg: price?.pricePerKg ? Number(price.pricePerKg) : undefined,
            pricePerPiece: price?.pricePerPiece ? Number(price.pricePerPiece) : undefined,
            pricePerPacket: price?.pricePerPacket ? Number(price.pricePerPacket) : undefined,
            packetWeight: price?.packetWeight ? Number(price.packetWeight) : undefined,
          },
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit && id) {
        await adminService.updateVegetable(id, form);
        toast.success('Vegetable updated');
      } else {
        await adminService.createVegetable(form);
        toast.success('Vegetable added');
      }
      navigate('/admin/vegetables');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof VegetableFormData>(key: K, value: VegetableFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminService.uploadImage(file);
      updateField('image', url);
      setImagePreview(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updatePrice = (key: string, value: string) => {
    const num = value === '' ? undefined : Number(value);
    setForm((prev) => ({
      ...prev,
      price: { ...prev.price, [key]: num },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate('/admin/vegetables')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vegetables
      </button>

      <h1 className="font-heading font-bold text-2xl mb-6">
        {isEdit ? 'Edit Vegetable' : 'Add Vegetable'}
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-medium text-text-dark">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Emoji</label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => updateField('emoji', e.target.value)}
                placeholder="🥬"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name (Hindi)</label>
              <input
                type="text"
                value={form.nameHindi}
                onChange={(e) => updateField('nameHindi', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Name (Kannada)
              </label>
              <input
                type="text"
                value={form.nameKannada}
                onChange={(e) => updateField('nameKannada', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Category *</label>
            <select
              value={form.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Image</label>
            <div className="flex items-start gap-4">
              {imagePreview && (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); updateField('image', undefined); }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-primary-green hover:bg-green-50/30 transition-all">
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                      <div className="w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                      <Upload className="w-4 h-4" />
                      Click to upload image
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="available"
              checked={form.available}
              onChange={(e) => updateField('available', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-green focus:ring-primary-green"
            />
            <label htmlFor="available" className="text-sm text-text-dark">
              Available for purchase
            </label>
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-medium text-text-dark">Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Current Stock (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.stockKg ?? ''}
                onChange={(e) =>
                  updateField('stockKg', e.target.value === '' ? 0 : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Low Stock Alert (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.minStockAlert ?? ''}
                onChange={(e) =>
                  updateField('minStockAlert', e.target.value === '' ? 5 : Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-medium text-text-dark">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Price per Kg (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.price?.pricePerKg ?? ''}
                onChange={(e) => updatePrice('pricePerKg', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Price per Piece (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.price?.pricePerPiece ?? ''}
                onChange={(e) => updatePrice('pricePerPiece', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Packet Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.price?.packetWeight ?? ''}
                onChange={(e) => updatePrice('packetWeight', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Price per Packet (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form.price?.pricePerPacket ?? ''}
                onChange={(e) => updatePrice('pricePerPacket', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
              />
            </div>
          </div>
        </div>

        {/* Price History */}
        {isEdit && priceHistory.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <h2 className="font-medium text-text-dark">Price History</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {priceHistory.map((entry) => {
                const oldP = entry.oldPrice ? parseFloat(entry.oldPrice) : null;
                const newP = parseFloat(entry.newPrice);
                const isUp = oldP !== null && newP > oldP;
                const isDown = oldP !== null && newP < oldP;
                return (
                  <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      {isUp ? (
                        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                      ) : isDown ? (
                        <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-sm text-text-muted">
                        {oldP !== null ? `₹${oldP.toFixed(2)}` : 'Initial'} → ₹{newP.toFixed(2)}/kg
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(entry.changedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Vegetable' : 'Add Vegetable'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/vegetables')}
            className="px-6 py-2.5 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
