import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft,
  FiFlag,
  FiRotateCcw,
  FiVideo,
  FiCheck,
  FiPlay,
  FiExternalLink,
  FiEye,
  FiClock,
  FiRefreshCw,
  FiCopy,
  FiSearch,
  FiMoreVertical,
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
import { getCampaignDirectDiscountTiers } from '../../../types/campaign.types';
import DiscountCalculator from '../../../components/ui/DiscountCalculator';


import VoucherVerifierModal from '../../../components/ui/VoucherVerifierModal';
import SendBillModal from '../components/SendBillModal';
import ApproveVoucherModal from '../components/ApproveVoucherModal';
import CampaignCountdownTimer from '../../../components/ui/CampaignCountdownTimer';
import { isDirectDiscountSubmission, normalizeSubmission, isReviewSubmission, getFallbackUniqueVoucherCode, getDirectDiscountBadgeText } from '../../../utils/submissionHelpers';
import toast from 'react-hot-toast';
import './ManageCampaignsPage.css';

export { isReviewSubmission };

type FilterType = 'all' | 'pending' | 'verified' | 'flagged';

const ManageCampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    myCreatedCampaigns,
    fetchMyCreatedCampaigns,
    flagSubmissionByAdvertiser,
    unflagSubmissionByAdvertiser,
    approveSubmissionByAdvertiser,
    approveDirectDiscountSubmission,
    sendBillToCreator,
    isLoading: storeLoading,
  } = useCampaignStore();
  const { showAlert, showConfirm } = useGlobalModalStore();

  const [singleCampaign, setSingleCampaign] = useState<any | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'all_rewards' | 'direct_discount' | 'reviews'>('all_rewards');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isVerifierModalOpen, setIsVerifierModalOpen] = useState(false);
  const [verifierInitialCode, setVerifierInitialCode] = useState('');
  const [isSendBillModalOpen, setIsSendBillModalOpen] = useState(false);
  const [selectedBillSubmission, setSelectedBillSubmission] = useState<any | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedApproveSubmission, setSelectedApproveSubmission] = useState<any | null>(null);
  const [showTopCalculator, setShowTopCalculator] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close dropdown menu when clicking anywhere outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuId(null);
    };
    if (activeMenuId) {
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [activeMenuId]);

  // Direct fetch for fresh submissions & campaign details safely without 406 Not Acceptable
  const fetchCampaignData = useCallback(async () => {
    if (!id) return;
    setIsFetchingDirect(true);
    try {
      const { data: campaignRes, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (campErr) throw campErr;

      const { data: subRes, error: subErr } = await supabase
        .from('submissions')
        .select('*')
        .eq('campaign_id', id)
        .order('submitted_at', { ascending: false });

      if (subErr) throw subErr;

      // Safely batch-fetch creator profiles
      const creatorIds = Array.from(new Set((subRes || []).map((s: any) => s.creator_id).filter(Boolean)));
      let profilesMap: Record<string, any> = {};
      if (creatorIds.length > 0) {
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', creatorIds);
          (profilesData || []).forEach((p: any) => {
            profilesMap[p.id] = p;
          });
        } catch (pErr) {
          console.warn('Could not batch load creator profiles:', pErr);
        }
      }

      setSingleCampaign({
        ...campaignRes,
        submissions: (subRes || []).map((sub: any) =>
          normalizeSubmission({
            ...sub,
            creator: profilesMap[sub.creator_id] || sub.creator || null,
          })
        ),
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

  // Extract configured direct discount tiers for this campaign
  const directDiscountTiers = useMemo(() => getCampaignDirectDiscountTiers(campaign), [campaign]);

  // Check if owner configured any direct discount tier
  const hasDirectDiscountOption = useMemo(() => {
    if (directDiscountTiers.length > 0) return true;
    let termsObj = campaign?.terms;
    if (typeof termsObj === 'string') {
      try {
        termsObj = JSON.parse(termsObj);
      } catch {}
    }
    return Array.isArray(termsObj?.direct_discount_tiers) && termsObj.direct_discount_tiers.length > 0;
  }, [directDiscountTiers, campaign]);

  // Check if owner configured any review / rate us perk
  const hasReviewOption = useMemo(() => {
    // 1. Direct discount tiers containing 'review' or 'rate'
    const hasTier = directDiscountTiers.some((t) => {
      const term = (t.term || '').toLowerCase();
      return term.includes('review') || term.includes('rate');
    });
    if (hasTier) return true;

    // 2. Terms direct_discount_tiers
    let termsObj = campaign?.terms;
    if (typeof termsObj === 'string') {
      try {
        termsObj = JSON.parse(termsObj);
      } catch {}
    }
    if (Array.isArray(termsObj?.direct_discount_tiers)) {
      const inTerms = termsObj.direct_discount_tiers.some((t: any) => {
        const term = (t?.term || '').toLowerCase();
        return term.includes('review') || term.includes('rate');
      });
      if (inTerms) return true;
    }

    // 3. Campaign top-level review_url
    if (campaign?.review_url && typeof campaign.review_url === 'string' && campaign.review_url.trim()) {
      return true;
    }

    return false;
  }, [directDiscountTiers, campaign]);

  // Split submissions by mode using bulletproof helper
  const reviewSubmissions = useMemo(
    () => submissions.filter((s: any) => isReviewSubmission(s)),
    [submissions]
  );
  const discountSubmissions = useMemo(
    () => submissions.filter((s: any) => isDirectDiscountSubmission(s) && !isReviewSubmission(s)),
    [submissions]
  );
  const rewardSubmissions = useMemo(
    () => submissions.filter((s: any) => !isDirectDiscountSubmission(s) && !isReviewSubmission(s)),
    [submissions]
  );

  // Review mode is ONLY visible if the owner set review type discount tiers (or has existing review submissions)
  const showReviewMode = hasReviewOption || reviewSubmissions.length > 0;

  // Direct discount mode is ONLY visible if the owner set direct discount tiers (or has existing discount submissions)
  const showDiscountMode = hasDirectDiscountOption || discountSubmissions.length > 0;

  // Auto-switch mode if current mode becomes unavailable
  useEffect(() => {
    if (submissionMode === 'reviews' && !showReviewMode) {
      setSubmissionMode(showDiscountMode ? 'direct_discount' : 'all_rewards');
    } else if (submissionMode === 'direct_discount' && !showDiscountMode) {
      setSubmissionMode('all_rewards');
    }
  }, [submissionMode, showReviewMode, showDiscountMode]);

  const currentModeSubmissions = useMemo(() => {
    if (submissionMode === 'all_rewards') return rewardSubmissions;
    if (submissionMode === 'direct_discount') return discountSubmissions;
    return reviewSubmissions;
  }, [submissionMode, rewardSubmissions, discountSubmissions, reviewSubmissions]);


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
    const sub = (campaign?.submissions || []).find((s: any) => s.id === submissionId);
    if (sub && (sub.status === 'verified' || sub.status === 'paid')) {
      toast.error('Approved submissions cannot be flagged.');
      return;
    }

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

  const handleUnflagSubmission = async (submissionId: string) => {
    const confirmed = await showConfirm(
      'Unflag this submission and restore it to Pending review?',
      'Unflag Submission'
    );
    if (!confirmed) return;

    try {
      await unflagSubmissionByAdvertiser(submissionId);
      setSingleCampaign((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: (prev.submissions || []).map((s: any) =>
            s.id === submissionId ? { ...s, status: 'pending' } : s
          ),
        };
      });
      toast.success('Submission unflagged and restored to pending');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to unflag submission. Please try again.');
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

  const handleOpenApproveModal = (submissionId: string) => {
    const subObj = submissions.find((s: any) => s.id === submissionId);
    if (!subObj) return;
    setSelectedApproveSubmission(subObj);
    setIsApproveModalOpen(true);
  };

  const handleConfirmApprove = async (options: {
    mode: 'discount' | 'custom_message';
    discountPercent?: number;
    customMessage?: string;
  }) => {
    if (!selectedApproveSubmission) return;
    const submissionId = selectedApproveSubmission.id;
    try {
      const voucherCode = await approveDirectDiscountSubmission(submissionId, options);
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
                  discount_percent: options.mode === 'custom_message' ? 0 : options.discountPercent,
                  voucher_details: {
                    ...(s.voucher_details || {}),
                    reward_type: options.mode === 'custom_message' ? 'custom_message' : 'discount',
                    is_custom_reward: options.mode === 'custom_message',
                    custom_message: options.mode === 'custom_message' ? options.customMessage : undefined,
                  },
                  verified_at: new Date().toISOString(),
                }
              : s
          ),
        };
      });
      if (options.mode === 'custom_message') {
        toast.success(`Custom reward approved! Voucher Code: ${voucherCode} generated.`);
      } else {
        toast.success(`Direct discount approved! Voucher Code: ${voucherCode} (${options.discountPercent}% OFF) generated.`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to approve submission.');
      throw err;
    }
  };

  const getStatusBadge = (status: string, isDirectDiscount: boolean = false) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'verified':
      case 'approved':
        return <Badge variant="success" size="sm">{isDirectDiscount ? 'Approved' : 'Approved (Pending Admin)'}</Badge>;
      case 'paid':
        return <Badge variant="accent" size="sm">{isDirectDiscount ? 'Approved' : 'Admin Approved & Paid'}</Badge>;
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

          {/* Campaign Ending Live Countdown Timer */}
          <div className="mt-5">
            <CampaignCountdownTimer
              createdAt={campaign.created_at}
              endDate={campaign.end_date}
              durationDays={campaign.verification_days || 35}
              status={campaign.status}
            />
          </div>
        </motion.div>

        {/* Mode Switcher: All Campaign Rewards vs Direct Discount vs Reviews */}
        {(showDiscountMode || showReviewMode) && (
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

            {showDiscountMode && (
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
            )}

            {/* Golden Option Button only visible to owners who have set review type discount tiers */}
            {showReviewMode && (
              <button
                type="button"
                className={`mode-switch-btn highlight-reviews-gold ${submissionMode === 'reviews' ? 'active' : ''}`}
                onClick={() => {
                  setSubmissionMode('reviews');
                  setActiveFilter('all');
                }}
              >
                <span>⭐ Reviews / Rate Us Submissions</span>
                <span className="mode-pill-badge gold-badge">{reviewSubmissions.length}</span>
              </button>
            )}
          </div>
        )}

        {/* Direct Discount Top Banner with Verifier & Calculator Shortcuts */}
        {submissionMode === 'direct_discount' && showDiscountMode && (
          <div className="direct-discount-banner">
            <div className="direct-discount-banner-text">
              <h4>🏷️ Direct Discount Videos & Vouchers</h4>
              <p>
                Direct discount videos only require your approval (Admin review is not needed). Approving automatically creates an authentic voucher code and notifies both you and the creator.
              </p>
            </div>
            <div className="direct-discount-banner-actions">
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
              <button
                type="button"
                className={`btn-open-calc ${showTopCalculator ? 'active' : ''}`}
                onClick={() => setShowTopCalculator(!showTopCalculator)}
              >
                <span>🧮</span>
                <span>{showTopCalculator ? 'Hide Calculator' : 'Discount Calculator'}</span>
              </button>
            </div>

            {/* Direct Discount Calculator for Owner right beside Verifier */}
            {showTopCalculator && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 w-full">
                <DiscountCalculator
                  initialDiscountPercent={campaign?.payout_tiers?.[0]?.payout_amount || 15}
                  isLockedPercent={false}
                  inline={true}
                  isOwner={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Reviews / Rate Us Top Golden Banner with Verifier & Calculator Shortcuts */}
        {submissionMode === 'reviews' && showReviewMode && (
          <div className="reviews-gold-banner">
            <div className="reviews-gold-banner-text">
              <h4>⭐ Reviews / Rate Us Submissions</h4>
              <p>
                Customers who opened and rated using your configured review link. You can review and approve them directly (no admin approval required) to issue discount vouchers and send bills.
              </p>
            </div>
            <div className="direct-discount-banner-actions">
              <button
                type="button"
                className="btn-open-verifier gold-verifier-btn"
                onClick={() => {
                  setVerifierInitialCode('');
                  setIsVerifierModalOpen(true);
                }}
              >
                <FiSearch size={14} />
                <span>Verify Customer Voucher</span>
              </button>
              <button
                type="button"
                className={`btn-open-calc ${showTopCalculator ? 'active' : ''}`}
                onClick={() => setShowTopCalculator(!showTopCalculator)}
              >
                <span>🧮</span>
                <span>{showTopCalculator ? 'Hide Calculator' : 'Discount Calculator'}</span>
              </button>
            </div>

            {/* Direct Discount Calculator for Owner right beside Verifier */}
            {showTopCalculator && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 w-full">
                <DiscountCalculator
                  initialDiscountPercent={campaign?.payout_tiers?.[0]?.payout_amount || 15}
                  isLockedPercent={false}
                  inline={true}
                  isOwner={true}
                />
              </div>
            )}
          </div>
        )}

        {/* Submissions Section Header & Filter Tabs */}
        <div className="submissions-section-header">
          <div className="submissions-title-row">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xl text-white">
                {submissionMode === 'all_rewards'
                  ? 'Campaign Reward Videos'
                  : submissionMode === 'direct_discount'
                  ? 'Direct Discount Submissions'
                  : '⭐ Reviews & Rate Us Submissions'}
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
                const isReview = isReviewSubmission(sub);
                const isDirectDisc = isDirectDiscountSubmission(sub) || isReview;

                return (
                  <motion.div
                    key={sub.id}
                    className="submission-card-rich glass-strong"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    {/* Video Thumbnail Box with Play Overlay / Review Card */}
                    <div
                      className={`submission-thumb-box ${isReview ? 'review-proof-box' : ''}`}
                      onClick={() => {
                        if (isReview) {
                          if (sub.video_url) {
                            window.open(sub.video_url, '_blank', 'noopener,noreferrer');
                          }
                        } else {
                          setSelectedSubmissionId(sub.id);
                        }
                      }}
                      title={isReview ? 'Click to open verified review link' : 'Click to watch video or view media'}
                    >
                      {isReview ? (
                        <div className="submission-thumb-fallback review-proof-thumb">
                          <div className="review-star-circle">
                            <span className="text-3xl">⭐</span>
                          </div>
                          <span className="review-target-tag">
                            REVIEW / RATE US
                          </span>
                          <span className="review-click-hint flex items-center gap-1.5 text-xs text-amber-300 font-bold mt-1">
                            <span>Open Review Page</span>
                            <FiExternalLink size={12} />
                          </span>
                        </div>
                      ) : thumbnail ? (
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
                            {platform.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Play Button Overlay (only for non-reviews) */}
                      {!isReview && (
                        <div className="submission-play-overlay">
                          <div className="play-icon-badge">
                            <FiPlay size={20} className="text-white ml-0.5" />
                          </div>
                          <span className="play-text-pill">Watch Video / View Media</span>
                        </div>
                      )}

                      {/* Creator Profile & Platform on Top Left of Thumbnail */}
                      <div className="submission-thumb-creator-pill" onClick={(e) => e.stopPropagation()}>
                        <Avatar
                          src={sub.creator?.avatar_url}
                          name={sub.creator?.full_name || 'Creator'}
                          size="xs"
                        />
                        <span className="creator-thumb-name" title={sub.creator?.full_name || sub.creator?.username}>
                          @{sub.creator?.username || sub.creator?.full_name || 'creator'}
                        </span>
                        {platformIcon && !isReview && (
                          <img
                            src={platformIcon}
                            alt={platform}
                            className="creator-thumb-platform-icon"
                          />
                        )}
                      </div>

                      {/* Status Badge + Three-dot menu at top right of video thumbnail */}
                      <div className="submission-thumb-top-right" onClick={(e) => e.stopPropagation()}>
                        <div className="submission-status-badge-wrap">
                          {getStatusBadge(
                            sub.status,
                            isDirectDisc ||
                              submissionMode === 'direct_discount' ||
                              submissionMode === 'reviews' ||
                              campaign?.type === 'discount'
                          )}
                        </div>

                        <div className="submission-menu-container">
                          <button
                            type="button"
                            className="submission-menu-btn"
                            aria-label="More options"
                            title="More options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === sub.id ? null : sub.id));
                            }}
                          >
                            <FiMoreVertical size={16} />
                          </button>

                          {activeMenuId === sub.id && (
                            <div className="submission-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="submission-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(sub.video_url || '');
                                  toast.success('Link copied to clipboard!');
                                  setActiveMenuId(null);
                                }}
                              >
                                <FiCopy size={14} />
                                <span>Copy Link</span>
                              </button>

                              <a
                                href={sub.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="submission-dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              >
                                <FiExternalLink size={14} />
                                <span>Open in New Tab</span>
                              </a>

                              {sub.status === 'pending' && campaign.status === 'active' && (
                                <button
                                  type="button"
                                  className="submission-dropdown-item text-danger"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    handleFlagSubmission(sub.id);
                                  }}
                                >
                                  <FiFlag size={14} />
                                  <span>Flag Submission</span>
                                </button>
                              )}

                              {sub.status === 'flagged' && campaign.status === 'active' && (
                                <button
                                  type="button"
                                  className="submission-dropdown-item text-warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    handleUnflagSubmission(sub.id);
                                  }}
                                >
                                  <FiRotateCcw size={14} />
                                  <span>Unflag Submission</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submission Content Info */}
                    <div className="submission-body">

                      {/* Metrics strip */}
                      <div className="submission-metrics-row">
                        {!isReview && (
                          <div className="metric-pill">
                            <FiEye size={14} className="text-accent" />
                            <span className="text-white font-bold text-xs">
                              {formatCount(sub.current_views || 0)} views
                            </span>
                          </div>
                        )}
                        <div className="metric-pill">
                          <FiClock size={14} className="text-secondary" />
                          <span className="text-secondary text-xs">
                            {new Date(sub.submitted_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {isReview ? (
                          <>
                            <Badge variant="warning" size="sm">
                              ⭐ Review / Rate Us
                            </Badge>
                            {sub.voucher_details?.reward_text && (
                              <Badge variant="accent" size="sm">
                                🏷️ {sub.voucher_details.reward_text}
                              </Badge>
                            )}
                          </>
                        ) : isDirectDiscountSubmission(sub) ? (
                          <>
                            <Badge variant="warning" size="sm">
                              {getDirectDiscountBadgeText(sub, campaign)}
                            </Badge>
                            {sub.voucher_details?.reward_text && (
                              <Badge variant="accent" size="sm">
                                🎁 {sub.voucher_details.reward_text}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="accent" size="sm">
                            🏆 All Rewards
                          </Badge>
                        )}
                      </div>

                      {/* Direct Discount / Review Voucher Details (Clean & Uncluttered) */}
                      {isDirectDisc && (sub.status === 'verified' || sub.status === 'paid') && (
                        <div className="submission-voucher-box">
                          {/* Clean Voucher Code & Status Header */}
                          <div className="voucher-card-header">
                            <div className="voucher-code-wrapper">
                              <span className="voucher-code-pill">
                                🎟️ {sub.voucher_code || getFallbackUniqueVoucherCode(sub.id)}
                              </span>
                              <button
                                type="button"
                                className="icon-btn voucher-copy-icon-btn"
                                onClick={() => {
                                  const codeToCopy = sub.voucher_code || getFallbackUniqueVoucherCode(sub.id);
                                  navigator.clipboard.writeText(codeToCopy);
                                  toast.success('Voucher code copied!');
                                }}
                                title="Copy voucher code"
                              >
                                <FiCopy size={13} />
                              </button>
                            </div>
                            <div className="voucher-actions-wrapper">
                              {/* If custom message reward, do NOT show Send Bill button */}
                              {sub.voucher_details?.is_custom_reward || sub.voucher_details?.reward_type === 'custom_message' ? (
                                <div className="voucher-custom-reward-tag">
                                  <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg">
                                    <span>🎁</span>
                                    <span>{sub.voucher_details?.custom_message || 'Custom Reward'}</span>
                                  </span>
                                </div>
                              ) : (
                                /* Shining Red Send Bill Button for Direct Discount & Reviews (becomes View Bill once billed) */
                                <button
                                  type="button"
                                  className="btn-send-bill-shining"
                                  onClick={() => {
                                    setSelectedBillSubmission(sub);
                                    setIsSendBillModalOpen(true);
                                  }}
                                  title={
                                    sub.voucher_details?.bill_amount
                                      ? 'View sent bill details'
                                      : 'Send bill to customer with pre-set discount'
                                  }
                                >
                                  <span className="shimmer-sweep-red" />
                                  <span className="btn-bill-icon">🧾</span>
                                  <span>
                                    {sub.voucher_details?.bill_amount ? 'View Bill' : 'Send Bill'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quick Approve Action if pending */}
                      {sub.status === 'pending' && campaign.status === 'active' && (
                        <div className="submission-actions-row">
                          <button
                            type="button"
                            className="btn btn-primary approve-action-btn w-full"
                            style={
                              isReview
                                ? { background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', color: '#1a1300', fontWeight: 800 }
                                : isDirectDisc ||
                                  submissionMode === 'direct_discount' ||
                                  submissionMode === 'reviews' ||
                                  campaign?.type === 'discount'
                                ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
                                : undefined
                            }
                            onClick={() => {
                              if (
                                isReview ||
                                isDirectDisc ||
                                submissionMode === 'direct_discount' ||
                                submissionMode === 'reviews' ||
                                campaign?.type === 'discount'
                              ) {
                                handleOpenApproveModal(sub.id);
                              } else {
                                handleApproveSubmission(sub.id);
                              }
                            }}
                            title={
                              isReview ||
                              isDirectDisc ||
                              submissionMode === 'direct_discount' ||
                              submissionMode === 'reviews' ||
                              campaign?.type === 'discount'
                                ? 'Approve and generate voucher code (no admin needed)'
                                : 'Approve submission (sends to Admin)'
                            }
                          >
                            <FiCheck size={15} />
                            <span>
                              {isReview
                                ? '⭐ Approve & Issue Voucher'
                                : isDirectDisc ||
                                  submissionMode === 'direct_discount' ||
                                  submissionMode === 'reviews' ||
                                  campaign?.type === 'discount'
                                ? 'Approve & Issue Voucher'
                                : 'Approve'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Unflag Action if flagged by mistake */}
                      {sub.status === 'flagged' && campaign.status === 'active' && (
                        <div className="submission-actions-row">
                          <button
                            type="button"
                            className="btn btn-outline unflag-action-btn w-full"
                            style={{
                              borderColor: 'rgba(245, 158, 11, 0.45)',
                              background: 'rgba(245, 158, 11, 0.08)',
                              color: '#fbbf24',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '10px 16px',
                              borderRadius: '10px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleUnflagSubmission(sub.id)}
                            title="Restore submission back to pending review"
                          >
                            <FiRotateCcw size={15} />
                            <span>Unflag Submission (Restore to Pending)</span>
                          </button>
                        </div>
                      )}
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
          if (isDirectDiscountSubmission(selectedSubmission)) {
            handleOpenApproveModal(id);
          } else {
            handleApproveSubmission(id);
          }
        }}
        onFlag={handleFlagSubmission}
        onUnflag={handleUnflagSubmission}
        campaignStatus={campaign.status}
      />

      {/* Dedicated Voucher Verifier Modal for Owner */}
      <VoucherVerifierModal
        isOpen={isVerifierModalOpen}
        onClose={() => setIsVerifierModalOpen(false)}
        initialCode={verifierInitialCode}
      />

      {/* Approve & Issue Voucher Modal with Discount vs Custom Message options */}
      <ApproveVoucherModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setSelectedApproveSubmission(null);
        }}
        submission={selectedApproveSubmission}
        campaign={campaign}
        onApprove={handleConfirmApprove}
      />

      {/* Send Bill Modal for Direct Discount Videos */}
      <SendBillModal
        isOpen={isSendBillModalOpen}
        onClose={() => {
          setIsSendBillModalOpen(false);
          setSelectedBillSubmission(null);
        }}
        submission={selectedBillSubmission}
        campaign={campaign}
        onSendBill={async (submissionId, billData) => {
          const success = await sendBillToCreator(submissionId, billData);
          if (success) {
            setSingleCampaign((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                submissions: (prev.submissions || []).map((s: any) =>
                  s.id === submissionId
                    ? {
                        ...s,
                        voucher_details: {
                          ...(s.voucher_details || {}),
                          bill_amount: billData.bill_amount,
                          discount_percent: billData.discount_percent,
                          discount_amount: billData.discount_amount,
                          final_payable: billData.final_payable,
                          note: billData.note || null,
                          billed_at: new Date().toISOString(),
                          status: 'billed',
                        },
                        earned_amount: billData.discount_amount,
                      }
                    : s
                ),
              };
            });
            fetchCampaignData();
          }
          return success;
        }}
      />
    </div>
  );
};

export default ManageCampaignDetailPage;
