import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useGlobalModalStore } from './globalModalStore';

interface UgcState {
  blockedUserIds: string[]; // Users that the current user has blocked
  blockedByThemIds: string[]; // Users that have blocked the current user
  
  fetchBlockedUsers: () => Promise<void>;
  reportItem: (itemId: string, itemType: 'profile' | 'campaign' | 'submission', reason: string) => Promise<void>;
  blockUser: (blockedId: string) => Promise<void>;
  unblockUser: (blockedId: string) => Promise<void>;
  checkIfBlockedByThem: (otherUserId: string) => Promise<boolean>;
}

export const useUgcStore = create<UgcState>((set, get) => ({
  blockedUserIds: [],
  blockedByThemIds: [],

  fetchBlockedUsers: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .or(`blocker_id.eq.${session.user.id},blocked_id.eq.${session.user.id}`);
        
      if (error) throw error;
      
      const iBlocked = data.filter(r => r.blocker_id === session.user.id).map(r => r.blocked_id);
      const blockedMe = data.filter(r => r.blocked_id === session.user.id).map(r => r.blocker_id);
      
      set({ blockedUserIds: iBlocked, blockedByThemIds: blockedMe });
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
      
      const { error } = await supabase.from('blocked_users').insert({
        blocker_id: session.user.id,
        blocked_id: blockedId
      });
      
      // Ignore unique constraint violation (already blocked)
      if (error && error.code !== '23505') {
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
    // Relying on the cached state which is fetched on load and chat open
    const state = get();
    return state.blockedByThemIds.includes(otherUserId);
  }
}));
