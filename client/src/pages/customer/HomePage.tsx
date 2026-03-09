import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeIndianRupee, Clock, Leaf, ArrowUpDown, Truck, Package } from 'lucide-react';
import Header from '../../components/common/Header';
import SearchBar from '../../components/customer/SearchBar';
import CategoryFilter from '../../components/customer/CategoryFilter';
import DealsSection from '../../components/customer/DealsSection';
import VegetableGrid from '../../components/customer/VegetableGrid';
import FridgeSelect from '../../components/common/FridgeSelect';
import { vegetableService } from '../../services/vegetableService';
import { fridgeService } from '../../services/fridgeService';
import { useCartStore } from '../../stores/cartStore';
import type { Vegetable, Category, OrderType } from '../../types';

interface FridgeLocation {
  id: string;
  name: string;
  refrigerators: { id: string; name: string }[];
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<FridgeLocation[]>([]);

  const orderType = useCartStore((s) => s.orderType);
  const selectedFridgeId = useCartStore((s) => s.selectedFridgeId);
  const setOrderType = useCartStore((s) => s.setOrderType);
  const setSelectedFridgeId = useCartStore((s) => s.setSelectedFridgeId);

  useEffect(() => {
    vegetableService.getCategories().then(setCategories).catch(console.error);
    fridgeService.getLocations().then(setLocations).catch(console.error);
  }, []);

  const fetchVegetables = useCallback(async () => {
    // For fridge pickup, don't fetch until a fridge is selected
    if (orderType === 'FRIDGE_PICKUP' && !selectedFridgeId) {
      setVegetables([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let result: Vegetable[];
      if (orderType === 'FRIDGE_PICKUP' && selectedFridgeId) {
        // Fetch fridge inventory and transform to Vegetable[]
        const fridge = await fridgeService.getFridgeInventory(selectedFridgeId);
        result = fridge.inventory.map((inv: { vegetable: Vegetable; quantityAvailable: string }) => ({
          ...inv.vegetable,
          // Cap display — the fridge has limited stock
          fridgeStock: parseFloat(inv.quantityAvailable),
        }));
        // Apply search filter client-side for fridge inventory
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter((v) => v.name.toLowerCase().includes(q));
        }
        // Apply category filter client-side
        if (selectedCategory) {
          result = result.filter((v) => v.categoryId === selectedCategory);
        }
      } else if (orderType === 'HOME_DELIVERY') {
        if (searchQuery.trim()) {
          result = await fridgeService.getWarehouseVegetables();
          const q = searchQuery.toLowerCase();
          result = result.filter((v) => v.name.toLowerCase().includes(q));
        } else if (selectedCategory) {
          result = await fridgeService.getWarehouseVegetables();
          result = result.filter((v) => v.categoryId === selectedCategory);
        } else {
          result = await fridgeService.getWarehouseVegetables();
        }
      } else {
        result = await vegetableService.getAll();
      }
      setVegetables(result);
    } catch (err) {
      console.error('Failed to fetch vegetables:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, orderType, selectedFridgeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVegetables();
      if (searchQuery) {
        setSearchParams({ q: searchQuery });
      } else {
        setSearchParams({});
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, orderType, selectedFridgeId, fetchVegetables, setSearchParams]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSelectedCategory(null);
    }
  };

  const handleCategorySelect = (id: string | null) => {
    setSelectedCategory(id);
    setSearchQuery('');
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    setSelectedCategory(null);
    setSearchQuery('');
    if (type === 'HOME_DELIVERY') {
      setSelectedFridgeId('');
    }
  };

  const handleFridgeChange = (fridgeId: string) => {
    setSelectedFridgeId(fridgeId);
  };

  const sortedVegetables = useMemo(() => {
    const sorted = [...vegetables];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => {
          const pa = a.prices[0]?.pricePerKg ? parseFloat(a.prices[0].pricePerKg) : Infinity;
          const pb = b.prices[0]?.pricePerKg ? parseFloat(b.prices[0].pricePerKg) : Infinity;
          return pa - pb;
        });
      case 'price-high':
        return sorted.sort((a, b) => {
          const pa = a.prices[0]?.pricePerKg ? parseFloat(a.prices[0].pricePerKg) : 0;
          const pb = b.prices[0]?.pricePerKg ? parseFloat(b.prices[0].pricePerKg) : 0;
          return pb - pa;
        });
      default:
        return sorted;
    }
  }, [vegetables, sortBy]);

  return (
    <>
      <Header onSearch={handleSearch} searchQuery={searchQuery} />

      {/* Hero Banner - only show when no search active */}
      {!searchQuery && !selectedCategory && (
        <div className="bg-gradient-hero border-b border-green-100/60">
          <div className="px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
            <div className="text-center animate-fade-in">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-text-dark mb-2.5 tracking-tight">
                Fresh Vegetables, <span className="text-gradient-green">Straight from Farm</span>
              </h1>
              <p className="text-text-muted text-sm sm:text-base max-w-lg mx-auto mb-5 leading-relaxed">
                Farm-fresh vegetables at the best prices. Order now and enjoy quality produce.
              </p>
              <div className="flex items-center justify-center gap-5 sm:gap-8 text-xs sm:text-sm text-text-muted">
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Leaf className="w-4 h-4 text-primary-green" />
                  </span>
                  100% Fresh
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <BadgeIndianRupee className="w-4 h-4 text-primary-green" />
                  </span>
                  Best Prices
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-primary-green" />
                  </span>
                  Quick Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-6">
        {/* Order Type Selector */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => handleOrderTypeChange('FRIDGE_PICKUP')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              orderType === 'FRIDGE_PICKUP'
                ? 'bg-primary-green text-white shadow-sm'
                : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            Fridge Pickup
          </button>
          <button
            onClick={() => handleOrderTypeChange('HOME_DELIVERY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              orderType === 'HOME_DELIVERY'
                ? 'bg-primary-green text-white shadow-sm'
                : 'bg-white border border-gray-200 text-text-muted hover:bg-gray-50'
            }`}
          >
            <Truck className="w-4 h-4" />
            Home Delivery
          </button>
        </div>

        {/* Fridge selector for pickup orders */}
        {orderType === 'FRIDGE_PICKUP' && locations.length > 0 && (
          <div className="mb-4">
            <FridgeSelect
              locations={locations}
              value={selectedFridgeId}
              onChange={handleFridgeChange}
            />
            {!selectedFridgeId && (
              <p className="text-xs text-text-muted mt-2 ml-1">
                Select a fridge location to see available vegetables
              </p>
            )}
          </div>
        )}

        <SearchBar value={searchQuery} onChange={handleSearch} />

        {/* Deals section - only show when browsing all */}
        {!searchQuery && !selectedCategory && <DealsSection />}

        {/* Category filter + sort row */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <CategoryFilter
            categories={categories}
            selectedId={selectedCategory}
            onSelect={handleCategorySelect}
          />
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-xs sm:text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-green/30 transition-all cursor-pointer"
            >
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low-High</option>
              <option value="price-high">Price: High-Low</option>
            </select>
          </div>
        </div>

        <VegetableGrid vegetables={sortedVegetables} loading={loading} />
      </div>
    </>
  );
}
