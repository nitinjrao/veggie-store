import { useState, useEffect } from 'react';
import { Package, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { producerService } from '../../services/producerService';
import { getErrorMessage } from '../../utils/error';
import type { Refrigerator, FridgeInventoryItem, Vegetable } from '../../types';

interface FridgeWithInventory extends Refrigerator {
  inventory?: FridgeInventoryItem[];
}

export default function ProducerFridgesPage() {
  const [fridges, setFridges] = useState<FridgeWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFridge, setSelectedFridge] = useState<string | null>(null);
  const [inventory, setInventory] = useState<FridgeInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Load form
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [loadItems, setLoadItems] = useState<
    { vegetableId: string; quantity: string; note: string }[]
  >([{ vegetableId: '', quantity: '', note: '' }]);
  const [savingLoad, setSavingLoad] = useState(false);
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);

  useEffect(() => {
    producerService
      .listFridges()
      .then((data: FridgeWithInventory[]) => {
        const list = Array.isArray(data) ? data : [];
        setFridges(list);
        if (list.length > 0) {
          setSelectedFridge(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFridge) return;
    setLoadingInventory(true);
    producerService
      .getFridgeInventory(selectedFridge)
      .then((data: FridgeWithInventory) => {
        setInventory(data.inventory || []);
        // Gather vegetables from inventory for the load form
        const vegs = (data.inventory || []).map((inv: FridgeInventoryItem) => inv.vegetable);
        setVegetables(vegs);
      })
      .catch(console.error)
      .finally(() => setLoadingInventory(false));
  }, [selectedFridge]);

  const handleLoad = async () => {
    if (!selectedFridge) return;
    const items = loadItems
      .filter((i) => i.vegetableId && parseFloat(i.quantity) > 0)
      .map((i) => ({
        vegetableId: i.vegetableId,
        quantity: parseFloat(i.quantity),
        note: i.note || undefined,
      }));

    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSavingLoad(true);
    try {
      const updated = await producerService.loadFridge(selectedFridge, items);
      setInventory(updated.inventory || []);
      toast.success('Vegetables loaded into fridge');
      setShowLoadForm(false);
      setLoadItems([{ vegetableId: '', quantity: '', note: '' }]);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingLoad(false);
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
      <h1 className="font-heading font-bold text-2xl text-text-dark mb-6">Fridges</h1>

      {fridges.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-text-muted">No fridges assigned to you.</p>
        </div>
      ) : (
        <>
          {/* Fridge selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {fridges.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFridge(f.id);
                  setShowLoadForm(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedFridge === f.id
                    ? 'bg-primary-green text-white'
                    : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
                }`}
              >
                {f.name}
                {f.location && <span className="ml-1 opacity-70">({f.location.name})</span>}
              </button>
            ))}
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-text-dark">Inventory</h2>
              {!showLoadForm && (
                <button
                  onClick={() => setShowLoadForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-primary-green-dark transition"
                >
                  <Plus className="w-4 h-4" />
                  Load Vegetables
                </button>
              )}
            </div>

            {loadingInventory ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-primary-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : inventory.length > 0 ? (
              <div className="space-y-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.vegetable?.emoji || '🥬'}</span>
                      <span className="text-sm font-medium">{item.vegetable?.name}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-bold ${
                          parseFloat(item.quantityAvailable) <= parseFloat(item.minimumThreshold)
                            ? 'text-amber-600'
                            : 'text-text-dark'
                        }`}
                      >
                        {parseFloat(item.quantityAvailable).toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-4">
                No inventory in this fridge.
              </p>
            )}
          </div>

          {/* Load Form */}
          {showLoadForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 animate-fade-in">
              <h2 className="font-medium text-text-dark mb-4">Load Vegetables</h2>
              <div className="space-y-3">
                {loadItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Vegetable</label>
                      <select
                        value={item.vegetableId}
                        onChange={(e) => {
                          const next = [...loadItems];
                          next[idx].vegetableId = e.target.value;
                          setLoadItems(next);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      >
                        <option value="">Select...</option>
                        {vegetables.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.emoji || '🥬'} {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-text-muted mb-1">Qty (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...loadItems];
                          next[idx].quantity = e.target.value;
                          setLoadItems(next);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-text-muted mb-1">Note</label>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => {
                          const next = [...loadItems];
                          next[idx].note = e.target.value;
                          setLoadItems(next);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                        placeholder="Optional"
                      />
                    </div>
                    {loadItems.length > 1 && (
                      <button
                        onClick={() => setLoadItems(loadItems.filter((_, i) => i !== idx))}
                        className="p-2 text-red-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() =>
                    setLoadItems([...loadItems, { vegetableId: '', quantity: '', note: '' }])
                  }
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-text-muted hover:bg-gray-50 transition"
                >
                  + Add Row
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => {
                    setShowLoadForm(false);
                    setLoadItems([{ vegetableId: '', quantity: '', note: '' }]);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-muted hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoad}
                  disabled={savingLoad}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-primary-green-dark transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {savingLoad ? 'Loading...' : 'Load'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
