import api from './api';
import type { Address } from '../types';

export const addressService = {
  getAll: async (): Promise<Address[]> => {
    const { data } = await api.get<Address[]>('/addresses');
    return data;
  },

  create: async (payload: { label: string; text: string; isDefault?: boolean }): Promise<Address> => {
    const { data } = await api.post<Address>('/addresses', payload);
    return data;
  },

  update: async (id: string, payload: { label?: string; text?: string; isDefault?: boolean }): Promise<Address> => {
    const { data } = await api.patch<Address>(`/addresses/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },
};
