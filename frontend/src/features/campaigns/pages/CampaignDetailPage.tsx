// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Detail Page
// Full campaign view with payout tiers, requirements, submit
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import {
  FiArrowLeft, FiShare2, FiMapPin, FiClock, FiUsers,
  FiExternalLink, FiCheck, FiAlertCircle, FiTrash2, FiCopy
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
import { getCampaignImages, parseTierReward } from '../../../types/campaign.types';
import { CampaignImageSlideshow } from '../../../components/ui/CampaignImageSlideshow';
import { isDirectDiscountSubmission, normalizeSubmission, encodeVideoId } from '../../../utils/submissionHelpers';
import './CampaignDetailPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { campaigns, savedCampaignIds, fetchSavedCampaigns, toggleSavedCampaign } = useCampaignStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { reportItem } = useUgcStore();
  const { showConfirm } = useGlobalModalStore();

  const campaign = campaigns.find((c) => c.id === id);
  const isExpired = campaign?.end_date ? new Date(campaign.end_date) < new Date() : false;
  const isCampaignOwner = !!user && !!campaign && (
    user.id === campaign.advertiser_id || 
    user.id === (campaign.advertiser as any)?.id
  );
  const [topEarners, setTopEarners] = useState<any[]>([]);
  const [userSubmission, setUserSubmission] = useState<any | null>(null);

  const [submissionType, setSubmissionType] = useState<'all_rewards' | 'direct_discount'>('all_rewards');

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to submit a video.');
      return;
    }
    if (isCampaignOwner) {
      toast.error('Campaign owners cannot submit videos to their own campaigns.');
      return;
    }
    if (!videoUrl || !videoUrl.trim()) {
      toast.error('Please enter a video URL.');
      return;
    }

    // Enforce whitelist: only YouTube, Instagram, or Facebook allowed
    const validation = validateAllowedVideoUrl(videoUrl);
    if (!validation.isValid) {
      toast.error(validation.error || 'Only YouTube, Instagram, or Facebook video links are allowed.');
      return;
    }

    const platform = validation.platform;

    if (campaign?.required_platforms && campaign.required_platforms.length > 0) {
      const requiredLower = campaign.required_platforms.map((p: string) => p.toLowerCase());
      if (!requiredLower.includes(platform)) {
        toast.error(`Invalid link. This campaign only accepts: ${campaign.required_platforms.join(', ')}`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      const cleanUrl = videoUrl.trim();
      const persistentVideoId = encodeVideoId(submissionType);
      const insertPayload: any = {
        campaign_id: campaign!.id,
        creator_id: user.id,
        video_url: cleanUrl,
        platform: platform,
        video_id: persistentVideoId,
        submission_type: submissionType,
      };

      let { error } = await supabase.from('submissions').insert(insertPayload);

      // Safe fallback if remote table does not have submission_type column yet
      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('submission_type'))) {
        delete insertPayload.submission_type;
        const retryRes = await supabase.from('submissions').insert(insertPayload);
        error = retryRes.error;
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error('You have already submitted a video for this campaign.');
        }
        throw error;
      }

      toast.success('Video submitted successfully!');
      setShowSubmitModal(false);
      setVideoUrl('');
      
      // Update local state to hide button immediately
      setUserSubmission(normalizeSubmission({
        campaign_id: campaign!.id,
        creator_id: user.id,
        status: 'pending',
        current_views: 0,
        earned_amount: 0,
        video_url: cleanUrl,
        platform: platform,
        video_id: persistentVideoId,
        submission_type: submissionType,
        submitted_at: new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit video');
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

  if (!campaign) {
    return (
      <div className="page-content container">
        <p>Campaign not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
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
            <button className="icon-btn" aria-label="Share">
              <FiShare2 />
            </button>
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
        {getCampaignImages(campaign).length > 0 && (
          <motion.div variants={fadeUp} className="w-full h-56 bg-black/20 rounded-xl overflow-hidden mb-6">
            <CampaignImageSlideshow 
              images={getCampaignImages(campaign)} 
              alt={campaign.title} 
              className="w-full h-full object-cover" 
              showBadge={getCampaignImages(campaign).length > 1}
            />
          </motion.div>
        )}

        {/* Prize Pool Card */}
        {campaign.prize_pool > 0 && (
          <motion.div variants={fadeUp}>
            <Card variant="ginger" padding="lg" className="prize-pool-card">
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
            {campaign.payout_tiers?.map((tier, idx) => {
              const parsed = parseTierReward(tier);
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
                    <span className="tier-amount">
                      {tier.reward_type === 'gift'
                        ? `🎁 ${parsed.rewardText}`
                        : tier.reward_type === 'discount' || campaign.type === 'discount'
                        ? `${tier.payout_amount}% Off`
                        : formatCurrency(tier.payout_amount, true)}
                    </span>
                    {tier.reward_description && tier.reward_type !== 'gift' && (
                      <span className="tier-bonus">{tier.reward_description}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
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
                <span className="info-value">
                  {campaign.location && campaign.location.toLowerCase() !== 'none'
                    ? campaign.location
                    : 'Online (None)'}
                </span>
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
                <span className="info-value">{campaign.required_platforms.join(', ')}</span>
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
            {campaign.keywords.map((kw) => (
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-secondary">Views Tracked</span>
                      <span className="font-bold">{formatCount(userSubmission.current_views || 0)}</span>
                    </div>
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

                        {/* Quick Discount Calculator right beside voucher! */}
                        <div className="mt-1 pt-1 border-t border-white/5">
                          <DiscountCalculator
                            initialDiscountPercent={userSubmission.discount_percent || 15}
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
                    <a 
                      href={userSubmission.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-center text-xs mt-3 pt-3 border-t border-white/5"
                      style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
                    >
                      <span style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '1px' }}>View Submitted Video</span>
                    </a>

                    {/* Remove submission if submitted by mistake */}
                    {userSubmission.status !== 'paid' && (
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
              onClick={() => setShowSubmitModal(true)}
              id="btn-submit-video"
              disabled={isExpired}
            >
              {isExpired ? 'Campaign Expired' : 'Submit Your Video'}
            </Button>
          )}
        </motion.div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            >
              <h3 className="text-lg font-bold text-white">Submit Your Video</h3>
              <p className="text-xs text-secondary mt-1">
                Select your reward category and enter your video URL from YouTube, Instagram, or Facebook.
              </p>

              {/* Submission Type Selector */}
              <div className="submission-type-selector mt-4">
                <label className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 block">
                  Select Submission Type
                </label>
                <div className="flex flex-col gap-2">
                  <div
                    className={`type-option-card ${submissionType === 'all_rewards' ? 'active' : ''}`}
                    onClick={() => setSubmissionType('all_rewards')}
                  >
                    <div className="type-radio-circle">
                      {submissionType === 'all_rewards' && <div className="type-radio-inner" />}
                    </div>
                    <div className="type-option-text">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>🏆 All Campaign Rewards</span>
                        <Badge variant="success" size="sm">Standard</Badge>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        Eligible for view milestone payouts and all cash & gift prizes.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`type-option-card ${submissionType === 'direct_discount' ? 'active' : ''}`}
                    onClick={() => setSubmissionType('direct_discount')}
                  >
                    <div className="type-radio-circle">
                      {submissionType === 'direct_discount' && <div className="type-radio-inner" />}
                    </div>
                    <div className="type-option-text">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>🏷️ Direct Discount Video</span>
                        <Badge variant="warning" size="sm">Perk</Badge>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">
                        Specific to store visits, coupon codes, and direct discount rewards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Input
                  label="Video URL"
                  placeholder="https://www.youtube.com/watch?v=... or instagram.com/reel/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  id="input-video-url"
                />
                <p className="text-[11px] text-tertiary mt-1.5 flex items-center gap-1.5">
                  <FiAlertCircle size={12} className="text-accent shrink-0" />
                  <span>Only YouTube, Instagram, or Facebook video links are accepted.</span>
                </p>
              </div>

              <div className="modal-actions mt-6">
                <Button variant="ghost" onClick={() => setShowSubmitModal(false)} disabled={isSubmitting}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} isLoading={isSubmitting}>
                  Submit Video
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CampaignDetailPage;
