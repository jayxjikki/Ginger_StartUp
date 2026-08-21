// ═══════════════════════════════════════════════════════════
// GINGER — Campaign Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Campaign, CampaignFilters, Submission } from '../types/campaign.types';

// Demo campaign data for development
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    advertiser_id: 'adv-1',
    title: 'Luxury Himalayan Resort Grand Opening',
    description: 'We just opened a 5-star luxury resort nestled in the Himalayan mountains. Create stunning videos showcasing the breathtaking views, world-class amenities, and gourmet dining experience. Show the infinity pool overlooking the valley, the spa, and the adventure activities we offer.',
    type: 'pool',
    prize_pool: 1000000,
    remaining_pool: 850000,
    status: 'active',
    required_platforms: ['youtube', 'instagram'],
    video_requirements: 'Minimum 60 seconds. Must include resort exterior, room tour, pool area, and restaurant. Use our slogan in the video.',
    slogan: 'Where Luxury Meets the Clouds ☁️',
    keywords: ['luxury resort', 'himalayan getaway', 'mountain retreat', 'travel india', '5 star hotel'],
    terms: {
      min_duration_seconds: 60,
      must_include_hashtags: ['#HimalayanLuxury', '#CloudResort', '#MountainRetreat'],
      must_mention: ['Cloud Peak Resort'],
      language: 'English or Hindi',
    },
    location: 'Manali, Himachal Pradesh',
    discount_percent: null,
    start_date: '2026-08-15T00:00:00Z',
    end_date: '2026-09-15T00:00:00Z',
    verification_days: 7,
    created_at: '2026-08-14T10:00:00Z',
    advertiser: {
      full_name: 'Arjun Mehta',
      avatar_url: null,
      username: 'cloudpeakresort',
      is_verified: true,
    },
    payout_tiers: [
      { id: 't1', campaign_id: '1', min_views: 1000, payout_amount: 1000, reward_type: 'cash', reward_description: null },
      { id: 't2', campaign_id: '1', min_views: 10000, payout_amount: 10000, reward_type: 'cash', reward_description: null },
      { id: 't3', campaign_id: '1', min_views: 100000, payout_amount: 200000, reward_type: 'cash', reward_description: 'Plus free 2-night stay!' },
      { id: 't4', campaign_id: '1', min_views: 1000000, payout_amount: 500000, reward_type: 'cash', reward_description: 'Plus lifetime membership!' },
    ],
    submission_count: 47,
  },
  {
    id: '2',
    advertiser_id: 'adv-2',
    title: 'Spice Garden Restaurant — Taste & Create',
    description: 'New authentic South Indian restaurant in Bangalore. Come eat our signature dishes, shoot a video review, and earn discounts! Show the ambiance, food plating, and your genuine reaction. We want real food lovers, not scripts.',
    type: 'hybrid',
    prize_pool: 200000,
    remaining_pool: 180000,
    status: 'active',
    required_platforms: ['instagram', 'youtube'],
    video_requirements: 'Must feature at least 3 dishes. Show the restaurant interior. Give honest review.',
    slogan: 'Spice That Speaks 🌶️',
    keywords: ['food review', 'south indian food', 'bangalore restaurant', 'food vlog'],
    terms: {
      min_duration_seconds: 30,
      must_include_hashtags: ['#SpiceGardenBLR', '#SpiceThatSpeaks'],
      language: 'Any',
    },
    location: 'Koramangala, Bangalore',
    discount_percent: 15,
    start_date: '2026-08-10T00:00:00Z',
    end_date: '2026-09-10T00:00:00Z',
    verification_days: 5,
    created_at: '2026-08-10T08:00:00Z',
    advertiser: {
      full_name: 'Priya Sharma',
      avatar_url: null,
      username: 'spicegardenbangalore',
      is_verified: false,
    },
    payout_tiers: [
      { id: 't5', campaign_id: '2', min_views: 500, payout_amount: 500, reward_type: 'cash', reward_description: null },
      { id: 't6', campaign_id: '2', min_views: 5000, payout_amount: 5000, reward_type: 'cash', reward_description: null },
      { id: 't7', campaign_id: '2', min_views: 50000, payout_amount: 50000, reward_type: 'cash', reward_description: 'Plus 1 month free meals!' },
    ],
    submission_count: 23,
  },
  {
    id: '3',
    advertiser_id: 'adv-3',
    title: 'FitZone Gym — Transform & Earn',
    description: 'Brand new premium gym opening in Delhi NCR. Create workout videos at our gym showcasing state-of-the-art equipment, personal training sessions, and our recovery zone. Fitness influencers and beginners both welcome!',
    type: 'pool',
    prize_pool: 500000,
    remaining_pool: 420000,
    status: 'active',
    required_platforms: ['youtube', 'instagram', 'tiktok'],
    video_requirements: 'Show at least 3 different workout zones. Include before/after or transformation angle.',
    slogan: 'Your Transformation Starts Here 💪',
    keywords: ['gym', 'fitness', 'workout', 'delhi gym', 'body transformation'],
    terms: {
      min_duration_seconds: 45,
      must_include_hashtags: ['#FitZoneDelhi', '#TransformHere'],
      must_mention: ['FitZone Premium'],
    },
    location: 'Connaught Place, Delhi',
    discount_percent: null,
    start_date: '2026-08-18T00:00:00Z',
    end_date: '2026-09-30T00:00:00Z',
    verification_days: 7,
    created_at: '2026-08-17T12:00:00Z',
    advertiser: {
      full_name: 'Vikram Singh',
      avatar_url: null,
      username: 'fitzonepremium',
      is_verified: true,
    },
    payout_tiers: [
      { id: 't8', campaign_id: '3', min_views: 1000, payout_amount: 1500, reward_type: 'cash', reward_description: null },
      { id: 't9', campaign_id: '3', min_views: 25000, payout_amount: 25000, reward_type: 'cash', reward_description: null },
      { id: 't10', campaign_id: '3', min_views: 500000, payout_amount: 200000, reward_type: 'cash', reward_description: 'Plus 1 year free membership!' },
    ],
    submission_count: 89,
  },
  {
    id: '4',
    advertiser_id: 'adv-4',
    title: 'EduSpark Online Courses — Learn & Share',
    description: 'Promote our AI & Machine Learning courses. Create educational content explaining why upskilling in AI is crucial in 2026. Share your learning journey or review our course content.',
    type: 'pool',
    prize_pool: 300000,
    remaining_pool: 275000,
    status: 'active',
    required_platforms: ['youtube'],
    video_requirements: 'Must be educational and informative. Show course dashboard, curriculum highlights, and your honest opinion.',
    slogan: 'Future-Proof Your Career with AI 🤖',
    keywords: ['online courses', 'AI learning', 'machine learning', 'edtech', 'career growth'],
    terms: {
      min_duration_seconds: 120,
      must_include_hashtags: ['#EduSpark', '#LearnAI', '#FutureReady'],
      must_mention: ['EduSpark'],
      language: 'English',
    },
    location: 'Online / Pan India',
    discount_percent: null,
    start_date: '2026-08-20T00:00:00Z',
    end_date: '2026-10-20T00:00:00Z',
    verification_days: 7,
    created_at: '2026-08-19T09:00:00Z',
    advertiser: {
      full_name: 'Neha Gupta',
      avatar_url: null,
      username: 'eduspark_official',
      is_verified: true,
    },
    payout_tiers: [
      { id: 't11', campaign_id: '4', min_views: 2000, payout_amount: 2000, reward_type: 'cash', reward_description: null },
      { id: 't12', campaign_id: '4', min_views: 20000, payout_amount: 15000, reward_type: 'cash', reward_description: null },
      { id: 't13', campaign_id: '4', min_views: 200000, payout_amount: 100000, reward_type: 'cash', reward_description: 'Plus lifetime access to all courses!' },
    ],
    submission_count: 31,
  },
  {
    id: '5',
    advertiser_id: 'adv-5',
    title: 'DreamHome Real Estate — Sell My Property',
    description: 'Luxury 4BHK penthouse in Mumbai with sea view. Create a stunning property tour video. Show every room, the view, the building amenities, and neighborhood highlights.',
    type: 'pool',
    prize_pool: 750000,
    remaining_pool: 750000,
    status: 'active',
    required_platforms: ['youtube', 'instagram'],
    video_requirements: 'Professional quality. Drone shots preferred. Must cover: living area, bedrooms, kitchen, balcony view, building amenities.',
    slogan: 'Live Above the Clouds in Mumbai 🏙️',
    keywords: ['real estate', 'luxury apartment', 'mumbai property', 'penthouse tour', 'sea view'],
    terms: {
      min_duration_seconds: 180,
      must_include_hashtags: ['#DreamHomeMumbai', '#LuxuryLiving', '#MumbaiPenthouse'],
      language: 'English or Hindi',
    },
    location: 'Worli, Mumbai',
    discount_percent: null,
    start_date: '2026-08-21T00:00:00Z',
    end_date: '2026-10-21T00:00:00Z',
    verification_days: 14,
    created_at: '2026-08-20T14:00:00Z',
    advertiser: {
      full_name: 'Rajesh Kapoor',
      avatar_url: null,
      username: 'dreamhomerealty',
      is_verified: true,
    },
    payout_tiers: [
      { id: 't14', campaign_id: '5', min_views: 5000, payout_amount: 5000, reward_type: 'cash', reward_description: null },
      { id: 't15', campaign_id: '5', min_views: 50000, payout_amount: 75000, reward_type: 'cash', reward_description: null },
      { id: 't16', campaign_id: '5', min_views: 500000, payout_amount: 300000, reward_type: 'cash', reward_description: 'Plus broker referral fee!' },
    ],
    submission_count: 12,
  },
];

