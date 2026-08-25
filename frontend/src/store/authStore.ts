// ═══════════════════════════════════════════════════════════
// GINGER — Auth Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/user.types';
import type { Session, User } from '@supabase/supabase-js';
import { fetchFollowersCount } from '../utils/socialHelpers';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  fetchProfile: () => Promise<void>;
  completeOnboarding: (
    profileData: Partial<Profile>, 
    socialLinks: { platform: string, username: string }[]
  ) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ user: session.user, session, isLoading: false, isInitialized: true });
        await get().fetchProfile();
      } else {
        set({ isLoading: false, isInitialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ user: session?.user ?? null, session });
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
      // Listen for realtime bans
      if (session?.user) {
        const channelName = `public:profiles:${session.user.id}`;
        const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
        if (existingChannel) {
          supabase.removeChannel(existingChannel);
        }

        supabase.channel(channelName)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${session.user.id}` 
          }, (payload) => {
            const updatedProfile = payload.new as Profile;
            if (updatedProfile.is_banned) {
              get().signOut();
              sessionStorage.setItem('showBannedPopup', 'true');
              window.location.href = '/login'; // Force redirect
            } else {
              set({ profile: updatedProfile });
            }
          })
          .subscribe();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      // Remove channel if exists
      const { user } = get();
      if (user) {
        supabase.removeChannel(supabase.channel(`public:profiles:${user.id}`));
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, profile: null, isLoading: false });
    } catch (error) {
      console.error('Sign-out error:', error);
      set({ isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        if (data.is_banned) {
          get().signOut();
          sessionStorage.setItem('showBannedPopup', 'true');
          window.location.href = '/login';
          return;
        }
        set({ profile: data as Profile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  completeOnboarding: async (profileData, socialLinks) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    set({ isLoading: true });
    try {
      // 1. Update profile with new data and set onboarding_completed = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Fetch followers and Insert social links if any
      let maxFollowers = profileData.follower_count || 0;

      if (socialLinks.length > 0) {
        // Clear old ones just in case
        await supabase.from('social_links').delete().eq('profile_id', user.id);
        
        const linksToInsert = await Promise.all(socialLinks.map(async (link) => {
          const followers = await fetchFollowersCount(link.platform, link.username);
          if (followers > maxFollowers) {
            maxFollowers = followers;
          }
          return {
            profile_id: user.id,
            platform: link.platform,
            username: link.username,
            url: link.username.startsWith('http') ? link.username : `https://${link.platform.toLowerCase()}.com/${link.username}`,
            followers: followers
          };
        }));

        const { error: linksError } = await supabase
          .from('social_links')
          .insert(linksToInsert);

        if (linksError) throw linksError;
        
        // Update profile with max followers if it changed
        if (maxFollowers > (profileData.follower_count || 0)) {
          await supabase
            .from('profiles')
            .update({ follower_count: maxFollowers })
            .eq('id', user.id);
        }
      }

      // 3. Refresh profile state
      await get().fetchProfile();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
