export interface CreatorProfile {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  location: string;
  isVerified: boolean;
  followers: number; // in thousands (e.g. 1200 = 1.2M)
  followersStr: string;
  campaigns: string;
  perPost: number; // in INR thousands (e.g. 12 = ₹12.0K)
  perPostStr: string;
  platforms: string[]; // 'youtube', 'instagram', 'tiktok', 'telegram'
  category: string; // e.g. 'Sports & Athletics, Cricket, Calisthenics'
  tagline?: string;
  featuredTitle?: string; // Aesthetic poster title like "WISDOM", "LANDS HIGH", "VISIONS", "TIMELESS"
  samplePosts?: {
    id: string;
    title: string;
    content: string;
    image_url: string;
    created_at: string;
  }[];
}

export const DUMMY_CREATORS: CreatorProfile[] = [
  {
    id: 'dummy-arjun-sports',
    fullName: 'Arjun Rawat',
    handle: '@arjunfit',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'POWER',
    tagline: 'CALISTHENICS & ENDURANCE',
    bio: 'National level athlete & calisthenics coach. Building functional strength & athletic power.',
    location: 'Bengaluru, Karnataka',
    isVerified: true,
    followers: 1450,
    followersStr: '1.4M',
    campaigns: '64+',
    perPost: 18,
    perPostStr: '₹18.0K',
    platforms: ['youtube', 'instagram', 'telegram'],
    category: 'Sports & Athletics, Calisthenics, Bodybuilding, Cricket',
    samplePosts: [
      { id: 'p-1', title: 'Ring Muscle-Up Progression', content: 'Master the transition with false grip technique.', image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'p-2', title: 'Explosive Leg Power Routine', content: 'Plyometrics drill breakdown for sprinters.', image_url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
    ]
  },
  {
    id: 'dummy-ananya-beauty',
    fullName: 'Ananya Roy',
    handle: '@ananyabeauty',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'GLOW',
    tagline: 'CLEAN BEAUTY & SKINCARE',
    bio: 'Dermatologist-recommended clean beauty, radiant skincare routines & honest ingredient reviews.',
    location: 'Mumbai, Maharashtra',
    isVerified: true,
    followers: 2100,
    followersStr: '2.1M',
    campaigns: '92+',
    perPost: 28,
    perPostStr: '₹28.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Beauty, Skincare, Makeup, Fragrance',
    samplePosts: [
      { id: 'p-3', title: 'Barrier Repair Morning Routine', content: 'Ceramides + Centella for soothing glass skin.', image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'dummy-zara-ugc',
    fullName: 'Zara Khan',
    handle: '@zarakhan_ugc',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'VISIONS',
    tagline: 'EDITORIAL UGC & LUXURY',
    bio: 'High-converting UGC video creator & creative director partnering with premium lifestyle brands.',
    location: 'New Delhi, India',
    isVerified: true,
    followers: 890,
    followersStr: '890K',
    campaigns: '110+',
    perPost: 15,
    perPostStr: '₹15.0K',
    platforms: ['instagram', 'tiktok'],
    category: 'Creator Type, UGC, Influencer, Model, Brand Ambassador',
    samplePosts: [
      { id: 'p-4', title: 'Silk & Shadows Editorial', content: 'Shooting natural light aesthetic product reels.', image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'dummy-vikram-fashion',
    fullName: 'Vikram Singhania',
    handle: '@vikramstyle',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'TIMELESS',
    tagline: 'BESPOKE MENSWEAR & STREETWEAR',
    bio: 'Minimalist menswear styling, luxury streetwear drops & capsule wardrobe curation.',
    location: 'Mumbai, Maharashtra',
    isVerified: true,
    followers: 1850,
    followersStr: '1.8M',
    campaigns: '78+',
    perPost: 25,
    perPostStr: '₹25.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Fashion & Style, Menswear, Sneakers, Clothing, Model',
    samplePosts: [
      { id: 'p-5', title: 'Monochrome Autumn Tailoring', content: 'Italian linen blended with structural Japanese cotton.', image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 4).toISOString() }
    ]
  },
  {
    id: 'dummy-aman-finance',
    fullName: 'Aman Mittal',
    handle: '@aman_invest',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'ALPHA',
    tagline: 'VENTURE CAPITAL & WEALTH',
    bio: 'Angel investor & ex-founder. Demystifying venture capital, crypto fundamentals & financial freedom.',
    location: 'Bengaluru, Karnataka',
    isVerified: true,
    followers: 3200,
    followersStr: '3.2M',
    campaigns: '140+',
    perPost: 45,
    perPostStr: '₹45.0K',
    platforms: ['youtube', 'telegram', 'instagram'],
    category: 'Finance & Business, Crypto, Business, Entrepreneur, Investing, Trading',
    samplePosts: [
      { id: 'p-6', title: 'Valuation Multiples in 2026', content: 'Analyzing tech EBITDA margins and free cash flow yield.', image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  },
  {
    id: 'dummy-tara-wellness',
    fullName: 'Tara Sen',
    handle: '@tarawellness',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'ZENITH',
    tagline: 'HOLISTIC YOGA & MINDFULNESS',
    bio: 'Certified Ashtanga Yoga teacher & breathwork mentor. Mind-body alignment for urban balance.',
    location: 'Rishikesh, Uttarakhand',
    isVerified: true,
    followers: 1100,
    followersStr: '1.1M',
    campaigns: '53+',
    perPost: 16,
    perPostStr: '₹16.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Fitness & Wellness, Yoga, Pilates, Health, Gym',
    samplePosts: [
      { id: 'p-7', title: 'Pranayama at Sunrise', content: 'Awaken sympathetic flow with 10-minute box breathing.', image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 6).toISOString() }
    ]
  },
  {
    id: 'dummy-ranveer-food',
    fullName: 'Chef Ranveer Sethi',
    handle: '@chefranveer',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'CRAFT',
    tagline: 'HERITAGE RECIPES & STREET EATS',
    bio: 'Celebrity chef celebrating ancient Indian spice trails with modern gastronomic twists.',
    location: 'Jaipur, Rajasthan',
    isVerified: true,
    followers: 2750,
    followersStr: '2.8M',
    campaigns: '125+',
    perPost: 36,
    perPostStr: '₹36.0K',
    platforms: ['youtube', 'instagram', 'tiktok'],
    category: 'Food & Drink, Food, Cooking, Chef, Foodie, Baking',
    samplePosts: [
      { id: 'p-8', title: 'Slow-Cooked Dum Biryani Secret', content: 'Why smoking whole spices in ghee changes everything.', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'dummy-kunal-gaming',
    fullName: 'Kunal "Apex" Verma',
    handle: '@apexkunal',
    avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'NEXUS',
    tagline: 'PRO ESPORTS & HARDWARE',
    bio: 'Competitive FPS caster, custom watercooled PC modder & next-generation gaming benchmark reviews.',
    location: 'Hyderabad, Telangana',
    isVerified: true,
    followers: 1650,
    followersStr: '1.6M',
    campaigns: '88+',
    perPost: 22,
    perPostStr: '₹22.0K',
    platforms: ['youtube', 'twitch', 'discord'],
    category: 'Gaming & Tech, Gaming, Esports, PC Build, Tech',
    samplePosts: [
      { id: 'p-9', title: '500FPS Beast PC Mod', content: 'Custom acrylic loop with dual radiator setup.', image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'dummy-ria-tech',
    fullName: 'Ria Sharma AI',
    handle: '@riatech_ai',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'FUTURE',
    tagline: 'AI ARCHITECTURE & DEVTOOLS',
    bio: 'Tech lead & AI educator. Exploring generative agents, neural architectures & modern developer tools.',
    location: 'Bengaluru, Karnataka',
    isVerified: true,
    followers: 1980,
    followersStr: '2.0M',
    campaigns: '76+',
    perPost: 30,
    perPostStr: '₹30.0K',
    platforms: ['youtube', 'github', 'x'],
    category: 'Gaming & Tech, Tech, AI, Virtual',
    samplePosts: [
      { id: 'p-10', title: 'Autonomous Multi-Agent Swarms', content: 'Hands-on tutorial building tool-calling reasoning agents.', image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 4).toISOString() }
    ]
  },
  {
    id: 'dummy-meera-travel',
    fullName: 'Meera Varma',
    handle: '@meeratravels',
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'LANDS HIGH',
    tagline: 'SOLO EXPLORATION & SLOW LIVING',
    bio: 'Visual travel documentarian across 42 countries. Immersive slow travel & indigenous community stories.',
    location: 'Goa, India',
    isVerified: true,
    followers: 2450,
    followersStr: '2.5M',
    campaigns: '95+',
    perPost: 32,
    perPostStr: '₹32.0K',
    platforms: ['youtube', 'instagram'],
    category: 'Lifestyle & Travel, Travel, Lifestyle, Outdoor',
    samplePosts: [
      { id: 'p-11', title: 'Hidden Fjord in Lofoten', content: 'Kayaking under midnight sun in the arctic circle.', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  },
  {
    id: 'dummy-siddharth-music',
    fullName: 'DJ Siddharth',
    handle: '@djsiddharth',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'PULSE',
    tagline: 'ELECTRONIC BEATS & LIVE SYNTH',
    bio: 'Electronic music producer & festival DJ. Pushing deep house, melodic techno & live modular synths.',
    location: 'Mumbai, Maharashtra',
    isVerified: true,
    followers: 1380,
    followersStr: '1.4M',
    campaigns: '62+',
    perPost: 20,
    perPostStr: '₹20.0K',
    platforms: ['youtube', 'instagram', 'spotify'],
    category: 'Music & Entertainment, Music, Dance',
    samplePosts: [
      { id: 'p-12', title: 'Sunset Live Set from Goa', content: '2-hour deep melodic house set now live on YouTube.', image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'dummy-tanmay-comedy',
    fullName: 'Tanmay Rao',
    handle: '@tanmaycomic',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'HUMOR',
    tagline: 'STANDUP & CULTURAL SATIRE',
    bio: 'Touring stand-up comedian, podcast creator & viral sketch writer bringing laughs to millions.',
    location: 'New Delhi, India',
    isVerified: true,
    followers: 3100,
    followersStr: '3.1M',
    campaigns: '130+',
    perPost: 42,
    perPostStr: '₹42.0K',
    platforms: ['youtube', 'instagram', 'x'],
    category: 'Music & Entertainment, Comedy, Acting, Movies',
    samplePosts: [
      { id: 'p-13', title: 'Corporate Meeting Stereotypes', content: 'When "let us circle back" turns into an existential crisis.', image_url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'dummy-aditya-pets',
    fullName: 'Dr. Aditya & Paws',
    handle: '@adityapaws',
    avatarUrl: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'NATURE',
    tagline: 'CANINE VET & BEHAVIOR',
    bio: 'Veterinarian, canine behavior specialist & rescue animal advocate educating pet parents everywhere.',
    location: 'Chandigarh, India',
    isVerified: true,
    followers: 860,
    followersStr: '860K',
    campaigns: '48+',
    perPost: 11,
    perPostStr: '₹11.0K',
    platforms: ['youtube', 'instagram'],
    category: 'Pets & Animals, Pet, Dogs, Cats',
    samplePosts: [
      { id: 'p-14', title: 'Puppy Socialization Protocol', content: 'Positive conditioning before 16 weeks of age.', image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 5).toISOString() }
    ]
  },
  {
    id: 'dummy-rohan-family',
    fullName: 'Rohan & Simran',
    handle: '@rohansimran_fam',
    avatarUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'LEGACY',
    tagline: 'MODERN PARENTING & TRAVEL',
    bio: 'Navigating parenthood, road trips with toddlers & creating meaningful home memories.',
    location: 'Pune, Maharashtra',
    isVerified: true,
    followers: 940,
    followersStr: '940K',
    campaigns: '58+',
    perPost: 14,
    perPostStr: '₹14.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Family & Parenting, Parenting, Mom, Family, Couple',
    samplePosts: [
      { id: 'p-15', title: 'Weekend Roadtrip Essentials', content: 'Pack light without forgetting a single baby essential.', image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'dummy-sneha-community',
    fullName: 'Sneha Patel',
    handle: '@snehastudent',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'COMMUNITY',
    tagline: 'CAMPUS LIFE & GEN-Z CAREERS',
    bio: 'College tips, early stage career coaching, internships and building vibrant student networks.',
    location: 'Ahmedabad, Gujarat',
    isVerified: false,
    followers: 520,
    followersStr: '520K',
    campaigns: '32+',
    perPost: 8,
    perPostStr: '₹8.0K',
    platforms: ['instagram', 'youtube', 'telegram'],
    category: 'Identity & Community, Student, Community',
    samplePosts: [
      { id: 'p-16', title: 'Landing Your First Tech Internship', content: 'Cold emailing framework with 40% reply rate.', image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  },
  {
    id: 'dummy-natasha-style',
    fullName: 'Natasha Varma',
    handle: '@natashavarma',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'COUTURE',
    tagline: 'VINTAGE RUNWAY & SUSTAINABILITY',
    bio: 'Fashion model, sustainable archive archivist & thrift culture documentary producer.',
    location: 'Kolkata, West Bengal',
    isVerified: true,
    followers: 1720,
    followersStr: '1.7M',
    campaigns: '84+',
    perPost: 24,
    perPostStr: '₹24.0K',
    platforms: ['instagram', 'tiktok'],
    category: 'Fashion & Style, Fashion, Model, Clothing, Activewear',
    samplePosts: [
      { id: 'p-17', title: '90s Silk Trench Restoration', content: 'Breathe new life into thrifted high-end tailoring.', image_url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 4).toISOString() }
    ]
  },
  {
    id: 'dummy-kabir-athletics',
    fullName: 'Kabir Sharma',
    handle: '@kabirsport',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'VALOR',
    tagline: 'PRO CRICKET & FOOTBALL',
    bio: 'Professional football development coach & athletic performance nutritionist.',
    location: 'Kochi, Kerala',
    isVerified: true,
    followers: 1250,
    followersStr: '1.3M',
    campaigns: '60+',
    perPost: 17,
    perPostStr: '₹17.0K',
    platforms: ['youtube', 'instagram'],
    category: 'Sports & Athletics, Football, Cricket, Sports, Bodybuilding',
    samplePosts: [
      { id: 'p-18', title: 'Sprint Mechanics & Ground Contact Time', content: 'Drills to shave 0.2s off your 30m sprint.', image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 3).toISOString() }
    ]
  },
  {
    id: 'dummy-priya-glam',
    fullName: 'Priya Sharma Glam',
    handle: '@priyaglam',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400',
    coverUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'CHARM',
    tagline: 'HAIR STYLING & BRIDAL GLAM',
    bio: 'Celebrity bridal hair stylist & masterclass educator in artisanal fragrance pairings.',
    location: 'Lucknow, Uttar Pradesh',
    isVerified: true,
    followers: 990,
    followersStr: '990K',
    campaigns: '51+',
    perPost: 15,
    perPostStr: '₹15.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Beauty, Hair, Makeup, Fragrance, Skincare',
    samplePosts: [
      { id: 'p-19', title: 'Silk Press & Heat Protection', content: 'Keep bounce without compromising strand hydration.', image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
    ]
  },
  {
    id: 'dummy-jikki',
    fullName: 'Jikki Thakur',
    handle: '@jikkithakur',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsAciJvVI6nGE8Riv5pl5AiCdsgUyuCBIztyf8yJ1nMsVzN_tKamimn4oVc377SuO03Y0BLG3vBSg6L9Gb661VbZxjTCOmgqtLkycpkas-Y4kNRelTvegSPmDOwuXDoRbG_T9NDOpD85w4fS1MEQXqfzIMok67ViFzp1sO1_5M7JgPmQnt8hPSXXoZIoKnrd1CqosMcNxDB8nQ1sCkiHfR8QRnCR7F_sliBrGJirtLIostx8BD9Qdq5Oh0',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
    featuredTitle: 'HORIZON',
    tagline: 'HIGH-ALTITUDE TRAVELS',
    bio: 'Software architect & mountaineer documenting Himalayas and remote mountain villages.',
    location: 'New Delhi, India',
    isVerified: true,
    followers: 1200,
    followersStr: '1.2M',
    campaigns: '50+',
    perPost: 12,
    perPostStr: '₹12.0K',
    platforms: ['youtube', 'instagram', 'tiktok'],
    category: 'Lifestyle & Travel, Travel, Outdoor, Lifestyle',
    samplePosts: [
      { id: 'p-20', title: 'Zanskar River Frozen Expedition', content: 'Walking the Chadar Trek at -25°C.', image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
    ]
  }
];

export const getDummyCreatorById = (id: string): CreatorProfile | undefined => {
  return DUMMY_CREATORS.find((c) => c.id === id);
};

export const getFeaturedCreators = (limit = 10): CreatorProfile[] => {
  return [...DUMMY_CREATORS].sort((a, b) => b.followers - a.followers).slice(0, limit);
};
