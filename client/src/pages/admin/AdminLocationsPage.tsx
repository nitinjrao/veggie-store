import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
import { adminService } from '../../services/adminService';
import type { Location } from '../../types';

interface LocationFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

const emptyForm: LocationFormData = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
};

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<(Location & { _count?: { refrigerators: number } })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await adminService.listLocations();
      setLocations(Array.isArray(data) ? data : data.locations || []);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (location: Location) => {
    setForm({
      name: location.name,
      address: location.address,
      latitude: location.latitude || '',
      longitude: location.longitude || '',
    });
    setEditingId(location.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    if (!form.address.trim()) {
      toast.error('Address is required');
      return;
    }
    setSaving(true);
    try {
      const payload: { name: string; address: string; latitude?: number; longitude?: number } = {
        name: form.name,
        address: form.address,
      };
      if (form.latitude) payload.latitude = parseFloat(form.latitude);
      if (form.longitude) payload.longitude = parseFloat(form.longitude);

      if (editingId) {
        const updated = await adminService.updateLocation(editingId, payload);
        setLocations((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...updated } : l)));
        toast.success('Location updated');
      } else {
        const created = await adminService.createLocation(payload);
        setLocations((prev) => [...prev, created]);
        toast.success('Location created');
      }
      setShowForm(false);
      setEditingId(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (location: Location) => {
    setToggling(location.id);
    try {
      const updated = await adminService.updateLocation(location.id, { active: !location.active });
      setLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, ...updated } : l)));
      toast.success(`Location ${updated.active ? 'activated' : 'deactivated'}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location? Only locations with no fridges can be deleted.')) return;
    setDeleting(id);
    try {
      await adminService.deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      toast.success('Location deleted');
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Locations</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 animate-in fade-in slide-in-from-top-2">
          <h2 className="font-medium text-text-dark mb-4">
            {editingId ? 'Edit Location' : 'New Location'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">
                Location Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. Indiranagar Branch"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Address *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. 100ft Road, Indiranagar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Latitude</label>
              <input
                type="text"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. 12.9716"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Longitude</label>
              <input
                type="text"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                placeholder="e.g. 77.5946"
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

      {/* Locations List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Location Name</th>
                <th className="text-left px-4 py-3 font-medium text-text-muted hidden sm:table-cell">
                  Address
                </th>
                <th className="text-center px-4 py-3 font-medium text-text-muted">Fridges</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {locations.map((location) => {
                const fridgeCount = location._count?.refrigerators ?? 0;
                return (
                  <tr key={location.id} className="hover:bg-gray-50/50 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary-green flex-shrink-0" />
                        <span className="font-medium text-text-dark">{location.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                      {location.address || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                        {fridgeCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(location)}
                        disabled={toggling === location.id}
                        className="focus:outline-none disabled:opacity-50"
                        title={location.active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                            location.active !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {location.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(location)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                          title="Edit location"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          disabled={deleting === location.id || fridgeCount > 0}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={fridgeCount > 0 ? 'Cannot delete: has fridges' : 'Delete location'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No locations yet. Click "Add Location" to create one.
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
