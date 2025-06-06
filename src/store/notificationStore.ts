import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Fetch notifications from Supabase
      // This is a placeholder - implement actual notification fetching logic
      set({ 
        notifications: [], 
        unreadCount: 0,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: 'Failed to load notifications', isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      // Mark notification as read in Supabase
      // This is a placeholder - implement actual marking logic
      const notifications = get().notifications.map(notification =>
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      set({ 
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
}));