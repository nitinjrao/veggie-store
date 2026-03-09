import api from './api';

export const transporterService = {
  getDashboard: () => api.get('/transporter/dashboard').then((r) => r.data),

  getAvailableOrders: () => api.get('/transporter/orders/available').then((r) => r.data),

  getMyOrders: (filter?: 'active' | 'completed' | 'in_transit') =>
    api.get('/transporter/orders/mine', { params: { filter } }).then((r) => r.data),

  claimOrder: (id: string) => api.post(`/transporter/orders/${id}/claim`).then((r) => r.data),

  markPickedUp: (id: string) =>
    api.patch(`/transporter/orders/${id}/pickup`).then((r) => r.data),

  deliverOrder: (id: string) =>
    api.patch(`/transporter/orders/${id}/deliver`).then((r) => r.data),

  getLoadingChecklist: (id: string) =>
    api.get(`/transporter/orders/${id}/loading-checklist`).then((r) => r.data),
};
