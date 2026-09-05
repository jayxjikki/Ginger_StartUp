import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { normalizeSubmission, isDirectDiscountSubmission } from '../utils/submissionHelpers';
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

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    try {
      let rawNotifs: any[] = [];
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data) {
          rawNotifs = [...data];
        }
      } catch (err) {
        console.warn('Direct notifications fetch warning:', err);
      }

      // Merge local notifications queue
      try {
        const localData = JSON.parse(localStorage.getItem(`ginger_local_notifications_${userId}`) || '[]');
        if (Array.isArray(localData)) {
          localData.forEach((ln: any) => {
            if (!rawNotifs.some(n => n.id === ln.id || (n.content === ln.content && n.entity_id === ln.entity_id))) {
              rawNotifs.push(ln);
            }
          });
        }
      } catch (_) {}

      // Auto-sync any approved or billed submissions for this user into notifications
      try {
        const { data: userSubs, error: subsErr } = await supabase
          .from('submissions')
          .select('id, campaign_id, video_id, status, earned_amount, verified_at, submitted_at, campaign:campaigns(id, title, advertiser_id)')
          .eq('creator_id', userId)
          .in('status', ['verified', 'paid']);

        if (!subsErr && userSubs && userSubs.length > 0) {
          for (const rawSub of userSubs) {
            const sub = normalizeSubmission(rawSub);
            const campaignTitle = (sub.campaign as any)?.title || 'Campaign';
            const vCode = sub.voucher_code || 'VCH-ACTIVE';

            // 1. If bill details exist, synthesize a Bill Received notification
            if (sub.voucher_details?.bill_amount) {
              const billContent = `🧾 Bill Received from "${campaignTitle}"! Original Bill: ₹${Number(sub.voucher_details.bill_amount).toLocaleString()} | Discount: ${sub.voucher_details.discount_percent}% (-₹${Number(sub.voucher_details.discount_amount).toLocaleString()}) | Final Amount to Pay: ₹${Number(sub.voucher_details.final_payable).toLocaleString()}${sub.voucher_details.note ? ` (${sub.voucher_details.note})` : ''}`;
              const billNotifId = `sub-bill-${sub.id}`;
              const exists = rawNotifs.some(n => n.id === billNotifId || (n.content && n.content.includes('🧾') && n.entity_id === sub.campaign_id));
              if (!exists) {
                rawNotifs.push({
                  id: billNotifId,
                  user_id: userId,
                  actor_id: (sub.campaign as any)?.advertiser_id || null,
                  type: 'system',
                  entity_id: sub.campaign_id,
                  content: billContent,
                  is_read: false,
                  created_at: sub.voucher_details?.billed_at || sub.verified_at || new Date().toISOString()
                });
              }
            }

            // 2. Voucher or Approval notification
            let contentText = '';
            if (sub.voucher_details?.is_custom_reward || sub.voucher_details?.reward_type === 'custom_message' || sub.voucher_details?.custom_message) {
              contentText = `🎁 Reward Issued: "${sub.voucher_details?.custom_message || 'Custom Reward'}"! Your voucher code is ${vCode} for "${campaignTitle}". Present this voucher code to claim your reward!`;
            } else if (isDirectDiscountSubmission(sub) || sub.voucher_code) {
              const disc = sub.discount_percent || sub.voucher_details?.discount_percent || 20;
              contentText = `🎟️ Voucher Issued: Your submission on "${campaignTitle}" was approved! Your voucher code is ${vCode} (${disc}% OFF).`;
            } else {
              contentText = `✅ Submission Approved: Your submission on "${campaignTitle}" was approved!`;
            }

            const voucherNotifId = `sub-approved-${sub.id}`;
            const existingIdx = rawNotifs.findIndex(
              (n: any) => n.id === voucherNotifId || (n.content && (n.content.includes(vCode) || (n.entity_id === sub.campaign_id && (n.content.includes('approved') || n.content.includes('Reward Issued') || n.content.includes('Voucher Issued')))))
            );

            if (existingIdx === -1) {
              rawNotifs.push({
                id: voucherNotifId,
                user_id: userId,
                actor_id: (sub.campaign as any)?.advertiser_id || null,
                type: 'system',
                entity_id: sub.campaign_id,
                content: contentText,
                is_read: false,
                created_at: sub.verified_at || sub.submitted_at || new Date().toISOString()
              });
            } else {
              // Update content if it was a generic placeholder
              if (rawNotifs[existingIdx].content.includes('Your video was approved') && contentText.includes('🎁')) {
                rawNotifs[existingIdx].content = contentText;
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Could not sync approved submission notifications:', syncErr);
      }

      // Sort rawNotifs by created_at descending
      rawNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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

      // Update local storage if present
      try {
        const notifObj = get().notifications.find(n => n.id === notificationId);
        const userId = notifObj?.user_id;
        if (userId) {
          const key = `ginger_local_notifications_${userId}`;
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = list.map((n: any) => n.id === notificationId ? { ...n, is_read: true } : n);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (_) {}

      if (!notificationId.startsWith('local-notif-') && !notificationId.startsWith('sub-')) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      }
    } catch (err) {
      console.warn('Error marking notification as read:', err);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      // Optimistic update
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));

      try {
        const key = `ginger_local_notifications_${userId}`;
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = list.map((n: any) => ({ ...n, is_read: true }));
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (_) {}

      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
      } catch (_) {}
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
  },

  subscribeToNotifications: (userId: string) => {
    if (notificationSubscription) {
      supabase.removeChannel(notificationSubscription);
    }

    notificationSubscription = supabase
      .channel('public:notifications_and_events')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `creator_id=eq.${userId}`
        },
        () => {
          // Instant notification sync whenever user's submission is approved or billed
          get().fetchNotifications(userId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new?.content && (payload.new.content.includes('🧾') || payload.new.content.includes('🎟️') || payload.new.content.includes('🎁'))) {
            get().fetchNotifications(userId);
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
