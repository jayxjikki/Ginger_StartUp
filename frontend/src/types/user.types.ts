// ═══════════════════════════════════════════════════════════
// GINGER — TypeScript Type Definitions
// User & Profile types
// ═══════════════════════════════════════════════════════════

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  category: string | null;
  location: string | null;
  mobile_number?: string;
  gender?: string;
  onboarding_completed?: boolean;
  follower_count: number;
  rates: ProfileRates | null;
  is_verified: boolean;
  telegram_id?: string;
  telegram_username?: string;
  role?: string;
  is_banned?: boolean;
  created_at: string;
}

export interface ProfileRates {
  per_post: number | null;
  per_story: number | null;
  per_reel: number | null;
  per_video: number | null;
  currency: string;
}

export interface SocialLink {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  username: string;
  url: string;
  followers: number;
  verified: boolean;
}

export type SocialPlatform =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'snapchat';

export interface MediaKit {
  id: string;
  profile_id: string;
  images: string[];
  pdf_url: string | null;
  description: string | null;
  rate_per_post: number | null;
  rate_per_story: number | null;
  rate_per_reel: number | null;
  categories: string[];
}

export type UserRole = 'creator' | 'advertiser' | 'both';

export const CATEGORIES = [
  'Education',
  'Fitness & Gym',
  'Gaming',
  'Travel',
  'Food & Restaurant',
  'Technology',
  'Fashion & Beauty',
  'Entertainment',
  'Music',
  'Health & Wellness',
  'Real Estate',
  'Automotive',
  'Finance',
  'Lifestyle',
  'Photography',
  'Art & Design',
  'Sports',
  'Parenting',
  'Pets',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];
