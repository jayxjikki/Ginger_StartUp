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
      if (userId.startsWith('dummy-')) {
        const dummyProfile = {
          id: userId,
          full_name: userId === 'dummy-jikki' ? 'Jikki Thakur' : 'Meera Travels',
          username: userId === 'dummy-jikki' ? '@jikkithakur' : '@meeratravels',
          avatar_url: userId === 'dummy-jikki' 
            ? 'https://lh3.googleusercontent.com/aida/AP1WRLsAciJvVI6nGE8Riv5pl5AiCdsgUyuCBIztyf8yJ1nMsVzN_tKamimn4oVc377SuO03Y0BLG3vBSg6L9Gb661VbZxjTCOmgqtLkycpkas-Y4kNRelTvegSPmDOwuXDoRbG_T9NDOpD85w4fS1MEQXqfzIMok67ViFzp1sO1_5M7JgPmQnt8hPSXXoZIoKnrd1CqosMcNxDB8nQ1sCkiHfR8QRnCR7F_sliBrGJirtLIostx8BD9Qdq5Oh0' 
            : 'https://via.placeholder.com/150/333/fff?text=MT',
          bio: userId === 'dummy-jikki' ? 'Tech professional & passionate world traveler.' : 'Travel vlogger | Exploring the world one city at a time.',
          created_at: new Date().toISOString()
        } as unknown as Profile;
        
        set({
          profile: dummyProfile,
          achievements: [],
          posts: [
            { id: '1', title: 'Sample Post', content: 'Dummy post content', image_url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop', created_at: new Date().toISOString() }
          ],
          socialLinks: [],
          stats: {
            totalEarnings: 12000,
            activeCampaigns: 5,
            completedCampaigns: 50,
            totalViews: 1200000
          },
          isLoading: false
        });
        return;
      }

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

      // Fetch Submissions for Stats
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('creator_id', userId);

      let totalEarnings = 0;
      let activeCampaigns = 0;
      let completedCampaigns = 0;
      let totalViews = 0;

      if (submissionsData) {
        submissionsData.forEach((sub: any) => {
          totalViews += (sub.current_views || 0);
          if (sub.status === 'paid') {
            completedCampaigns += 1;
            totalEarnings += (sub.earned_amount || 0);
          } else if (sub.status === 'pending' || sub.status === 'verified') {
            activeCampaigns += 1;
          }
        });
      }

      set({
        profile: profileData as Profile,
        achievements: achievementsData || [],
        posts: postsData || [],
        socialLinks: socialData || [],
        stats: {
          totalEarnings,
          activeCampaigns,
          completedCampaigns,
          totalViews,
        }
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
