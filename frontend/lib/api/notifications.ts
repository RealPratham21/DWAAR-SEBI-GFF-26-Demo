import { apiRequest } from '@/lib/api/client';
import type {
  MarkAllReadResponse,
  NotificationsListResponse,
  UserNotification,
} from '@/lib/notifications/types';

export async function fetchNotifications(limit = 20): Promise<NotificationsListResponse> {
  return apiRequest<NotificationsListResponse>(`/notifications?limit=${limit}`, {
    method: 'GET',
  });
}

export async function markNotificationRead(notificationId: string): Promise<UserNotification> {
  return apiRequest<UserNotification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  return apiRequest<MarkAllReadResponse>('/notifications/read-all', {
    method: 'PATCH',
  });
}
