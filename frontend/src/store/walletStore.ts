// ═══════════════════════════════════════════════════════════
// GINGER — Wallet Store (Zustand)
// Fetches the active user's wallet balance and transactions
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

interface WalletState {
  balance: {
    available: number;
    pending: number;
    total_earned: number;
    total_spent: number;
  };
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;

  fetchWalletData: (userId: string) => Promise<void>;
  subscribeToWallet: (userId: string) => void;
  unsubscribeFromWallet: () => void;
}

let walletChannel: ReturnType<typeof supabase.channel> | null = null;

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: {
    available: 0,
    pending: 0,
    total_earned: 0,
    total_spent: 0,
  },
  transactions: [],
  isLoading: false,
  error: null,

  fetchWalletData: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // In a real app, there would be a wallet_balances table or a view.
      // For now, we will calculate the balance from transactions.
      const { data: txData, error: txError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      const transactions = txData as WalletTransaction[];
      
      let available = 0;
      let pending = 0;
      let total_earned = 0;
      let total_spent = 0;

      transactions.forEach(tx => {
        if (tx.status === 'completed') {
          if (tx.amount > 0) {
            available += tx.amount;
            if (tx.type === 'earning') total_earned += tx.amount;
          } else {
            available += tx.amount; // tx.amount is negative
            total_spent += Math.abs(tx.amount);
          }
        } else if (tx.status === 'pending') {
          if (tx.amount > 0) {
            pending += tx.amount;
          }
        }
      });

      set({
        transactions,
        balance: { available, pending, total_earned, total_spent }
      });
    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToWallet: (userId: string) => {
    if (walletChannel) return;
    
    walletChannel = supabase.channel('public:wallet_transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${userId}` },
        () => {
           // On any transaction change, just refetch the wallet data to recalculate balance correctly
           get().fetchWalletData(userId);
        }
      )
      .subscribe();
  },
  
  unsubscribeFromWallet: () => {
    if (walletChannel) {
      supabase.removeChannel(walletChannel);
      walletChannel = null;
    }
  }
}));
