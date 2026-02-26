import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase before importing the store
const mockSignOut = vi.fn().mockResolvedValue(undefined);
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getAuth: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
}));

import { useAuthStore } from './authStore';
import type { User } from '../types';

const mockUser: User = {
  id: 'u1',
  role: 'customer',
  name: 'Test User',
  phone: '9876543210',
};

const adminUser: User = {
  id: 'a1',
  role: 'admin',
  name: 'Admin',
  email: 'admin@test.com',
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: true });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
  });

  it('setUser stores user and sets authenticated', () => {
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('setUser works with admin user', () => {
    useAuthStore.getState().setUser(adminUser);
    const state = useAuthStore.getState();
    expect(state.user?.role).toBe('admin');
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears user and calls signOut', async () => {
    useAuthStore.getState().setUser(mockUser);
    await useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('user')).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });

  describe('initialize', () => {
    it('restores user from localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('user', 'not-valid-json');
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('does nothing when localStorage is empty', () => {
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('registers onAuthStateChanged listener', () => {
      useAuthStore.getState().initialize();
      expect(mockOnAuthStateChanged).toHaveBeenCalled();
    });

    it('onAuthStateChanged with no firebase user clears state', () => {
      useAuthStore.getState().setUser(mockUser);
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: null) => void) => {
          callback(null);
        }
      );
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('onAuthStateChanged with firebase user keeps existing user', () => {
      useAuthStore.getState().setUser(mockUser);
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: { uid: string }) => void) => {
          callback({ uid: 'firebase-uid' });
        }
      );
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
    });

    it('onAuthStateChanged with firebase user but no local user sets loading false', () => {
      mockOnAuthStateChanged.mockImplementation(
        (_auth: unknown, callback: (user: { uid: string }) => void) => {
          callback({ uid: 'firebase-uid' });
        }
      );
      useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
