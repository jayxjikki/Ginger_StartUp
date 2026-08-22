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
  FiExternalLink, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { useCampaignStore } from '../../../store/campaignStore';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Input from '../../../components/ui/Input';
import { formatCurrency, formatCount, formatTimeLeft } from '../../../utils/formatters';
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
  const { campaigns } = useCampaignStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const campaign = campaigns.find((c) => c.id === id);
  const [topEarners, setTopEarners] = useState<any[]>([]);

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
          <button className="icon-btn" aria-label="Share">
            <FiShare2 />
          </button>
        </motion.div>

        {/* Campaign Type & Timer */}
        <motion.div className="detail-header" variants={fadeUp}>
          <Badge variant="ginger" size="md">
            {campaign.type === 'pool' ? '💰 Prize Pool' :
             campaign.type === 'discount' ? '🏷️ Discount' : '⚡ Hybrid'}
          </Badge>
          <span className="detail-time-left">
            <FiClock size={14} /> {formatTimeLeft(campaign.end_date)}
          </span>
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

        {/* Campaign Cover Image */}
        {campaign.image_url && (
          <motion.div variants={fadeUp} className="w-full h-48 bg-black/20 rounded-xl overflow-hidden mb-6">
            <img 
              src={campaign.image_url} 
              alt={campaign.title} 
              className="w-full h-full object-cover" 
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
          <h5 className="section-title">Payout Tiers</h5>
          <div className="payout-tiers">
            {campaign.payout_tiers?.map((tier, idx) => (
              <motion.div
                key={tier.id}
                className="payout-tier"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.08, type: 'spring' as const, stiffness: 300, damping: 30 }}
              >
                <div className="tier-views">
                  <div className="tier-dot" />
                  <span>{formatCount(tier.min_views)} views</span>
                </div>
                <div className="tier-arrow">→</div>
                <div className="tier-reward">
                  <span className="tier-amount">{formatCurrency(tier.payout_amount, true)}</span>
                  {tier.reward_description && (
                    <span className="tier-bonus">{tier.reward_description}</span>
                  )}
                </div>
              </motion.div>
            ))}
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
                <span className="info-value">{campaign.location || 'Anywhere'}</span>
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

        {/* Submit CTA */}
        <motion.div className="detail-cta" variants={fadeUp}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setShowSubmitModal(true)}
            id="btn-submit-video"
          >
            Submit Your Video
          </Button>
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
              <h3>Submit Your Video</h3>
              <p className="text-sm text-secondary mt-2">
                Paste your video link below. We'll verify the views after {campaign.verification_days} days.
              </p>
              <div className="mt-4">
                <Input
                  label="Video URL"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  id="input-video-url"
                />
              </div>
              <div className="modal-actions mt-6">
                <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setShowSubmitModal(false)}>
                  Submit
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
