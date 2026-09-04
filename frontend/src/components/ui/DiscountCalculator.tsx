import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import './DiscountCalculator.css';

interface DiscountCalculatorProps {
  initialDiscountPercent?: number;
  voucherCode?: string;
  defaultOpen?: boolean;
  inline?: boolean;
  onClose?: () => void;
}

export const DiscountCalculator: React.FC<DiscountCalculatorProps> = ({
  initialDiscountPercent = 15,
  voucherCode,
  defaultOpen = false,
  inline = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [billAmount, setBillAmount] = useState<string>('1000');
  const [discountPercent, setDiscountPercent] = useState<string>(
    initialDiscountPercent > 0 ? String(initialDiscountPercent) : '15'
  );

  const parsedAmount = Math.max(0, parseFloat(billAmount) || 0);
  const parsedRate = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));

  const savings = (parsedAmount * parsedRate) / 100;
  const finalPrice = Math.max(0, parsedAmount - savings);

  const quickPillOptions = [10, 15, 20, 25, 50];

  const content = (
    <div className="discount-calculator-box">
      <div className="discount-calc-header">
        <div className="calc-title-row">
          <span style={{ fontSize: '1.1rem' }}>🧮</span>
          <h5>Quick Discount Calculator</h5>
          {voucherCode && <span className="calc-badge">{voucherCode}</span>}
        </div>
        {!inline && (
          <button
            type="button"
            className="icon-btn"
            style={{ width: 24, height: 24, fontSize: '0.8rem' }}
            onClick={() => setIsOpen(false)}
            title="Close calculator"
          >
            ✕
          </button>
        )}
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
            />
          </div>
        </div>

        {/* Discount Rate */}
        <div className="calc-input-group">
          <label className="calc-label">Discount %</label>
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
        </div>
      </div>

      {/* Quick Rate Pills */}
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
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="inline-flex flex-col">
      <button
        type="button"
        className={`calc-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open quick discount calculator"
      >
        <span>🧮</span>
        <span>{isOpen ? 'Hide Calculator' : 'Discount Calculator'}</span>
        {isOpen ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
      </button>

      {isOpen && content}
    </div>
  );
};

export default DiscountCalculator;
