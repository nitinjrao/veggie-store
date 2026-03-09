import api from './api';
import type { Vegetable } from '../types';

export const fridgeService = {
  getLocations: () => api.get('/fridge/locations').then((r) => r.data),
  getFridgeInventory: (id: string) => api.get(`/fridge/fridges/${id}`).then((r) => r.data),
  placePickupOrder: (data: {
    refrigeratorId?: string;
    orderType?: string;
    addressId?: string;
    items: { vegetableId: string; quantity: number; unit: string }[];
  }) => api.post('/fridge/pickup-orders', data).then((r) => r.data),
  getMyPickupOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/fridge/pickup-orders', { params }).then((r) => r.data),
  getPickupOrder: (id: string) => api.get(`/fridge/pickup-orders/${id}`).then((r) => r.data),
  markOrderPaid: (id: string, data: { method: string; reference?: string }) =>
    api.put(`/fridge/pickup-orders/${id}/mark-paid`, data).then((r) => r.data),
  uploadPaymentScreenshot: (id: string, file: File, method: string, reference?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('method', method);
    if (reference) formData.append('reference', reference);
    return api
      .post(`/fridge/pickup-orders/${id}/payment-screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  getWarehouseVegetables: () =>
    api.get<Vegetable[]>('/vegetables/warehouse-available').then((r) => r.data),
};
