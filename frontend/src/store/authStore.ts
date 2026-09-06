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
  signInWithGoogle: () => Promise<void>;
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
      // 1. Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
        } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          set({ user: session?.user ?? null, session, isLoading: false, isInitialized: true });
          if (session?.user) {
            await get().fetchProfile();
          }
        }
      });

      // 2. Check current stored session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
        return;
      }

      // 3. Proactively check if session JWT is already expired or near expiration (< 30s)
      const nowSeconds = Math.floor(Date.now() / 1000);
      const isExpired = session.expires_at ? session.expires_at <= nowSeconds + 30 : false;

      let currentSession: Session | null = session;
      if (isExpired) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.warn('Stored session is expired and refresh failed. Clearing stale auth.');
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            if (typeof window !== 'undefined') {
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
                  localStorage.removeItem(key);
                }
              }
            }
            set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
            return;
          }
          currentSession = refreshData.session;
        } catch {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
          return;
        }
      }

      if (currentSession?.user) {
        set({ user: currentSession.user, session: currentSession, isLoading: false, isInitialized: true });
        await get().fetchProfile();
      } else {
        set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
      }

      // Listen for realtime bans
      if (currentSession?.user) {
        const channelName = `public:profiles:${currentSession.user.id}`;
        const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
        if (existingChannel) {
          supabase.removeChannel(existingChannel);
        }

        supabase.channel(channelName)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${currentSession.user.id}` 
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
      set({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
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

      await supabase.auth.signOut().catch(() => {});
      if (typeof window !== 'undefined') {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
            localStorage.removeItem(key);
          }
        }
      }
      set({ user: null, session: null, profile: null, isLoading: false });
    } catch (error) {
      console.error('Sign-out error:', error);
      set({ user: null, session: null, profile: null, isLoading: false });
    }
  },

  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST303' || error.message?.includes('JWT expired')) {
          console.warn('JWT expired during fetchProfile, refreshing session...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session) {
            set({ session: refreshData.session, user: refreshData.session.user });
            const retryRes = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            data = retryRes.data;
            error = retryRes.error;
          } else {
            console.warn('Session refresh failed in fetchProfile, signing out');
            await get().signOut();
            return;
          }
        }

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }
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

if (typeof window !== 'undefined') {
  window.addEventListener('supabase:jwt-expired', () => {
    const state = useAuthStore.getState();
    if (state.user) {
      useAuthStore.setState({ user: null, session: null, profile: null, isLoading: false, isInitialized: true });
      toast.error('Session expired. Please sign in again.', { id: 'session-expired' });
    }
  });
}

