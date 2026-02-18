import { create } from 'zustand';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  initialize: () => {
    // Restore user from localStorage to avoid flicker
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('user');
      }
    }

    // Listen for Firebase auth state changes
    onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase user signed out
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Firebase user is signed in — keep existing user data from localStorage
        // The actual user profile was set during login via setUser()
        const { user } = get();
        if (!user) {
          // Edge case: Firebase is signed in but localStorage was cleared
          // User will need to re-login via the backend
          set({ isLoading: false });
        } else {
          set({ isLoading: false });
        }
      }
    });
  },
}));
