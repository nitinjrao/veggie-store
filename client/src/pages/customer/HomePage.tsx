import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  // Fetch categories on mount
  useEffect(() => {
    vegetableService.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch vegetables based on search/category
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

  // Debounced search
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
      <div className="px-4 py-4">
        <SearchBar value={searchQuery} onChange={handleSearch} />
        <div className="mb-4">
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
