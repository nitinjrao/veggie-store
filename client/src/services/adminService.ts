import api from './api';
import type { Vegetable, Category } from '../types';

export interface DashboardFridgeHealth {
  id: string;
  name: string;
  location: string;
  totalItems: number;
  lowStockCount: number;
  totalStock: number;
  producers: { id: string; name: string }[];
  pendingOrders: number;
  confirmedOrders: number;
  readyOrders: number;
  health: 'healthy' | 'warning' | 'critical';
}

export interface DashboardStaffActivity {
  id: string;
  name: string;
  role: string;
  assignedFridges: string[];
  ordersConfirmedToday: number;
  ordersReadyToday: number;
  totalActionsToday: number;
}

export interface DashboardAttentionItem {
  type: string;
  message: string;
  severity: 'critical' | 'warning';
}

export interface DashboardStats {
  totalVegetables: number;
  totalCategories: number;
  ordersToday: number;
  pendingOrderCount: number;
  confirmedOrderCount: number;
  readyOrderCount: number;
  revenueToday: string;
  totalCustomers: number;
  totalActiveFridges: number;
  totalActiveStaff: number;
  totalRevenue: string;
  pickedUpToday: number;
  lowStockItems: {
    id: string;
    name: string;
    emoji: string | null;
    stockKg: string;
    minStockAlert: string;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    customer: { name: string | null; phone: string };
    _count: { items: number };
    refrigerator?: { name: string; location?: { name: string } };
    assignedTo?: { id: string; name: string } | null;
  }[];
  fridgeHealth: DashboardFridgeHealth[];
  staffActivity: DashboardStaffActivity[];
  attentionItems: DashboardAttentionItem[];
}

export interface VegetableFormData {
  name: string;
  nameHindi?: string;
  nameKannada?: string;
  emoji?: string;
  description?: string;
  image?: string;
  categoryId: string;
  available?: boolean;
  stockKg?: number;
  minStockAlert?: number;
  price?: {
    pricePerKg?: number;
    pricePerPiece?: number;
    pricePerPacket?: number;
    pricePerBundle?: number;
    pricePerBunch?: number;
    packetWeight?: number;
  };
}

