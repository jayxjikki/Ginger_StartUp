import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink, FiCheck, FiFlag, FiEye, FiCopy } from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';
import Badge from '../../../components/ui/Badge';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { getEmbedInfo, getVideoThumbnail } from '../../../utils/videoHelpers';
import { formatCount } from '../../../utils/formatters';
import toast from 'react-hot-toast';

interface SubmissionVideoModalProps {
  submission: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onFlag?: (id: string) => void;
  campaignStatus?: string;
}

const SubmissionVideoModal: React.FC<SubmissionVideoModalProps> = ({
  submission,
  isOpen,
  onClose,
  onApprove,
  onFlag,
  campaignStatus = 'active',
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!submission) return null;

  const embedInfo = getEmbedInfo(submission.video_url);
  const platform = submission.platform || 'video';
  const platformIcon = getSocialIcon(platform);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(submission.video_url);
    toast.success('Video link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" size="sm">Pending Review</Badge>;
      case 'verified': return <Badge variant="success" size="sm">Approved / Verified</Badge>;
      case 'paid': return <Badge variant="accent" size="sm">Paid</Badge>;
      case 'rejected': return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'flagged': return <Badge variant="error" size="sm">Flagged (Reviewing)</Badge>;
      case 'disputed': return <Badge variant="warning" size="sm">Disputed</Badge>;
      default: return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="submission-modal-overlay" onClick={onClose}>
          <motion.div
            className="submission-modal-content glass-strong"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="submission-modal-header">
              <div className="flex items-center gap-3">
                <Avatar
                  src={submission.creator?.avatar_url}
                  name={submission.creator?.full_name || 'Creator'}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-base leading-tight">
                      {submission.creator?.full_name || 'Creator'}
                    </h3>
                    {platformIcon && (
                      <img src={platformIcon} alt={platform} className="w-4 h-4 object-contain inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-secondary mt-0.5">
                    @{submission.creator?.username || 'creator'} • {platform.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(submission.status)}
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Video Player Container */}
            <div className="submission-video-viewport">
              {embedInfo.type === 'youtube' && (
                <div className="video-aspect-box">
                  <iframe
                    src={embedInfo.embedUrl}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="video-iframe"
                  />
                </div>
              )}

              {embedInfo.type === 'direct' && (
                <div className="video-aspect-box">
                  <video
                    src={embedInfo.embedUrl}
                    controls
                    autoPlay
                    playsInline
                    className="video-element"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {(embedInfo.type === 'instagram' || embedInfo.type === 'external') && (
                <div className="external-video-preview">
                  {getVideoThumbnail(submission.video_url) && (
                    <img
                      src={getVideoThumbnail(submission.video_url)!}
                      alt="Video thumbnail"
                      className="external-video-thumb-bg"
                    />
                  )}
                  <div className="external-video-overlay">
                    {platformIcon && (
                      <div className="external-platform-logo-circle">
                        <img src={platformIcon} alt={platform} className="w-10 h-10 object-contain" />
                      </div>
                    )}
                    <h4 className="text-white font-bold text-lg mt-3">Watch on {platform.toUpperCase()}</h4>
                    <p className="text-xs text-secondary max-w-md text-center mt-1 px-4">
                      Click below to watch this creator's video directly on {platform} in a new tab or app.
                    </p>
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fancy-btn primary-glow mt-5 flex items-center gap-2 px-6 py-2.5"
                    >
                      <FiExternalLink size={17} />
                      <span>Open Video Link</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Submission Info Bar */}
            <div className="submission-modal-meta">
              <div className="meta-left">
                <div className="meta-item">
                  <span className="meta-label">Views Tracked</span>
                  <span className="meta-value flex items-center gap-1.5 font-bold text-white">
                    <FiEye size={15} className="text-accent" />
                    {formatCount(submission.current_views || 0)}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Submitted</span>
                  <span className="meta-value text-secondary">
                    {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="meta-right">
                <button
                  type="button"
                  className="meta-action-btn"
                  onClick={handleCopyLink}
                  title="Copy video link"
                >
                  <FiCopy size={15} />
                  <span>Copy Link</span>
                </button>
                <a
                  href={submission.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meta-action-btn external"
                >
                  <FiExternalLink size={15} />
                  <span>Open URL</span>
                </a>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="submission-modal-actions">
              {submission.status === 'pending' && campaignStatus === 'active' && onApprove && (
                <button
                  type="button"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    onApprove(submission.id);
                    onClose();
                  }}
                >
                  <FiCheck size={18} />
                  <span>Approve Submission</span>
                </button>
              )}

              {(submission.status === 'pending' || submission.status === 'verified') &&
                campaignStatus === 'active' &&
                onFlag && (
                  <button
                    type="button"
                    className="btn btn-outline flag-btn flex-1 flex items-center justify-center gap-2"
                    onClick={() => {
                      onFlag(submission.id);
                      onClose();
                    }}
                  >
                    <FiFlag size={16} />
                    <span>Flag Video</span>
                  </button>
                )}

              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionVideoModal;
