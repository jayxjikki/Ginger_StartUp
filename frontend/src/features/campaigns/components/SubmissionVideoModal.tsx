import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink, FiCheck, FiFlag, FiRotateCcw } from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { getEmbedInfo, getVideoThumbnail } from '../../../utils/videoHelpers';
import { isDirectDiscountSubmission } from '../../../utils/submissionHelpers';

interface SubmissionVideoModalProps {
  submission: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onFlag?: (id: string) => void;
  onUnflag?: (id: string) => void;
  onReject?: (id: string) => void;
  campaignStatus?: string;
  isAdmin?: boolean;
}

const SubmissionVideoModal: React.FC<SubmissionVideoModalProps> = ({
  submission,
  isOpen,
  onClose,
  onApprove,
  onFlag,
  onUnflag,
  onReject,
  campaignStatus = 'active',
  isAdmin = false,
}) => {
  useEffect(() => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="submission-modal-overlay" onClick={onClose}>
          <motion.div
            className="submission-modal-content"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="submission-modal-header">
              <div className="modal-header-creator">
                <Avatar
                  src={submission.creator?.avatar_url}
                  name={submission.creator?.full_name || 'Creator'}
                  size="md"
                />
                <div className="modal-creator-text">
                  <div className="modal-creator-name-row">
                    <h3 className="modal-creator-name">
                      {submission.creator?.full_name || 'Creator'}
                    </h3>
                    {platformIcon && (
                      <img
                        src={platformIcon}
                        alt={platform}
                        className="modal-platform-icon"
                        style={{ width: 16, height: 16, minWidth: 16, maxWidth: 16, objectFit: 'contain' }}
                      />
                    )}
                  </div>
                  <p className="modal-creator-handle">
                    @{submission.creator?.username || 'creator'} • {platform.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="modal-header-actions">
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Video Player / Fallback View */}
            <div className="submission-modal-player-wrapper">
              {embedInfo.type === 'youtube' && (
                <iframe
                  src={embedInfo.embedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="modal-iframe youtube-frame"
                />
              )}

              {embedInfo.type === 'instagram' && (
                <iframe
                  src={embedInfo.embedUrl}
                  title="Instagram video player"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency
                  allow="encrypted-media"
                  className="modal-iframe instagram-frame"
                />
              )}

              {embedInfo.type === 'facebook' && (
                <iframe
                  src={embedInfo.embedUrl}
                  title="Facebook video player"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  className="modal-iframe facebook-frame"
                />
              )}

              {embedInfo.type === 'image' && (
                <div className="flex items-center justify-center p-4 bg-black/40 rounded-xl max-h-[70vh] overflow-hidden">
                  <img
                    src={embedInfo.embedUrl}
                    alt="Submitted proof"
                    className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}

              {embedInfo.type === 'direct' && (
                <video
                  src={embedInfo.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  className="modal-direct-video"
                />
              )}

              {embedInfo.type === 'external' && (
                <div className="modal-unsupported-preview">
                  <div className="modal-unsupported-thumb-box">
                    <img
                      src={getVideoThumbnail(submission.video_url, platform) || '/images/brand/logo.png'}
                      alt="Video preview"
                      className="modal-unsupported-thumb"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/brand/logo.png';
                      }}
                    />
                  </div>
                  <p className="modal-unsupported-text">
                    This video format cannot be previewed inline. Open directly to view:
                  </p>
                  <a
                    href={submission.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <span>Open in {platform}</span>
                    <FiExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            {((isAdmin && submission.status !== 'paid') ||
              (!isAdmin && (submission.status === 'pending' || submission.status === 'flagged') && campaignStatus === 'active')) && (
              <div className="submission-modal-actions">
                {isAdmin ? (
                  <>
                    {submission.status !== 'paid' && onApprove && (
                      <button
                        type="button"
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}
                        onClick={() => onApprove(submission.id)}
                      >
                        <FiCheck size={18} />
                        <span>Approve (Final Call)</span>
                      </button>
                    )}

                    {submission.status !== 'rejected' && onReject && (
                      <button
                        type="button"
                        className="btn btn-outline flag-btn flex-1 flex items-center justify-center gap-2"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                        onClick={() => onReject(submission.id)}
                      >
                        <FiX size={16} />
                        <span>Reject Video</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {submission.status === 'pending' && campaignStatus === 'active' && onApprove && (
                      <button
                        type="button"
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        style={
                          isDirectDiscountSubmission(submission)
                            ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }
                            : undefined
                        }
                        onClick={() => onApprove(submission.id)}
                      >
                        <FiCheck size={18} />
                        <span>{isDirectDiscountSubmission(submission) ? 'Approve & Issue Voucher' : 'Approve Submission'}</span>
                      </button>
                    )}

                    {submission.status === 'pending' &&
                      campaignStatus === 'active' &&
                      onFlag && (
                        <button
                          type="button"
                          className="btn btn-outline flag-btn flex-1 flex items-center justify-center gap-2"
                          onClick={() => onFlag(submission.id)}
                        >
                          <FiFlag size={16} />
                          <span>Flag Video</span>
                        </button>
                      )}

                    {submission.status === 'flagged' &&
                      campaignStatus === 'active' &&
                      onUnflag && (
                        <button
                          type="button"
                          className="btn btn-outline flag-btn flex-1 flex items-center justify-center gap-2"
                          style={{
                            borderColor: 'rgba(245, 158, 11, 0.45)',
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.08)',
                          }}
                          onClick={() => onUnflag(submission.id)}
                        >
                          <FiRotateCcw size={16} />
                          <span>Unflag Video (Restore to Pending)</span>
                        </button>
                      )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionVideoModal;
