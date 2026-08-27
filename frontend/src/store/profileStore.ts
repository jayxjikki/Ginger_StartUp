// ═══════════════════════════════════════════════════════════
// GINGER — Profile Store (Zustand)
// Fetches the active user's profile, achievements, posts, etc.
// ═══════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
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

export interface VerifiedChannel {
  id: string;
  channel_username: string;
  is_verified: boolean;
  member_count?: number;
  created_at: string;
}

interface SocialLink {
  id: string;
  platform: string;
  username: string;
  url: string;
  followers: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface MediaKitItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface ProfileState {
  profile: Profile | null;
  achievements: Achievement[];
  posts: BlogPost[];
  socialLinks: SocialLink[];
  messages: Message[];
  mediaKitItems: MediaKitItem[];
  verifiedChannels: VerifiedChannel[];
  stats: {
    totalEarnings: number;
    activeCampaigns: number;
    completedCampaigns: number;
    totalViews: number;
    telegramMembers: number;
  };
  isLoading: boolean;
  error: string | null;

  fetchProfileData: (userId: string) => Promise<void>;
  createAchievement: (achievement: Partial<Achievement>) => Promise<void>;
  createPost: (post: Partial<BlogPost>) => Promise<void>;
  updateSocialLinks: (links: SocialLink[]) => Promise<void>;
  addVerifiedSocialLink: (platform: string, username: string, url: string, followers?: number, access_token?: string) => Promise<void>;
  createMediaKitItem: (item: { title: string; description: string; image_url: string }) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  togglePinnedSocial: (platform: string) => Promise<void>;
  deleteItem: (id: string, type: 'achievement' | 'media_kit' | 'post') => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        profile: null,
        achievements: [],
        posts: [],
        socialLinks: [],
        messages: [],
        mediaKitItems: [],
        verifiedChannels: [],
        stats: {
          totalEarnings: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          totalViews: 0,
          telegramMembers: 0,
        },
        isLoading: false,
        error: null,

        fetchProfileData: async (userId: string) => {
          if (!userId || userId === 'undefined') return;
          set({ isLoading: true, error: null });
          try {
            if (userId.startsWith('dummy-')) {
              const currentState = get();
              // If we already have this dummy user loaded, don't overwrite their state
              if (currentState.profile?.id === userId) {
                set({ isLoading: false });
                return;
              }

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
                messages: [],
                mediaKitItems: [],
                verifiedChannels: [],
                stats: {
                  totalEarnings: 12000,
                  activeCampaigns: 5,
                  completedCampaigns: 50,
                  totalViews: 1200000,
                  telegramMembers: 15400
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

            // Fetch Messages
            const { data: messagesData } = await supabase
              .from('messages')
              .select('*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)')
              .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
              .order('created_at', { ascending: false });

            // Fetch Verified Channels
            const { data: channelsData } = await supabase
              .from('verified_channels')
              .select('*')
              .eq('profile_id', userId)
              .order('created_at', { ascending: false });

            // Fetch Media Kit Items
            const { data: mediaKitData } = await supabase
              .from('media_kit_items')
              .select('*')
              .eq('profile_id', userId)
              .order('created_at', { ascending: false });

            let totalEarnings = 0;
            let activeCampaigns = 0;
            let completedCampaigns = 0;
            let totalViews = 0;
            let telegramMembers = 0;

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

            if (channelsData) {
              channelsData.forEach((ch: any) => {
                telegramMembers += (ch.member_count || 0);
              });
            }

            set({
              profile: profileData as Profile,
              achievements: achievementsData || [],
              posts: postsData || [],
              socialLinks: socialData || [],
              messages: messagesData || [],
              verifiedChannels: channelsData || [],
              mediaKitItems: mediaKitData || [],
              stats: {
                totalEarnings,
                activeCampaigns,
                completedCampaigns,
                totalViews,
                telegramMembers,
              }
            });
          } catch (err: any) {
            console.error('Error fetching profile data:', err);
            set({ error: err.message });
          } finally {
            set({ isLoading: false });
          }
        },

        updateSocialLinks: async (links) => {
          const { profile } = get();
          if (!profile) return;
          try {
            const { error: deleteError } = await supabase
              .from('social_links')
              .delete()
              .eq('profile_id', profile.id);
              
            if (deleteError) throw deleteError;
            
            if (links.length > 0) {
              const linksToInsert = links.map((link) => {
                return {
                  profile_id: profile.id,
                  platform: link.platform,
                  username: link.username,
                  url: link.username.startsWith('http') ? link.username : `https://${link.platform.toLowerCase()}.com/${link.username}`,
                  followers: 0 // Edge function will update this later
                };
              });
              
              const { error: insertError } = await supabase
                .from('social_links')
                .insert(linksToInsert);
                
              if (insertError) throw insertError;
            }
            
            // Invoke edge function to sync actual followers
            try {
              const { error: invokeError } = await supabase.functions.invoke('sync-followers', {
                body: { targetUserId: profile.id }
              });
              
              if (invokeError) {
                console.error('Error invoking sync-followers:', invokeError);
              }
            } catch (invokeErr) {
              console.error('Failed to sync followers via edge function:', invokeErr);
            }

            // Reload profile data to get the updated links and max followers
            await get().fetchProfileData(profile.id);
            
          } catch (err: any) {
            console.error('Error updating social links:', err);
            throw err;
          }
        },

        addVerifiedSocialLink: async (platform: string, username: string, url: string, followers: number = 0, access_token?: string) => {
          const { profile, socialLinks } = get();
          if (!profile) return;
          try {
            // First check if it already exists
            const existingLink = socialLinks.find(l => l.platform.toLowerCase() === platform.toLowerCase());
            
            if (existingLink) {
              const updates: any = { username, url, followers, verified: true };
              if (access_token) updates.access_token = access_token;
              
              const { error } = await supabase
                .from('social_links')
                .update(updates)
                .eq('id', existingLink.id);
              if (error) throw error;
            } else {
              const insertData: any = { profile_id: profile.id, platform, username, url, followers, verified: true };
              if (access_token) insertData.access_token = access_token;
              
              const { error } = await supabase
                .from('social_links')
                .insert([insertData]);
              if (error) throw error;
            }
            
            // Reload profile data to get updated links
            get().fetchProfileData(profile.id);
          } catch (err: any) {
            console.error('Error adding verified social link:', err);
            throw err;
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
        },

        createMediaKitItem: async (item) => {
          const { profile } = get();
          if (!profile) return;
          try {
            const { data, error } = await supabase
              .from('media_kit_items')
              .insert([{ ...item, profile_id: profile.id }])
              .select()
              .single();
            if (error) throw error;
            set((state) => ({ mediaKitItems: [data, ...state.mediaKitItems] }));
          } catch (err: any) {
            console.error('Error creating media kit item:', err);
            throw err;
          }
        },

        sendMessage: async (receiverId, content) => {
          const { profile } = get();
          if (!profile) return;
          try {
            const { error } = await supabase
              .from('messages')
              .insert([{
                sender_id: profile.id,
                receiver_id: receiverId,
                content,
              }]);
            if (error) throw error;
          } catch (err: any) {
            console.error('Error sending message:', err);
            throw err;
          }
        },
        updateProfile: async (updates) => {
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null
          }));
        },
        togglePinnedSocial: async (platform: string) => {
          const { profile } = get();
          if (!profile) return;
          
          let currentPins = [...(profile.pinned_socials || [])];
          
          if (currentPins.includes(platform)) {
            currentPins = currentPins.filter(p => p !== platform);
          } else {
            if (currentPins.length >= 3) {
              throw new Error("You can only pin up to 3 platforms.");
            }
            currentPins.push(platform);
          }
          
          try {
            const { error } = await supabase
              .from('profiles')
              .update({ pinned_socials: currentPins })
              .eq('id', profile.id);
            if (error) throw error;
            set({ profile: { ...profile, pinned_socials: currentPins } });
          } catch (err: any) {
            console.error('Error toggling pinned social:', err);
            throw err;
          }
        },

        deleteItem: async (id: string, type: 'achievement' | 'media_kit' | 'post') => {
          const { profile, achievements, mediaKitItems, posts } = get();
          if (!profile) return;
          try {
            let table = '';
            if (type === 'achievement') table = 'achievements';
            else if (type === 'media_kit') table = 'media_kit_items';
            else if (type === 'post') table = 'posts';

            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;

            if (type === 'achievement') {
              set({ achievements: achievements.filter(a => a.id !== id) });
            } else if (type === 'media_kit') {
              set({ mediaKitItems: mediaKitItems.filter(m => m.id !== id) });
            } else if (type === 'post') {
              set({ posts: posts.filter(p => p.id !== id) });
            }
          } catch (err: any) {
            console.error('Error deleting item:', err);
            throw err;
          }
        }
      }),
      {
        name: 'profile-store',
      }
    )
  )
);
