import api from './api';
import type { Vegetable } from '../types';

export const favoriteService = {
  getAll: () => api.get<Vegetable[]>('/favorites').then((r) => r.data),

  getIds: () => api.get<string[]>('/favorites/ids').then((r) => r.data),

  add: (vegetableId: string) =>
    api.post(`/favorites/${vegetableId}`).then((r) => r.data),

  remove: (vegetableId: string) =>
    api.delete(`/favorites/${vegetableId}`).then((r) => r.data),
};
