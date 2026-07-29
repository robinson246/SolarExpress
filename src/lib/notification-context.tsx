'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './auth-context';

export interface NotificationItem {
  _id: string;
  type: 'welcome' | 'promotion' | 'transaction';
  message: string;
  read: boolean;
  dismissed?: boolean;
  tokenId?: number;
  txHash?: string;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismissPromotion: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  dismissPromotion: async () => {},
  refresh: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', credentials: 'include' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH', credentials: 'include' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissPromotion = async (id: string) => {
    await fetch(`/api/notifications/${id}/dismiss`, { method: 'PATCH', credentials: 'include' });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, dismissed: true } : n));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, markRead, markAllRead, dismissPromotion, refresh: fetchNotifs }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
