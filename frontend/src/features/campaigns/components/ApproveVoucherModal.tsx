import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiPercent, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Avatar from '../../../components/ui/Avatar';
import './ApproveVoucherModal.css';

interface ApproveVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  campaign: any;
  onApprove: (options: {
    mode: 'discount' | 'custom_message';
    discountPercent?: number;
    customMessage?: string;
  }) => Promise<void>;
}

export const ApproveVoucherModal: React.FC<ApproveVoucherModalProps> = ({
  isOpen,
  onClose,
  submission,
  campaign,
  onApprove,
}) => {
  const [mode, setMode] = useState<'discount' | 'custom_message'>('discount');
  const [discountInput, setDiscountInput] = useState<string>('20');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick suggestion chips for custom message
  const quickSuggestions = [
    '🎁 You got a free merch!',
    '⭐ You got a freebie on your visit!',
    '☕ Free drink on your next order',
    '🛍️ Free gift box with your purchase',
    '🎟️ VIP Special entry pass',
  ];

  useEffect(() => {
    if (isOpen && submission) {
      setMode('discount');
      setCustomMessage('');

      // Auto resolve default discount percent
      let defaultDisc = 20;
      if (submission.voucher_details?.reward_text) {
        const match = String(submission.voucher_details.reward_text).match(/(\d+(\.\d+)?)/);
        if (match) defaultDisc = parseFloat(match[1]);
      } else if (campaign?.terms?.direct_discount_tiers?.length) {
        const match = String(campaign.terms.direct_discount_tiers[0].reward || '').match(/(\d+(\.\d+)?)/);
        if (match) defaultDisc = parseFloat(match[1]);
      } else if (campaign?.payout_tiers?.[0]?.payout_amount) {
        defaultDisc = campaign.payout_tiers[0].payout_amount;
      }
      setDiscountInput(String(defaultDisc));
    }
  }, [isOpen, submission, campaign]);

  if (!isOpen || !submission) return null;

  const creatorName = submission.creator?.full_name || submission.creator?.username || 'Customer';
  const creatorHandle = submission.creator?.username ? `@${submission.creator.username}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'discount') {
      const disc = parseFloat(discountInput.trim());
      if (isNaN(disc) || disc <= 0 || disc > 100) {
        toast.error('Please enter a valid discount percentage between 1 and 100.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onApprove({ mode: 'discount', discountPercent: disc });
        onClose();
      } catch (err: any) {
        // Handled by caller
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!customMessage.trim()) {
        toast.error('Please write a custom reward message (e.g., "You got a free merch").');
        return;
      }
      setIsSubmitting(true);
      try {
        await onApprove({ mode: 'custom_message', customMessage: customMessage.trim() });
        onClose();
      } catch (err: any) {
        // Handled by caller
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
        <motion.div
          className="approve-voucher-modal-card glass-strong"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="approve-modal-header">
            <div className="flex items-center gap-3">
              <Avatar
                src={submission.creator?.avatar_url}
                name={creatorName}
                size="md"
              />
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Approve & Issue Voucher
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  For <span className="text-amber-300 font-medium">{creatorName}</span> {creatorHandle}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="modal-close-icon-btn"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="approve-modal-body mt-4 flex flex-col gap-4">
            {/* Mode Select Tabs */}
            {/* Mode Select Tabs */}
            <div className="approve-mode-grid">
              <button
                type="button"
                className={`approve-mode-card ${mode === 'discount' ? 'active' : ''}`}
                onClick={() => setMode('discount')}
              >
                <div className="mode-card-radio">
                  {mode === 'discount' && <div className="mode-card-radio-inner" />}
                </div>
                <div className="mode-card-info">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span className="mode-icon-badge">
                      <FiPercent size={13} />
                    </span>
                    <span>Give Discount</span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1 leading-snug">
                    Issue percentage discount voucher with bill calculation option.
                  </p>
                </div>
              </button>

              <button
                type="button"
                className={`approve-mode-card ${mode === 'custom_message' ? 'active' : ''}`}
                onClick={() => setMode('custom_message')}
              >
                <div className="mode-card-radio">
                  {mode === 'custom_message' && <div className="mode-card-radio-inner" />}
                </div>
                <div className="mode-card-info">
                  <div className="flex items-center gap-2 font-bold text-sm text-white">
                    <span className="mode-icon-badge">
                      <FiMessageSquare size={13} />
                    </span>
                    <span>Send Custom Message</span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1 leading-snug">
                    Send custom reward (e.g. free merch, freebie) without bill calculation.
                  </p>
                </div>
              </button>
            </div>

            {/* Dynamic Inputs Based on Selection */}
            {mode === 'discount' ? (
              <div className="discount-input-box p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Discount Percentage (%)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    className="discount-percent-field"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    placeholder="e.g. 20"
                    autoFocus
                  />
                  <span className="discount-suffix">% OFF</span>
                </div>
                <p className="text-[11px] text-secondary">
                  Customer will receive a voucher code for {discountInput || 0}% discount. You can also send them an itemized bill.
                </p>
              </div>
            ) : (
              <div className="custom-msg-input-box">
                <textarea
                  className="custom-msg-textarea"
                  rows={2}
                  placeholder="e.g. You got a free merch! / You got a freebie..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  autoFocus
                />
                <div className="quick-suggestions-row">
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mb-1.5">
                    Quick Perks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((suggestion, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className="suggestion-chip"
                        onClick={() => setCustomMessage(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="approve-modal-actions mt-2 flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                className="btn btn-ghost text-xs py-2 px-4 text-white/70 hover:text-white"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn approve-submit-btn-green text-xs py-2 px-5 flex items-center gap-1.5"
                disabled={isSubmitting}
              >
                <FiCheck size={15} />
                <span>{isSubmitting ? 'Saving...' : 'Done'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApproveVoucherModal;
