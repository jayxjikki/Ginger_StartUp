// ═══════════════════════════════════════════════════════════
// GINGER — Auth Store (Zustand)
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/user.types';
import type { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  fetchProfile: () => Promise<void>;
  saveBasicProfile: (profileData: Partial<Profile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
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

  signInWithGoogle: () => {
    try {
      set({ isLoading: true });
      // 1. Force clear any stuck Supabase auth locks that might be hanging around
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase.auth.lock')) {
          localStorage.removeItem(key);
        }
      }
      
      // 2. Build the exact Supabase Auth URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const redirectUrl = encodeURIComponent(window.location.origin);
      
      // 3. Force the browser to jump directly to the Supabase OAuth provider
      window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (typeof window !== 'undefined') {
        toast.error(`Sign in failed: ${error?.message || 'Unknown error'}`);
      }
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

  saveBasicProfile: async (profileData) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    set({ isLoading: true });
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      
      await get().fetchProfile();
    } catch (error) {
      console.error('Error saving basic profile:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeOnboarding: async () => {
    const { user, profile } = get();
    if (!user || !profile) return;

    set({ isLoading: true });
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await get().fetchProfile();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
