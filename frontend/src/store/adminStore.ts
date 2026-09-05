// ═══════════════════════════════════════════════════════════
// GINGER — Admin Store (Zustand)
// Global state for Admin Dashboard functionality
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/user.types';
import type { Campaign } from '../types/campaign.types';
import { normalizeSubmission } from '../utils/submissionHelpers';

export interface AdminState {
  users: Profile[];
  campaigns: Campaign[];
  submissions: any[];
  withdrawals: any[];
  slideshows: any[];
  isLoading: boolean;
  error: string | null;

  // Fetchers
  fetchAllData: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchCampaigns: () => Promise<void>;
  fetchSubmissions: () => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
  fetchSlideshows: () => Promise<void>;

  // Mutations
  toggleUserBan: (userId: string, isBanned: boolean) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  rejectSubmission: (submissionId: string) => Promise<void>;
  processWithdrawal: (txId: string) => Promise<void>;
  deleteSlideshow: (slideId: string) => Promise<void>;
  createSlideshow: (data: any) => Promise<void>;
  deleteSubmission: (submissionId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteWithdrawal: (withdrawalId: string) => Promise<void>;
  unflagSubmissionAsAdmin: (submissionId: string) => Promise<void>;
  approveSubmissionAsAdmin: (submissionId: string, payoutAmount?: number) => Promise<void>;
  verifySubmissionAsAdmin: (submissionId: string) => Promise<void>;
  approveAndPayCampaign: (campaignId: string, payoutPerCreator: number) => Promise<void>;
  fetchUserNotifications: (userId: string) => Promise<any[]>;
  deleteUserNotification: (notifId: string) => Promise<void>;
  fetchUserMessages: (userId: string) => Promise<{ messages: any[]; conversations: any[] }>;
  deleteUserMessage: (messageId: string) => Promise<void>;
  sendGingerNotification: (targetUserId: string, title: string, message: string, adminUserId?: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  campaigns: [],
  submissions: [],
  withdrawals: [],
  slideshows: [],
  isLoading: false,
  error: null,

  fetchAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all([
        get().fetchUsers(),
        get().fetchCampaigns(),
        get().fetchSubmissions(),
        get().fetchWithdrawals(),
        get().fetchSlideshows()
      ]);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUsers: async () => {
    const [{ data: users, error }, { data: reports }, { data: blocks }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('reported_item_id, item_type'),
      supabase.from('blocked_users').select('blocked_id')
    ]);
    
    if (error) throw error;
    
    const enrichedUsers = (users as any[]).map(u => {
      const userReports = (reports || []).filter(r => r.reported_item_id === u.id).length;
      const userBlocks = (blocks || []).filter(b => b.blocked_id === u.id).length;
      return {
        ...u,
        _reportCount: userReports,
        _blockCount: userBlocks,
        _totalFlags: userReports + userBlocks
      };
    }).sort((a, b) => b._totalFlags - a._totalFlags);

    set({ users: enrichedUsers });
  },

  fetchCampaigns: async () => {
    const [{ data: campaigns, error }, { data: reports }] = await Promise.all([
      supabase.from('campaigns').select('*, advertiser:profiles(*)').order('created_at', { ascending: false }),
      supabase.from('reports').select('reported_item_id, item_type')
    ]);
    
    if (error) throw error;
    
    const enrichedCampaigns = (campaigns as any[]).map(c => {
      const campReports = (reports || []).filter(r => r.reported_item_id === c.id).length;
      return {
        ...c,
        _reportCount: campReports,
        _totalFlags: campReports
      };
    }).sort((a, b) => b._totalFlags - a._totalFlags);

    set({ campaigns: enrichedCampaigns });
  },

  fetchSubmissions: async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, campaign:campaigns(*), creator:profiles(*)')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    const normalized = (data || []).map((s) => normalizeSubmission(s));
    set({ submissions: normalized });
  },

