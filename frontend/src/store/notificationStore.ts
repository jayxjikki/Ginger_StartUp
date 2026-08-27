import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'system' | 'admin';
  entity_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
}

let notificationSubscription: ReturnType<typeof supabase.channel> | null = null;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.is_read).length;

      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      // Optimistic update
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      // Optimistic update
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  },

  subscribeToNotifications: (userId: string) => {
    if (notificationSubscription) {
      supabase.removeChannel(notificationSubscription);
    }

    notificationSubscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          // A new notification was received!
          // We fetch it specifically to get the nested actor details
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:profiles!actor_id (
                full_name,
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            set(state => ({
              notifications: [data as Notification, ...state.notifications],
              unreadCount: state.unreadCount + 1
            }));
            
            // Show toast notification
            toast.success('You have a new notification!', {
              icon: '🔔',
              style: {
                borderRadius: '10px',
                background: '#1d1f27',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              }
            });
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromNotifications: () => {
    if (notificationSubscription) {
      supabase.removeChannel(notificationSubscription);
      notificationSubscription = null;
    }
  }
}));
