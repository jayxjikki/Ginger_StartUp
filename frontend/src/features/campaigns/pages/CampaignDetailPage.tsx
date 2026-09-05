// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Detail Page
// Full campaign view with payout tiers, requirements, submit
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  FiArrowLeft, FiShare2, FiMapPin, FiClock, FiUsers,
  FiExternalLink, FiCheck, FiAlertCircle, FiTrash2, FiCopy,
  FiX, FiUpload
} from 'react-icons/fi';
import DiscountCalculator from '../../../components/ui/DiscountCalculator';
import { validateAllowedVideoUrl } from '../../../utils/videoHelpers';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useCampaignStore } from '../../../store/campaignStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { useUgcStore } from '../../../store/ugcStore';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Input from '../../../components/ui/Input';
import { formatCurrency, formatCount, formatTimeLeft } from '../../../utils/formatters';
import { getCampaignImages, parseTierReward, getCampaignDirectDiscountTiers } from '../../../types/campaign.types';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { CampaignImageSlideshow } from '../../../components/ui/CampaignImageSlideshow';
import { isDirectDiscountSubmission, normalizeSubmission, encodeVideoId } from '../../../utils/submissionHelpers';
import CampaignShareModal from '../../../components/ui/CampaignShareModal';
import './CampaignDetailPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

interface ExpandableDetailValueProps {
  text: string;
  limit?: number;
}