export const adminService = {
  getDashboardStats: () => api.get<DashboardStats>('/admin/dashboard/stats').then((r) => r.data),

  listVegetables: () => api.get<Vegetable[]>('/admin/vegetables').then((r) => r.data),

  createVegetable: (data: VegetableFormData) =>
    api.post<Vegetable>('/admin/vegetables', data).then((r) => r.data),

  updateVegetable: (id: string, data: Partial<VegetableFormData>) =>
    api.put<Vegetable>(`/admin/vegetables/${id}`, data).then((r) => r.data),

  deleteVegetable: (id: string) => api.delete(`/admin/vegetables/${id}`).then((r) => r.data),

  getCategories: () => api.get<Category[]>('/categories').then((r) => r.data),

  // Admin Categories
  listCategories: () => api.get<AdminCategory[]>('/admin/categories').then((r) => r.data),

  createCategory: (data: CategoryFormData) =>
    api.post<AdminCategory>('/admin/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: Partial<CategoryFormData>) =>
    api.put<AdminCategory>(`/admin/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`).then((r) => r.data),

  // Image upload
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post<{ url: string }>('/admin/vegetables/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.url;
  },

  // Price history
  getPriceHistory: (vegetableId: string) =>
    api
      .get<PriceHistoryItem[]>(`/admin/vegetables/${vegetableId}/price-history`)
      .then((r) => r.data),

  // Bulk stock
  bulkUpdateStock: (updates: { id: string; stockKg: number }[]) =>
    api.put<Vegetable[]>('/admin/vegetables/bulk-stock', { updates }).then((r) => r.data),

  // Customers
  listCustomers: (params?: { page?: number; search?: string }) =>
    api.get<AdminCustomersResponse>('/admin/customers', { params }).then((r) => r.data),

  getCustomer: (id: string) =>
    api.get<AdminCustomerDetail>(`/admin/customers/${id}`).then((r) => r.data),

  // Staff management
  listStaff: (params?: { role?: string; search?: string }) =>
    api.get('/admin/staff', { params }).then((r) => r.data),

  createStaff: (data: { name: string; email: string; phone?: string; role: string }) =>
    api.post('/admin/staff', data).then((r) => r.data),

  updateStaff: (
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string | null;
      role: string;
      active: boolean;
    }>
  ) => api.put(`/admin/staff/${id}`, data).then((r) => r.data),

  setStaffPassword: (id: string, password: string) =>
    api.put(`/admin/staff/${id}/password`, { password }).then((r) => r.data),

  deactivateStaff: (id: string) => api.delete(`/admin/staff/${id}`).then((r) => r.data),

  // Payments
  getPaymentSummary: (days?: number) =>
    api.get('/admin/payments/summary', { params: { days } }).then((r) => r.data),

  // Locations
  listLocations: () => api.get('/admin/locations').then((r) => r.data),
  createLocation: (data: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  }) => api.post('/admin/locations', data).then((r) => r.data),
  updateLocation: (
    id: string,
    data: Partial<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      active: boolean;
    }>
  ) => api.put(`/admin/locations/${id}`, data).then((r) => r.data),
  deleteLocation: (id: string) => api.delete(`/admin/locations/${id}`).then((r) => r.data),

  // Fridges
  listFridges: (params?: { locationId?: string; status?: string }) =>
    api.get('/admin/fridges', { params }).then((r) => r.data),
  createFridge: (data: { locationId: string; name: string }) =>
    api.post('/admin/fridges', data).then((r) => r.data),
  getFridge: (id: string) => api.get(`/admin/fridges/${id}`).then((r) => r.data),
  updateFridge: (id: string, data: Partial<{ name: string; status: string; locationId: string }>) =>
    api.put(`/admin/fridges/${id}`, data).then((r) => r.data),
  deleteFridge: (id: string) => api.delete(`/admin/fridges/${id}`).then((r) => r.data),
  updateFridgeInventory: (
    id: string,
    items: { vegetableId: string; quantityAvailable: number; minimumThreshold: number }[]
  ) => api.put(`/admin/fridges/${id}/inventory`, { items }).then((r) => r.data),
  getLowStockAlerts: () => api.get('/admin/fridges/alerts/low-stock').then((r) => r.data),

  // Fridge Orders
  listFridgeOrders: (params?: {
    page?: number;
    status?: string;
    paymentStatus?: string;
    refrigeratorId?: string;
    search?: string;
  }) => api.get('/admin/fridge-orders', { params }).then((r) => r.data),
  getFridgeOrder: (id: string) => api.get(`/admin/fridge-orders/${id}`).then((r) => r.data),
  updateFridgeOrderStatus: (id: string, status: string) =>
    api.put(`/admin/fridge-orders/${id}/status`, { status }).then((r) => r.data),
  logFridgePayment: (
    orderId: string,
    data: { amount: number; method: string; reference?: string; notes?: string }
  ) => api.post(`/admin/fridge-orders/${orderId}/payments`, data).then((r) => r.data),

  // Fridge Order - new fulfillment endpoints
  assignFridgeOrder: (orderId: string, staffId: string) =>
    api.put(`/admin/fridge-orders/${orderId}/assign`, { staffId }).then((r) => r.data),
  getFridgePendingCounts: () => api.get('/admin/fridge-orders/pending-counts').then((r) => r.data),
  getFridgeActiveOrders: (fridgeId: string) =>
    api.get(`/admin/fridge-orders/by-fridge/${fridgeId}`).then((r) => r.data),

  // Fridge producer assignments
  getFridgeProducers: (fridgeId: string) =>
    api.get(`/admin/fridges/${fridgeId}/producers`).then((r) => r.data),
  assignProducerToFridge: (fridgeId: string, staffId: string) =>
    api.post(`/admin/fridges/${fridgeId}/producers`, { staffId }).then((r) => r.data),
  unassignProducerFromFridge: (fridgeId: string, staffId: string) =>
    api.delete(`/admin/fridges/${fridgeId}/producers/${staffId}`).then((r) => r.data),
};

export interface AdminCategory {
  id: string;
  name: string;
  nameHindi: string | null;
  nameKannada: string | null;
  image: string | null;
  sortOrder: number;
  _count: { vegetables: number };
}

export interface CategoryFormData {
  name: string;
  nameHindi?: string;
  nameKannada?: string;
  image?: string;
  sortOrder?: number;
}

export interface PriceHistoryItem {
  id: string;
  vegetableId: string;
  oldPrice: string | null;
  newPrice: string;
  changedAt: string;
}

export interface AdminCustomerDetail {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  createdAt: string;
  fridgePickupOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    _count: { items: number };
    refrigerator?: { name: string; location?: { name: string } };
  }[];
  _count: { fridgePickupOrders: number; favorites: number };
  totalSpend: string;
}

export interface AdminCustomersResponse {
  customers: {
    id: string;
    name: string | null;
    phone: string;
    createdAt: string;
    _count: { fridgePickupOrders: number };
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
