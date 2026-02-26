import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetIds = vi.fn();
const mockAdd = vi.fn();
const mockRemove = vi.fn();

vi.mock('../services/favoriteService', () => ({
  favoriteService: {
    getIds: () => mockGetIds(),
    add: (id: string) => mockAdd(id),
    remove: (id: string) => mockRemove(id),
  },
}));

import { useFavoriteStore } from './favoriteStore';

describe('favoriteStore', () => {
  beforeEach(() => {
    useFavoriteStore.setState({ ids: new Set(), loaded: false });
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useFavoriteStore.getState();
    expect(state.ids.size).toBe(0);
    expect(state.loaded).toBe(false);
  });

  describe('load', () => {
    it('loads favorite ids from service', async () => {
      mockGetIds.mockResolvedValue(['v1', 'v2', 'v3']);
      await useFavoriteStore.getState().load();
      const state = useFavoriteStore.getState();
      expect(state.ids.size).toBe(3);
      expect(state.ids.has('v1')).toBe(true);
      expect(state.ids.has('v2')).toBe(true);
      expect(state.ids.has('v3')).toBe(true);
      expect(state.loaded).toBe(true);
    });

    it('handles empty favorites', async () => {
      mockGetIds.mockResolvedValue([]);
      await useFavoriteStore.getState().load();
      const state = useFavoriteStore.getState();
      expect(state.ids.size).toBe(0);
      expect(state.loaded).toBe(true);
    });

    it('handles service error gracefully', async () => {
      mockGetIds.mockRejectedValue(new Error('Network error'));
      await useFavoriteStore.getState().load();
      const state = useFavoriteStore.getState();
      expect(state.ids.size).toBe(0);
      expect(state.loaded).toBe(true);
    });
  });

  describe('toggle', () => {
    it('adds a favorite optimistically', async () => {
      mockAdd.mockResolvedValue(undefined);
      await useFavoriteStore.getState().toggle('v1');
      const state = useFavoriteStore.getState();
      expect(state.ids.has('v1')).toBe(true);
      expect(mockAdd).toHaveBeenCalledWith('v1');
    });

    it('removes a favorite optimistically', async () => {
      useFavoriteStore.setState({ ids: new Set(['v1', 'v2']) });
      mockRemove.mockResolvedValue(undefined);
      await useFavoriteStore.getState().toggle('v1');
      const state = useFavoriteStore.getState();
      expect(state.ids.has('v1')).toBe(false);
      expect(state.ids.has('v2')).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith('v1');
    });

    it('reverts on add error', async () => {
      mockAdd.mockRejectedValue(new Error('Failed'));
      await useFavoriteStore.getState().toggle('v1');
      const state = useFavoriteStore.getState();
      expect(state.ids.has('v1')).toBe(false);
    });

    it('reverts on remove error', async () => {
      useFavoriteStore.setState({ ids: new Set(['v1']) });
      mockRemove.mockRejectedValue(new Error('Failed'));
      await useFavoriteStore.getState().toggle('v1');
      const state = useFavoriteStore.getState();
      expect(state.ids.has('v1')).toBe(true);
    });
  });
});
