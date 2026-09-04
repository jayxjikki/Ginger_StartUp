// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Share Modal
// QR Code & Direct Link sharing with authentication preservation
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCopy, FiCheck, FiShare2, FiDownload, FiExternalLink, FiInfo, FiLink } from 'react-icons/fi';
import { FaWhatsapp, FaTelegramPlane, FaTwitter, FaQrcode } from 'react-icons/fa';
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
  const [activeTab, setActiveTab] = useState<'qr' | 'link'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const campaignUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/campaigns/${campaign.id}`
    : `/campaigns/${campaign.id}`;

  const shareText = `Check out this campaign "${campaign.title}" on Ginger! Create videos and earn cash rewards or discounts:`;

  // Generate crisp QR code on modal open or tab switch
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

  // Handle Native Share Sheet
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text: `${shareText} ${campaignUrl}`,
          url: campaignUrl,
        });
        toast.success('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share URLs
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${campaignUrl}`)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(shareText)}`;

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

        {/* Tab Switcher: QR Code vs Direct Link */}
        <div className="share-tabs-nav">
          <button
            type="button"
            className={`share-tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <FaQrcode size={14} />
            <span>1st QR Code</span>
          </button>
          <button
            type="button"
            className={`share-tab-btn ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => setActiveTab('link')}
          >
            <FiLink size={14} />
            <span>2nd Direct Link</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="share-tab-body">
          <AnimatePresence mode="wait">
            {activeTab === 'qr' ? (
              <motion.div
                key="qr-tab"
                className="qr-preview-container"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="link-tab"
                className="link-preview-container"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {/* Direct Link Input Box */}
                <div className="link-input-box">
                  <FiExternalLink size={16} className="link-icon" />
                  <input
                    type="text"
                    readOnly
                    value={campaignUrl}
                    className="link-text-input"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className="link-copy-action-btn"
                    onClick={handleCopyLink}
                  >
                    {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Social Share Buttons */}
                <div className="social-share-section">
                  <span className="social-share-label">Instant Share</span>
                  <div className="social-buttons-grid">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-share-btn"
                    >
                      <FaWhatsapp className="social-icon-whatsapp" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-share-btn"
                    >
                      <FaTelegramPlane className="social-icon-telegram" />
                      <span>Telegram</span>
                    </a>
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-share-btn"
                    >
                      <FaTwitter className="social-icon-twitter" />
                      <span>X / Twitter</span>
                    </a>
                  </div>
                </div>

                {/* Native Share Sheet */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    type="button"
                    className="native-share-btn"
                    onClick={handleNativeShare}
                  >
                    <FiShare2 size={16} />
                    <span>Share via Other Apps...</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Auth Guidance Note */}
          <div className="share-modal-footer-note">
            <FiInfo size={14} className="note-icon" />
            <p>
              Anyone clicking this link or scanning the QR code will open this campaign. If they are not logged in, they will be sent to the login page first and automatically directed back here!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignShareModal;
