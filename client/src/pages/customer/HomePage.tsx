import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, Clock, Leaf } from 'lucide-react';
import Header from '../../components/common/Header';
import SearchBar from '../../components/customer/SearchBar';
import CategoryFilter from '../../components/customer/CategoryFilter';
import VegetableGrid from '../../components/customer/VegetableGrid';
import { vegetableService } from '../../services/vegetableService';
import type { Vegetable, Category } from '../../types';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vegetableService.getCategories().then(setCategories).catch(console.error);
  }, []);

  const fetchVegetables = useCallback(async () => {
    setLoading(true);
    try {
      let result: Vegetable[];
      if (searchQuery.trim()) {
        result = await vegetableService.search(searchQuery);
      } else if (selectedCategory) {
        result = await vegetableService.getByCategory(selectedCategory);
      } else {
        result = await vegetableService.getAll();
      }
      setVegetables(result);
    } catch (err) {
      console.error('Failed to fetch vegetables:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

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
  }, [searchQuery, selectedCategory, fetchVegetables, setSearchParams]);

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

  return (
    <>
      <Header onSearch={handleSearch} searchQuery={searchQuery} />

      {/* Hero Banner - only show when no search active */}
      {!searchQuery && !selectedCategory && (
        <div className="bg-gradient-hero border-b border-green-100/50">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
            <div className="text-center animate-fade-in">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text-dark mb-2">
                Fresh Vegetables, <span className="text-gradient-green">Daily Delivered</span>
              </h1>
              <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mb-4">
                Farm-fresh vegetables at your doorstep. Order now for same-day delivery.
              </p>
              <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Leaf className="w-4 h-4 text-primary-green" />
                  100% Fresh
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-primary-green" />
                  Free Delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary-green" />
                  Same Day
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <SearchBar value={searchQuery} onChange={handleSearch} />

        <div className="mb-5">
          <CategoryFilter
            categories={categories}
            selectedId={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>

        <VegetableGrid vegetables={vegetables} loading={loading} />
      </div>
    </>
  );
}
