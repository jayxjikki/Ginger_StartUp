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
  direct_discount_tiers?: DirectDiscountTierItem[];
}

/**
 * Helper to safely extract an array of image URLs from a Campaign
 * Prioritizes campaign.images, terms.images, terms.image_urls, and image_url fallbacks
 */
export function getCampaignImages(campaign: {
  image_url?: string | null;
  images?: string[] | null;
  terms?: any;
  [key: string]: any;
} | null | undefined): string[] {
  if (!campaign) return [];
  const result: string[] = [];

  const addImage = (img: any) => {
    if (!img) return;
    if (typeof img === 'string') {
      const trimmed = img.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(addImage);
            return;
          }
        } catch {}
      }
      if (trimmed.includes(',')) {
        trimmed.split(',').forEach((part) => addImage(part.trim()));
        return;
      }
      if (!result.includes(trimmed)) {
        result.push(trimmed);
      }
    } else if (Array.isArray(img)) {
      img.forEach(addImage);
    }
  };

  // 1. Check direct images array
  if (Array.isArray(campaign.images) && campaign.images.length > 0) {
    campaign.images.forEach(addImage);
  }

  // 2. Check terms images (supporting parsed object or raw stringified JSON)
  let termsObj = campaign.terms;
  if (typeof termsObj === 'string') {
    try {
      termsObj = JSON.parse(termsObj);
    } catch {}
  }
  if (termsObj && typeof termsObj === 'object') {
    if (Array.isArray(termsObj.images)) {
      termsObj.images.forEach(addImage);
    }
    if (Array.isArray(termsObj.image_urls)) {
      termsObj.image_urls.forEach(addImage);
    }
    if (termsObj.image_url) {
      addImage(termsObj.image_url);
    }
  }

  // 3. Check direct image_url, cover_image, banner_url, image
  addImage(campaign.image_url);
  addImage(campaign.cover_image);
  addImage(campaign.banner_url);
  addImage(campaign.image);

  return result;
}

export interface PayoutTier {
  id: string;
  campaign_id: string;
  min_views: number;
  payout_amount: number;
  reward_type: RewardType;
  reward_description: string | null;
}

export const DIRECT_DISCOUNT_TERMS = [
  { id: 'shoot_video', label: 'Shoot a video', icon: '🎥' },
  { id: 'visit_us', label: 'Visit us', icon: '📍' },
  { id: 'post_story', label: 'Post story/highlight', icon: '📱' },
  { id: 'review_rate', label: 'Review/rate us', icon: '⭐' },
] as const;

export type DirectDiscountTerm = (typeof DIRECT_DISCOUNT_TERMS)[number]['label'];

export interface DirectDiscountTierItem {
  term: DirectDiscountTerm | string;
  reward: string;
  review_url?: string;
}

/**
 * Helper to safely extract all configured direct discount tiers from a campaign
 */
export function getCampaignDirectDiscountTiers(campaign: any): DirectDiscountTierItem[] {
  if (!campaign) return [];
  const result: DirectDiscountTierItem[] = [];

  // 1. From campaign.terms.direct_discount_tiers
  let termsObj = campaign.terms;
  if (typeof termsObj === 'string') {
    try {
      termsObj = JSON.parse(termsObj);
    } catch {}
  }
  if (termsObj && Array.isArray(termsObj.direct_discount_tiers)) {
    termsObj.direct_discount_tiers.forEach((dt: any) => {
      if (dt && dt.term && dt.reward) {
        result.push({
          term: dt.term,
          reward: dt.reward,
          review_url: dt.review_url,
        });
      }
    });
  }

  // 2. From payout_tiers if not in terms
  if (Array.isArray(campaign.payout_tiers)) {
    campaign.payout_tiers.forEach((tier: any) => {
      const parsed = parseTierReward(tier);
      if (parsed.isDirectDiscount && parsed.conditionText && parsed.rewardText) {
        const alreadyIn = result.some((r) => r.term === parsed.conditionText);
        if (!alreadyIn) {
          result.push({
            term: parsed.conditionText,
            reward: parsed.rewardText,
          });
        }
      }
    });
  }

  return result;
}

export interface GiftTierItem {
  type?: 'views' | 'text';
  minViews?: string;
  condition?: string;
  gift: string;
}

/**
 * Parses a payout tier's reward_description to check for direct discount or custom text-text condition/reward
 */
export function parseTierReward(tier: {
  reward_type?: string;
  reward_description?: string | null;
  min_views?: number;
  payout_amount?: number;
}): {
  isTextTier: boolean;
  isDirectDiscount: boolean;
  conditionText: string;
  rewardText: string;
} {
  if (tier.reward_description) {
    if (
      tier.reward_description.startsWith('[Direct Discount]') ||
      tier.reward_description.startsWith('Direct Discount:')
    ) {
      const clean = tier.reward_description.replace(/^(\[Direct Discount\]\s*|Direct Discount:\s*)/, '');
      if (clean.includes(' ::: ')) {
        const [term, rew] = clean.split(' ::: ');
        return { isTextTier: true, isDirectDiscount: true, conditionText: term.trim(), rewardText: rew.trim() };
      }
      if (clean.includes(' : REWARD : ')) {
        const [term, rew] = clean.split(' : REWARD : ');
        return { isTextTier: true, isDirectDiscount: true, conditionText: term.trim(), rewardText: rew.trim() };
      }
      return {
        isTextTier: true,
        isDirectDiscount: true,
        conditionText: clean,
        rewardText: tier.payout_amount ? `${tier.payout_amount}% Discount` : 'Discount',
      };
    }
  }

  if (tier.reward_type === 'gift' && tier.reward_description) {
    if (tier.reward_description.includes(' : REWARD : ')) {
      const [cond, rew] = tier.reward_description.split(' : REWARD : ');
      return { isTextTier: true, isDirectDiscount: false, conditionText: cond.trim(), rewardText: rew.trim() };
    }
    if (tier.reward_description.includes(' ::: ')) {
      const [cond, rew] = tier.reward_description.split(' ::: ');
      return { isTextTier: true, isDirectDiscount: false, conditionText: cond.trim(), rewardText: rew.trim() };
    }
  }
  return {
    isTextTier: false,
    isDirectDiscount: false,
    conditionText: '',
    rewardText: tier.reward_description || 'Bonus Gift',
  };
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
  submission_type?: 'all_rewards' | 'direct_discount';
  voucher_code?: string | null;
  voucher_status?: 'active' | 'redeemed' | null;
  discount_percent?: number | null;
  voucher_details?: any | null;
  voucher_redeemed_at?: string | null;
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
