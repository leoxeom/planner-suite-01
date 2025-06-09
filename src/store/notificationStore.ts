import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Types basés sur la structure de la table notifications dans Supabase
export type NotificationType = 
  | 'replacement_request'
  | 'event_update'
  | 'event_cancelled'
  | 'team_validated'
  | 'request_approved'
  | 'request_rejected';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  related_event_id?: string;
  related_request_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch notifications from Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.is_read).length;
      
      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ 
        error: 'Impossible de charger les notifications', 
        isLoading: false 
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      // Mark notification as read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      const notifications = get().notifications.map(notification =>
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      );
      
      set({ 
        notifications,
        unreadCount: notifications.filter(n => !n.is_read).length
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      set({ error: 'Impossible de marquer la notification comme lue' });
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      // Mark all notifications as read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      
      // Update local state
      const notifications = get().notifications.map(notification => ({
        ...notification,
        is_read: true
      }));
      
      set({ 
        notifications,
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({ error: 'Impossible de marquer toutes les notifications comme lues' });
    }
  }
}));
