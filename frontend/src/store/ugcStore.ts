import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useGlobalModalStore } from './globalModalStore';

interface UgcState {
  blockedUserIds: string[]; // Users that the current user has blocked
  
  fetchBlockedUsers: () => Promise<void>;
  reportItem: (itemId: string, itemType: 'profile' | 'campaign' | 'submission', reason: string) => Promise<void>;
  blockUser: (blockedId: string) => Promise<void>;
  unblockUser: (blockedId: string) => Promise<void>;
  checkIfBlockedByThem: (otherUserId: string) => Promise<boolean>;
}

export const useUgcStore = create<UgcState>((set, get) => ({
  blockedUserIds: [],

  fetchBlockedUsers: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', session.user.id);
        
      if (error) throw error;
      
      set({ blockedUserIds: data.map(row => row.blocked_id) });
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  },

  reportItem: async (itemId, itemType, reason) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('reports').insert({
        reporter_id: session.user.id,
        reported_item_id: itemId,
        item_type: itemType,
        reason: reason,
        status: 'pending'
      });
      
      if (error) throw error;
      useGlobalModalStore.getState().showAlert('Report submitted successfully. We will review it shortly.', 'Report Sent');
    } catch (err: any) {
      console.error('Error reporting item:', err);
      useGlobalModalStore.getState().showAlert(err.message || 'Failed to submit report', 'Error');
    }
  },
  
  blockUser: async (blockedId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('blocked_users').upsert({
        blocker_id: session.user.id,
        blocked_id: blockedId
      }, { onConflict: 'blocker_id,blocked_id' });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      set(state => ({ blockedUserIds: [...state.blockedUserIds, blockedId] }));
      useGlobalModalStore.getState().showAlert('User has been blocked and will no longer be able to interact with you.', 'User Blocked');
    } catch (err: any) {
      console.error('Error blocking user:', err);
      useGlobalModalStore.getState().showAlert(err.message || 'Failed to block user', 'Error');
    }
  },

  unblockUser: async (blockedId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('blocked_users')
        .delete()
        .eq('blocker_id', session.user.id)
        .eq('blocked_id', blockedId);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      set(state => ({ blockedUserIds: state.blockedUserIds.filter(id => id !== blockedId) }));
      useGlobalModalStore.getState().showAlert('User has been unblocked.', 'User Unblocked');
    } catch (err: any) {
      console.error('Error unblocking user:', err);
      useGlobalModalStore.getState().showAlert(err.message || 'Failed to unblock user', 'Error');
    }
  },

  checkIfBlockedByThem: async (otherUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', otherUserId)
        .eq('blocked_id', session.user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        console.error('Error checking if blocked by them:', error);
        return false;
      }
      
      return !!data;
    } catch (err) {
      console.error('Error checking block status:', err);
      return false;
    }
  }
}));
