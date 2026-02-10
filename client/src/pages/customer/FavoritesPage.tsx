import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import Header from '../../components/common/Header';
import VegetableCard from '../../components/customer/VegetableCard';
import { favoriteService } from '../../services/favoriteService';
import { useAuthStore } from '../../stores/authStore';
import type { Vegetable } from '../../types';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    favoriteService
      .getAll()
      .then(setFavorites)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  return (
    <>
      <Header />
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h1 className="font-heading font-bold text-xl">My Favorites</h1>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-text-muted mb-4">Login to save your favorite vegetables</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-primary-green-dark transition"
            >
              Login
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-text-muted mb-4">No favorites yet. Tap the heart on any vegetable to save it here.</p>
            <Link
              to="/"
              className="inline-block px-6 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-primary-green-dark transition"
            >
              Browse Vegetables
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {favorites.map((veg) => (
              <VegetableCard key={veg.id} vegetable={veg} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
