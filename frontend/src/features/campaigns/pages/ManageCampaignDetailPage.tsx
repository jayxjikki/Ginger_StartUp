import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiFlag,
  FiVideo,
  FiCheck,
  FiPlay,
  FiExternalLink,
  FiEye,
  FiClock,
  FiRefreshCw,
  FiCopy,
  FiSearch,
} from 'react-icons/fi';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { supabase } from '../../../lib/supabase';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { formatCurrency, formatCount } from '../../../utils/formatters';
import { getSocialIcon } from '../../../utils/socialHelpers';
import { getVideoThumbnail } from '../../../utils/videoHelpers';
import SubmissionVideoModal from '../components/SubmissionVideoModal';
import DiscountCalculator from '../../../components/ui/DiscountCalculator';
import VoucherVerifierModal from '../../../components/ui/VoucherVerifierModal';
import toast from 'react-hot-toast';
import './ManageCampaignsPage.css';

type FilterType = 'all' | 'pending' | 'verified' | 'flagged';

const ManageCampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    myCreatedCampaigns,
    fetchMyCreatedCampaigns,
    flagSubmissionByAdvertiser,
    approveSubmissionByAdvertiser,
    approveDirectDiscountSubmission,
    submitCampaignToAdmin,
    isLoading: storeLoading,
  } = useCampaignStore();
  const { showConfirm, showAlert } = useGlobalModalStore();

  const [singleCampaign, setSingleCampaign] = useState<any | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'all_rewards' | 'direct_discount'>('all_rewards');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isVerifierModalOpen, setIsVerifierModalOpen] = useState(false);
  const [verifierInitialCode, setVerifierInitialCode] = useState('');

  // Direct fetch for fresh submissions & campaign details
  const fetchCampaignData = useCallback(async () => {
    if (!id) return;
    setIsFetchingDirect(true);
    try {
      const { data: campaignRes, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (campErr) throw campErr;

      const { data: subRes, error: subErr } = await supabase
        .from('submissions')
        .select('*, creator:profiles(*)')
        .eq('campaign_id', id)
        .order('submitted_at', { ascending: false });

      if (subErr) throw subErr;

      setSingleCampaign({
        ...campaignRes,
        submissions: subRes || [],
      });
    } catch (err: any) {
      console.error('Error fetching campaign details:', err);
    } finally {
      setIsFetchingDirect(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignData();
    if (user?.id) {
      fetchMyCreatedCampaigns(user.id);
    }
  }, [fetchCampaignData, user?.id, fetchMyCreatedCampaigns]);

  const campaign = useMemo(() => {
    if (singleCampaign) return singleCampaign;
    return myCreatedCampaigns.find((c) => c.id === id);
  }, [singleCampaign, myCreatedCampaigns, id]);

  const submissions = useMemo(() => {
    return (campaign?.submissions as any[]) || [];
  }, [campaign?.submissions]);

  const selectedSubmission = useMemo(() => {
    if (!selectedSubmissionId) return null;
    return submissions.find((s: any) => s.id === selectedSubmissionId) || null;
  }, [submissions, selectedSubmissionId]);

  // Split submissions by mode
  const rewardSubmissions = useMemo(
    () => submissions.filter((s: any) => s.submission_type !== 'direct_discount'),
    [submissions]
  );
  const discountSubmissions = useMemo(
    () => submissions.filter((s: any) => s.submission_type === 'direct_discount'),
    [submissions]
  );

  const currentModeSubmissions = useMemo(
    () => (submissionMode === 'all_rewards' ? rewardSubmissions : discountSubmissions),
    [submissionMode, rewardSubmissions, discountSubmissions]
  );

  // Counts for tabs in current mode
  const pendingCount = useMemo(
    () => currentModeSubmissions.filter((s: any) => s.status === 'pending').length,
    [currentModeSubmissions]
  );
  const approvedCount = useMemo(
    () =>
      currentModeSubmissions.filter(
        (s: any) => s.status === 'verified' || s.status === 'approved' || s.status === 'paid'
      ).length,
    [currentModeSubmissions]
  );
  const flaggedCount = useMemo(
    () => currentModeSubmissions.filter((s: any) => s.status === 'flagged').length,
    [currentModeSubmissions]
  );

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return currentModeSubmissions.filter((s: any) => s.status === 'pending');
      case 'verified':
        return currentModeSubmissions.filter(
          (s: any) => s.status === 'verified' || s.status === 'approved' || s.status === 'paid'
        );
      case 'flagged':
        return currentModeSubmissions.filter((s: any) => s.status === 'flagged');
      case 'all':
      default:
        return currentModeSubmissions;
    }
  }, [currentModeSubmissions, activeFilter]);

  const handleFlagSubmission = async (submissionId: string) => {
    const confirmed = await showConfirm(
      'Are you sure you want to flag this submission? Admin will review it and decide whether to reject it permanently.',
      'Flag Video'
    );
    if (!confirmed) return;

    try {
      await flagSubmissionByAdvertiser(submissionId);
      setSingleCampaign((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: (prev.submissions || []).map((s: any) =>
            s.id === submissionId ? { ...s, status: 'flagged' } : s
          ),
        };
      });
      toast.success('Submission flagged for admin review');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to flag submission. Please try again.');
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await approveSubmissionByAdvertiser(submissionId);
      setSingleCampaign((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: (prev.submissions || []).map((s: any) =>
            s.id === submissionId ? { ...s, status: 'verified' } : s
          ),
        };
      });
      showAlert('Submission approved! Sent to Admin for final payment processing.', 'Success');
    } catch (err) {
      console.error(err);
      showAlert('Failed to approve submission. Please try again.');
    }
  };

  const handleApproveDirectDiscount = async (submissionId: string) => {
    const defaultDiscount = campaign?.payout_tiers?.[0]?.payout_amount || 15;
    const input = prompt(
      `Approve this direct discount video?\n\nThis will instantly issue a unique voucher code and notify both the creator & you (no admin approval needed).\n\nEnter Discount Percentage (%):`,
      String(defaultDiscount)
    );
    if (input === null) return;
    const discountRate = parseFloat(input.trim()) || defaultDiscount;

    try {
      const voucherCode = await approveDirectDiscountSubmission(submissionId, discountRate);
      setSingleCampaign((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: (prev.submissions || []).map((s: any) =>
            s.id === submissionId
              ? {
                  ...s,
                  status: 'verified',
                  voucher_code: voucherCode,
                  voucher_status: 'active',
                  discount_percent: discountRate,
                  verified_at: new Date().toISOString(),
                }
              : s
          ),
        };
      });
      toast.success(`Direct discount approved! Voucher Code: ${voucherCode} generated.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to approve direct discount submission.');
    }
  };

  const handleSubmitCampaign = async () => {
    const confirmed = await showConfirm(
      'Submit this campaign for final approval? You will not be able to verify more submissions after this.'
    );
    if (!confirmed) return;
    try {
      await submitCampaignToAdmin(id!);
      toast.success('Campaign submitted for final approval and payout!');
      fetchCampaignData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit campaign.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'verified':
        return <Badge variant="success" size="sm">Approved (Pending Admin)</Badge>;
      case 'paid':
        return <Badge variant="accent" size="sm">Admin Approved & Paid</Badge>;
      case 'rejected':
        return <Badge variant="error" size="sm">Rejected</Badge>;
      case 'flagged':
        return <Badge variant="error" size="sm">Flagged</Badge>;
      case 'disputed':
        return <Badge variant="warning" size="sm">Disputed</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  const isLoading = (storeLoading || isFetchingDirect) && !campaign;

  if (isLoading) {
    return (
      <div className="manage-campaigns-page flex justify-center items-center h-screen">
        <div className="spinner-large"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="manage-campaigns-page flex flex-col justify-center items-center h-screen gap-4">
        <h2 className="text-white text-xl font-bold">Campaign Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/manage-campaigns')}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="manage-campaigns-page">
      {/* Dynamic Background Blobs */}
      <div className="manage-page-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Header */}
      <header className="manage-header relative z-20">
        <button
          className="icon-btn manage-back-btn"
          onClick={() => navigate('/manage-campaigns')}
          aria-label="Back to Campaigns"
        >
          <FiArrowLeft size={22} />
        </button>
        <div className="manage-header-center">
          <h1 className="manage-title bg-gradient-text">Manage Campaign</h1>
          <p className="manage-subtitle">Submissions & video reviews</p>
        </div>
        <button
          className="icon-btn manage-refresh-btn"
          onClick={fetchCampaignData}
          disabled={isFetchingDirect}
          title="Refresh submissions"
          aria-label="Refresh submissions"
        >
          <FiRefreshCw size={18} className={isFetchingDirect ? 'animate-spin text-accent' : ''} />
        </button>
      </header>

      <main className="manage-main relative z-10">
        {/* Campaign Details Header Card */}
        <motion.div
          className="manage-detail-header-card glass-strong"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="manage-detail-top-row">
            <div className="manage-detail-title-col">
              <h2 className="manage-detail-title">
                {campaign.title || 'Untitled Campaign'}
              </h2>
              {campaign.slogan && (
                <p className="manage-detail-slogan">{campaign.slogan}</p>
              )}
            </div>
            <Badge
              variant={campaign.status === 'active' ? 'success' : 'default'}
              size="md"
              className="status-pill-badge uppercase shrink-0"
            >
              {campaign.status}
            </Badge>
          </div>

          <div className="manage-detail-stats-bar">
            <div className="detail-stat">
              <span className="detail-stat-label">TOTAL BUDGET</span>
              <span className="detail-stat-value text-accent">
                {formatCurrency(campaign.prize_pool || 0)}
              </span>
            </div>
            <div className="detail-stat-divider"></div>
            <div className="detail-stat">
              <span className="detail-stat-label">SUBMISSIONS</span>
              <span className="detail-stat-value text-white detail-stat-icon-val">
                <FiVideo size={16} className="text-secondary" />
                <span>{submissions.length}</span>
              </span>
            </div>
            <div className="detail-stat-divider"></div>
            <div className="detail-stat">
              <span className="detail-stat-label">APPROVED</span>
              <span className="detail-stat-value text-[#4caf50]">
                {approvedCount}
              </span>
            </div>
          </div>

          {campaign.status === 'active' && (
            <div className="mt-5">
              <button
                className="fancy-btn primary-glow w-full"
                onClick={handleSubmitCampaign}
              >
                Submit Campaign for Final Approval
              </button>
              <p className="text-xs text-secondary mt-2 text-center">
                Review and approve all valid creator videos before final payout submission.
              </p>
            </div>
          )}

          {campaign.status === 'paused' && (
            <div className="mt-5 p-3.5 rounded-xl border border-warning/20 bg-warning/5 text-warning flex items-center justify-center font-bold text-sm gap-2">
              <FiCheck /> Campaign Submitted for Admin Final Approval & Payout
            </div>
          )}
        </motion.div>

        {/* Mode Switcher: All Campaign Rewards vs Direct Discount */}
        <div className="manage-mode-switcher">
          <button
            type="button"
            className={`mode-switch-btn ${submissionMode === 'all_rewards' ? 'active' : ''}`}
            onClick={() => {
              setSubmissionMode('all_rewards');
              setActiveFilter('all');
            }}
          >
            <span>🏆 All Campaign Rewards Submissions</span>
            <span className="mode-pill-badge">{rewardSubmissions.length}</span>
          </button>

          <button
            type="button"
            className={`mode-switch-btn highlight-discount ${submissionMode === 'direct_discount' ? 'active' : ''}`}
            onClick={() => {
              setSubmissionMode('direct_discount');
              setActiveFilter('all');
            }}
          >
            <span>🏷️ Direct Discount Videos & Vouchers</span>
            <span className="mode-pill-badge discount">{discountSubmissions.length}</span>
          </button>
        </div>

        {/* Direct Discount Top Banner with Verifier Shortcut */}
        {submissionMode === 'direct_discount' && (
          <div className="direct-discount-banner">
            <div className="direct-discount-banner-text">
              <h4>🏷️ Direct Discount Videos & Vouchers</h4>
              <p>
                Direct discount videos only require your approval (Admin review is not needed). Approving automatically creates an authentic voucher code and notifies both you and the creator.
              </p>
            </div>
            <button
              type="button"
              className="btn-open-verifier"
              onClick={() => {
                setVerifierInitialCode('');
                setIsVerifierModalOpen(true);
              }}
            >
              <FiSearch size={14} />
              <span>Verify Customer Voucher</span>
            </button>
          </div>
        )}

        {/* Submissions Section Header & Filter Tabs */}
        <div className="submissions-section-header">
          <div className="submissions-title-row">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xl text-white">
                {submissionMode === 'all_rewards' ? 'Campaign Reward Videos' : 'Direct Discount Videos'}
              </h3>
              <span className="submissions-total-pill">{currentModeSubmissions.length}</span>
            </div>

            {/* Filter Tabs */}
            <div className="submission-filter-tabs">
              <button
                type="button"
                className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All <span className="tab-badge">{currentModeSubmissions.length}</span>
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveFilter('pending')}
              >
                Pending <span className="tab-badge warning">{pendingCount}</span>
              </button>
              <button
                type="button"
                className={`filter-tab-btn ${activeFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setActiveFilter('verified')}
              >
                Approved <span className="tab-badge success">{approvedCount}</span>
              </button>
              {flaggedCount > 0 && (
                <button
                  type="button"
                  className={`filter-tab-btn ${activeFilter === 'flagged' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('flagged')}
                >
                  Flagged <span className="tab-badge error">{flaggedCount}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <motion.div
            className="empty-submissions-card glass-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-submissions-icon">
              <FiVideo size={36} className="text-secondary" />
            </div>
            <h4 className="text-lg font-bold text-white mt-3">
              {activeFilter === 'all'
                ? 'No Submissions Yet'
                : `No ${activeFilter.toUpperCase()} Submissions`}
            </h4>
            <p className="text-xs text-secondary max-w-sm mt-1">
              {activeFilter === 'all'
                ? 'When creators discover your campaign and submit their videos, they will show up here for your review.'
                : `There are currently no submissions with "${activeFilter}" status.`}
            </p>
          </motion.div>
        ) : (
          <div className="submission-list">
            <AnimatePresence>
              {filteredSubmissions.map((sub: any, idx: number) => {
                const thumbnail = getVideoThumbnail(sub.video_url);
                const platform = (sub.platform || 'video').toLowerCase();
                const platformIcon = getSocialIcon(platform);

                return (
                  <motion.div
                    key={sub.id}
                    className="submission-card-rich glass-strong"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    {/* Video Thumbnail Box with Play Overlay */}
                    <div
                      className="submission-thumb-box"
                      onClick={() => setSelectedSubmissionId(sub.id)}
                      title="Click to watch video"
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt="Video submission thumbnail"
                          className="submission-thumb-img"
                          loading="lazy"
                          onError={(e) => {
                            const current = e.currentTarget.src;
                            if (current.includes('hqdefault.jpg')) {
                              e.currentTarget.src = current.replace('hqdefault.jpg', 'mqdefault.jpg');
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="submission-thumb-fallback">
                          {platformIcon ? (
                            <img
                              src={platformIcon}
                              alt={platform}
                              className="platform-icon-fallback"
                              style={{ width: 36, height: 36, objectFit: 'contain' }}
                            />
                          ) : (
                            <FiVideo size={32} className="text-accent" />
                          )}
                          <span className="fallback-tag-text">
                            {platform.toUpperCase()} VIDEO
                          </span>
                        </div>
                      )}

                      {/* Play Button Overlay */}
                      <div className="submission-play-overlay">
                        <div className="play-icon-badge">
                          <FiPlay size={20} className="text-white ml-0.5" />
                        </div>
                        <span className="play-text-pill">Watch Video</span>
                      </div>

                      {/* Platform Tag */}
                      {platformIcon && (
                        <div className="submission-platform-tag">
                          <img
                            src={platformIcon}
                            alt={platform}
                            className="platform-icon-tag"
                            style={{ width: 14, height: 14, minWidth: 14, maxWidth: 14, objectFit: 'contain' }}
                          />
                          <span>{platform.toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {/* Submission Content Info */}
                    <div className="submission-body">
                      <div className="submission-top-row">
                        <div className="creator-profile-snippet">
                          <Avatar
                            src={sub.creator?.avatar_url}
                            name={sub.creator?.full_name || 'Creator'}
                            size="md"
                          />
                          <div className="creator-meta">
                            <h4 className="creator-name" title={sub.creator?.full_name}>
                              {sub.creator?.full_name || 'Creator'}
                            </h4>
                            <p className="creator-handle">
                              @{sub.creator?.username || 'creator'}
                            </p>
                          </div>
                        </div>

                        <div className="submission-status-wrapper">
                          {getStatusBadge(sub.status)}
                        </div>
                      </div>

                      {/* Metrics strip */}
                      <div className="submission-metrics-row">
                        <div className="metric-pill">
                          <FiEye size={14} className="text-accent" />
                          <span className="text-white font-bold text-xs">
                            {formatCount(sub.current_views || 0)} views
                          </span>
                        </div>
                        <div className="metric-pill">
                          <FiClock size={14} className="text-secondary" />
                          <span className="text-secondary text-xs">
                            {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <Badge variant={sub.submission_type === 'direct_discount' ? 'warning' : 'accent'} size="sm">
                          {sub.submission_type === 'direct_discount' ? '🏷️ Direct Discount' : '🏆 All Rewards'}
                        </Badge>
                      </div>

                      {/* Video URL Display */}
                      <div className="submission-url-preview">
                        <span className="submission-url-text">
                          {sub.video_url}
                        </span>
                      </div>

                      {/* Direct Discount Voucher Details with Quick Calculator */}
                      {sub.submission_type === 'direct_discount' && (sub.status === 'verified' || sub.status === 'paid') && (
                        <div className="submission-voucher-box">
                          <div className="voucher-row-top">
                            <div className="flex items-center gap-2">
                              <span className="voucher-code-pill">
                                🎟️ {sub.voucher_code || 'VCH-ACTIVE'}
                              </span>
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(sub.voucher_code || '');
                                  toast.success('Voucher code copied!');
                                }}
                                title="Copy voucher code"
                              >
                                <FiCopy size={13} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant={sub.voucher_status === 'redeemed' ? 'warning' : 'success'} size="sm">
                                {sub.voucher_status === 'redeemed' ? 'REDEEMED' : 'ACTIVE'}
                              </Badge>
                              <button
                                type="button"
                                className="btn btn-outline text-xs py-1 px-2.5"
                                style={{ borderColor: 'rgba(52, 211, 153, 0.35)', color: '#34d399' }}
                                onClick={() => {
                                  setVerifierInitialCode(sub.voucher_code || '');
                                  setIsVerifierModalOpen(true);
                                }}
                                title="Open verifier for this voucher"
                              >
                                Verify / Redeem
                              </button>
                            </div>
                          </div>

                          {/* Quick Discount Calculator right beside voucher! */}
                          <div className="mt-1">
                            <DiscountCalculator
                              initialDiscountPercent={sub.discount_percent || 15}
                              voucherCode={sub.voucher_code}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons Row */}
                      <div className="submission-actions-row">
                        {/* Primary Watch Video Button */}
                        <button
                          type="button"
                          className="watch-video-btn"
                          onClick={() => setSelectedSubmissionId(sub.id)}
                        >
                          <FiPlay size={15} />
                          <span>Watch Video</span>
                        </button>

                        {/* Secondary Button Row */}
                        <div className="submission-sub-actions">
                          {/* Open Original Link in New Tab */}
                          <a
                            href={sub.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="open-link-btn"
                            title="Open original video URL in new tab"
                          >
                            <FiExternalLink size={14} />
                            <span>Open Link</span>
                          </a>

                          {/* Quick Approve Action */}
                          {sub.status === 'pending' && campaign.status === 'active' && (
                            <button
                              type="button"
                              className="btn btn-primary approve-action-btn"
                              style={
                                sub.submission_type === 'direct_discount'
                                  ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
                                  : undefined
                              }
                              onClick={() => {
                                if (sub.submission_type === 'direct_discount') {
                                  handleApproveDirectDiscount(sub.id);
                                } else {
                                  handleApproveSubmission(sub.id);
                                }
                              }}
                              title={
                                sub.submission_type === 'direct_discount'
                                  ? 'Approve and generate voucher code (no admin needed)'
                                  : 'Approve submission (sends to Admin)'
                              }
                            >
                              <FiCheck size={15} />
                              <span>{sub.submission_type === 'direct_discount' ? 'Approve & Issue Voucher' : 'Approve'}</span>
                            </button>
                          )}

                          {/* Quick Flag Action */}
                          {(sub.status === 'pending' ||
                            sub.status === 'verified' ||
                            sub.status === 'paid') &&
                            campaign.status === 'active' && (
                              <button
                                type="button"
                                className="flag-action-btn"
                                onClick={() => handleFlagSubmission(sub.id)}
                                title="Flag submission for admin review"
                              >
                                <FiFlag size={13} />
                                <span>Flag</span>
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Embedded Video Player Modal */}
      <SubmissionVideoModal
        isOpen={!!selectedSubmission}
        submission={selectedSubmission}
        onClose={() => setSelectedSubmissionId(null)}
        onApprove={(id) => {
          if (selectedSubmission?.submission_type === 'direct_discount') {
            handleApproveDirectDiscount(id);
          } else {
            handleApproveSubmission(id);
          }
        }}
        onFlag={handleFlagSubmission}
        campaignStatus={campaign.status}
      />

      {/* Dedicated Voucher Verifier Modal for Owner */}
      <VoucherVerifierModal
        isOpen={isVerifierModalOpen}
        onClose={() => setIsVerifierModalOpen(false)}
        initialCode={verifierInitialCode}
      />
    </div>
  );
};

export default ManageCampaignDetailPage;
