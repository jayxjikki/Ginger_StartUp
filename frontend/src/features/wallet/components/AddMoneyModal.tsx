import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';
import { useWalletStore } from '../../../store/walletStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import './WalletModals.css';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { fetchWalletData } = useWalletStore();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!user) return;
    
    setIsLoading(true);
    try {
      const res = await loadRazorpayScript();
      
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setIsLoading(false);
        return;
      }

      // Read key from env, fallback to generic test key if missing
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TYaXp2bC2qDrd1';

      const options = {
        key: key,
        amount: numAmount * 100, // Amount in paise
        currency: 'INR',
        name: 'Ginger StartUp',
        description: 'Wallet Deposit',
        image: 'https://i.ibb.co/3s8pM4m/ginger-logo.png',
        handler: async function (response: any) {
          try {
            const { error } = await supabase
              .from('wallet_transactions')
              .insert([{
                user_id: user.id,
                amount: numAmount,
                type: 'deposit',
                status: 'completed',
                description: `Added money via Razorpay (${response.razorpay_payment_id || 'Test'})`,
              }]);
              
            if (error) throw error;
            
            toast.success(`Successfully added ₹${numAmount} to your wallet!`);
            fetchWalletData(user.id);
            setAmount('');
            onClose();
          } catch (err: any) {
            console.error('Database error after payment:', err);
            toast.error('Payment succeeded but failed to update wallet. Contact support.');
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'User',
          email: user?.email || '',
        },
        theme: {
          color: '#ff4d4d' // Ginger brand color
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      
    } catch (err: any) {
      console.error('Error opening Razorpay:', err);
      toast.error('Failed to initiate payment');
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
              <h4>Add Money</h4>
              <button className="icon-btn" onClick={onClose} disabled={isLoading}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAdd} className="wallet-modal-body">
              <p className="text-sm text-secondary mb-4">
                Enter the amount you wish to deposit into your Ginger wallet.
              </p>
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
                required
                min="1"
              />
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Add Money'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMoneyModal;
