import api from './api';
import type { Order, OrdersResponse, PlaceOrderPayload } from '../types';

export const orderService = {
  placeOrder: async (payload: PlaceOrderPayload): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', payload);
    return data;
  },

  getMyOrders: async (page = 1, limit = 10): Promise<OrdersResponse> => {
    const { data } = await api.get<OrdersResponse>('/orders', { params: { page, limit } });
    return data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
};
