import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  MapPin,
  ChevronDown,
  Package,
  AlertTriangle,
  Wrench,
  CircleDot,
  CircleOff,
  ShoppingCart,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
import { adminService } from '../../services/adminService';
import type { Location, Refrigerator, RefrigeratorStatus, FridgePickupOrder } from '../../types';
import { FRIDGE_ORDER_STATUS_STYLES, FRIDGE_ORDER_STATUS_LABELS } from '../../utils/statusStyles';

interface LocationWithFridges extends Location {
  _count?: { refrigerators: number };
  refrigerators: (Refrigerator & { _count?: { inventory: number } })[];
}

interface LowStockAlert {
  refrigeratorId?: string;
  refrigeratorName: string;
  vegetableName: string;
  vegetableEmoji: string | null;
  quantityAvailable: number;
  minimumThreshold: number;
  vegetable?: { name: string };
  refrigerator?: { name: string; id?: string };
  fridgeName?: string;
  fridgeId?: string;
  quantity?: number;
  threshold?: number;
}

interface LocationFormData {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface FridgeFormData {
  name: string;
  locationId: string;
  status: RefrigeratorStatus;
}

const STATUS_CONFIG: Record<
  RefrigeratorStatus,
  { label: string; color: string; icon: typeof CircleDot }
> = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CircleDot,
  },
  INACTIVE: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: CircleOff,
  },
  MAINTENANCE: {
    label: 'Maintenance',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Wrench,
  },
};

