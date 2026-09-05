import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiLock, FiCheckCircle } from 'react-icons/fi';
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

  const isAlreadyBilled = Boolean(submission?.voucher_details?.bill_amount);

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

      if (submission.voucher_details?.bill_amount) {
        setBillAmountInput(String(submission.voucher_details.bill_amount));
        setNote(submission.voucher_details.note || '');
      } else {
        setBillAmountInput('');
        setNote('');
      }
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  // If already billed, pull the locked figures directly from voucher_details
  const billedOriginal = isAlreadyBilled && submission.voucher_details?.bill_amount
    ? Number(submission.voucher_details.bill_amount)
    : (parseFloat(billAmountInput) || 0);

  const billedDiscountPercent = isAlreadyBilled && submission.voucher_details?.discount_percent != null
    ? Number(submission.voucher_details.discount_percent)
    : discountPercent;

  const billedDiscountAmount = isAlreadyBilled && submission.voucher_details?.discount_amount != null
    ? Number(submission.voucher_details.discount_amount)
    : Math.round((billedOriginal * billedDiscountPercent) / 100);

  const billedFinalPayable = isAlreadyBilled && submission.voucher_details?.final_payable != null
    ? Number(submission.voucher_details.final_payable)
    : Math.max(0, billedOriginal - billedDiscountAmount);

  const billedNote = submission.voucher_details?.note || note;
  const billedAt = submission.voucher_details?.billed_at;

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyBilled) {
      onClose();
      return;
    }
    if (billedOriginal <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSendBill(submission.id, {
        bill_amount: billedOriginal,
        discount_percent: billedDiscountPercent,
        discount_amount: billedDiscountAmount,
        final_payable: billedFinalPayable,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="send-bill-title">
                    {isAlreadyBilled ? 'Sent Bill Receipt' : 'Send Bill & Apply Discount'}
                  </h3>
                  {isAlreadyBilled && (
                    <span className="billed-locked-badge">
                      <FiLock size={11} /> Sent & Locked
                    </span>
                  )}
                </div>
                <p className="send-bill-subtitle">
                  {isAlreadyBilled
                    ? `This bill has been sent to @${submission.creator?.username || 'customer'} with a ${billedDiscountPercent}% pre-set discount. Details are locked and view-only.`
                    : `Directly enter the bill amount. The pre-set ${discountPercent}% discount is automatically deducted and sent to user & campaign notifications.`}
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
                <span className="voucher-discount-badge">{billedDiscountPercent}% OFF</span>
              </div>
            </div>

            {/* Bill Amount Input / View */}
            <div className="send-bill-field-group">
              <label className="send-bill-label">
                <span>Original Bill Amount</span>
                {isAlreadyBilled ? (
                  <span style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: 500, textTransform: 'lowercase' }}>(view-only)</span>
                ) : (
                  <span className="required-star">*</span>
                )}
              </label>

              {isAlreadyBilled ? (
                <div className="send-bill-input-wrap">
                  <span className="send-bill-currency-symbol">₹</span>
                  <div className="send-bill-input send-bill-input-locked">
                    {billedOriginal.toLocaleString()}
                  </div>
                </div>
              ) : (
                <>
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
                        className={`send-bill-chip ${billedOriginal === amt ? 'active' : ''}`}
                        onClick={() => setBillAmountInput(String(amt))}
                      >
                        ₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Live Calculation Receipt Breakdown */}
            <div className="send-bill-breakdown-card">
              <div className="breakdown-header">
                <span className="breakdown-header-tag">
                  {isAlreadyBilled ? '🧾 SENT BILL BREAKDOWN (LOCKED)' : '🧾 LIVE BILL BREAKDOWN'}
                </span>
                <span className="breakdown-auto-tag">Pre-set {billedDiscountPercent}% Applied</span>
              </div>

              <div className="breakdown-row">
                <span className="breakdown-label">Original Bill Amount</span>
                <span className="breakdown-value">
                  ₹{billedOriginal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="breakdown-row discount-row">
                <span className="breakdown-label">
                  Direct Discount ({billedDiscountPercent}%)
                </span>
                <span className="breakdown-value discount-value">
                  -₹{billedDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>

              <div className="breakdown-divider" />

              <div className="breakdown-row total-row">
                <div className="total-label-group">
                  <span className="total-label">Final Amount Customer Pays</span>
                  <span className="total-sub">Directly payable at counter / checkout</span>
                </div>
                <span className="total-value">
                  ₹{billedFinalPayable.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Optional Note / Invoice Ref */}
            {(isAlreadyBilled ? Boolean(billedNote) : true) && (
              <div className="send-bill-field-group">
                <label className="send-bill-label">
                  <span>Bill Description / Note</span>
                  {!isAlreadyBilled && <span className="optional-tag">(Optional)</span>}
                </label>
                {isAlreadyBilled ? (
                  <div className="send-bill-note-input send-bill-input-locked">
                    {billedNote}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="send-bill-note-input"
                    placeholder="e.g., Table 4 dinner / 1 Month gym pass"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={80}
                  />
                )}
              </div>
            )}

            {/* Sent Timestamp if already billed */}
            {isAlreadyBilled && billedAt && (
              <div className="billed-timestamp-row">
                <FiCheckCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <span>
                  Sent on{' '}
                  {new Date(billedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(billedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="send-bill-actions">
              {isAlreadyBilled ? (
                <button
                  type="button"
                  className="btn-send-bill-submit-shining"
                  onClick={onClose}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <span className="btn-shimmer-sweep" />
                  <span>Close Bill</span>
                </button>
              ) : (
                <>
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
                    disabled={billedOriginal <= 0 || isSubmitting}
                  >
                    <span className="btn-shimmer-sweep" />
                    <span className="btn-icon">🧾</span>
                    <span>
                      {isSubmitting
                        ? 'Sending Bill...'
                        : `Send Bill (Payable: ₹${billedFinalPayable.toLocaleString()})`}
                    </span>
                  </button>
                </>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendBillModal;

