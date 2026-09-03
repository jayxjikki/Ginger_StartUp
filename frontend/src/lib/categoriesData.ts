// ═══════════════════════════════════════════════════════════
// GINGER — Categories & Subcategories Taxonomy
// ═══════════════════════════════════════════════════════════

export interface CategoryGroup {
  id: string;
  name: string;
  shortName: string;
  icon?: string;
  subcategories: string[];
}

export const CATEGORIES_DATA: CategoryGroup[] = [
  {
    id: 'sports',
    name: 'Sports & Athletics',
    shortName: 'Sports',
    icon: 'sports_cricket',
    subcategories: [
      'Cricket',
      'Football',
      'Soccer',
      'Basketball',
      'Tennis',
      'Badminton',
      'Sports',
      'Powerlifting',
      'Crossfit',
      'Calisthenics',
      'Pickleball',
      'Golf',
      'Bodybuilding',
      'Outdoor',
      'Fishing',
      'Surfing',
      'Hunting',
      'Kabaddi',
      'Sports Betting'
    ]
  },
  {
    id: 'beauty',
    name: 'Beauty',
    shortName: 'Beauty',
    icon: 'face',
    subcategories: ['Beauty', 'Nail', 'Skincare', 'Makeup', 'Fragrance', 'Hair']
  },
  {
    id: 'creator_type',
    name: 'Creator Type',
    shortName: 'Creator Type',
    icon: 'video_camera_front',
    subcategories: ['UGC', 'Influencer', 'Model', 'Brand Ambassador']
  },
  {
    id: 'family',
    name: 'Family & Parenting',
    shortName: 'Family',
    icon: 'family_restroom',
    subcategories: ['Tradwife', 'Mom', 'Family', 'Parenting', 'Couple', 'Pregnancy']
  },
  {
    id: 'fashion',
    name: 'Fashion & Style',
    shortName: 'Fashion',
    icon: 'styler',
    subcategories: [
      'Fashion',
      'Goth',
      'Blonde Hair',
      'Curly Hair',
      'Red Hair',
      'Tattoo',
      'Menswear',
      'Model',
      'Activewear',
      'Sneakers',
      'Clothing'
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Business',
    shortName: 'Finance',
    icon: 'payments',
    subcategories: ['Finance', 'Crypto', 'Business', 'Entrepreneur', 'Investing', 'Trading', 'Real Estate']
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    shortName: 'Fitness',
    icon: 'fitness_center',
    subcategories: ['Fitness', 'Health', 'Yoga', 'Weight Loss', 'Dental', 'Carnivore', 'Pilates', 'Gym']
  },
  {
    id: 'food',
    name: 'Food & Drink',
    shortName: 'Food & Drink',
    icon: 'restaurant',
    subcategories: ['Food', 'Cooking', 'Chef', 'Beer', 'Foodie', 'Baking', 'Cocktails']
  },
  {
    id: 'gaming_tech',
    name: 'Gaming & Tech',
    shortName: 'Gaming & Tech',
    icon: 'sports_esports',
    subcategories: ['Gaming', 'Tech', 'Virtual', 'AI', 'Chess', 'Poker', 'PC Build', 'Esports']
  },
  {
    id: 'identity',
    name: 'Identity & Community',
    shortName: 'Community',
    icon: 'groups',
    subcategories: ['Student', 'Black', 'Christian', 'Asian', 'Teen', 'Disney', 'Catholic', 'Latina', 'Nurse']
  },
  {
    id: 'lifestyle_travel',
    name: 'Lifestyle & Travel',
    shortName: 'Travel & Lifestyle',
    icon: 'flight_takeoff',
    subcategories: ['Travel', 'Lifestyle', 'DIY', 'Cannabis', 'Cleaning', 'Woodworking', 'Personal Use']
  },
  {
    id: 'music_entertainment',
    name: 'Music & Entertainment',
    shortName: 'Entertainment',
    icon: 'music_note',
    subcategories: ['Music', 'Car', 'Cosplay', 'Comedy', 'Ballet', 'Dance', 'Acting', 'Movies']
  },
  {
    id: 'pets',
    name: 'Pets & Animals',
    shortName: 'Pets',
    icon: 'pets',
    subcategories: ['Pet', 'Dogs', 'Cats', 'Exotic Animals']
  }
];

export const ALL_CATEGORY_NAMES = CATEGORIES_DATA.map((c) => c.name);

// All subcategories flat list
export const ALL_SUBCATEGORIES = Array.from(
  new Set(CATEGORIES_DATA.flatMap((cat) => cat.subcategories))
);

// Map a subcategory to its parent CategoryGroup
export const SUBCATEGORY_TO_PARENT_NAME: Record<string, string> = {};
CATEGORIES_DATA.forEach((group) => {
  group.subcategories.forEach((sub) => {
    SUBCATEGORY_TO_PARENT_NAME[sub.toLowerCase()] = group.name;
  });
});
