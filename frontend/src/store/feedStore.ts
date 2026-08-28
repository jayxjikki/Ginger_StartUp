import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface FeedComment {
  id: string;
  user_id: string;
  entity_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
}

interface FeedState {
  // Likes & Comments Count
  postLikesCount: Record<string, number>;
  userLikedPosts: Record<string, boolean>;
  postCommentsCount: Record<string, number>;
  
  fetchLikes: (entityIds: string[]) => Promise<void>;
  toggleLike: (entityId: string) => Promise<void>;
  
  // Comments
  postComments: Record<string, FeedComment[]>;
  fetchComments: (entityId: string) => Promise<void>;
  addComment: (entityId: string, content: string) => Promise<void>;
  
  // Sharing
  sharePost: (receiverId: string, postMetadata: {
    postId: string, 
    imageUrl: string, 
    caption: string, 
    posterName: string, 
    posterAvatar: string,
    posterId: string,
    customMessage?: string
  }) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  postLikesCount: {},
  userLikedPosts: {},
  postCommentsCount: {},
  postComments: {},

  fetchLikes: async (entityIds: string[]) => {
    if (entityIds.length === 0) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Fetch likes count (group by entity_id)
      const { data: countData, error: countError } = await supabase
        .from('interactions_likes')
        .select('entity_id')
        .in('entity_id', entityIds);
        
      if (countError) throw countError;
      
      const counts: Record<string, number> = {};
      countData?.forEach(row => {
        counts[row.entity_id] = (counts[row.entity_id] || 0) + 1;
      });

      // 2. Fetch comments count
      const { data: commentsCountData } = await supabase
        .from('interactions_comments')
        .select('entity_id')
        .in('entity_id', entityIds);

      const commentsCounts: Record<string, number> = {};
      commentsCountData?.forEach(row => {
        commentsCounts[row.entity_id] = (commentsCounts[row.entity_id] || 0) + 1;
      });
      
      // 3. Fetch user's own likes
      const userLikes: Record<string, boolean> = {};
      if (session) {
        const { data: userData, error: userError } = await supabase
          .from('interactions_likes')
          .select('entity_id')
          .eq('user_id', session.user.id)
          .in('entity_id', entityIds);
          
        if (!userError && userData) {
          userData.forEach(row => {
            userLikes[row.entity_id] = true;
          });
        }
      }
      
      set(state => ({
        postLikesCount: { ...state.postLikesCount, ...counts },
        postCommentsCount: { ...state.postCommentsCount, ...commentsCounts },
        userLikedPosts: { ...state.userLikedPosts, ...userLikes }
      }));
    } catch (err) {
      console.error('Error fetching likes and comments counts:', err);
    }
  },

  toggleLike: async (entityId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const isLiked = get().userLikedPosts[entityId];
      
      // Optimistic update
      set(state => ({
        userLikedPosts: { ...state.userLikedPosts, [entityId]: !isLiked },
        postLikesCount: { 
          ...state.postLikesCount, 
          [entityId]: (state.postLikesCount[entityId] || 0) + (isLiked ? -1 : 1) 
        }
      }));
      
      if (isLiked) {
        await supabase
          .from('interactions_likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('entity_id', entityId);
      } else {
        await supabase
          .from('interactions_likes')
          .insert({ user_id: session.user.id, entity_id: entityId });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // We don't rollback optimistic UI for simplicity, but could do it here
    }
  },
  
  fetchComments: async (entityId: string) => {
    try {
      const { data, error } = await supabase
        .from('interactions_comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      set(state => ({
        postComments: { ...state.postComments, [entityId]: data || [] }
      }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  },
  
  addComment: async (entityId: string, content: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('interactions_comments')
        .insert({
          user_id: session.user.id,
          entity_id: entityId,
          content
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .single();
        
      if (error) throw error;
      
      if (data) {
        set(state => {
          const existing = state.postComments[entityId] || [];
          const currentCount = state.postCommentsCount[entityId] !== undefined ? state.postCommentsCount[entityId] : existing.length;
          return {
            postComments: {
              ...state.postComments,
              [entityId]: [...existing, data]
            },
            postCommentsCount: {
              ...state.postCommentsCount,
              [entityId]: currentCount + 1
            }
          };
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  },
  
  sharePost: async (receiverId: string, postMetadata) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      // Formatting a special message that acts as a share link
      const payload = JSON.stringify(postMetadata);
      const content = `[SHARE_CARD]${payload}[/SHARE_CARD]`;
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: session.user.id,
          receiver_id: receiverId,
          content
        });
        
      if (error) throw error;
      
      // If a custom message was provided, send it as a follow-up message
      if (postMetadata.customMessage && postMetadata.customMessage.trim().length > 0) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            sender_id: session.user.id,
            receiver_id: receiverId,
            content: postMetadata.customMessage.trim()
          });
        if (msgError) console.error("Error sending custom message:", msgError);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      throw err;
    }
  }
}));
