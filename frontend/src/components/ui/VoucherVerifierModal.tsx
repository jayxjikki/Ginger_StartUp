import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiSearch, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { verifyVoucherCode, markVoucherAsRedeemed, type VoucherVerificationResult } from '../../utils/voucherHelpers';
import { formatDate } from '../../utils/formatters';
import Avatar from './Avatar';
import Badge from './Badge';
import DiscountCalculator from './DiscountCalculator';
import './DiscountCalculator.css';

interface VoucherVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const VoucherVerifierModal: React.FC<VoucherVerifierModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VoucherVerificationResult | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleVerify(initialCode);
    } else {
      setResult(null);
    }
  }, [initialCode, isOpen]);

  const handleVerify = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || code).trim();
    if (!targetCode) {
      toast.error('Please enter a voucher code.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await verifyVoucherCode(targetCode);
      setResult(res);
      if (res.isValid) {
        toast.success(res.isRedeemed ? 'Voucher found (Already Redeemed)' : 'Valid Active Voucher!');
      } else {
        toast.error(res.error || 'Invalid voucher code.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error verifying voucher.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!result?.submission?.voucher_code) return;
    setIsRedeeming(true);
    try {
      const res = await markVoucherAsRedeemed(result.submission.voucher_code);
      if (res.success) {
        toast.success('Voucher marked as REDEEMED successfully!');
        setResult((prev) => (prev ? { ...prev, isRedeemed: true } : prev));
      } else {
        toast.error(res.error || 'Failed to redeem voucher.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error redeeming voucher.');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="admin-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <motion.div
          className="admin-modal-content glass-strong"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 520, padding: '1.75rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '1.3rem' }}>🔍</span>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Voucher Verifier</h3>
                <p className="text-xs text-secondary">Verify customer direct discount vouchers</p>
              </div>
            </div>
            <button
              type="button"
              className="admin-modal-close"
              onClick={onClose}
              style={{ position: 'static' }}
            >
              ✕
            </button>
          </div>

          {/* Search / Input Box */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="input-field uppercase font-mono tracking-wider font-bold"
              placeholder="e.g. VCH-GNG-XXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-primary flex items-center gap-1.5 px-4"
              onClick={() => handleVerify()}
              disabled={isVerifying}
            >
              <FiSearch size={15} />
              <span>{isVerifying ? 'Checking...' : 'Verify'}</span>
            </button>
          </div>

          {/* Verification Result */}
          {result && (
            <div className="mt-4">
              {result.isValid && result.submission ? (
                <div
                  className="p-4 rounded-xl border flex flex-col gap-3"
                  style={{
                    background: result.isRedeemed
                      ? 'rgba(255, 179, 0, 0.05)'
                      : 'rgba(52, 211, 153, 0.08)',
                    borderColor: result.isRedeemed
                      ? 'rgba(255, 179, 0, 0.3)'
                      : 'rgba(52, 211, 153, 0.3)',
                  }}
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.isRedeemed ? (
                        <FiCheckCircle size={18} className="text-amber-400" />
                      ) : (
                        <FiCheckCircle size={18} className="text-emerald-400" />
                      )}
                      <span className="font-bold text-sm text-white">
                        {result.isRedeemed ? 'Already Redeemed' : 'Valid Active Voucher'}
                      </span>
                    </div>
                    <Badge variant={result.isRedeemed ? 'warning' : 'success'} size="sm">
                      {result.isRedeemed ? 'REDEEMED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  {/* Code display */}
                  <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {result.submission.voucher_code}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(result.submission.voucher_code);
                        toast.success('Code copied!');
                      }}
                      title="Copy code"
                    >
                      <FiCopy size={13} />
                    </button>
                  </div>

                  {/* Creator and Campaign Details */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={result.submission.creator?.avatar_url}
                        name={result.submission.creator?.full_name || 'Customer'}
                        size="xs"
                      />
                      <div>
                        <span className="font-semibold text-white block">
                          {result.submission.creator?.full_name || 'Customer'}
                        </span>
                        <span className="text-secondary">
                          @{result.submission.creator?.username || 'user'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-semibold text-white block truncate max-w-[160px]">
                        {result.submission.campaign?.title || 'Campaign'}
                      </span>
                      <span className="text-secondary">
                        Issued {formatDate(result.submission.verified_at || result.submission.submitted_at)}
                      </span>
                    </div>
                  </div>

                  {/* Redeem Action */}
                  {!result.isRedeemed ? (
                    <button
                      type="button"
                      className="btn btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                      onClick={handleRedeem}
                      disabled={isRedeeming}
                    >
                      <FiCheck size={16} />
                      <span>{isRedeeming ? 'Redeeming...' : 'Mark Voucher as Redeemed'}</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs text-amber-400/80 bg-amber-400/10 py-1.5 rounded">
                      This voucher was previously redeemed and cannot be reused.
                    </div>
                  )}

                  {/* Inline Quick Calculator for convenience! */}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <DiscountCalculator
                      inline={true}
                      initialDiscountPercent={result.submission.discount_percent || 15}
                      voucherCode={result.submission.voucher_code}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                  <FiXCircle size={22} className="text-red-400 shrink-0" />
                  <div>
                    <h5 className="text-white font-bold text-sm">Voucher Code Not Found</h5>
                    <p className="text-xs text-secondary mt-0.5">
                      {result.error || 'Please double check the code entered with the customer.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VoucherVerifierModal;
