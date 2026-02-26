import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFavoriteStore } from '../stores/favoriteStore';

export function useInitialize() {
  const initAuth = useAuthStore((s) => s.initialize);
  const loadFavorites = useFavoriteStore((s) => s.load);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);
}
