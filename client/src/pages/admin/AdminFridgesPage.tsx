import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
import { adminService } from '../../services/adminService';
import type { Refrigerator, RefrigeratorStatus, Location } from '../../types';

interface LowStockAlert {
  id: string;
  quantityAvailable: number;
  minimumThreshold: number;
  refrigeratorName: string;
  vegetableName: string;
  vegetableEmoji: string | null;
  vegetable?: { name: string };
  refrigerator?: { name: string };
  fridgeName?: string;
  quantity?: number;
  threshold?: number;
}

interface FridgeFormData {
  name: string;
  locationId: string;
  status: RefrigeratorStatus;
}

const emptyForm: FridgeFormData = {
  name: '',
  locationId: '',
  status: 'ACTIVE',
};

const statusColor: Record<RefrigeratorStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-red-100 text-red-700',
  MAINTENANCE: 'bg-yellow-100 text-yellow-700',
};

const STATUS_OPTIONS: { value: RefrigeratorStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export default function AdminFridgesPage() {
  const navigate = useNavigate();
  const [fridges, setFridges] = useState<Refrigerator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FridgeFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadFridges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterLocation, filterStatus]);

  const loadData = async () => {
    try {
      const [locsData, alertsData] = await Promise.all([
        adminService.listLocations(),
        adminService.getLowStockAlerts().catch(() => []),
      ]);
      setLocations(Array.isArray(locsData) ? locsData : locsData.locations || []);
      setLowStockAlerts(Array.isArray(alertsData) ? alertsData : alertsData.alerts || []);
    } catch {
      // silently fail for supporting data
    }
  };

  const loadFridges = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterLocation) params.locationId = filterLocation;
      if (filterStatus) params.status = filterStatus;
      const data = await adminService.listFridges(params);
      setFridges(Array.isArray(data) ? data : data.fridges || []);
    } catch {
      toast.error('Failed to load fridges');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (fridge: Refrigerator) => {
    setForm({
      name: fridge.name,
      locationId: fridge.locationId,
      status: fridge.status,
    });
    setEditingId(fridge.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Fridge name is required');
      return;
    }
    if (!form.locationId) {
      toast.error('Please select a location');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await adminService.updateFridge(editingId, form);
        setFridges((prev) => prev.map((f) => (f.id === editingId ? { ...f, ...updated } : f)));
        toast.success('Fridge updated');
      } else {
        const created = await adminService.createFridge({
          name: form.name,
          locationId: form.locationId,
        });
        setFridges((prev) => [...prev, created]);
        toast.success('Fridge created');
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
    if (!confirm('Delete this fridge? This will remove all its inventory.')) return;
    setDeleting(id);
    try {
      await adminService.deleteFridge(id);
      setFridges((prev) => prev.filter((f) => f.id !== id));
      toast.success('Fridge deleted');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  if (loading && fridges.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Refrigerators</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Fridge
        </button>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">
              Low Stock Alerts ({lowStockAlerts.length})
            </h3>
          </div>
          <div className="space-y-1">
            {lowStockAlerts.slice(0, 5).map((alert: LowStockAlert, idx: number) => (
              <p key={idx} className="text-sm text-yellow-700">
                <span className="font-medium">{alert.vegetable?.name || alert.vegetableName}</span>
                {' in '}
                <span className="font-medium">{alert.refrigerator?.name || alert.fridgeName}</span>
                {' - '}
                {alert.quantityAvailable ?? alert.quantity} available (min:{' '}
                {alert.minimumThreshold ?? alert.threshold})
              </p>
            ))}
            {lowStockAlerts.length > 5 && (
              <p className="text-sm text-yellow-600">...and {lowStockAlerts.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 animate-in fade-in slide-in-from-top-2">
          <h2 className="font-medium text-text-dark mb-4">
            {editingId ? 'Edit Fridge' : 'New Fridge'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Fridge Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. Fridge A"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Location *</label>
              <select
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
              >
                <option value="">Select location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as RefrigeratorStatus }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fridges List */}
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
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Fridge Name</th>
                  <th className="text-left px-4 py-3 font-medium text-text-muted">Location</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-text-muted">Inventory</th>
                  <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fridges.map((fridge) => {
                  const inventoryCount = fridge._count?.inventory ?? 0;
                  return (
                    <tr key={fridge.id} className="hover:bg-gray-50/50 group">
                      <td className="px-4 py-3 font-medium text-text-dark">{fridge.name}</td>
                      <td className="px-4 py-3 text-text-muted">{fridge.location?.name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColor[fridge.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {fridge.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          {inventoryCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/fridges/${fridge.id}/inventory`)}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-text-muted hover:text-green-700 transition"
                            title="Manage inventory"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(fridge)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                            title="Edit fridge"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fridge.id)}
                            disabled={deleting === fridge.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete fridge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {fridges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                      No fridges found. Click "Add Fridge" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
