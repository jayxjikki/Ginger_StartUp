// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Feed Page ("Clipping" Tab)
// Browse, filter, and discover campaigns
// ═══════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiSliders, FiMapPin, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi';
import { useCampaignStore } from '../../../store/campaignStore';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { SkeletonCard } from '../../../components/ui/Skeleton';
import { formatCurrency, formatCount, formatTimeLeft } from '../../../utils/formatters';
import type { Campaign, CampaignSortOption } from '../../../types/campaign.types';
import './CampaignFeedPage.css';

const sortOptions: { id: CampaignSortOption; label: string; icon: React.ReactNode }[] = [
  { id: 'newest', label: 'Newest', icon: <FiClock /> },
  { id: 'highest_pool', label: 'Top Prize', icon: <FiTrendingUp /> },
  { id: 'ending_soon', label: 'Ending Soon', icon: <FiClock /> },
  { id: 'most_submissions', label: 'Popular', icon: <FiUsers /> },
];

const CampaignFeedPage: React.FC = () => {
  const {
    filteredCampaigns,
    filters,
    setFilters,
    isLoading,
    fetchCampaigns,
  } = useCampaignStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'pool': return 'ginger';
      case 'discount': return 'success';
      case 'hybrid': return 'accent';
      default: return 'default';
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'pool': return '💰 Prize Pool';
      case 'discount': return '🏷️ Discount';
      case 'hybrid': return '⚡ Hybrid';
      default: return type;
    }
  };

  return (
    <div className="page-content">
      <div className="container campaign-feed">
        {/* Header */}
        <motion.div
          className="feed-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
        >
          <div>
            <h3>Campaigns</h3>
            <p className="text-secondary text-sm">Create videos & earn money</p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="feed-search"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring' as const, stiffness: 300, damping: 30 }}
        >
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search campaigns, keywords..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="search-input"
              id="campaign-search"
            />
            <button className="search-filter-btn" aria-label="Filters">
              <FiSliders />
            </button>
          </div>
        </motion.div>

        {/* Sort Pills */}
        <motion.div
          className="sort-pills"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {sortOptions.map((option) => (
            <button
              key={option.id}
              className={`sort-pill ${filters.sortBy === option.id ? 'active' : ''}`}
              onClick={() => setFilters({ sortBy: option.id })}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </motion.div>

        {/* Campaign List */}
        <div className="campaign-list">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCampaigns.map((campaign, index) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  index={index}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  typeColor={getCampaignTypeColor(campaign.type)}
                  typeLabel={getCampaignTypeLabel(campaign.type)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {!isLoading && filteredCampaigns.length === 0 && (
          <div className="feed-empty">
            <span className="feed-empty-icon">🔍</span>
            <h4>No campaigns found</h4>
            <p className="text-secondary text-sm">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Campaign Card Component ────────────────────────────
interface CampaignCardProps {
  campaign: Campaign;
  index: number;
  onClick: () => void;
  typeColor: string;
  typeLabel: string;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  index,
  onClick,
  typeColor,
  typeLabel,
}) => {
  const topTier = campaign.payout_tiers?.[campaign.payout_tiers.length - 1];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 30, delay: index * 0.05 }}
    >
      <Card variant="glass" padding="none" onClick={onClick} className="campaign-card">
        {/* Card Header */}
        <div className="campaign-card-header">
          <div className="campaign-card-meta">
            <Badge variant={typeColor as any} size="sm">{typeLabel}</Badge>
            <span className="campaign-time-left">{formatTimeLeft(campaign.end_date)}</span>
          </div>
          {campaign.prize_pool > 0 && (
            <div className="campaign-prize">
              <span className="campaign-prize-label">Prize Pool</span>
              <span className="campaign-prize-amount gradient-text">
                {formatCurrency(campaign.prize_pool, true)}
              </span>
            </div>
          )}
        </div>

        {/* Card Image (if exists) */}
        {campaign.image_url && (
          <div className="w-full h-40 bg-black/20 overflow-hidden">
            <img 
              src={campaign.image_url} 
              alt={campaign.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Card Body */}
        <div className="campaign-card-body">
          <h4 className="campaign-card-title">{campaign.title}</h4>
          <p className="campaign-card-desc line-clamp-2">{campaign.description}</p>

          {/* Advertiser */}
          <div className="campaign-card-advertiser">
            <Avatar
              src={campaign.advertiser?.avatar_url}
              name={campaign.advertiser?.full_name || 'Advertiser'}
              size="xs"
              verified={campaign.advertiser?.is_verified}
            />
            <span className="text-sm text-secondary">
              {campaign.advertiser?.full_name}
            </span>
          </div>

          {/* Bottom Row */}
          <div className="campaign-card-footer">
            <div className="campaign-card-stats">
              {campaign.location && (
                <span className="campaign-stat">
                  <FiMapPin size={12} /> {campaign.location}
                </span>
              )}
              <span className="campaign-stat">
                <FiUsers size={12} /> {campaign.submission_count} creators
              </span>
            </div>
            {topTier && (
              <div className="campaign-top-payout">
                Up to <strong>{formatCurrency(topTier.payout_amount, true)}</strong>
              </div>
            )}
          </div>

          {/* Payout Tiers Preview */}
          {campaign.payout_tiers && campaign.payout_tiers.length > 0 && (
            <div className="campaign-tiers-preview">
              {campaign.payout_tiers.slice(0, 3).map((tier) => (
                <div key={tier.id} className="tier-chip">
                  {formatCount(tier.min_views)} views → {formatCurrency(tier.payout_amount, true)}
                </div>
              ))}
              {campaign.payout_tiers.length > 3 && (
                <div className="tier-chip tier-chip-more">
                  +{campaign.payout_tiers.length - 3} more
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          <div className="campaign-keywords">
            {campaign.keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="keyword-tag">#{kw.replace(/\s+/g, '')}</span>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default CampaignFeedPage;
