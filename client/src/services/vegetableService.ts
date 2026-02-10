import api from './api';
import type { Vegetable, Category } from '../types';

export const vegetableService = {
  getAll: () => api.get<Vegetable[]>('/vegetables').then((r) => r.data),

  getById: (id: string) => api.get<Vegetable>(`/vegetables/${id}`).then((r) => r.data),

  getByCategory: (categoryId: string) =>
    api.get<Vegetable[]>(`/vegetables/category/${categoryId}`).then((r) => r.data),

  search: (query: string) =>
    api.get<Vegetable[]>(`/vegetables/search?q=${encodeURIComponent(query)}`).then((r) => r.data),

  getCategories: () => api.get<Category[]>('/categories').then((r) => r.data),
};
