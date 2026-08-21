// ═══════════════════════════════════════════════════════════
// GINGER — App Constants
// ═══════════════════════════════════════════════════════════

export const APP_NAME = 'Ginger';
export const APP_TAGLINE = 'Create. Promote. Earn.';
export const APP_DESCRIPTION = 'The fair influencer marketplace where everyone earns based on results.';

export const SOCIAL_PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'FaYoutube' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', icon: 'FaInstagram' },
  { id: 'tiktok', name: 'TikTok', color: '#000000', icon: 'FaTiktok' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'FaFacebook' },
  { id: 'twitter', name: 'X (Twitter)', color: '#1DA1F2', icon: 'FaXTwitter' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'FaLinkedin' },
  { id: 'snapchat', name: 'Snapchat', color: '#FFFC00', icon: 'FaSnapchat' },
] as const;

export const CAMPAIGN_TYPES = [
  { id: 'pool', label: 'Prize Pool', description: 'Set a prize pool that creators earn from based on views' },
  { id: 'discount', label: 'Discount Offer', description: 'Offer discounts to people who create promotional content' },
  { id: 'hybrid', label: 'Hybrid', description: 'Combine prize pool with discount offers' },
] as const;

export const REWARD_TYPES = [
  { id: 'cash', label: 'Cash', icon: '💰' },
  { id: 'discount', label: 'Discount', icon: '🏷️' },
  { id: 'gift', label: 'Gift', icon: '🎁' },
  { id: 'refund', label: 'Full Refund', icon: '💸' },
] as const;

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'highest_pool', label: 'Highest Prize Pool' },
  { id: 'ending_soon', label: 'Ending Soon' },
  { id: 'trending', label: 'Trending' },
  { id: 'most_submissions', label: 'Most Popular' },
] as const;

export const VERIFICATION_PERIODS = [
  { days: 1, label: '1 Day' },
  { days: 3, label: '3 Days' },
  { days: 5, label: '5 Days' },
  { days: 7, label: '7 Days' },
  { days: 14, label: '14 Days' },
] as const;

export const CURRENCY_SYMBOL = '₹';
export const PLATFORM_FEE_PERCENT = 5;
