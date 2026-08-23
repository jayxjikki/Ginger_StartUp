// ═══════════════════════════════════════════════════════════
// GINGER — Admin Store (Zustand)
// Global state for Admin Dashboard functionality
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/user.types';
import type { Campaign } from '../types/campaign.types';

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
  approveSubmission: (submissionId: string, earnedAmount: number) => Promise<void>;
  rejectSubmission: (submissionId: string) => Promise<void>;
  processWithdrawal: (txId: string) => Promise<void>;
  deleteSlideshow: (slideId: string) => Promise<void>;
  createSlideshow: (data: any) => Promise<void>;
  updateSlideshow: (slideId: string, data: any) => Promise<void>;
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
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    set({ users: data as unknown as Profile[] });
  },

  fetchCampaigns: async () => {
    const { data, error } = await supabase.from('campaigns').select('*, advertiser:profiles(*)').order('created_at', { ascending: false });
    if (error) throw error;
    set({ campaigns: data as unknown as Campaign[] });
  },

  fetchSubmissions: async () => {
    const { data, error } = await supabase.from('submissions').select('*, campaign:campaigns(*), creator:profiles(*)').order('submitted_at', { ascending: false });
    if (error) throw error;
    set({ submissions: data });
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
      users: state.users.map(u => u.id === userId ? { ...u, is_banned: isBanned } : u)
    }));
  },

  deleteCampaign: async (campaignId: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (error) throw error;
    set((state) => ({ campaigns: state.campaigns.filter(c => c.id !== campaignId) }));
  },

  approveSubmission: async (submissionId: string, earnedAmount: number) => {
    // 1. Update submission
    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .update({ status: 'verified', earned_amount: earnedAmount, verified_at: new Date().toISOString() })
      .eq('id', submissionId)
      .select('creator_id')
      .single();
      
    if (subError) throw subError;

    // 2. Add to wallet
    const { error: walletError } = await supabase
      .from('wallet_transactions')
      .insert([{
        user_id: subData.creator_id,
        amount: earnedAmount,
        type: 'earning',
        status: 'completed',
        description: 'Campaign Earning'
      }]);
      
    if (walletError) throw walletError;

    set((state) => ({
      submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'verified', earned_amount: earnedAmount } : s)
    }));
  },

  rejectSubmission: async (submissionId: string) => {
    const { error } = await supabase.from('submissions').update({ status: 'rejected' }).eq('id', submissionId);
    if (error) throw error;
    set((state) => ({
      submissions: state.submissions.map(s => s.id === submissionId ? { ...s, status: 'rejected' } : s)
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
  }
}));