const ExpandableDetailValue: React.FC<ExpandableDetailValueProps> = ({ text, limit = 48 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return <span className="info-value">{text}</span>;
  }

  const truncated = text.slice(0, limit).trim();

  return (
    <div className="info-expandable-wrap">
      <span className="info-value">
        {isExpanded ? text : `${truncated}...`}
      </span>
      <button
        type="button"
        className="info-read-more-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        {isExpanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
};

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, savedCampaignIds, fetchSavedCampaigns, toggleSavedCampaign } = useCampaignStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { reportItem } = useUgcStore();
  const { showConfirm } = useGlobalModalStore();

  const [singleCampaign, setSingleCampaign] = useState<any | null>(null);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(true);

  // Direct fetch for fresh campaign details (fixes reload & direct link/QR opens)
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadCampaign = async () => {
      // If already in Zustand, use it immediately
      const existing = campaigns.find((c) => c.id === id);
      if (existing) {
        setSingleCampaign(existing);
        setIsLoadingCampaign(false);
      } else {
        setIsLoadingCampaign(true);
      }

      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*, advertiser:profiles(*), payout_tiers(*)')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching campaign:', error);
        } else if (data && isMounted) {
          setSingleCampaign(data);
        }
      } catch (err) {
        console.error('Failed to load campaign:', err);
      } finally {
        if (isMounted) {
          setIsLoadingCampaign(false);
        }
      }
    };

    loadCampaign();

    return () => {
      isMounted = false;
    };
  }, [id, campaigns]);

  const campaign = useMemo(() => {
    if (singleCampaign) return singleCampaign;
    return campaigns.find((c) => c.id === id) || null;
  }, [singleCampaign, campaigns, id]);

  const isExpired = campaign?.end_date ? new Date(campaign.end_date) < new Date() : false;
  const isCampaignOwner = !!user && !!campaign && (
    user.id === campaign.advertiser_id || 
    user.id === (campaign.advertiser as any)?.id
  );
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [userSubmission, setUserSubmission] = useState<any | null>(null);

  const [submissionType, setSubmissionType] = useState<'all_rewards' | 'direct_discount'>('all_rewards');
  const [selectedDirectTierIdx, setSelectedDirectTierIdx] = useState(0);
  const [visitMediaFile, setVisitMediaFile] = useState<File | null>(null);
  const [visitMediaUrl, setVisitMediaUrl] = useState('');
  const [isUploadingVisitMedia, setIsUploadingVisitMedia] = useState(false);
  const [isReviewVerified, setIsReviewVerified] = useState(false);
  const [storyUrl, setStoryUrl] = useState('');

  const directDiscountTiers = useMemo(() => getCampaignDirectDiscountTiers(campaign), [campaign]);
  const hasDirectDiscountTiers = directDiscountTiers.length > 0;
  const standardRewardTiers = useMemo(() => {
    if (!campaign?.payout_tiers || !Array.isArray(campaign.payout_tiers)) return [];
    return campaign.payout_tiers.filter((tier: any) => {
      const parsed = parseTierReward(tier);
      return !parsed.isDirectDiscount;
    });
  }, [campaign]);
  const hasRewardTiers = standardRewardTiers.length > 0 || ((campaign?.prize_pool || 0) > 0);
  const showAllRewardsOption = hasRewardTiers || !hasDirectDiscountTiers;

  useEffect(() => {
    if (!hasRewardTiers && hasDirectDiscountTiers) {
      setSubmissionType('direct_discount');
    } else if (!hasDirectDiscountTiers) {
      setSubmissionType('all_rewards');
    }
  }, [hasRewardTiers, hasDirectDiscountTiers]);

  const activeDirectTier = directDiscountTiers[selectedDirectTierIdx] || directDiscountTiers[0];

  const activeTermLower = (activeDirectTier?.term || '').toLowerCase();
  const isVideoAction = activeTermLower.includes('video') || activeTermLower.includes('shoot');
  const isVisitAction = activeTermLower.includes('visit');
  const isStoryAction = activeTermLower.includes('story') || activeTermLower.includes('highlight');
  const isReviewAction = activeTermLower.includes('review') || activeTermLower.includes('rate');

  const targetReviewUrl = useMemo(() => {
    if (activeDirectTier?.review_url?.trim()) {
      return activeDirectTier.review_url.trim();
    }
    const query = encodeURIComponent(`${campaign?.title || 'Business'} ${campaign?.location || ''} reviews`.trim());
    return `https://www.google.com/search?q=${query}`;
  }, [activeDirectTier, campaign]);

  const openSubmitModal = () => {
    setVideoUrl('');
    setStoryUrl('');
    setVisitMediaFile(null);
    setVisitMediaUrl('');
    setIsReviewVerified(false);
    setSelectedDirectTierIdx(0);
    if (!hasRewardTiers && hasDirectDiscountTiers) {
      setSubmissionType('direct_discount');
    } else if (!hasDirectDiscountTiers) {
      setSubmissionType('all_rewards');
    }
    setShowSubmitModal(true);
  };

  const handleVisitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error('File size exceeds 25MB limit. Please select a smaller photo or video.');
      return;
    }

    setVisitMediaFile(file);
    setIsUploadingVisitMedia(true);
    try {
      const url = await uploadToCloudinary(file, user?.id);
      setVisitMediaUrl(url);
      toast.success('Visit proof uploaded successfully!');
    } catch (err: any) {
      console.warn('Cloudinary upload error, using local file URL fallback:', err);
      const localUrl = URL.createObjectURL(file);
      setVisitMediaUrl(localUrl);
      toast.success('Visit proof selected!');
    } finally {
      setIsUploadingVisitMedia(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit.');
      return;
    }
    if (isCampaignOwner) {
      toast.error('Campaign owners cannot submit to their own campaigns.');
      return;
    }

    let finalUrl = '';
    let finalPlatform = 'video';
    let voucherDetails: any = null;

    if (submissionType === 'all_rewards') {
      if (!videoUrl || !videoUrl.trim()) {
        toast.error('Please enter a video URL.');
        return;
      }

      const validation = validateAllowedVideoUrl(videoUrl);
      if (!validation.isValid) {
        toast.error(validation.error || 'Only YouTube, Instagram, or Facebook video links are allowed.');
        return;
      }

      finalPlatform = validation.platform;

      if (campaign?.required_platforms && campaign.required_platforms.length > 0) {
        const requiredLower = campaign.required_platforms.map((p: string) => p.toLowerCase());
        if (!requiredLower.includes(finalPlatform)) {
          toast.error(`Invalid link. This campaign only accepts: ${campaign.required_platforms.join(', ')}`);
          return;
        }
      }

      finalUrl = videoUrl.trim();
    } else {
      // Direct Discount submission
      if (!activeDirectTier) {
        toast.error('Please select a valid direct discount option.');
        return;
      }

      if (isVideoAction) {
        if (!videoUrl || !videoUrl.trim()) {
          toast.error('Please enter your video URL.');
          return;
        }
        const validation = validateAllowedVideoUrl(videoUrl);
        if (!validation.isValid) {
          toast.error(validation.error || 'Only YouTube, Instagram, or Facebook video links are allowed.');
          return;
        }
        finalPlatform = validation.platform;
        finalUrl = videoUrl.trim();
      } else if (isVisitAction) {
        if (!visitMediaUrl) {
          toast.error('Please upload a raw photo or video proof of your store visit.');
          return;
        }
        finalUrl = visitMediaUrl;
        const isVideo = visitMediaFile?.type.startsWith('video/') || /\.(mp4|webm|mov|avi)$/i.test(finalUrl);
        finalPlatform = isVideo ? 'video' : 'image';
      } else if (isStoryAction) {
        if (!storyUrl || !storyUrl.trim()) {
          toast.error('Please enter your story or highlight link.');
          return;
        }
        try {
          new URL(storyUrl.trim());
        } catch {
          toast.error('Please enter a valid URL for your story or highlight.');
          return;
        }
        finalUrl = storyUrl.trim();
        finalPlatform = finalUrl.toLowerCase().includes('instagram') ? 'instagram' : 'facebook';
      } else if (isReviewAction) {
        if (!isReviewVerified) {
          toast.error('Please click the review link to open and rate before submitting.');
          return;
        }
        finalUrl = targetReviewUrl;
        finalPlatform = 'review';
      } else {
        if (!videoUrl || !videoUrl.trim()) {
          toast.error('Please enter a submission link.');
          return;
        }
        finalUrl = videoUrl.trim();
        finalPlatform = 'other';
      }

      voucherDetails = {
        action_term: activeDirectTier.term,
        reward_text: activeDirectTier.reward,
        review_url: activeDirectTier.review_url || (isReviewAction ? targetReviewUrl : undefined),
        review_verified: isReviewAction ? isReviewVerified : undefined,
        submitted_media_url: finalUrl,
        submitted_media_type: isVisitAction ? (finalPlatform === 'video' ? 'video' : 'image') : undefined,
      };
    }

    setIsSubmitting(true);
    try {
      const persistentVideoId = encodeVideoId(
        submissionType,
        `${(activeDirectTier?.term || 'reward').toLowerCase().replace(/\s+/g, '_')}::${Date.now()}`
      );
      const insertPayload: any = {
        campaign_id: campaign!.id,
        creator_id: user.id,
        video_url: finalUrl,
        platform: finalPlatform,
        video_id: persistentVideoId,
        submission_type: submissionType,
        voucher_details: voucherDetails,
      };

      let { error } = await supabase.from('submissions').insert(insertPayload);

      // Safe fallback if remote table does not have submission_type or voucher_details column yet
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('submission_type') || error.message?.toLowerCase().includes('voucher_details'))) {
        delete insertPayload.voucher_details;
        delete insertPayload.submission_type;
        const retryRes = await supabase.from('submissions').insert(insertPayload);
        error = retryRes.error;
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already submitted for this campaign.');
        }
        throw error;
      }

      // Notify owner
      if (campaign?.advertiser_id) {
        const creatorName = user.user_metadata?.full_name || user.user_metadata?.username || 'A customer';
        const notifMsg = isReviewAction
          ? `⭐ New Review / Rating Submission from @${creatorName} for "${campaign.title}" claiming ${activeDirectTier?.reward || 'Discount'}!`
          : submissionType === 'direct_discount'
            ? `🏷️ New Direct Discount Submission (${activeDirectTier?.term || 'Perk'}) from @${creatorName} for "${campaign.title}"!`
            : `🎬 New Video Submission from @${creatorName} on "${campaign.title}"!`;

        try {
          await supabase.from('notifications').insert({
            user_id: campaign.advertiser_id,
            actor_id: user.id,
            type: 'system',
            entity_id: campaign.id,
            content: notifMsg,
          });
        } catch {
          // Non-blocking notification error
        }
      }

      toast.success(
        isReviewAction
          ? 'Review verified and submitted! The campaign owner will issue your discount voucher.'
          : 'Submitted successfully!'
      );
      setShowSubmitModal(false);
      setVideoUrl('');
      setStoryUrl('');
      setVisitMediaFile(null);
      setVisitMediaUrl('');
      setIsReviewVerified(false);

      // Update local state to hide button immediately
      setUserSubmission(normalizeSubmission({
        campaign_id: campaign!.id,
        creator_id: user.id,
        status: 'pending',
        current_views: 0,
        earned_amount: 0,
        video_url: finalUrl,
        platform: finalPlatform,
        video_id: persistentVideoId,
        submission_type: submissionType,
        voucher_details: voucherDetails,
        submitted_at: new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSubmission = async () => {
    if (!userSubmission || !user) return;
    const confirmed = await showConfirm(
      'Are you sure you want to remove your video submission? You will be able to submit a new video link.',
      'Remove Submission'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('campaign_id', campaign!.id)
        .eq('creator_id', user.id);

      if (error) throw error;

      setUserSubmission(null);
      setVideoUrl('');
      toast.success('Submission removed! You can now submit a new video link.');
    } catch (err: any) {
      console.error('Error removing submission:', err);
      toast.error(err.message || 'Failed to remove submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!campaign) return;
    const fetchTopEarners = async () => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*, creator:profiles(*)')
          .eq('campaign_id', campaign.id)
          .order('earned_amount', { ascending: false })
          .limit(3);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setTopEarners(data.map((sub, index) => ({
            rank: index + 1,
            name: sub.creator?.full_name || 'Unknown',
            views: sub.current_views || 0,
            earned: sub.earned_amount || 0
          })));
        } else {
          setTopEarners([]);
        }
      } catch (err) {
        console.error('Error fetching top earners:', err);
      }
    };
    fetchTopEarners();
  }, [campaign?.id]);

  // Fetch User's Submission
  useEffect(() => {
    if (!campaign || !user) return;
    
    const fetchSubmission = async () => {
      try {
        const { data } = await supabase
          .from('submissions')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('creator_id', user.id)
          .single();
        
        if (data) {
          setUserSubmission(normalizeSubmission(data));
        }
      } catch (err) {
        // Ignored, user just hasn't submitted yet
      }
    };
    
    fetchSubmission();
    if (user?.id) {
      fetchSavedCampaigns(user.id);
    }
  }, [campaign?.id, user?.id, fetchSavedCampaigns]);

  if (isLoadingCampaign && !campaign) {
    return (
      <div className="page-content container" style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', borderColor: 'rgba(255, 107, 43, 0.2)', borderTopColor: '#ff6b2b' }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="page-content container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h3 className="text-lg font-bold text-white mb-2">Campaign Not Found</h3>
        <p className="text-sm text-secondary mb-4">This campaign may have been removed or the link is invalid.</p>
        <Button variant="secondary" onClick={() => navigate('/campaigns')}>Browse Campaigns</Button>
      </div>
    );
  }

  const safePrizePool = campaign.prize_pool || 0;
  const safeRemainingPool = campaign.remaining_pool != null ? campaign.remaining_pool : safePrizePool;
  const poolUsedPercent = safePrizePool > 0 
    ? Math.max(0, Math.min(100, ((safePrizePool - safeRemainingPool) / safePrizePool) * 100))
    : 0;

  return (
    <div className="page-content">
      <motion.div
        className="container campaign-detail"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Top Bar */}
        <motion.div className="detail-topbar" variants={fadeUp}>
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft />
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="icon-btn" 
              onClick={() => {
                if (user?.id) toggleSavedCampaign(campaign.id, user.id);
              }}
              style={{ color: savedCampaignIds.includes(campaign.id) ? 'var(--text-accent)' : 'inherit' }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: savedCampaignIds.includes(campaign.id) ? "'FILL' 1" : "'FILL' 0" }}>
                bookmark
              </span>
            </button>
            <button
              className="icon-btn"
              aria-label="Share Campaign"
              onClick={() => setIsShareModalOpen(true)}
              title="Share Campaign (QR & Link)"
            >
              <FiShare2 />
            </button>
            {!isCampaignOwner && (
              <button 
                className="icon-btn" 
                aria-label="Report Campaign"
                onClick={async () => {
                  const confirmed = await showConfirm("Are you sure you want to report this campaign? Our moderation team will review it.", "Report Campaign");
                  if (confirmed && campaign) {
                    await reportItem(campaign.id, 'campaign', 'Inappropriate content or spam');
                  }
                }}
              >
                <FiAlertCircle />
              </button>
            )}
          </div>
        </motion.div>

        {/* Campaign Type & Timer */}
        <motion.div className="detail-header" variants={fadeUp}>
          <Badge variant="ginger" size="md">
            {campaign.type === 'pool' ? '💰 Prize Pool' :
             campaign.type === 'discount' ? '🏷️ Discount' : '⚡ Hybrid'}
          </Badge>
          {campaign.end_date && (
            <span className="detail-time-left">
              <FiClock size={14} /> {formatTimeLeft(campaign.end_date)}
            </span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h2 className="detail-title" variants={fadeUp}>
          {campaign.title}
        </motion.h2>

        {/* Advertiser */}
        <motion.div className="detail-advertiser" variants={fadeUp}>
          <Avatar
            src={campaign.advertiser?.avatar_url}
            name={campaign.advertiser?.full_name || 'Advertiser'}
            size="sm"
            verified={campaign.advertiser?.is_verified}
          />
          <div>
            <p className="text-sm font-semibold">{campaign.advertiser?.full_name}</p>
            <p className="text-xs text-tertiary">@{campaign.advertiser?.username}</p>
          </div>
        </motion.div>

        {/* Campaign Images (Single or Auto Slideshow) */}
        {getCampaignImages(campaign).length > 0 ? (
          <motion.div variants={fadeUp} className="detail-banner-wrapper">
            <CampaignImageSlideshow 
              images={getCampaignImages(campaign)} 
              alt={campaign.title} 
              className="detail-banner-slideshow" 
              showBadge={getCampaignImages(campaign).length > 1}
              showNavArrows={getCampaignImages(campaign).length > 1}
              showIndicators={getCampaignImages(campaign).length > 1}
              intervalMs={3500}
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="detail-banner-wrapper detail-banner-placeholder">
            <div className="detail-placeholder-inner">
              <span className="detail-placeholder-tag">
                {campaign.type === 'pool' ? '💰 PRIZE POOL' :
                 campaign.type === 'discount' ? '🏷️ DISCOUNT' : '⚡ HYBRID'}
              </span>
              <h3 className="detail-placeholder-title">{campaign.title}</h3>
              {campaign.slogan && <p className="detail-placeholder-slogan">"{campaign.slogan}"</p>}
            </div>
          </motion.div>
        )}

        {/* Prize Pool Card */}
        {campaign.prize_pool > 0 && (
          <motion.div variants={fadeUp}>
            <Card variant="ginger" padding="md" className="prize-pool-card">
              <div className="prize-pool-header">
                <div>
                  <span className="prize-pool-label">Total Prize Pool</span>
                  <h2 className="prize-pool-amount gradient-text">
                    {formatCurrency(campaign.prize_pool)}
                  </h2>
                </div>
                <div className="prize-pool-remaining">
                  <span className="text-xs text-tertiary">Remaining</span>
                  <span className="font-bold text-ginger">
                    {formatCurrency(safeRemainingPool, true)}
                  </span>
                </div>
              </div>
              <div className="prize-pool-progress">
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${poolUsedPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <span className="text-xs text-tertiary">{Math.round(poolUsedPercent)}% distributed</span>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Payout Tiers */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">{campaign.type === 'discount' ? 'Discount Tiers' : 'Payout Tiers'}</h5>
          <div className="payout-tiers">
            {(() => {
              // Ensure direct discount tiers are always 1st above all other tiers
              const rawTiers = [...(campaign.payout_tiers || [])];
              if (campaign.terms?.direct_discount_tiers && Array.isArray(campaign.terms.direct_discount_tiers)) {
                campaign.terms.direct_discount_tiers.forEach((dt: any, i: number) => {
                  const alreadyPresent = rawTiers.some((t: any) => {
                    const p = parseTierReward(t);
                    return p.isDirectDiscount && p.conditionText === dt.term;
                  });
                  if (!alreadyPresent && dt.term && dt.reward) {
                    rawTiers.unshift({
                      id: `direct-discount-${i}`,
                      campaign_id: campaign.id,
                      min_views: 0,
                      payout_amount: parseFloat(String(dt.reward).replace(/[^0-9.]/g, '')) || 0,
                      reward_type: 'discount',
                      reward_description: `[Direct Discount] ${dt.term} ::: ${dt.reward}`,
                    });
                  }
                });
              }

              const sortedTiers = rawTiers.sort((a: any, b: any) => {
                const isDirectA = parseTierReward(a).isDirectDiscount;
                const isDirectB = parseTierReward(b).isDirectDiscount;
                if (isDirectA && !isDirectB) return -1;
                if (!isDirectA && isDirectB) return 1;
                return 0;
              });

              return sortedTiers.map((tier: any, idx: number) => {
                const parsed = parseTierReward(tier);
                if (parsed.isDirectDiscount) {
                  return (
                    <motion.div
                      key={tier.id || idx}
                      className="payout-tier gold-detail-tier"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.08, type: 'spring' as const, stiffness: 300, damping: 30 }}
                    >
                      <div className="gold-detail-header-tag">
                        <span>✨ DIRECT DISCOUNT TIER</span>
                      </div>
                      <div className="gold-detail-content">
                        <div className="tier-views">
                          <div className="tier-dot gold-detail-dot" />
                          <span className="gold-detail-term">
                            {parsed.conditionText}
                          </span>
                        </div>
                        <div className="tier-arrow gold-detail-arrow">→</div>
                        <div className="tier-reward">
                          <span className="tier-amount gold-detail-amount">
                            🏷️ {parsed.rewardText}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={tier.id || idx}
                    className="payout-tier"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.08, type: 'spring' as const, stiffness: 300, damping: 30 }}
                  >
                    <div className="tier-views">
                      <div className="tier-dot" />
                      <span>
                        {parsed.isTextTier
                          ? `📌 ${parsed.conditionText}`
                          : `${formatCount(tier.min_views)} views`}
                      </span>
                    </div>
                    <div className="tier-arrow">→</div>
                    <div className="tier-reward">
                      {tier.reward_type === 'gift' ? (
                        <span className="tier-amount">
                          🎁 {parsed.rewardText}
                        </span>
                      ) : tier.reward_type === 'discount' || campaign.type === 'discount' ? (
                        <span className="tier-amount tier-discount-amount">
                          {tier.payout_amount ? `${tier.payout_amount}% Discount` : (tier.reward_description || 'Discount')}
                        </span>
                      ) : (
                        <>
                          <span className="tier-amount">
                            {formatCurrency(tier.payout_amount, true)}
                          </span>
                          {tier.reward_description && (
                            <span className="tier-bonus">{tier.reward_description}</span>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">About This Campaign</h5>
          <Card variant="default" padding="md">
            <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
              {campaign.description}
            </p>
          </Card>
        </motion.div>

        {/* Requirements */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Video Requirements</h5>
          <Card variant="default" padding="md" className="requirements-card">
            {campaign.video_requirements && (
              <div className="req-item">
                <FiCheck className="req-icon" />
                <p className="text-sm">{campaign.video_requirements}</p>
              </div>
            )}
            {campaign.slogan && (
              <div className="req-item">
                <FiAlertCircle className="req-icon" />
                <p className="text-sm">Must use slogan: <strong>"{campaign.slogan}"</strong></p>
              </div>
            )}
            {campaign.terms?.must_include_hashtags && (
              <div className="req-item">
                <FiCheck className="req-icon" />
                <p className="text-sm">Hashtags: {campaign.terms.must_include_hashtags.join(', ')}</p>
              </div>
            )}
            {campaign.terms?.min_duration_seconds && (
              <div className="req-item">
                <FiCheck className="req-icon" />
                <p className="text-sm">Min. duration: {campaign.terms.min_duration_seconds}s</p>
              </div>
            )}
            {campaign.terms?.language && (
              <div className="req-item">
                <FiCheck className="req-icon" />
                <p className="text-sm">Language: {campaign.terms.language}</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Campaign Info */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Details</h5>
          <div className="detail-info-grid">
            <div className="info-item">
              <FiMapPin className="info-icon" />
              <div>
                <span className="info-label">Location</span>
                <ExpandableDetailValue
                  text={
                    campaign.location && campaign.location.toLowerCase() !== 'none'
                      ? campaign.location
                      : 'Online (None)'
                  }
                  limit={45}
                />
              </div>
            </div>
            <div className="info-item">
              <FiUsers className="info-icon" />
              <div>
                <span className="info-label">Submissions</span>
                <span className="info-value">{campaign.submission_count} creators</span>
              </div>
            </div>
            <div className="info-item">
              <FiClock className="info-icon" />
              <div>
                <span className="info-label">Verification</span>
                <span className="info-value">{campaign.verification_days} days</span>
              </div>
            </div>
            <div className="info-item">
              <FiExternalLink className="info-icon" />
              <div>
                <span className="info-label">Platforms</span>
                <ExpandableDetailValue
                  text={campaign.required_platforms.join(', ')}
                  limit={45}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Earners */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">🏆 Top Earners</h5>
          <Card variant="default" padding="md">
            <div className="top-earners">
              {topEarners.length > 0 ? (
                topEarners.map((earner) => (
                  <div key={earner.rank} className="earner-row">
                    <span className={`earner-rank rank-${earner.rank}`}>#{earner.rank}</span>
                    <div className="earner-info">
                      <span className="font-semibold text-sm">{earner.name}</span>
                      <span className="text-xs text-tertiary">{formatCount(earner.views)} views</span>
                    </div>
                    <span className="earner-amount gradient-text font-bold">
                      {formatCurrency(earner.earned, true)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-tertiary py-4">No top earners yet. Be the first!</div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Keywords */}
        <motion.div variants={fadeUp}>
          <div className="detail-keywords">
            {(campaign.keywords || []).map((kw: string) => (
              <Badge key={kw} variant="default" size="sm">#{kw.replace(/\s+/g, '')}</Badge>
            ))}
          </div>
        </motion.div>

        {/* Submit CTA or Submission Status */}
        <motion.div className="detail-cta" variants={fadeUp}>
          {userSubmission ? (
            (() => {
              // Calculate expected earning (next tier)
              let nextTier: any = null;
              if (campaign.payout_tiers && campaign.payout_tiers.length > 0) {
                const sortedTiers = [...campaign.payout_tiers]
                  .filter((t) => t.reward_type !== 'gift' || t.min_views > 0)
                  .sort((a, b) => a.min_views - b.min_views);
                const currentViews = userSubmission.current_views || 0;
                for (const tier of sortedTiers) {
                  if (tier.min_views > currentViews) {
                    nextTier = tier;
                    break;
                  }
                }
                if (!nextTier && currentViews >= sortedTiers[sortedTiers.length - 1].min_views) {
                  nextTier = 'max';
                }
              }

              return (
                <Card variant="ginger" padding="md">
                  <h5 className="section-title" style={{ color: 'var(--text-primary)' }}>Your Submission</h5>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Status</span>
                      <Badge variant={userSubmission.status === 'verified' ? 'success' : 'default'} size="sm">
                        {userSubmission.status === 'verified' ? 'APPROVED' : userSubmission.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Submission Type</span>
                      <Badge variant={isDirectDiscountSubmission(userSubmission) ? 'warning' : 'accent'} size="sm">
                        {isDirectDiscountSubmission(userSubmission) ? '🏷️ Direct Discount' : '🏆 All Rewards'}
                      </Badge>
                    </div>
                    {!isDirectDiscountSubmission(userSubmission) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-secondary">Views Tracked</span>
                        <span className="font-bold">{formatCount(userSubmission.current_views || 0)}</span>
                      </div>
                    )}
                    {/* Direct Discount Voucher Details */}
                    {isDirectDiscountSubmission(userSubmission) && (userSubmission.status === 'verified' || userSubmission.status === 'paid') && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-2 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                            🎟️ Your Direct Discount Voucher
                          </span>
                          <Badge variant={userSubmission.voucher_status === 'redeemed' ? 'warning' : 'success'} size="sm">
                            {userSubmission.voucher_status === 'redeemed' ? 'REDEEMED' : 'ACTIVE'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-lg border border-white/5">
                          <span className="font-mono text-base font-bold text-emerald-300">
                            {userSubmission.voucher_code || 'VCH-ACTIVE'}
                          </span>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(userSubmission.voucher_code || '');
                              toast.success('Voucher code copied!');
                            }}
                            title="Copy voucher code"
                          >
                            <FiCopy size={13} />
                          </button>
                        </div>

                        <p className="text-[11px] text-secondary">
                          Present this code at the store / checkout to receive your discount or perk!
                        </p>

                        {/* Bill Summary from Owner if issued */}
                        {userSubmission.voucher_details?.bill_amount && (
                          <div className="creator-bill-receipt-card">
                            <div className="receipt-header">
                              <span className="receipt-title">🧾 Bill Summary from Owner</span>
                              <span className="receipt-badge">ISSUED</span>
                            </div>
                            <div className="receipt-row">
                              <span className="receipt-label">Original Bill:</span>
                              <span className="receipt-val">₹{Number(userSubmission.voucher_details.bill_amount).toLocaleString()}</span>
                            </div>
                            <div className="receipt-row discount-highlight">
                              <span className="receipt-label">Discount Applied ({userSubmission.voucher_details.discount_percent}%):</span>
                              <span className="receipt-val">-₹{Number(userSubmission.voucher_details.discount_amount).toLocaleString()}</span>
                            </div>
                            <div className="receipt-divider" />
                            <div className="receipt-row total-highlight">
                              <span className="receipt-label-total">Final Amount You Pay:</span>
                              <span className="receipt-val-total">₹{Number(userSubmission.voucher_details.final_payable).toLocaleString()}</span>
                            </div>
                            {userSubmission.voucher_details.note && (
                              <p className="receipt-note">"{userSubmission.voucher_details.note}"</p>
                            )}
                          </div>
                        )}

                        {/* Quick Discount Calculator with locked discount pre-set by owner! */}
                        <div className="mt-1 pt-1 border-t border-white/5">
                          <DiscountCalculator
                            initialDiscountPercent={userSubmission.discount_percent || 15}
                            lockedDiscountPercent={userSubmission.discount_percent || 15}
                            isLockedPercent={true}
                            voucherCode={userSubmission.voucher_code}
                          />
                        </div>
                      </div>
                    )}

                    {!isDirectDiscountSubmission(userSubmission) && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-secondary">Earned Amount</span>
                          <span className="font-bold text-ginger">{formatCurrency(userSubmission.earned_amount || 0, true)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-secondary">Expected Earning</span>
                          {nextTier === 'max' ? (
                            <span className="font-bold text-success text-sm">Max Reached! 🏆</span>
                          ) : nextTier ? (
                            <div className="text-right">
                              <span className="font-bold">{formatCurrency(nextTier.payout_amount, true)}</span>
                              <span className="block text-[10px] text-tertiary uppercase tracking-wider mt-0.5">at {formatCount(nextTier.min_views)} views</span>
                            </div>
                          ) : (
                            <span className="text-sm text-tertiary">No Tiers</span>
                          )}
                        </div>
                      </>
                    )}
                    {!isDirectDiscountSubmission(userSubmission) && (
                      <a 
                        href={userSubmission.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-center text-xs mt-3 pt-3 border-t border-white/5"
                        style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
                      >
                        <span style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1px' }}>View Submitted Video</span>
                      </a>
                    )}

                    {/* Remove submission if submitted by mistake — only allowed before approval and before voucher is issued */}
                    {!(userSubmission.status === 'verified' || userSubmission.status === 'paid' || Boolean(userSubmission.voucher_code)) && (
                      <div className="pt-2 border-t border-white/5">
                        <button
                          type="button"
                          className="btn btn-outline flex items-center justify-center gap-2 text-xs py-2 px-3 w-full"
                          style={{ borderColor: 'rgba(255, 69, 58, 0.3)', color: '#ff453a' }}
                          onClick={handleRemoveSubmission}
                          disabled={isSubmitting}
                          title="Remove this video if you submitted the wrong link"
                        >
                          <FiTrash2 size={13} />
                          <span>Remove / Change Video</span>
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })()
          ) : isCampaignOwner ? (
            <div className="p-4 rounded-xl border border-amber-400/30 bg-amber-400/10 text-center flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span>👑</span>
                <span>You Are The Campaign Owner</span>
              </div>
              <p className="text-xs text-secondary max-w-sm">
                Campaign owners cannot submit videos to their own campaigns. You can review submitted creator videos and issue vouchers.
              </p>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/manage-campaigns/${campaign.id}`)}
                className="mt-1"
              >
                Manage Campaign & Submissions
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={openSubmitModal}
              id="btn-submit-video"
              disabled={isExpired}
            >
              {isExpired ? 'Campaign Expired' : 'Submit to Campaign'}
            </Button>
          )}
        </motion.div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
            <motion.div
              className="modal-content direct-discount-submit-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Submit to Campaign</h3>
                  <p className="text-xs text-secondary mt-1">
                    Select your submission type to claim rewards or instant direct discounts.
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={() => setShowSubmitModal(false)}
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Submission Type Selector */}
              <div className="submission-type-selector mt-4">
                <div className="flex flex-col gap-2">
                  {showAllRewardsOption && (
                    <div
                      className={`type-option-card ${submissionType === 'all_rewards' ? 'active' : ''}`}
                      onClick={() => setSubmissionType('all_rewards')}
                    >
                      <div className="type-radio-circle">
                        {submissionType === 'all_rewards' && <div className="type-radio-inner" />}
                      </div>
                      <div className="type-option-text">
                        <div className="font-bold text-sm text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>🏆 All Campaign Rewards</span>
                          </div>
                          <Badge variant="success" size="sm">Standard</Badge>
                        </div>
                        <p className="text-xs text-secondary mt-0.5">
                          Eligible for view milestone payouts and all cash & gift prizes.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Direct Discount Card - ONLY shown if campaign has direct discount tiers */}
                  {hasDirectDiscountTiers && (
                    <div
                      className={`type-option-card gold-card ${submissionType === 'direct_discount' ? 'active' : ''}`}
                      onClick={() => setSubmissionType('direct_discount')}
                    >
                      <div className="gold-card-shine" />
                      <div className="type-radio-circle">
                        {submissionType === 'direct_discount' && <div className="type-radio-inner gold-radio-inner" />}
                      </div>
                      <div className="type-option-text">
                        <div className="font-bold text-sm text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>🏷️ Direct Discount</span>
                            <span className="gold-pill-shimmer">✨ Shiny Perk</span>
                          </div>
                          <Badge variant="warning" size="sm">{directDiscountTiers.length} Options</Badge>
                        </div>
                        <p className="text-xs text-amber-200/80 mt-0.5">
                          Instant store discounts, coupons, and owner-issued vouchers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* If Direct Discount chosen, show the sub-options corresponding to configured direct discount tiers */}
              {submissionType === 'direct_discount' && hasDirectDiscountTiers && (
                <div className="direct-discount-subtiers-box mt-4">
                  <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2 block">
                    Choose Direct Discount Perk
                  </label>
                  <div className={`subtiers-options-grid count-${Math.min(directDiscountTiers.length, 4)}`}>
                    {directDiscountTiers.map((dt, idx) => {
                      const isSelected = selectedDirectTierIdx === idx;
                      const dtTermLower = (dt.term || '').toLowerCase();
                      const icon = dtTermLower.includes('video') || dtTermLower.includes('shoot')
                        ? '🎥'
                        : dtTermLower.includes('visit')
                        ? '📍'
                        : dtTermLower.includes('story') || dtTermLower.includes('highlight')
                        ? '📱'
                        : '⭐';

                      return (
                        <div
                          key={idx}
                          className={`subtier-option-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedDirectTierIdx(idx);
                            setIsReviewVerified(false);
                            setVisitMediaUrl('');
                            setVisitMediaFile(null);
                            setStoryUrl('');
                          }}
                        >
                          <div className="subtier-chip-header">
                            <span className="subtier-chip-icon">{icon}</span>
                            <span className="subtier-chip-term">{dt.term}</span>
                          </div>
                          <span className="subtier-chip-reward">{dt.reward}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Inputs according to chosen submission type and action */}
              <div className="mt-4">
                {submissionType === 'all_rewards' ? (
                  <div>
                    <Input
                      label="Video URL (YouTube, Instagram, or Facebook)"
                      placeholder="https://www.youtube.com/watch?v=... or instagram.com/reel/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      id="input-video-url"
                    />
                  </div>
                ) : isVideoAction ? (
                  <div>
                    <Input
                      label="Video URL (YouTube, Instagram, or Facebook)"
                      placeholder="https://www.youtube.com/watch?v=... or instagram.com/reel/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      id="input-direct-video-url"
                    />
                    <p className="text-[11px] text-tertiary mt-1.5 flex items-center gap-1.5">
                      <FiAlertCircle size={12} className="text-amber-400 shrink-0" />
                      <span>Submit your published video link to receive your {activeDirectTier?.reward} discount.</span>
                    </p>
                  </div>
                ) : isVisitAction ? (
                  <div className="visit-media-upload-container">
                    <label className="text-xs font-bold text-white mb-2 block flex items-center gap-1.5">
                      <span>📍 Visit Proof (Raw Image or Video File)</span>
                    </label>

                    {visitMediaUrl ? (
                      <div className="visit-media-preview-card">
                        {visitMediaFile?.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(visitMediaUrl) ? (
                          <video src={visitMediaUrl} controls className="visit-preview-media" />
                        ) : (
                          <img src={visitMediaUrl} alt="Visit proof" className="visit-preview-media" />
                        )}
                        <div className="visit-preview-meta">
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <FiCheck size={14} /> Proof Attached ({visitMediaFile?.name || 'File Uploaded'})
                          </span>
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:text-red-300 font-medium underline cursor-pointer"
                            onClick={() => {
                              setVisitMediaUrl('');
                              setVisitMediaFile(null);
                            }}
                          >
                            Remove & Choose Different File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="visit-file-dropzone">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handleVisitFileChange}
                          disabled={isUploadingVisitMedia}
                        />
                        <div className="dropzone-content">
                          {isUploadingVisitMedia ? (
                            <div className="flex flex-col items-center gap-2 py-4">
                              <div className="animate-spin rounded-full h-7 w-7 border-2 border-amber-400 border-t-transparent" />
                              <span className="text-xs text-amber-300 font-medium">Uploading raw media...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 py-4 cursor-pointer">
                              <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                                <FiUpload size={22} />
                              </div>
                              <div className="text-center">
                                <span className="text-[11px] text-secondary block">
                                  Supports JPG, PNG, MP4, MOV (Max 25MB)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                ) : isStoryAction ? (
                  <div>
                    <Input
                      label="Story or Highlight Link"
                      placeholder="https://instagram.com/stories/... or highlight link"
                      value={storyUrl}
                      onChange={(e) => setStoryUrl(e.target.value)}
                      id="input-story-url"
                    />
                    <p className="text-[11px] text-tertiary mt-1.5 flex items-center gap-1.5">
                      <FiAlertCircle size={12} className="text-amber-400 shrink-0" />
                      <span>Enter the direct link to your published story or highlight.</span>
                    </p>
                  </div>
                ) : isReviewAction ? (
                  <div className="review-action-container">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                      <span>⭐</span>
                      <span>Review & Rate Us for {activeDirectTier?.reward}</span>
                    </div>

                    <button
                      type="button"
                      className={`btn-open-review-link ${isReviewVerified ? 'verified' : ''}`}
                      onClick={() => {
                        window.open(targetReviewUrl, '_blank', 'noopener,noreferrer');
                        setIsReviewVerified(true);
                        toast.success('Review page opened! Verified with green tick ✓');
                      }}
                    >
                      <span className="btn-review-icon">{isReviewVerified ? '✓' : '⭐'}</span>
                      <span className="btn-review-text">
                        {isReviewVerified ? 'Review Page Opened (Verified ✓)' : 'Open Review & Rate Us Page'}
                      </span>
                      <FiExternalLink size={15} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Input
                      label="Submission URL"
                      placeholder="https://..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      id="input-other-url"
                    />
                  </div>
                )}
              </div>

              <div className="modal-actions mt-6">
                <Button variant="ghost" onClick={() => setShowSubmitModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    (submissionType === 'direct_discount' && isReviewAction && !isReviewVerified) ||
                    (submissionType === 'direct_discount' && isVisitAction && (!visitMediaUrl || isUploadingVisitMedia))
                  }
                  isLoading={isSubmitting}
                  style={
                    submissionType === 'direct_discount'
                      ? {
                          background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)',
                          color: '#1a1300',
                          fontWeight: 800,
                          border: 'none',
                        }
                      : undefined
                  }
                >
                  {isReviewAction && submissionType === 'direct_discount'
                    ? 'Submit Review Verification'
                    : submissionType === 'direct_discount'
                    ? 'Submit Direct Discount'
                    : 'Submit Video'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Share Campaign Modal (1st QR, 2nd Link) */}
        <CampaignShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          campaign={campaign}
        />
      </motion.div>
    </div>
  );
};

export default CampaignDetailPage;
