import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import type { Submission, Campaign } from '../../../types/campaign.types';
import Avatar from '../../../components/ui/Avatar';
import './SendBillModal.css';

interface SendBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  campaign: Campaign;
  onSendBill: (submissionId: string, billData: {
    bill_amount: number;
    discount_percent: number;
    discount_amount: number;
    final_payable: number;
    note?: string;
  }) => Promise<boolean>;
}

export const SendBillModal: React.FC<SendBillModalProps> = ({
  isOpen,
  onClose,
  submission,
  campaign,
  onSendBill,
}) => {
  // Pre-set discount percent resolution
  const resolvePreSetDiscount = (): number => {
    if (submission?.discount_percent && submission.discount_percent > 0) {
      return submission.discount_percent;
    }
    if (submission?.voucher_details?.discount_percent) {
      return submission.voucher_details.discount_percent;
    }
    if (submission?.voucher_details?.reward_text) {
      const match = String(submission.voucher_details.reward_text).match(/(\d+(\.\d+)?)/);
      if (match) return parseFloat(match[1]);
    }
    if (campaign?.terms?.direct_discount_tiers && campaign.terms.direct_discount_tiers.length > 0) {
      for (const dt of campaign.terms.direct_discount_tiers) {
        const match = String(dt.reward || '').match(/(\d+(\.\d+)?)/);
        if (match) return parseFloat(match[1]);
      }
    }
    if (campaign?.discount_percent && campaign.discount_percent > 0) {
      return campaign.discount_percent;
    }
    return 20; // Default fallback
  };

  const defaultDiscount = resolvePreSetDiscount();
  const [billAmountInput, setBillAmountInput] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(defaultDiscount);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or initialize values when modal opens or submission changes
  useEffect(() => {
    if (isOpen && submission) {
      const resolved = resolvePreSetDiscount();
      setDiscountPercent(resolved);

      // If already billed previously, prefill existing bill amount
      if (submission.voucher_details?.bill_amount) {
        setBillAmountInput(String(submission.voucher_details.bill_amount));
        if (submission.voucher_details.note) {
          setNote(submission.voucher_details.note);
        }
      } else {
        setBillAmountInput('');
        setNote('');
      }
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  const billAmount = parseFloat(billAmountInput) || 0;
  const discountAmount = Math.round((billAmount * discountPercent) / 100);
  const finalPayable = Math.max(0, billAmount - discountAmount);

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (billAmount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSendBill(submission.id, {
        bill_amount: billAmount,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        final_payable: finalPayable,
        note: note.trim() || undefined,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="send-bill-modal-overlay" onClick={onClose}>
        <motion.div
          className="send-bill-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        >
          {/* Header */}
          <div className="send-bill-modal-header">
            <div className="send-bill-header-title-group">
              <div className="send-bill-icon-badge">
                <span>🧾</span>
              </div>
              <div>
                <h3 className="send-bill-title">Send Bill & Apply Discount</h3>
                <p className="send-bill-subtitle">
                  Directly enter the bill amount. The pre-set {discountPercent}% discount is automatically deducted and sent to user & campaign notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="send-bill-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="send-bill-form">
            {/* Creator & Voucher Pill */}
            <div className="send-bill-customer-bar">
              <div className="send-bill-customer-info">
                <Avatar
                  src={submission.creator?.avatar_url}
                  name={submission.creator?.full_name || 'Creator'}
                  size="sm"
                />
                <div>
                  <span className="customer-name">
                    {submission.creator?.full_name || 'Creator'}
                  </span>
                  <span className="customer-handle">
                    @{submission.creator?.username || 'customer'}
                  </span>
                </div>
              </div>

              <div className="send-bill-voucher-pill">
                <span className="voucher-icon">🎟️</span>
                <span className="voucher-code">{submission.voucher_code || 'VCH-ACTIVE'}</span>
                <span className="voucher-discount-badge">{discountPercent}% OFF</span>
              </div>
            </div>

            {/* Bill Amount Input */}
            <div className="send-bill-field-group">
              <label className="send-bill-label">
                <span>Enter Bill Amount</span>
                <span className="required-star">*</span>
              </label>

              <div className="send-bill-input-wrap">
                <span className="send-bill-currency-symbol">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  className="send-bill-input"
                  placeholder="e.g. 1000"
                  value={billAmountInput}
                  onChange={(e) => setBillAmountInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="send-bill-chips-row">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`send-bill-chip ${billAmount === amt ? 'active' : ''}`}
                    onClick={() => setBillAmountInput(String(amt))}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Calculation Receipt Breakdown */}
            <div className="send-bill-breakdown-card">
              <div className="breakdown-header">
                <span className="breakdown-header-tag">🧾 LIVE BILL BREAKDOWN</span>
                <span className="breakdown-auto-tag">Pre-set {discountPercent}% Applied</span>
              </div>

              <div className="breakdown-row">
                <span className="breakdown-label">Original Bill Amount</span>
                <span className="breakdown-value">
                  ₹{billAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="breakdown-row discount-row">
                <span className="breakdown-label">
                  Direct Discount ({discountPercent}%)
                </span>
                <span className="breakdown-value discount-value">
                  -₹{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="breakdown-divider" />

              <div className="breakdown-row total-row">
                <div className="total-label-group">
                  <span className="total-label">Final Amount Customer Pays</span>
                  <span className="total-sub">Directly payable at counter / checkout</span>
                </div>
                <span className="total-value">
                  ₹{finalPayable.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Optional Note / Invoice Ref */}
            <div className="send-bill-field-group">
              <label className="send-bill-label">
                <span>Bill Description / Note</span>
                <span className="optional-tag">(Optional)</span>
              </label>
              <input
                type="text"
                className="send-bill-note-input"
                placeholder="e.g., Table 4 dinner / 1 Month gym pass"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={80}
              />
            </div>

            {/* Action Buttons */}
            <div className="send-bill-actions">
              <button
                type="button"
                className="btn-bill-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-send-bill-submit-shining"
                disabled={billAmount <= 0 || isSubmitting}
              >
                <span className="btn-shimmer-sweep" />
                <span className="btn-icon">🧾</span>
                <span>
                  {isSubmitting
                    ? 'Sending Bill...'
                    : `Send Bill (Payable: ₹${finalPayable.toLocaleString()})`}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendBillModal;
