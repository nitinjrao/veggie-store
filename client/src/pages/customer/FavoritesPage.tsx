import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, ArrowRight } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 rounded-xl hover:bg-gray-100 text-text-muted transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
            <h1 className="font-heading font-bold text-xl">My Favorites</h1>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <Heart className="w-12 h-12 text-red-200" />
            </div>
            <h2 className="text-lg font-bold text-text-dark mb-2">Login to see your favorites</h2>
            <p className="text-text-muted mb-8">Save your favorite vegetables for quick access</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
            >
              Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Heart className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-text-dark mb-2">No favorites yet</h2>
            <p className="text-text-muted mb-8">Tap the heart on any vegetable to save it here</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-green text-white font-medium hover:shadow-glow-green transition-all active:scale-95"
            >
              Browse Vegetables
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-children">
            {favorites.map((veg) => (
              <VegetableCard key={veg.id} vegetable={veg} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
