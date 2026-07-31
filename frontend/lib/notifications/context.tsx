'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import { useAuth } from '@/lib/auth/context';
import type { UserNotification } from '@/lib/notifications/types';

interface NotificationContextValue {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  prependNotification: (notification: UserNotification) => void;
  markRead: (notificationId: string) => Promise<UserNotification | null>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearState = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setError(null);
    setIsLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      clearState();
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchNotifications();
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch {
      setError('Unable to load notifications.');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [clearState, isAuthenticated]);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }
    if (!isAuthenticated) {
      clearState();
      return;
    }
    void refresh();
  }, [clearState, isAuthenticated, isRestoringSession, refresh]);

  const prependNotification = useCallback((notification: UserNotification) => {
    setNotifications((current) => {
      const existing = current.find((item) => item.id === notification.id);
      if (!notification.readAt && !existing) {
        setUnreadCount((count) => count + 1);
      }
      return [notification, ...current.filter((item) => item.id !== notification.id)];
    });
  }, []);

  const markRead = useCallback(async (notificationId: string) => {
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((current) => {
        const previous = current.find((item) => item.id === notificationId);
        const wasUnread = Boolean(previous && !previous.readAt);
        if (wasUnread) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return current.map((item) => (item.id === updated.id ? updated : item));
      });
      return updated;
    } catch {
      setError('Unable to update notification.');
      return null;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => (item.readAt ? item : { ...item, readAt: now })),
      );
      setUnreadCount(0);
    } catch {
      setError('Unable to mark notifications as read.');
    }
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      prependNotification,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      refresh,
      prependNotification,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function useOptionalNotifications() {
  return useContext(NotificationContext);
}
