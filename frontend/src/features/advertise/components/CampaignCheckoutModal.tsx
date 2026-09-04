import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import { useWalletStore } from '../../../store/walletStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import '../../wallet/components/WalletModals.css'; // Reuse wallet modal styles
import { formatCurrency } from '../../../utils/formatters';

interface CampaignCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  campaignCost: number;
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CampaignCheckoutModal: React.FC<CampaignCheckoutModalProps> = ({ isOpen, onClose, onSuccess, campaignCost }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const { balance, fetchWalletData } = useWalletStore();

  useEffect(() => {
    if (isOpen && user) {
      fetchWalletData(user.id);
    }
  }, [isOpen, user, fetchWalletData]);

  const handlePayment = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const walletAvailable = balance.available;
      const walletDeduction = Math.min(walletAvailable, campaignCost);
      const remainingAmount = campaignCost - walletDeduction;

      // Case 1: Fully paid via Wallet
      if (remainingAmount <= 0) {
        const { error } = await supabase
          .from('wallet_transactions')
          .insert([{
            user_id: user.id,
            amount: -campaignCost,
            type: 'withdrawal',
            status: 'completed',
            description: `Campaign creation fee`,
          }]);
        
        if (error) throw error;
        toast.success(`Successfully deducted ${formatCurrency(campaignCost)} from wallet!`);
        fetchWalletData(user.id);
        await onSuccess();
        setIsLoading(false);
        return;
      }

      // Case 2: Requires Razorpay for remaining amount
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setIsLoading(false);
        return;
      }

      const key = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TYaXp2bC2qDrd1';
      const options = {
        key: key,
        amount: remainingAmount * 100, // paise
        currency: 'INR',
        name: 'Ginger StartUp',
        description: 'Campaign Creation Checkout',
        image: 'https://i.ibb.co/3s8pM4m/ginger-logo.png',
        handler: async function (response: any) {
          try {
            // Insert Razorpay Deposit for the remaining amount
            const { error: depositError } = await supabase
              .from('wallet_transactions')
              .insert([{
                user_id: user.id,
                amount: remainingAmount,
                type: 'deposit',
                status: 'completed',
                description: `Added money via Razorpay for Campaign (${response.razorpay_payment_id || 'Test'})`,
              }]);
              
            if (depositError) throw depositError;

            // Insert full withdrawal for Campaign Cost
            const { error: withdrawalError } = await supabase
              .from('wallet_transactions')
              .insert([{
                user_id: user.id,
                amount: -campaignCost,
                type: 'withdrawal',
                status: 'completed',
                description: `Campaign creation fee`,
              }]);

            if (withdrawalError) throw withdrawalError;
            
            toast.success(`Payment successful! Publishing campaign...`);
            fetchWalletData(user.id);
            await onSuccess();
          } catch (err: any) {
            console.error('Database error after payment:', err);
            toast.error('Payment succeeded but failed to update records. Contact support.');
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || 'User',
          email: user?.email || '',
        },
        theme: {
          color: '#ff4d4d'
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error('Payment error', err);
      toast.error('Failed to process payment');
      setIsLoading(false);
    }
  };

  const walletAvailable = balance.available || 0;
  const walletDeduction = Math.min(walletAvailable, campaignCost);
  const remainingAmount = campaignCost - walletDeduction;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="wallet-modal-overlay">
          <motion.div
            className="wallet-modal-container glass-strong"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ maxWidth: '400px' }}
          >
            <div className="wallet-modal-header">
              <h4>Checkout</h4>
              <button className="icon-btn" onClick={onClose} disabled={isLoading}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="wallet-modal-body p-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                <span className="text-secondary">Campaign Cost:</span>
                <span className="font-bold text-accent">{formatCurrency(campaignCost)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-secondary">Wallet Balance:</span>
                <span className="font-bold text-green-400">{formatCurrency(walletAvailable)}</span>
              </div>
              
              {walletDeduction > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff4d4d' }}>
                  <span>Wallet Deduction:</span>
                  <span>-{formatCurrency(walletDeduction)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                <span>To Pay:</span>
                <span>{formatCurrency(remainingAmount)}</span>
              </div>

              <div className="mt-4">
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={handlePayment} 
                  isLoading={isLoading}
                >
                  {remainingAmount > 0 ? 'Pay via Razorpay' : 'Pay & Publish'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CampaignCheckoutModal;