const STATUS_OPTIONS: { value: RefrigeratorStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

const emptyLocationForm: LocationFormData = { name: '', address: '', latitude: '', longitude: '' };
const emptyFridgeForm: FridgeFormData = { name: '', locationId: '', status: 'ACTIVE' };

export default function AdminPickupPointsPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationWithFridges[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded locations
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Location form
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationForm, setLocationForm] = useState<LocationFormData>(emptyLocationForm);
  const [savingLocation, setSavingLocation] = useState(false);

  // Fridge form
  const [showFridgeFormFor, setShowFridgeFormFor] = useState<string | null>(null);
  const [editingFridgeId, setEditingFridgeId] = useState<string | null>(null);
  const [fridgeForm, setFridgeForm] = useState<FridgeFormData>(emptyFridgeForm);
  const [savingFridge, setSavingFridge] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  // Order counts per fridge
  const [pendingCounts, setPendingCounts] = useState<
    Record<string, { pending: number; confirmed: number; ready: number }>
  >({});

  // Producer assignment
  const [fridgeProducers, setFridgeProducers] = useState<
    Record<
      string,
      { id: string; name: string; email: string; phone: string | null; active: boolean }[]
    >
  >({});
  const [allProducers, setAllProducers] = useState<{ id: string; name: string; email: string }[]>(
    []
  );
  const [assigningProducer, setAssigningProducer] = useState<string | null>(null);
  const [selectedProducerIds, setSelectedProducerIds] = useState<Record<string, string>>({});

  // Active orders per fridge (loaded on expand)
  const [fridgeOrders, setFridgeOrders] = useState<Record<string, FridgePickupOrder[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [locsData, fridgesData, alertsData, countsData, staffData] = await Promise.all([
        adminService.listLocations(),
        adminService.listFridges(),
        adminService.getLowStockAlerts().catch(() => []),
        adminService.getFridgePendingCounts().catch(() => ({})),
        adminService.listStaff({ role: 'PRODUCER' }).catch(() => ({ staff: [] })),
      ]);

      setPendingCounts(countsData || {});
      const producers = Array.isArray(staffData) ? staffData : staffData.staff || [];
      setAllProducers(producers.filter((p: { active?: boolean }) => p.active !== false));

      const locs: Location[] = Array.isArray(locsData) ? locsData : locsData.locations || [];
      const fridges: Refrigerator[] = Array.isArray(fridgesData)
        ? fridgesData
        : fridgesData.fridges || [];
      const alerts: LowStockAlert[] = Array.isArray(alertsData)
        ? alertsData
        : alertsData.alerts || [];

      // Group fridges by location
      const locationsWithFridges: LocationWithFridges[] = locs.map((loc) => ({
        ...loc,
        refrigerators: fridges.filter((f) => f.locationId === loc.id),
      }));

      setLocations(locationsWithFridges);
      setLowStockAlerts(alerts);

      // Auto-expand all locations that have fridges
      setExpanded(
        new Set(locationsWithFridges.filter((l) => l.refrigerators.length > 0).map((l) => l.id))
      );
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Load producers and orders for fridges in this location
        const loc = locations.find((l) => l.id === id);
        if (loc) {
          loc.refrigerators.forEach((f) => {
            if (!fridgeProducers[f.id]) loadFridgeProducers(f.id);
            if (!fridgeOrders[f.id]) loadFridgeActiveOrders(f.id);
          });
        }
      }
      return next;
    });
  };

  const getAlertsForFridge = (fridgeId: string) =>
    lowStockAlerts.filter(
      (a) => (a.refrigeratorId || a.refrigerator?.id || a.fridgeId) === fridgeId
    );

  // --- Location CRUD ---

  const openCreateLocation = () => {
    setLocationForm(emptyLocationForm);
    setEditingLocationId(null);
    setShowLocationForm(true);
  };

  const openEditLocation = (loc: Location) => {
    setLocationForm({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude || '',
      longitude: loc.longitude || '',
    });
    setEditingLocationId(loc.id);
    setShowLocationForm(true);
  };

  const saveLocation = async () => {
    if (!locationForm.name.trim()) return toast.error('Name is required');
    if (!locationForm.address.trim()) return toast.error('Address is required');
    setSavingLocation(true);
    try {
      const payload: { name: string; address: string; latitude?: number; longitude?: number } = {
        name: locationForm.name,
        address: locationForm.address,
      };
      if (locationForm.latitude) payload.latitude = parseFloat(locationForm.latitude);
      if (locationForm.longitude) payload.longitude = parseFloat(locationForm.longitude);

      if (editingLocationId) {
        await adminService.updateLocation(editingLocationId, payload);
        toast.success('Location updated');
      } else {
        await adminService.createLocation(payload);
        toast.success('Location created');
      }
      setShowLocationForm(false);
      setEditingLocationId(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingLocation(false);
    }
  };

  const toggleLocationActive = async (loc: Location) => {
    try {
      await adminService.updateLocation(loc.id, { active: !loc.active });
      toast.success(`Location ${loc.active ? 'deactivated' : 'activated'}`);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Delete this location? Only empty locations can be deleted.')) return;
    setDeleting(id);
    try {
      await adminService.deleteLocation(id);
      toast.success('Location deleted');
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  // --- Producer Assignment ---

  const loadFridgeProducers = async (fridgeId: string) => {
    try {
      const data = await adminService.getFridgeProducers(fridgeId);
      setFridgeProducers((prev) => ({ ...prev, [fridgeId]: Array.isArray(data) ? data : [] }));
    } catch {
      // ignore
    }
  };

  const handleAssignProducer = async (fridgeId: string) => {
    const producerId = selectedProducerIds[fridgeId];
    if (!producerId) return;
    setAssigningProducer(fridgeId);
    try {
      await adminService.assignProducerToFridge(fridgeId, producerId);
      toast.success('Producer assigned');
      setSelectedProducerIds((prev) => ({ ...prev, [fridgeId]: '' }));
      await loadFridgeProducers(fridgeId);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssigningProducer(null);
    }
  };

  const handleUnassignProducer = async (fridgeId: string, staffId: string) => {
    try {
      await adminService.unassignProducerFromFridge(fridgeId, staffId);
      toast.success('Producer unassigned');
      await loadFridgeProducers(fridgeId);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  // --- Active Orders per Fridge ---

  const loadFridgeActiveOrders = async (fridgeId: string) => {
    setLoadingOrders(fridgeId);
    try {
      const data = await adminService.getFridgeActiveOrders(fridgeId);
      setFridgeOrders((prev) => ({
        ...prev,
        [fridgeId]: Array.isArray(data) ? data : data.orders || [],
      }));
    } catch {
      // ignore
    } finally {
      setLoadingOrders(null);
    }
  };

  // --- Fridge CRUD ---

  const openCreateFridge = (locationId: string) => {
    setFridgeForm({ name: '', locationId, status: 'ACTIVE' });
    setEditingFridgeId(null);
    setShowFridgeFormFor(locationId);
    // Ensure location is expanded
    setExpanded((prev) => new Set(prev).add(locationId));
  };

  const openEditFridge = (fridge: Refrigerator) => {
    setFridgeForm({ name: fridge.name, locationId: fridge.locationId, status: fridge.status });
    setEditingFridgeId(fridge.id);
    setShowFridgeFormFor(fridge.locationId);
  };

  const saveFridge = async () => {
    if (!fridgeForm.name.trim()) return toast.error('Fridge name is required');
    setSavingFridge(true);
    try {
      if (editingFridgeId) {
        await adminService.updateFridge(editingFridgeId, fridgeForm);
        toast.success('Fridge updated');
      } else {
        await adminService.createFridge({
          name: fridgeForm.name,
          locationId: fridgeForm.locationId,
        });
        toast.success('Fridge created');
      }
      setShowFridgeFormFor(null);
      setEditingFridgeId(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingFridge(false);
    }
  };

  const deleteFridge = async (id: string) => {
    if (!confirm('Delete this fridge? This will remove all its inventory.')) return;
    setDeleting(id);
    try {
      await adminService.deleteFridge(id);
      toast.success('Fridge deleted');
      await loadData();
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

  const totalFridges = locations.reduce((s, l) => s + l.refrigerators.length, 0);
  const activeFridges = locations.reduce(
    (s, l) => s + l.refrigerators.filter((f) => f.status === 'ACTIVE').length,
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl text-text-dark">Pickup Points</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {locations.length} location{locations.length !== 1 ? 's' : ''} &middot; {activeFridges}/
            {totalFridges} fridges active
          </p>
        </div>
        <button
          onClick={openCreateLocation}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Low Stock Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {lowStockAlerts.length} low stock alert{lowStockAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.slice(0, 6).map((alert, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-xs text-amber-800"
              >
                <span>{alert.vegetableEmoji || '🥬'}</span>
                <span className="font-medium">{alert.vegetable?.name || alert.vegetableName}</span>
                <span className="text-amber-500">in</span>
                <span>
                  {alert.refrigerator?.name || alert.fridgeName || alert.refrigeratorName}
                </span>
              </span>
            ))}
            {lowStockAlerts.length > 6 && (
              <span className="inline-flex items-center px-2.5 py-1 text-xs text-amber-600">
                +{lowStockAlerts.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-text-muted mb-1">Total Locations</p>
          <p className="text-2xl font-bold text-text-dark">{locations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-text-muted mb-1">Active Fridges</p>
          <p className="text-2xl font-bold text-text-dark">
            {activeFridges}
            <span className="text-sm font-normal text-text-muted">/{totalFridges}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-text-muted mb-1">Low Stock Alerts</p>
          <p
            className={`text-2xl font-bold ${lowStockAlerts.length > 0 ? 'text-amber-600' : 'text-text-dark'}`}
          >
            {lowStockAlerts.length}
          </p>
        </div>
      </div>

      {/* New Location Form */}
      {showLocationForm && !editingLocationId && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 animate-fade-in">
          <h2 className="font-medium text-text-dark mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-green" />
            New Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Name *</label>
              <input
                type="text"
                value={locationForm.name}
                onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                placeholder="e.g. Indiranagar"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Address *</label>
              <input
                type="text"
                value={locationForm.address}
                onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                placeholder="e.g. 100ft Road, Bengaluru 560038"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Latitude</label>
              <input
                type="text"
                value={locationForm.latitude}
                onChange={(e) => setLocationForm((f) => ({ ...f, latitude: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                placeholder="12.9716"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Longitude</label>
              <input
                type="text"
                value={locationForm.longitude}
                onChange={(e) => setLocationForm((f) => ({ ...f, longitude: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                placeholder="77.5946"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveLocation}
              disabled={savingLocation}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {savingLocation ? 'Creating...' : 'Create Location'}
            </button>
            <button
              onClick={() => {
                setShowLocationForm(false);
                setEditingLocationId(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Location Cards */}
      <div className="space-y-3">
        {locations.map((location) => {
          const isExpanded = expanded.has(location.id);
          const fridgeCount = location.refrigerators.length;
          const activeFridgeCount = location.refrigerators.filter(
            (f) => f.status === 'ACTIVE'
          ).length;
          const locationAlertCount = location.refrigerators.reduce(
            (sum, f) => sum + getAlertsForFridge(f.id).length,
            0
          );
          const isEditingThis = editingLocationId === location.id && showLocationForm;

          return (
            <div
              key={location.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all duration-200 ${
                location.active !== false
                  ? 'border-gray-200 border-l-4 border-l-emerald-400'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Location Header */}
              {isEditingThis ? (
                <div className="p-5 border-b border-gray-100 animate-fade-in">
                  <h2 className="font-medium text-text-dark mb-4 flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary-green" />
                    Edit Location
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={locationForm.name}
                        onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={locationForm.address}
                        onChange={(e) =>
                          setLocationForm((f) => ({ ...f, address: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={locationForm.latitude}
                        onChange={(e) =>
                          setLocationForm((f) => ({ ...f, latitude: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={locationForm.longitude}
                        onChange={(e) =>
                          setLocationForm((f) => ({ ...f, longitude: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveLocation}
                      disabled={savingLocation}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {savingLocation ? 'Saving...' : 'Update'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLocationForm(false);
                        setEditingLocationId(null);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpanded(location.id)}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4.5 h-4.5 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-dark text-sm truncate">
                        {location.name}
                      </h3>
                      {location.active === false && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 uppercase tracking-wide">
                          Inactive
                        </span>
                      )}
                      {locationAlertCount > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {locationAlertCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{location.address}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium text-text-dark">
                        {fridgeCount} fridge{fridgeCount !== 1 ? 's' : ''}
                      </p>
                      {fridgeCount > 0 && (
                        <p className="text-[11px] text-text-muted">{activeFridgeCount} active</p>
                      )}
                    </div>

                    {/* Actions (stop propagation so clicks don't toggle expand) */}
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openCreateFridge(location.id)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-text-muted hover:text-emerald-600 transition"
                        title="Add fridge to this location"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditLocation(location)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                        title="Edit location"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleLocationActive(location)}
                        className={`p-1.5 rounded-lg transition ${
                          location.active !== false
                            ? 'hover:bg-gray-100 text-text-muted hover:text-gray-600'
                            : 'hover:bg-emerald-50 text-text-muted hover:text-emerald-600'
                        }`}
                        title={
                          location.active !== false ? 'Deactivate location' : 'Activate location'
                        }
                      >
                        {location.active !== false ? (
                          <CircleOff className="w-3.5 h-3.5" />
                        ) : (
                          <CircleDot className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
                        disabled={deleting === location.id || fridgeCount > 0}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition disabled:opacity-20 disabled:cursor-not-allowed"
                        title={fridgeCount > 0 ? 'Remove all fridges first' : 'Delete location'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Expanded: Fridges */}
              {isExpanded && !isEditingThis && (
                <div className="border-t border-gray-100">
                  {/* Add fridge form */}
                  {showFridgeFormFor === location.id && (
                    <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 animate-fade-in">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-text-muted mb-1">
                            Fridge Name *
                          </label>
                          <input
                            type="text"
                            value={fridgeForm.name}
                            onChange={(e) => setFridgeForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 bg-white"
                            placeholder="e.g. Gandhi Bazaar"
                            autoFocus
                          />
                        </div>
                        {editingFridgeId && (
                          <div className="sm:w-36">
                            <label className="block text-xs font-medium text-text-muted mb-1">
                              Status
                            </label>
                            <select
                              value={fridgeForm.status}
                              onChange={(e) =>
                                setFridgeForm((f) => ({
                                  ...f,
                                  status: e.target.value as RefrigeratorStatus,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 bg-white"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <button
                            onClick={saveFridge}
                            disabled={savingFridge}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            {savingFridge ? 'Saving...' : editingFridgeId ? 'Update' : 'Add'}
                          </button>
                          <button
                            onClick={() => {
                              setShowFridgeFormFor(null);
                              setEditingFridgeId(null);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fridge list */}
                  {location.refrigerators.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {location.refrigerators.map((fridge) => {
                        const alerts = getAlertsForFridge(fridge.id);
                        const statusConf = STATUS_CONFIG[fridge.status] || STATUS_CONFIG.ACTIVE;
                        const StatusIcon = statusConf.icon;
                        const inventoryCount = fridge._count?.inventory ?? 0;
                        const counts = pendingCounts[fridge.id];
                        const producers = fridgeProducers[fridge.id] || [];
                        const activeOrders = fridgeOrders[fridge.id] || [];

                        return (
                          <div key={fridge.id}>
                            <div className="flex items-center gap-3 px-5 py-3 pl-10 hover:bg-gray-50/50 transition-colors group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-text-dark">
                                    {fridge.name}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConf.color}`}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConf.label}
                                  </span>
                                  {alerts.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-amber-600 font-medium">
                                      <AlertTriangle className="w-3 h-3" />
                                      {alerts.length} low stock
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-text-muted mt-0.5">
                                  {inventoryCount} item{inventoryCount !== 1 ? 's' : ''} in
                                  inventory
                                </p>
                                {/* Order count badges */}
                                {counts &&
                                  (counts.pending > 0 ||
                                    counts.confirmed > 0 ||
                                    counts.ready > 0) && (
                                    <div className="flex gap-1.5 mt-1.5">
                                      {counts.pending > 0 && (
                                        <Link
                                          to={`/admin/orders?status=PENDING&refrigeratorId=${fridge.id}`}
                                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition"
                                        >
                                          {counts.pending} pending
                                        </Link>
                                      )}
                                      {counts.confirmed > 0 && (
                                        <Link
                                          to={`/admin/orders?status=CONFIRMED&refrigeratorId=${fridge.id}`}
                                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                                        >
                                          {counts.confirmed} confirmed
                                        </Link>
                                      )}
                                      {counts.ready > 0 && (
                                        <Link
                                          to={`/admin/orders?status=READY&refrigeratorId=${fridge.id}`}
                                          className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                                        >
                                          {counts.ready} ready
                                        </Link>
                                      )}
                                    </div>
                                  )}
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => navigate(`/admin/fridges/${fridge.id}/inventory`)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-text-muted hover:text-emerald-600 transition"
                                  title="Manage inventory"
                                >
                                  <Package className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditFridge(fridge)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted hover:text-text-dark transition"
                                  title="Edit fridge"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteFridge(fridge.id)}
                                  disabled={deleting === fridge.id}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition disabled:opacity-30"
                                  title="Delete fridge"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Assigned Producers */}
                            <div className="px-5 pl-10 pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] text-text-muted font-medium">
                                  Producers:
                                </span>
                                {producers.length > 0 ? (
                                  producers.map((p) => (
                                    <span
                                      key={p.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200"
                                    >
                                      {p.name}
                                      <button
                                        onClick={() => handleUnassignProducer(fridge.id, p.id)}
                                        className="hover:text-red-500 transition"
                                        title="Remove producer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-gray-400">None</span>
                                )}
                                {/* Assign new producer */}
                                <div className="inline-flex items-center gap-1">
                                  <select
                                    value={selectedProducerIds[fridge.id] || ''}
                                    onChange={(e) =>
                                      setSelectedProducerIds((prev) => ({
                                        ...prev,
                                        [fridge.id]: e.target.value,
                                      }))
                                    }
                                    className="px-2 py-0.5 rounded border border-gray-200 text-[11px] bg-white"
                                  >
                                    <option value="">+ Assign</option>
                                    {allProducers
                                      .filter((p) => !producers.some((fp) => fp.id === p.id))
                                      .map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.name}
                                        </option>
                                      ))}
                                  </select>
                                  {selectedProducerIds[fridge.id] && (
                                    <button
                                      onClick={() => handleAssignProducer(fridge.id)}
                                      disabled={assigningProducer === fridge.id}
                                      className="p-0.5 rounded hover:bg-emerald-50 text-emerald-600 transition disabled:opacity-50"
                                    >
                                      <UserPlus className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Active Orders for this fridge */}
                            {activeOrders.length > 0 && (
                              <div className="px-5 pl-10 pb-3">
                                <div className="bg-gray-50/80 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <ShoppingCart className="w-3.5 h-3.5 text-text-muted" />
                                    <span className="text-[11px] font-medium text-text-muted">
                                      Active Orders ({activeOrders.length})
                                    </span>
                                  </div>
                                  {activeOrders.slice(0, 5).map((order) => (
                                    <Link
                                      key={order.id}
                                      to={`/admin/orders/${order.id}`}
                                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white transition text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-primary-green">
                                          {order.orderNumber}
                                        </span>
                                        <span className="text-text-muted">
                                          {order.customer?.name || order.customer?.phone}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${FRIDGE_ORDER_STATUS_STYLES[order.status]}`}
                                        >
                                          {FRIDGE_ORDER_STATUS_LABELS[order.status]}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {order.assignedTo && (
                                          <span className="text-[10px] text-text-muted">
                                            {order.assignedTo.name}
                                          </span>
                                        )}
                                        <span className="font-medium">
                                          {'\u20B9'}
                                          {order.totalAmount}
                                        </span>
                                      </div>
                                    </Link>
                                  ))}
                                  {activeOrders.length > 5 && (
                                    <Link
                                      to={`/admin/orders?refrigeratorId=${fridge.id}`}
                                      className="block text-center text-[11px] text-primary-green hover:underline pt-1"
                                    >
                                      View all {activeOrders.length} orders
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}
                            {loadingOrders === fridge.id && (
                              <div className="px-5 pl-10 pb-3">
                                <div className="flex items-center justify-center py-3">
                                  <div className="w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full animate-spin" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    showFridgeFormFor !== location.id && (
                      <div className="px-5 py-6 text-center">
                        <p className="text-sm text-text-muted mb-2">No fridges at this location</p>
                        <button
                          onClick={() => openCreateFridge(location.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-green hover:bg-emerald-50 rounded-lg transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add first fridge
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}

        {locations.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-text-muted text-sm mb-3">No pickup locations yet</p>
            <button
              onClick={openCreateLocation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add your first location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