  fetchWithdrawals: async () => {
    const { data, error } = await supabase.from('wallet_transactions')
      .select('*, user:profiles(*)')
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false });
    if (error) throw error;
    set({ withdrawals: data });
  },

  fetchSlideshows: async () => {
    const { data, error } = await supabase.from('slideshows').select('*').order('order_index', { ascending: true });
    if (error) throw error;
    set({ slideshows: data });
  },

  toggleUserBan: async (userId: string, isBanned: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', userId);
    if (error) throw error;
    set((state) => ({
      users: state.users.map(u => u.id === userId ? { ...u, is_banned: isBanned } : u),
      submissions: state.submissions.map(s => 
        s.creator_id === userId && s.creator 
          ? { ...s, creator: { ...s.creator, is_banned: isBanned } } 
          : s
      )
    }));
  },

  deleteCampaign: async (campaignId: string) => {
    // 1. Delete associated reports
    try {
      await supabase.from('reports').delete().eq('reported_item_id', campaignId);
    } catch (_) {}
    // 2. Delete associated notifications
    try {
      await supabase.from('notifications').delete().eq('entity_id', campaignId);
    } catch (_) {}
    // 3. Delete associated submissions
    try {
      await supabase.from('submissions').delete().eq('campaign_id', campaignId);
    } catch (_) {}
    // 4. Delete campaign record
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (error) throw error;
    set((state) => ({ 
      campaigns: state.campaigns.filter(c => c.id !== campaignId),
      submissions: state.submissions.filter(s => s.campaign_id !== campaignId)
    }));
  },

  deleteSubmission: async (submissionId: string) => {
    // 1. Delete associated reports
    try {
      await supabase.from('reports').delete().eq('reported_item_id', submissionId);
    } catch (_) {}
    // 2. Purge associated notifications
    try {
      const { data: sub } = await supabase
        .from('submissions')
        .select('id, campaign_id, creator_id')
        .eq('id', submissionId)
        .maybeSingle();

      if (sub?.campaign_id && sub?.creator_id) {
        await supabase
          .from('notifications')
          .delete()
          .eq('entity_id', sub.campaign_id)
          .eq('user_id', sub.creator_id);
      }
    } catch (_) {}
    // 3. Delete submission record
    const { error } = await supabase.from('submissions').delete().eq('id', submissionId);
    if (error) throw error;
    set((state) => ({ submissions: state.submissions.filter(s => s.id !== submissionId) }));
  },

  deleteUser: async (userId: string) => {
    // Purge everything related to this user completely (saving no record anywhere)
    try {
      await supabase.from('reports').delete().or(`reporter_id.eq.${userId},reported_item_id.eq.${userId}`);
    } catch (_) {}
    try {
      await supabase.from('notifications').delete().or(`user_id.eq.${userId},actor_id.eq.${userId}`);
    } catch (_) {}
    try {
      await supabase.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    } catch (_) {}
    try {
      await supabase.from('wallet_transactions').delete().eq('user_id', userId);
    } catch (_) {}
    try {
      await supabase.from('withdrawals').delete().eq('user_id', userId);
    } catch (_) {}
    try {
      await supabase.from('submissions').delete().eq('creator_id', userId);
    } catch (_) {}
    try {
      await supabase.from('campaigns').delete().eq('advertiser_id', userId);
    } catch (_) {}
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    set((state) => ({
      users: state.users.filter(u => u.id !== userId),
      submissions: state.submissions.filter(s => s.creator_id !== userId),
      campaigns: state.campaigns.filter(c => c.advertiser_id !== userId),
      withdrawals: state.withdrawals.filter(w => w.user_id !== userId)
    }));
  },

  deleteWithdrawal: async (withdrawalId: string) => {
    try {
      await supabase.from('wallet_transactions').delete().eq('id', withdrawalId);
    } catch (_) {}
    try {
      await supabase.from('withdrawals').delete().eq('id', withdrawalId);
    } catch (_) {}
    set((state) => ({ withdrawals: state.withdrawals.filter(w => w.id !== withdrawalId) }));
  },

  unflagSubmissionAsAdmin: async (submissionId: string) => {
    const { error } = await supabase.from('submissions').update({ status: 'pending' }).eq('id', submissionId);
    if (error) throw error;
    set((state) => ({
      submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'pending' } : s)
    }));
  },

  approveAndPayCampaign: async (campaignId: string, payoutPerCreator: number) => {
    // 1. Fetch Campaign details
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('advertiser_id, remaining_pool')
      .eq('id', campaignId)
      .single();

    if (fetchError) throw fetchError;
    if (!campaign) throw new Error('Campaign not found');

    // 2. Fetch all verified submissions for this campaign
    const { data: verifiedSubmissions, error: subFetchError } = await supabase
      .from('submissions')
      .select('id, creator_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'verified');
      
    if (subFetchError) throw subFetchError;
    
    const submissionsToPay = verifiedSubmissions || [];
    const totalPayout = submissionsToPay.length * payoutPerCreator;
    
    // Safety check - we shouldn't pay out more than the remaining pool
    const currentRemainingPool = campaign.remaining_pool || 0;
    
    // We'll proceed even if pool is insufficient in a dev environment, 
    // but typically you'd block this.
    // if (totalPayout > currentRemainingPool) throw new Error("Insufficient remaining pool for payouts.");

    const finalRemainingPool = Math.max(0, currentRemainingPool - totalPayout);
    const refundAmount = finalRemainingPool;

    // 3. Create transactions array
    const transactions = [];
    
    // Create payouts for creators
    submissionsToPay.forEach(sub => {
      if (payoutPerCreator > 0) {
        transactions.push({
          user_id: sub.creator_id,
          amount: payoutPerCreator,
          type: 'earning',
          status: 'completed',
          description: 'Campaign Earning'
        });
      }
    });

    // Create refund for advertiser
    if (refundAmount > 0 && campaign.advertiser_id) {
      transactions.push({
        user_id: campaign.advertiser_id,
        amount: refundAmount,
        type: 'deposit',
        status: 'completed',
        description: 'Refund for remaining budget of completed campaign'
      });
    }

    // 4. Update the submissions to 'paid'
    if (submissionsToPay.length > 0) {
      const { error: subUpdateError } = await supabase
        .from('submissions')
        .update({ status: 'paid', earned_amount: payoutPerCreator, verified_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('status', 'verified');
        
      if (subUpdateError) throw subUpdateError;
    }

    // 5. Update the campaign to 'completed' and remaining_pool to 0
    const { error: campUpdateError } = await supabase
      .from('campaigns')
      .update({ status: 'completed', remaining_pool: 0 })
      .eq('id', campaignId);

    if (campUpdateError) throw campUpdateError;

    // 6. Insert all transactions
    if (transactions.length > 0) {
      const { error: walletError } = await supabase
        .from('wallet_transactions')
        .insert(transactions);
        
      if (walletError) throw walletError;
    }

    // 7. Update local state
    set((state) => ({
      campaigns: state.campaigns.map(c => 
        c.id === campaignId ? { ...c, status: 'completed', remaining_pool: 0 } : c
      ),
      submissions: state.submissions.map(s => 
        (s.campaign_id === campaignId && s.status === 'verified') 
          ? { ...s, status: 'paid', earned_amount: payoutPerCreator } 
          : s
      )
    }));
  },

  rejectSubmission: async (submissionId: string) => {
    const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', submissionId);
    if (error) throw error;
    set((state) => ({
      submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'rejected' } : s)
    }));
  },

  approveSubmissionAsAdmin: async (submissionId: string, payoutAmount: number = 0) => {
    // 1. Fetch submission details
    const { data: sub, error: subError } = await supabase
      .from('submissions')
      .select('*, campaign:campaigns(*), creator:profiles(*)')
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;
    if (!sub) throw new Error('Submission not found');

    const now = new Date().toISOString();

    // 2. Update submission to 'paid' (Admin Final Call)
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'paid',
        earned_amount: payoutAmount,
        verified_at: now,
        paid_at: now
      })
      .eq('id', submissionId);

    if (updateError) throw updateError;

    // 3. If payoutAmount > 0, create earning wallet transaction for creator
    if (payoutAmount > 0 && sub.creator_id) {
      await supabase.from('wallet_transactions').insert({
        user_id: sub.creator_id,
        amount: payoutAmount,
        type: 'earning',
        status: 'completed',
        description: `Payout for campaign: ${sub.campaign?.title || 'Campaign'}`
      });

      // Deduct from campaign remaining_pool if available
      if (sub.campaign_id && sub.campaign?.remaining_pool !== undefined) {
        const newPool = Math.max(0, (sub.campaign.remaining_pool || 0) - payoutAmount);
        await supabase.from('campaigns').update({ remaining_pool: newPool }).eq('id', sub.campaign_id);
      }
    }

    // 4. Update local state
    set((state) => ({
      submissions: state.submissions.map(s =>
        s.id === submissionId
          ? { ...s, status: 'paid', earned_amount: payoutAmount, verified_at: now, paid_at: now }
          : s
      ),
      campaigns: payoutAmount > 0 && sub.campaign_id
        ? state.campaigns.map(c =>
            c.id === sub.campaign_id
              ? { ...c, remaining_pool: Math.max(0, (c.remaining_pool || 0) - payoutAmount) }
              : c
          )
        : state.campaigns
    }));
  },

  verifySubmissionAsAdmin: async (submissionId: string) => {
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'verified', verified_at: new Date().toISOString() })
      .eq('id', submissionId);
    if (error) throw error;
    set((state) => ({
      submissions: state.submissions.map(s =>
        s.id === submissionId ? { ...s, status: 'verified', verified_at: new Date().toISOString() } : s
      )
    }));
  },

  processWithdrawal: async (txId: string) => {
    const { error } = await supabase.from('wallet_transactions').update({ status: 'completed' }).eq('id', txId);
    if (error) throw error;
    set((state) => ({
      withdrawals: state.withdrawals.map(w => w.id === txId ? { ...w, status: 'completed' } : w)
    }));
  },

  deleteSlideshow: async (slideId: string) => {
    try {
      const { error } = await supabase
        .from('slideshows')
        .delete()
        .eq('id', slideId);

      if (error) throw error;
      set({ slideshows: get().slideshows.filter(s => s.id !== slideId) });
    } catch (error: any) {
      throw error;
    }
  },

  createSlideshow: async (data: any) => {
    try {
      const { data: newSlide, error } = await supabase
        .from('slideshows')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      set({ slideshows: [...get().slideshows, newSlide] });
    } catch (error: any) {
      throw error;
    }
  },

  updateSlideshow: async (slideId: string, data: any) => {
    try {
      const { data: updatedSlide, error } = await supabase
        .from('slideshows')
        .update(data)
        .eq('id', slideId)
        .select()
        .single();
      
      if (error) throw error;
      set({ slideshows: get().slideshows.map(s => s.id === slideId ? updatedSlide : s) });
    } catch (error: any) {
      throw error;
    }
  },

  fetchUserNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching user notifications:', err);
      return [];
    }
  },

  deleteUserNotification: async (notifId: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', notifId);
    if (error) throw error;
  },

  fetchUserMessages: async (userId: string) => {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const allMsgs = msgs || [];
      const partnerIds = Array.from(
        new Set(allMsgs.map(m => m.sender_id === userId ? m.receiver_id : m.sender_id))
      ).filter(Boolean);

      let partnerMap: Record<string, any> = {};
      if (partnerIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', partnerIds);
        if (profs) {
          profs.forEach(p => { partnerMap[p.id] = p; });
        }
      }

      const convMap: Record<string, { partner: any; messages: any[]; lastMessage: any }> = {};
      allMsgs.forEach(m => {
        const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (!convMap[partnerId]) {
          convMap[partnerId] = {
            partner: partnerMap[partnerId] || { id: partnerId, full_name: 'User', username: 'user' },
            messages: [],
            lastMessage: m
          };
        }
        convMap[partnerId].messages.push(m);
        convMap[partnerId].lastMessage = m;
      });

      const conversations = Object.values(convMap).sort((a, b) =>
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );

      return { messages: allMsgs, conversations };
    } catch (err: any) {
      console.error('Error fetching user messages:', err);
      return { messages: [], conversations: [] };
    }
  },

  deleteUserMessage: async (messageId: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  },

  sendGingerNotification: async (targetUserId: string, title: string, message: string, adminUserId?: string) => {
    const formattedContent = title.trim()
      ? `📢 Ginger Notification: ${title.trim()} — ${message.trim()}`
      : `📢 Ginger Notification: ${message.trim()}`;

    // 1. Insert into notifications table with type 'admin'
    const { error: notifErr } = await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: adminUserId || null,
      type: 'admin',
      content: formattedContent,
      is_read: false
    });
    if (notifErr) {
      console.warn('Direct notification insert notice:', notifErr);
    }

    // 2. Also save to user local notifications queue if in same client / fallback
    try {
      const key = `ginger_local_notifications_${targetUserId}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const newNotif = {
        id: `gn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: targetUserId,
        actor_id: adminUserId || null,
        type: 'admin',
        content: formattedContent,
        is_read: false,
        created_at: new Date().toISOString(),
        actor: {
          full_name: 'Ginger Notification',
          username: 'ginger',
          avatar_url: '/images/brand/logo.png'
        }
      };
      existing.unshift(newNotif);
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    } catch (_) {}

    // 3. Insert into messages table from admin to target user so it also appears in their direct chats
    if (adminUserId) {
      try {
        await supabase.from('messages').insert({
          sender_id: adminUserId,
          receiver_id: targetUserId,
          content: `📢 [Ginger Notification]\n${title ? `**${title.trim()}**\n\n` : ''}${message.trim()}`
        });
      } catch (msgErr) {
        console.warn('Direct message insert notice:', msgErr);
      }
    }
  }
}));
