import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { useWalletStore } from '../../../store/walletStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import './WalletModals.css';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, availableBalance }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { fetchWalletData } = useWalletStore();

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (numAmount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Simulate payout gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase
        .from('wallet_transactions')
        .insert([{
          user_id: user.id,
          amount: -numAmount, // Negative amount for withdrawal
          type: 'withdrawal',
          status: 'pending', // Withdrawals usually start pending
          description: 'Withdrawal to Bank Account',
        }]);
        
      if (error) throw error;
      
      toast.success(`Withdrawal request for ₹${numAmount} submitted!`);
      fetchWalletData(user.id);
      setAmount('');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to submit withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="wallet-modal-overlay">
          <motion.div
            className="wallet-modal-container glass-strong"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="wallet-modal-header">
              <h4>Withdraw Funds</h4>
              <button className="icon-btn" onClick={onClose} disabled={isLoading}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="wallet-modal-body">
              <p className="text-sm text-secondary mb-4">
                Available to withdraw: <strong>₹{availableBalance.toLocaleString()}</strong>
              </p>
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="e.g. 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                required
                min="1"
                max={availableBalance}
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;
