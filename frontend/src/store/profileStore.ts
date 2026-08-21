// ═══════════════════════════════════════════════════════════
// GINGER — Profile Store (Zustand)
// Fetches the active user's profile, achievements, posts, etc.
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/user.types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  date_earned: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url: string;
  created_at: string;
}

interface SocialLink {
  id: string;
  platform: string;
  username: string;
  followers: number;
}

interface ProfileState {
  profile: Profile | null;
  achievements: Achievement[];
  posts: BlogPost[];
  socialLinks: SocialLink[];
  stats: {
    totalEarnings: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalViews: number;
  };
  isLoading: boolean;
  error: string | null;

  fetchProfileData: (userId: string) => Promise<void>;
  createAchievement: (achievement: Partial<Achievement>) => Promise<void>;
  createPost: (post: Partial<BlogPost>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  achievements: [],
  posts: [],
  socialLinks: [],
  stats: {
    totalEarnings: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalViews: 0,
  },
  isLoading: false,
  error: null,

  fetchProfileData: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (profileError) throw profileError;

      // Fetch Achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('profile_id', userId)
        .order('date_earned', { ascending: false });

      // Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      // Fetch Social Links
      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('profile_id', userId);

      set({
        profile: profileData as Profile,
        achievements: achievementsData || [],
        posts: postsData || [],
        socialLinks: socialData || [],
      });
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createAchievement: async (achievement) => {
    const { profile } = get();
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert([{ ...achievement, profile_id: profile.id }])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ achievements: [data, ...state.achievements] }));
    } catch (err: any) {
      console.error('Error creating achievement:', err);
      throw err;
    }
  },

  createPost: async (post) => {
    const { profile } = get();
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{ ...post, author_id: profile.id }])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ posts: [data, ...state.posts] }));
    } catch (err: any) {
      console.error('Error creating post:', err);
      throw err;
    }
  }
}));