interface CampaignState {
  campaigns: Campaign[];
  filteredCampaigns: Campaign[];
  selectedCampaign: Campaign | null;
  mySubmissions: Submission[];
  filters: CampaignFilters;
  isLoading: boolean;

  // Actions
  fetchCampaigns: () => Promise<void>;
  setSelectedCampaign: (campaign: Campaign | null) => void;
  setFilters: (filters: Partial<CampaignFilters>) => void;
  applyFilters: () => void;
}

const defaultFilters: CampaignFilters = {
  search: '',
  location: '',
  type: '',
  minPayout: 0,
  maxPayout: 0,
  platform: '',
  category: '',
  sortBy: 'newest',
};

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: DEMO_CAMPAIGNS,
  filteredCampaigns: DEMO_CAMPAIGNS,
  selectedCampaign: null,
  mySubmissions: [],
  filters: defaultFilters,
  isLoading: false,

  fetchCampaigns: async () => {
    set({ isLoading: true });
    // In production, this fetches from Supabase
    // For now, use demo data
    setTimeout(() => {
      set({ campaigns: DEMO_CAMPAIGNS, filteredCampaigns: DEMO_CAMPAIGNS, isLoading: false });
    }, 800);
  },

  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  applyFilters: () => {
    const { campaigns, filters } = get();
    let result = [...campaigns];

    // Search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.keywords.some((k) => k.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter((c) => c.location?.toLowerCase().includes(loc));
    }

    // Type filter
    if (filters.type) {
      result = result.filter((c) => c.type === filters.type);
    }

    // Platform filter
    if (filters.platform) {
      result = result.filter((c) => c.required_platforms.includes(filters.platform));
    }

    // Sort
    switch (filters.sortBy) {
      case 'highest_pool':
        result.sort((a, b) => b.prize_pool - a.prize_pool);
        break;
      case 'ending_soon':
        result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      case 'most_submissions':
        result.sort((a, b) => (b.submission_count ?? 0) - (a.submission_count ?? 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    set({ filteredCampaigns: result });
  },
}));
