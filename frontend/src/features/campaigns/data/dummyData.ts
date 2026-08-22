export interface CreatorProfile {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  location: string;
  isVerified: boolean;
  followers: number; // in thousands (e.g. 1200 = 1.2M)
  followersStr: string;
  campaigns: string;
  perPost: number; // in INR thousands (e.g. 12 = ₹12.0K)
  perPostStr: string;
  platforms: string[]; // 'youtube', 'instagram', 'tiktok'
  category: string; // 'Education', 'Gaming', etc.
}

export const DUMMY_CREATORS: CreatorProfile[] = [
  {
    id: 'dummy-jikki',
    fullName: 'Jikki Thakur',
    handle: '@jikkithakur',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsAciJvVI6nGE8Riv5pl5AiCdsgUyuCBIztyf8yJ1nMsVzN_tKamimn4oVc377SuO03Y0BLG3vBSg6L9Gb661VbZxjTCOmgqtLkycpkas-Y4kNRelTvegSPmDOwuXDoRbG_T9NDOpD85w4fS1MEQXqfzIMok67ViFzp1sO1_5M7JgPmQnt8hPSXXoZIoKnrd1CqosMcNxDB8nQ1sCkiHfR8QRnCR7F_sliBrGJirtLIostx8BD9Qdq5Oh0',
    bio: 'Tech professional & passionate world traveler.',
    location: 'New Delhi, India',
    isVerified: true,
    followers: 1200,
    followersStr: '1.2M',
    campaigns: '50+',
    perPost: 12,
    perPostStr: '₹12.0K',
    platforms: ['youtube', 'instagram', 'tiktok'],
    category: 'Travel'
  },
  {
    id: 'dummy-meera',
    fullName: 'Meera Travels',
    handle: '@meeratravels',
    avatarUrl: 'https://via.placeholder.com/150/333/fff?text=MT',
    bio: 'Travel vlogger | Exploring the world one city at a time.',
    location: 'Mumbai, India',
    isVerified: true,
    followers: 820,
    followersStr: '820K',
    campaigns: '35+',
    perPost: 8.5,
    perPostStr: '₹8.5K',
    platforms: ['instagram', 'youtube'],
    category: 'Travel'
  },
  {
    id: 'dummy-arjun',
    fullName: 'Arjun Fitness',
    handle: '@arjunfit',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    bio: 'Certified personal trainer. Helping you build your dream physique.',
    location: 'Bangalore, India',
    isVerified: false,
    followers: 450,
    followersStr: '450K',
    campaigns: '12+',
    perPost: 5,
    perPostStr: '₹5.0K',
    platforms: ['instagram'],
    category: 'Fitness & Gym'
  },
  {
    id: 'dummy-techguru',
    fullName: 'The Tech Guru',
    handle: '@techguru',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    bio: 'Unboxing the future. Tech reviews and tutorials.',
    location: 'Hyderabad, India',
    isVerified: true,
    followers: 3500,
    followersStr: '3.5M',
    campaigns: '120+',
    perPost: 50,
    perPostStr: '₹50.0K',
    platforms: ['youtube', 'instagram'],
    category: 'Technology'
  },
  {
    id: 'dummy-riya',
    fullName: 'Riya Cooks',
    handle: '@riyacooks',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    bio: 'Simple home recipes & restaurant reviews.',
    location: 'Chennai, India',
    isVerified: false,
    followers: 250,
    followersStr: '250K',
    campaigns: '8+',
    perPost: 3,
    perPostStr: '₹3.0K',
    platforms: ['youtube', 'tiktok'],
    category: 'Food & Restaurant'
  },
  {
    id: 'dummy-sam',
    fullName: 'Sam Plays',
    handle: '@samgaming',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150',
    bio: 'Pro eSports player. Streaming everyday.',
    location: 'Pune, India',
    isVerified: true,
    followers: 1800,
    followersStr: '1.8M',
    campaigns: '85+',
    perPost: 25,
    perPostStr: '₹25.0K',
    platforms: ['youtube', 'tiktok', 'instagram'],
    category: 'Gaming'
  },
  {
    id: 'dummy-edu',
    fullName: 'Learn With Neha',
    handle: '@learnwithneha',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    bio: 'Making math and science easy for high schoolers.',
    location: 'Delhi, India',
    isVerified: true,
    followers: 900,
    followersStr: '900K',
    campaigns: '20+',
    perPost: 10,
    perPostStr: '₹10.0K',
    platforms: ['youtube'],
    category: 'Education'
  },
  {
    id: 'dummy-priya',
    fullName: 'Priya Life',
    handle: '@priyastyle',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bio: 'Fashion, beauty, and daily vlogs.',
    location: 'Mumbai, India',
    isVerified: true,
    followers: 2200,
    followersStr: '2.2M',
    campaigns: '150+',
    perPost: 30,
    perPostStr: '₹30.0K',
    platforms: ['instagram', 'tiktok'],
    category: 'Fashion'
  },
  {
    id: 'dummy-rohit',
    fullName: 'Rohit Fit',
    handle: '@rohitfit',
    avatarUrl: 'https://via.placeholder.com/150/333/fff?text=RF',
    bio: 'Calisthenics and bodyweight mastery.',
    location: 'Kolkata, India',
    isVerified: false,
    followers: 120,
    followersStr: '120K',
    campaigns: '5+',
    perPost: 2,
    perPostStr: '₹2.0K',
    platforms: ['instagram', 'youtube'],
    category: 'Fitness & Gym'
  },
  {
    id: 'dummy-foodie',
    fullName: 'The Bangalore Foodie',
    handle: '@blrfoodie',
    avatarUrl: 'https://via.placeholder.com/150/333/fff?text=BF',
    bio: 'Discovering the best eats in Namma Bengaluru.',
    location: 'Bangalore, India',
    isVerified: true,
    followers: 600,
    followersStr: '600K',
    campaigns: '40+',
    perPost: 7,
    perPostStr: '₹7.0K',
    platforms: ['instagram'],
    category: 'Food & Restaurant'
  }
];
