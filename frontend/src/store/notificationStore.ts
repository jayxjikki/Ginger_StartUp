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

const resolveNotificationActors = async (rawNotifs: any[]): Promise<Notification[]> => {
  if (!rawNotifs || rawNotifs.length === 0) return [];

  const needsActorIds = Array.from(
    new Set(
      rawNotifs
        .filter((n) => n.actor_id && (!n.actor || typeof n.actor !== 'object' || !n.actor.full_name))
        .map((n) => n.actor_id)
    )
  ) as string[];

  let profilesMap: Record<string, { full_name: string; username: string; avatar_url: string }> = {};

  if (needsActorIds.length > 0) {
    try {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', needsActorIds);

      if (profs) {
        profs.forEach((p) => {
          profilesMap[p.id] = {
            full_name: p.full_name || 'Someone',
            username: p.username || '',
            avatar_url: p.avatar_url || '',
          };
        });
      }
    } catch (err) {
      console.warn('Could not batch load notification actors:', err);
    }
  }

  return rawNotifs.map((n) => {
    const joinedActor = n.actor && typeof n.actor === 'object' && n.actor.full_name ? n.actor : undefined;
    const resolvedActor = n.actor_id ? profilesMap[n.actor_id] || joinedActor : undefined;
    return {
      ...n,
      actor: resolvedActor || joinedActor,
    } as Notification;
  });
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      let rawNotifs = data || [];

      // Auto-sync any approved submissions for this user into notifications
      try {
        const { data: approvedSubs } = await supabase
          .from('submissions')
          .select('id, campaign_id, voucher_code, status, verified_at, submitted_at, campaign:campaigns(id, title, advertiser_id)')
          .eq('creator_id', userId)
          .in('status', ['verified', 'paid']);

        if (approvedSubs && approvedSubs.length > 0) {
          for (const sub of approvedSubs) {
            const vCode = sub.voucher_code || 'VCH-ACTIVE';
            const contentText = `Your video was approved and voucher code ${vCode} was generated.`;
            const existingIdx = rawNotifs.findIndex(
              (n: any) => n.content && (n.content.includes(vCode) || (n.entity_id === sub.campaign_id && n.content.toLowerCase().includes('approved')))
            );
            if (existingIdx === -1) {
              // Persist into database in background
              (async () => {
                try {
                  await supabase.from('notifications').insert({
                    user_id: userId,
                    actor_id: (sub.campaign as any)?.advertiser_id || null,
                    type: 'system',
                    entity_id: sub.campaign_id,
                    content: contentText,
                  });
                } catch (e) {
                  console.warn('Silent insert error:', e);
                }
              })();

              rawNotifs.unshift({
                id: `sub-approved-${sub.id}`,
                user_id: userId,
                actor_id: (sub.campaign as any)?.advertiser_id || null,
                type: 'system',
                entity_id: sub.campaign_id,
                content: contentText,
                is_read: false,
                created_at: sub.verified_at || sub.submitted_at || new Date().toISOString()
              });
            } else {
              // Normalize existing notification content to the clean text and ensure entity_id is set
              rawNotifs[existingIdx].content = contentText;
              if (!rawNotifs[existingIdx].entity_id) {
                rawNotifs[existingIdx].entity_id = sub.campaign_id;
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Could not sync approved submission notifications:', syncErr);
      }

      const notifications = await resolveNotificationActors(rawNotifs);
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
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            const [resolved] = await resolveNotificationActors([data]);
            set(state => ({
              notifications: [resolved, ...state.notifications],
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
