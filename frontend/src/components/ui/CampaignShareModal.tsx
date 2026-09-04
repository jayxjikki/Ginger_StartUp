// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Share Modal
// Clean QR Code modal with direct link copy & QR download
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiCopy, FiCheck, FiDownload } from 'react-icons/fi';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import './CampaignShareModal.css';

interface CampaignShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    title: string;
    description?: string;
    type?: string;
    prize_pool?: number;
  };
}

export const CampaignShareModal: React.FC<CampaignShareModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const campaignUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/campaigns/${campaign.id}`
    : `/campaigns/${campaign.id}`;

  // Generate crisp QR code on modal open
  useEffect(() => {
    if (isOpen && campaignUrl) {
      setIsGeneratingQr(true);
      QRCode.toDataURL(campaignUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        })
        .catch((err) => {
          console.error('QR code generation error:', err);
          setIsGeneratingQr(false);
        });
    }
  }, [isOpen, campaignUrl]);

  // Handle Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      toast.success('Campaign link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  // Handle Download QR Code
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement('a');
    const safeTitle = (campaign.title || 'campaign').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadLink.href = qrDataUrl;
    downloadLink.download = `Ginger_QR_${safeTitle}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success('QR Code downloaded!');
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <motion.div
        className="share-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Modal Header */}
        <div className="share-modal-header">
          <div className="share-modal-title-group">
            <h3>Share Campaign</h3>
            <p className="truncate max-w-xs">{campaign.title}</p>
          </div>
          <button
            type="button"
            className="share-modal-close-btn"
            onClick={onClose}
            aria-label="Close share modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body: Crisp QR Card & Actions */}
        <div className="share-tab-body">
          <div className="qr-preview-container">
            <div className="qr-card-frame">
              {isGeneratingQr ? (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    className="btn-spinner"
                    style={{
                      width: 32,
                      height: 32,
                      borderColor: 'rgba(255, 107, 43, 0.2)',
                      borderTopColor: '#ff6b2b',
                    }}
                  />
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${campaign.title}`}
                  className="qr-image-render"
                />
              )}
              <div className="qr-brand-tag">
                <span className="qr-brand-logo">⚡</span>
                <span>SCAN ON GINGER</span>
              </div>
            </div>

            <p className="qr-instructions">
              Scan this QR code with any phone camera or barcode scanner to open this campaign immediately.
            </p>

            <div className="qr-actions-row">
              <button
                type="button"
                className="qr-download-btn"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl || isGeneratingQr}
              >
                <FiDownload size={15} />
                <span>Download QR</span>
              </button>

              <button
                type="button"
                className="qr-copy-btn"
                onClick={handleCopyLink}
              >
                {copied ? <FiCheck size={15} color="#34d399" /> : <FiCopy size={15} />}
                <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignShareModal;
