import React, { useState, useEffect } from 'react';
import { FiLock, FiSend, FiX } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import './DiscountCalculator.css';

interface DiscountCalculatorProps {
  initialDiscountPercent?: number;
  voucherCode?: string;
  defaultOpen?: boolean;
  inline?: boolean;
  onClose?: () => void;
  isLockedPercent?: boolean;
  lockedDiscountPercent?: number;
  isOwner?: boolean;
  recipientUsername?: string;
  onSendBill?: (billAmount: number, finalPrice: number, discountPercent: number, savings: number) => Promise<void> | void;
}

export const DiscountCalculator: React.FC<DiscountCalculatorProps> = ({
  initialDiscountPercent = 15,
  voucherCode,
  defaultOpen = false,
  inline = false,
  isLockedPercent = false,
  lockedDiscountPercent,
  isOwner = false,
  recipientUsername,
  onSendBill,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [billAmount, setBillAmount] = useState<string>('1000');
  const [isSendingBill, setIsSendingBill] = useState(false);

  const effectiveFixedRate = lockedDiscountPercent !== undefined
    ? lockedDiscountPercent
    : (initialDiscountPercent > 0 ? initialDiscountPercent : 15);

  const [discountPercent, setDiscountPercent] = useState<string>(String(effectiveFixedRate));

  const parsedAmount = Math.max(0, parseFloat(billAmount) || 0);
  const parsedRate = isLockedPercent
    ? effectiveFixedRate
    : Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  const savings = (parsedAmount * parsedRate) / 100;
  const finalPrice = Math.max(0, parsedAmount - savings);

  const quickPillOptions = [10, 15, 20, 25, 50];

  const handleSendBillClick = async () => {
    if (!onSendBill || parsedAmount <= 0 || isSendingBill) return;
    setIsSendingBill(true);
    try {
      await onSendBill(parsedAmount, finalPrice, parsedRate, savings);
    } finally {
      setIsSendingBill(false);
    }
  };

  // Prevent body scroll when modal open
  useEffect(() => {
    if (isOpen && !inline) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, inline]);

  const content = (
    <div className="discount-calculator-box">
      <div className="discount-calc-header">
        <div className="calc-title-row">
          <span style={{ fontSize: '1.1rem' }}>🧮</span>
          <h5>{isOwner ? 'Store Bill & Discount' : 'Quick Discount Calculator'}</h5>
          {voucherCode && <span className="calc-badge">{voucherCode}</span>}
        </div>
        <button
          type="button"
          className="calc-modal-close-btn"
          onClick={() => setIsOpen(false)}
          title="Close calculator"
          aria-label="Close"
        >
          <FiX size={17} />
        </button>
      </div>

      <div className="calc-inputs-grid">
        {/* Bill / Item Amount */}
        <div className="calc-input-group">
          <label className="calc-label">Bill / Price</label>
          <div className="calc-input-wrapper">
            <span className="calc-input-prefix">₹</span>
            <input
              type="number"
              min="0"
              step="any"
              className="calc-input"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="e.g. 1000"
              autoFocus
            />
          </div>
        </div>

        {/* Discount Rate */}
        <div className="calc-input-group">
          <label className="calc-label">
            {isLockedPercent ? 'Fixed Discount' : 'Discount %'}
          </label>
          {isLockedPercent ? (
            <div className="calc-locked-field" title={`Locked at ${parsedRate}% as approved by campaign owner`}>
              <FiLock size={13} className="text-emerald-400" />
              <span className="calc-locked-rate">{parsedRate}%</span>
              <span className="calc-locked-tag">FIXED</span>
            </div>
          ) : (
            <div className="calc-input-wrapper">
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                className="calc-input has-suffix"
                style={{ paddingLeft: '0.75rem' }}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                placeholder="e.g. 15"
              />
              <span className="calc-input-suffix">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Rate Pills only shown if NOT locked */}
      {!isLockedPercent && (
        <div className="quick-pct-row">
          {quickPillOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`quick-pct-btn ${parsedRate === opt ? 'active' : ''}`}
              onClick={() => setDiscountPercent(String(opt))}
            >
              {opt}%
            </button>
          ))}
        </div>
      )}

      {/* Result Card */}
      <div className="calc-result-card">
        <div className="result-main">
          <span className="result-main-label">Price to be Paid</span>
          <span className="result-main-price text-emerald-400">
            {formatCurrency(finalPrice)}
          </span>
        </div>
        <div className="result-savings-badge">
          <span className="savings-label">You Save ({parsedRate}%)</span>
          <span className="savings-amount">
            -{formatCurrency(savings)}
          </span>
        </div>
      </div>

      {/* Owner Action: Send Bill Receipt Notification to Creator */}
      {isOwner && onSendBill && (
        <div className="calc-owner-bill-action">
          <button
            type="button"
            className="btn btn-primary calc-send-bill-btn"
            disabled={isSendingBill || parsedAmount <= 0}
            onClick={handleSendBillClick}
            title="Send bill amount and calculated discount to creator's notifications"
          >
            <FiSend size={14} />
            <span>
              {isSendingBill
                ? 'Sending Bill...'
                : `Send Bill Receipt (₹${finalPrice.toLocaleString('en-IN')})`}
            </span>
          </button>
          <p className="calc-send-bill-note">
            Sends an instant bill receipt notification to {recipientUsername ? `@${recipientUsername}` : 'the user'}.
          </p>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className="calc-toggle-btn"
        onClick={() => setIsOpen(true)}
        title="Open quick discount calculator"
      >
        <span>🧮</span>
        <span>Discount Calculator</span>
      </button>

      {/* Full-screen Modal Overlay */}
      {isOpen && (
        <div
          className="calc-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Discount Calculator"
        >
          <div className="calc-modal-sheet">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default DiscountCalculator;

