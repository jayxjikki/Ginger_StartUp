// ═══════════════════════════════════════════════════════════
// GINGER — Map Campaign Preview Card
// Type-specific layout (Pool, Discount, Hybrid) with distance & chat
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../../../types/campaign.types';
import { getCampaignImages } from '../../../types/campaign.types';
import { CampaignImageSlideshow } from '../../../components/ui/CampaignImageSlideshow';
import { formatCurrency } from '../../../utils/formatters';

interface MapCampaignCardProps {
  campaign: Campaign;
  distanceKm: number | null;
  onClose: () => void;
  onOpenChat: (ownerId: string, ownerName: string, ownerAvatar: string | null) => void;
}

export const MapCampaignCard: React.FC<MapCampaignCardProps> = ({
  campaign,
  distanceKm,
  onClose,
  onOpenChat,
}) => {
  const navigate = useNavigate();

  const ownerName = campaign.advertiser?.full_name || 'Campaign Sponsor';
  const ownerAvatar = campaign.advertiser?.avatar_url || null;
  const isVerified = campaign.advertiser?.is_verified ?? false;

  const distanceText = distanceKm !== null 
    ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away`)
    : null;

  return (
    <div className={`map-campaign-card type-${campaign.type}`} onClick={(e) => e.stopPropagation()}>
      {/* Top Banner Row */}
      <div className="card-top-banner">
        <div className="card-type-tag">
          <span className="material-symbols-outlined type-icon">
            {campaign.type === 'pool' && 'monetization_on'}
            {campaign.type === 'discount' && 'sell'}
            {campaign.type === 'hybrid' && 'bolt'}
          </span>
          <span className="type-label">
            {campaign.type === 'pool' && 'PRIZE POOL'}
            {campaign.type === 'discount' && 'DISCOUNT OFFER'}
            {campaign.type === 'hybrid' && 'HYBRID REWARDS'}
          </span>
        </div>

        <button className="card-close-btn" onClick={onClose} aria-label="Close Preview">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Main Campaign Identity & Image */}
      <div className="card-body">
        <div className="card-header-left">
          {getCampaignImages(campaign).length > 0 ? (
            <div className="card-thumb-slideshow-wrapper" style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}>
              <CampaignImageSlideshow
                images={getCampaignImages(campaign)}
                alt={campaign.title}
                className="card-thumb"
                showIndicators={false}
                showBadge={false}
              />
            </div>
          ) : (
            <div className="card-thumb-placeholder">
              <span className="material-symbols-outlined">campaign</span>
            </div>
          )}

          <div className="card-title-group">
            <h4 className="card-title" title={campaign.title}>{campaign.title}</h4>
            {campaign.slogan && <p className="card-slogan">"{campaign.slogan}"</p>}
            
            <div className="card-location-row">
              <span className="material-symbols-outlined pin-icon">location_on</span>
              <span className="loc-name">{campaign.location || 'Local Campaign'}</span>
              {distanceText && <span className="loc-dist">({distanceText})</span>}
            </div>
          </div>
        </div>

        {/* Dynamic Rewards Layout by Campaign Type */}
        <div className="card-reward-box">
          {campaign.type === 'pool' && (
            <div className="reward-pool-content">
              <span className="reward-label">Total Prize Pool</span>
              <div className="reward-value-gold">
                {formatCurrency(campaign.prize_pool || 0)}
              </div>
              {campaign.payout_tiers && campaign.payout_tiers.length > 0 && (
                <span className="reward-sub">
                  {campaign.payout_tiers.length} View-to-Pay Tiers Available
                </span>
              )}
            </div>
          )}

          {campaign.type === 'discount' && (
            <div className="reward-discount-content">
              <span className="reward-label">Exclusive Discount</span>
              <div className="reward-value-green">
                {campaign.discount_percent ? `${campaign.discount_percent}% OFF` : 'Special Promo'}
              </div>
              {campaign.payout_tiers && campaign.payout_tiers.length > 0 && (
                <span className="reward-sub">
                  Earn higher discounts based on your video views
                </span>
              )}
            </div>
          )}

          {campaign.type === 'hybrid' && (
            <div className="reward-hybrid-content">
              <span className="reward-label">Cash + Discounts + Gifts</span>
              <div className="reward-hybrid-badges">
                {Number(campaign.prize_pool) > 0 && (
                  <span className="hybrid-badge pool">
                    💰 {formatCurrency(campaign.prize_pool)} Pool
                  </span>
                )}
                {campaign.discount_percent && (
                  <span className="hybrid-badge disc">
                    🏷️ {campaign.discount_percent}% Off
                  </span>
                )}
                {campaign.payout_tiers?.some(t => t.reward_type === 'gift') && (
                  <span className="hybrid-badge gift">
                    🎁 Free Gifts/Merch
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sponsor/Owner Info */}
        <div className="card-owner-row">
          <div className="owner-profile">
            {ownerAvatar ? (
              <img src={ownerAvatar} alt={ownerName} className="owner-avatar" />
            ) : (
              <div className="owner-avatar-placeholder">
                {ownerName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="owner-meta">
              <div className="owner-name-row">
                <span className="owner-name">{ownerName}</span>
                {isVerified && (
                  <span className="material-symbols-outlined owner-verified" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </div>
              <span className="owner-sub">Campaign Sponsor</span>
            </div>
          </div>

          <button
            type="button"
            className="card-chat-btn"
            onClick={() => onOpenChat(campaign.advertiser_id, ownerName, ownerAvatar)}
            title="Chat directly with campaign owner"
          >
            <span className="material-symbols-outlined">chat</span>
            <span>Contact</span>
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="card-actions">
          <button
            type="button"
            className="card-view-btn"
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
          >
            <span>View Campaign & Participate</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
