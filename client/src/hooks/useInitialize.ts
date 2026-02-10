import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

export function useInitialize() {
  const initAuth = useAuthStore((s) => s.initialize);
  const initCart = useCartStore((s) => s.initialize);

  useEffect(() => {
    initAuth();
    initCart();
  }, [initAuth, initCart]);
}
