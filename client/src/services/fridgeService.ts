import api from './api';

export const fridgeService = {
  getLocations: () => api.get('/fridge/locations').then((r) => r.data),
  getFridgeInventory: (id: string) => api.get(`/fridge/fridges/${id}`).then((r) => r.data),
  placePickupOrder: (data: {
    refrigeratorId: string;
    items: { vegetableId: string; quantity: number; unit: string }[];
  }) => api.post('/fridge/pickup-orders', data).then((r) => r.data),
  getMyPickupOrders: (params?: { page?: number; limit?: number }) =>
    api.get('/fridge/pickup-orders', { params }).then((r) => r.data),
  getPickupOrder: (id: string) => api.get(`/fridge/pickup-orders/${id}`).then((r) => r.data),
  markOrderPaid: (id: string, data: { method: string; reference?: string }) =>
    api.put(`/fridge/pickup-orders/${id}/mark-paid`, data).then((r) => r.data),
};
