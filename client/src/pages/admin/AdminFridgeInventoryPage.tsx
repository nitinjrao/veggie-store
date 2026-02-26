import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/error';
import { adminService } from '../../services/adminService';
import type { Refrigerator, FridgeInventoryItem, Vegetable } from '../../types';

interface InventoryRow {
  vegetableId: string;
  vegetableName: string;
  vegetableEmoji: string;
  quantityAvailable: number;
  minimumThreshold: number;
  isNew?: boolean;
}

export default function AdminFridgeInventoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fridge, setFridge] = useState<Refrigerator | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [allVegetables, setAllVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newVegetableId, setNewVegetableId] = useState('');

  useEffect(() => {
    if (!id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [fridgeData, vegsData] = await Promise.all([
        adminService.getFridge(id!),
        adminService.listVegetables(),
      ]);
      setFridge(fridgeData);
      setAllVegetables(Array.isArray(vegsData) ? vegsData : []);

      const items: FridgeInventoryItem[] = fridgeData.inventory || [];
      setInventory(
        items.map((item: FridgeInventoryItem) => ({
          vegetableId: item.vegetableId,
          vegetableName: item.vegetable?.name || 'Unknown',
          vegetableEmoji: item.vegetable?.emoji || '',
          quantityAvailable: parseFloat(item.quantityAvailable) || 0,
          minimumThreshold: parseFloat(item.minimumThreshold) || 0,
        }))
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const usedVegetableIds = new Set(inventory.map((r) => r.vegetableId));
  const availableVegetables = allVegetables.filter((v) => !usedVegetableIds.has(v.id));

  const handleAddItem = () => {
    if (!newVegetableId) {
      toast.error('Select a vegetable');
      return;
    }
    const veg = allVegetables.find((v) => v.id === newVegetableId);
    if (!veg) return;

    setInventory((prev) => [
      ...prev,
      {
        vegetableId: veg.id,
        vegetableName: veg.name,
        vegetableEmoji: veg.emoji || '',
        quantityAvailable: 0,
        minimumThreshold: 5,
        isNew: true,
      },
    ]);
    setNewVegetableId('');
    setShowAddRow(false);
  };

  const handleRemoveItem = (vegetableId: string) => {
    setInventory((prev) => prev.filter((r) => r.vegetableId !== vegetableId));
  };

  const handleUpdateRow = (
    vegetableId: string,
    field: 'quantityAvailable' | 'minimumThreshold',
    value: number
  ) => {
    setInventory((prev) =>
      prev.map((r) => (r.vegetableId === vegetableId ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const items = inventory.map((r) => ({
        vegetableId: r.vegetableId,
        quantityAvailable: r.quantityAvailable,
        minimumThreshold: r.minimumThreshold,
      }));
      await adminService.updateFridgeInventory(id, items);
      toast.success('Inventory updated successfully');
      // Reload to get fresh data
      await loadData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !fridge) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/pickup-points')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pickup Points
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading font-bold text-2xl">{fridge?.name} - Inventory</h1>
          <p className="text-sm text-text-muted">{fridge?.location?.name}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-muted">Vegetable</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted">Available Qty</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted">Min Threshold</th>
                <th className="text-center px-4 py-3 font-medium text-text-muted">Status</th>
                <th className="text-right px-4 py-3 font-medium text-text-muted">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map((row) => {
                const isBelowThreshold = row.quantityAvailable < row.minimumThreshold;
                return (
                  <tr
                    key={row.vegetableId}
                    className={`hover:bg-gray-50/50 ${isBelowThreshold ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.vegetableEmoji || '🥬'}</span>
                        <span className="font-medium text-text-dark">{row.vegetableName}</span>
                        {row.isNew && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium">
                            New
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.quantityAvailable}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.vegetableId,
                            'quantityAvailable',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={`w-24 mx-auto block px-3 py-1.5 rounded-lg border text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-green ${
                          isBelowThreshold ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.minimumThreshold}
                        onChange={(e) =>
                          handleUpdateRow(
                            row.vegetableId,
                            'minimumThreshold',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-24 mx-auto block px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-green"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isBelowThreshold ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" />
                          Low
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(row.vegetableId)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition"
                        title="Remove from inventory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No inventory items. Click "Add Item" to add vegetables.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item */}
      {showAddRow ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-medium text-text-dark mb-3">Add Vegetable to Inventory</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={newVegetableId}
              onChange={(e) => setNewVegetableId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
            >
              <option value="">Select a vegetable...</option>
              {availableVegetables.map((veg) => (
                <option key={veg.id} value={veg.id}>
                  {veg.emoji || ''} {veg.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg hover:bg-primary-green-dark transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddRow(false);
                  setNewVegetableId('');
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
          {availableVegetables.length === 0 && (
            <p className="text-sm text-text-muted mt-2">
              All vegetables are already in the inventory.
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setShowAddRow(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-text-muted hover:border-primary-green hover:text-primary-green transition w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      )}
    </div>
  );
}
