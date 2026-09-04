// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Type Definitions
// ═══════════════════════════════════════════════════════════

export interface Campaign {
  id: string;
  advertiser_id: string;
  title: string;
  description: string;
  type: CampaignType;
  prize_pool: number;
  remaining_pool: number;
  status: CampaignStatus;
  total_budget?: number; // Alias for prize_pool
  platform?: string; // Alias for required_platforms
  required_platforms: string[];
  video_requirements: string | null;
  slogan: string | null;
  keywords: string[];
  terms: CampaignTerms | null;
  location: string | null;
  discount_percent: number | null;
  start_date: string;
  end_date: string;
  verification_days: number;
  created_at: string;
  image_url?: string;
  images?: string[];
  // Joined fields
  advertiser?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
    is_verified: boolean;
  };
  payout_tiers?: PayoutTier[];
  submission_count?: number;
  submissions?: Submission[];
}

export type CampaignType = 'pool' | 'discount' | 'hybrid';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'expired' | 'draft';

export interface CampaignTerms {
  min_duration_seconds?: number;
  max_duration_seconds?: number;
  must_include_hashtags?: string[];
  must_mention?: string[];
  language?: string;
  content_restrictions?: string;
  additional_notes?: string;
  images?: string[];
}

/**
 * Helper to safely extract an array of image URLs from a Campaign
 * Prioritizes campaign.images, then terms.images, then parses image_url
 */
export function getCampaignImages(campaign: {
  image_url?: string | null;
  images?: string[] | null;
  terms?: any;
}): string[] {
  if (Array.isArray(campaign.images) && campaign.images.length > 0) {
    return campaign.images.filter(Boolean);
  }
  if (campaign.terms && Array.isArray(campaign.terms.images) && campaign.terms.images.length > 0) {
    return campaign.terms.images.filter(Boolean);
  }
  if (campaign.image_url) {
    const trimmed = campaign.image_url.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean);
        }
      } catch {}
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
}

export interface PayoutTier {
  id: string;
  campaign_id: string;
  min_views: number;
  payout_amount: number;
  reward_type: RewardType;
  reward_description: string | null;
}

export type RewardType = 'cash' | 'discount' | 'gift' | 'refund';

export interface SlideshowItem {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  badge_text: string;
  badge_icon: string;
  theme_color: string;
  link_url?: string;
  order_index: number;
}

export interface Submission {
  id: string;
  campaign_id: string;
  creator_id: string;
  video_url: string;
  platform: string;
  video_id: string;
  current_views: number;
  status: SubmissionStatus;
  earned_amount: number;
  submitted_at: string;
  verified_at: string | null;
  paid_at: string | null;
  // Joined fields
  campaign?: Campaign;
  creator?: {
    full_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export type SubmissionStatus = 'pending' | 'verified' | 'paid' | 'disputed' | 'rejected';

export interface CampaignFilters {
  search: string;
  location: string;
  type: CampaignType | '';
  minPayout: number;
  maxPayout: number;
  platform: string;
  category: string;
  sortBy: CampaignSortOption;
}

export type CampaignSortOption = 'newest' | 'highest_pool' | 'ending_soon' | 'trending' | 'most_submissions';
