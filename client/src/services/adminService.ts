import api from './api';
import type { Vegetable, Category, Order, OrderStatus } from '../types';

export interface DashboardStats {
  totalVegetables: number;
  totalCategories: number;
  ordersToday: number;
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
  }[];
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
    packetWeight?: number;
  };
}

export const adminService = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/admin/dashboard/stats').then((r) => r.data),

  listVegetables: () =>
    api.get<Vegetable[]>('/admin/vegetables').then((r) => r.data),

  createVegetable: (data: VegetableFormData) =>
    api.post<Vegetable>('/admin/vegetables', data).then((r) => r.data),

  updateVegetable: (id: string, data: Partial<VegetableFormData>) =>
    api.put<Vegetable>(`/admin/vegetables/${id}`, data).then((r) => r.data),

  deleteVegetable: (id: string) =>
    api.delete(`/admin/vegetables/${id}`).then((r) => r.data),

  getCategories: () =>
    api.get<Category[]>('/categories').then((r) => r.data),

  // Orders
  listOrders: (params?: { page?: number; status?: string; search?: string }) =>
    api
      .get<AdminOrdersResponse>('/admin/orders', { params })
      .then((r) => r.data),

  getOrder: (id: string) =>
    api.get<AdminOrder>(`/admin/orders/${id}`).then((r) => r.data),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    api.put<AdminOrder>(`/admin/orders/${id}/status`, { status }).then((r) => r.data),

  // Customers
  listCustomers: (params?: { page?: number; search?: string }) =>
    api.get<AdminCustomersResponse>('/admin/customers', { params }).then((r) => r.data),

  getCustomer: (id: string) =>
    api.get<any>(`/admin/customers/${id}`).then((r) => r.data),
};

export interface AdminOrdersResponse {
  orders: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string | null; phone: string };
  _count: { items: number };
}

export interface AdminOrder extends Order {
  customer: { id: string; name: string | null; phone: string; address: string | null };
}

export interface AdminCustomersResponse {
  customers: {
    id: string;
    name: string | null;
    phone: string;
    createdAt: string;
    _count: { orders: number };
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
