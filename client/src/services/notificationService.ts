import api from './api';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: (params?: { page?: number; limit?: number }) =>
    api
      .get<{ notifications: Notification[]; total: number; page: number; totalPages: number }>(
        '/notifications',
        { params }
      )
      .then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string) =>
    api.put<Notification>(`/notifications/${id}/read`).then((r) => r.data),
};
