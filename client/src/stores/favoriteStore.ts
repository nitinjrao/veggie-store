import { create } from 'zustand';
import { favoriteService } from '../services/favoriteService';

interface FavoriteState {
  ids: Set<string>;
  loaded: boolean;
  toggle: (vegetableId: string) => void;
  load: () => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  ids: new Set<string>(),
  loaded: false,

  load: async () => {
    try {
      const ids = await favoriteService.getIds();
      set({ ids: new Set(ids), loaded: true });
    } catch {
      // Not logged in or error — just skip
      set({ loaded: true });
    }
  },

  toggle: async (vegetableId: string) => {
    const { ids } = get();
    const isFav = ids.has(vegetableId);

    // Optimistic update
    const newIds = new Set(ids);
    if (isFav) {
      newIds.delete(vegetableId);
    } else {
      newIds.add(vegetableId);
    }
    set({ ids: newIds });

    try {
      if (isFav) {
        await favoriteService.remove(vegetableId);
      } else {
        await favoriteService.add(vegetableId);
      }
    } catch {
      // Revert on error
      set({ ids });
    }
  },
}));
