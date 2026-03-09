import api from './api';

export const producerService = {
  // Fridges
  listFridges: () => api.get('/producer/fridges').then((r) => r.data),
  getFridgeInventory: (id: string) =>
    api.get(`/producer/fridges/${id}/inventory`).then((r) => r.data),
  loadFridge: (id: string, items: { vegetableId: string; quantity: number; note?: string }[]) =>
    api.post(`/producer/fridges/${id}/load`, { items }).then((r) => r.data),
  getMyTransactions: (params?: { page?: number; limit?: number }) =>
    api.get('/producer/fridges/transactions/mine', { params }).then((r) => r.data),

  // Orders
  getOrderSummary: () => api.get('/producer/fridges/orders/summary').then((r) => r.data),
  getPendingOrders: () => api.get('/producer/fridges/orders/pending').then((r) => r.data),
  confirmOrder: (id: string) =>
    api.put(`/producer/fridges/orders/${id}/confirm`).then((r) => r.data),
  markOrderReady: (id: string) =>
    api.put(`/producer/fridges/orders/${id}/ready`).then((r) => r.data),

  // All orders
  getAllOrders: (status?: string) =>
    api.get('/producer/fridges/orders/all', { params: status ? { status } : {} }).then((r) => r.data),

  // Procurement view (cumulative from PENDING + CONFIRMED)
  getProcurementView: () => api.get('/producer/fridges/orders/procurement').then((r) => r.data),

  // Packing views
  getCumulativeView: () => api.get('/producer/orders/cumulative').then((r) => r.data),
  getAssemblyView: () => api.get('/producer/orders/assembly').then((r) => r.data),
};
