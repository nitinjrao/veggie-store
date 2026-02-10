import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { useFavoriteStore } from '../stores/favoriteStore';

export function useInitialize() {
  const initAuth = useAuthStore((s) => s.initialize);
  const initCart = useCartStore((s) => s.initialize);
  const loadFavorites = useFavoriteStore((s) => s.load);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initAuth();
    initCart();
  }, [initAuth, initCart]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);
}
