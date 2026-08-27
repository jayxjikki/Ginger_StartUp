import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useUgcStore } from './ugcStore';

const getDeletedChats = (): Record<string, string> => {
  try {
    const val = localStorage.getItem('deleted_chats');
    return val ? JSON.parse(val) : {};
  } catch {
    return {};
  }
};

const markChatDeleted = (userId: string) => {
  try {
    const current = getDeletedChats();
    current[userId] = new Date().toISOString();
    localStorage.setItem('deleted_chats', JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save deleted chat state', e);
  }
};
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  reaction?: string | null;
  sender?: {
    full_name: string;
  };
}

export interface InboxChat {
  userId: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface ChatState {
  messages: Message[];
  inboxChats: InboxChat[];
  isLoading: boolean;
  error: string | null;

  // Active chat context
  activeRecipientId: string | null;
  partnerTyping: boolean;

  // Actions
  setActiveRecipient: (id: string | null) => void;
  fetchInbox: (currentUserId: string) => Promise<void>;
  fetchHistory: (currentUserId: string, recipientId: string) => Promise<void>;
  markMessagesRead: (currentUserId: string, recipientId: string) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
  reactToMessage: (messageId: string, reaction: string | null) => Promise<void>;
  subscribeToMessages: (currentUserId: string) => void;
  unsubscribeFromMessages: () => void;
  
  // Presence
  subscribeToPresence: (currentUserId: string, recipientId: string) => void;
  setTypingStatus: (isTyping: boolean) => Promise<void>;

  // Management
  deleteChat: (currentUserId: string, recipientId: string) => Promise<void>;
}

// Keep track of the active channel so we can unsubscribe
let messageChannel: any = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inboxChats: [],
  isLoading: false,
  error: null,
  activeRecipientId: null,
  partnerTyping: false,

  setActiveRecipient: (id: string | null) => {
    set({ activeRecipientId: id, messages: [], partnerTyping: false }); // clear messages on switch
  },

  fetchInbox: async (currentUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch all messages involving the current user
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      if (!messages || messages.length === 0) {
        set({ inboxChats: [] });
        return;
      }

      // 2. Group by partner ID to find the latest message per partner
      const partnerMap = new Map<string, Message>();
      const deletedChats = getDeletedChats();
      
      messages.forEach((msg: Message) => {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        
        // Skip messages that were sent before this chat was locally deleted
        const deletedAt = deletedChats[partnerId];
        if (deletedAt && new Date(msg.created_at).getTime() <= new Date(deletedAt).getTime()) {
          return;
        }

        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, msg);
        }
      });

      // 3. Get unique partner IDs
      const partnerIds = Array.from(partnerMap.keys());
      
      // We NO LONGER filter out blocked users from the inbox. They should remain visible.
      const { blockedByThemIds } = useUgcStore.getState();
      const validPartnerIds = partnerIds;

      if (validPartnerIds.length === 0) {
        set({ inboxChats: [], isLoading: false });
        return;
      }

      // Fetch profiles for all valid partners
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', validPartnerIds);

      // 4. Map to InboxChat array
      const inboxChats: InboxChat[] = validPartnerIds.map(partnerId => {
        const msg = partnerMap.get(partnerId)!;
        const profile = profiles?.find(p => p.id === partnerId);
        
        let lastMessageText = msg.content;
        if (lastMessageText.startsWith('[SHARE_CARD]')) {
          lastMessageText = 'Shared a post';
        }
        
        const isBlockedByThem = blockedByThemIds.includes(partnerId);
        const name = isBlockedByThem ? 'Ginger user' : (profile?.full_name || 'Unknown User');
        const avatar = isBlockedByThem ? null : (profile?.avatar_url || null);
        
        return {
          userId: partnerId,
          name,
          avatar,
          lastMessage: lastMessageText,
          timestamp: msg.created_at,
          unread: msg.receiver_id === currentUserId && !msg.read
        };
      });

      // Sort by timestamp descending
      inboxChats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      set({ inboxChats });
    } catch (err: any) {
      console.error('Failed to fetch inbox:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async (currentUserId: string, recipientId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true }); // Older messages first
      
      if (error) throw error;
      let filteredData = data as Message[];
      
      // Filter out messages deleted locally
      const deletedChats = getDeletedChats();
      const deletedAt = deletedChats[recipientId];
      if (deletedAt) {
        const deleteTime = new Date(deletedAt).getTime();
        filteredData = filteredData.filter(m => new Date(m.created_at).getTime() > deleteTime);
      }
      
      set({ messages: filteredData });
      
      // Mark as read after fetching history
      await get().markMessagesRead(currentUserId, recipientId);
    } catch (err: any) {
      console.error('Failed to fetch chat history:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  markMessagesRead: async (currentUserId: string, recipientId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', recipientId)
        .eq('read', false);
        
      // Update local state
      set((state) => ({
        messages: state.messages.map(m => 
          m.receiver_id === currentUserId && m.sender_id === recipientId 
            ? { ...m, read: true } 
            : m
        )
      }));
    } catch (err) {
      console.error('Failed to mark messages read:', err);
    }
  },

  sendMessage: async (senderId: string, receiverId: string, content: string) => {
    try {
      // Check block status
      const { blockedUserIds, blockedByThemIds } = useUgcStore.getState();
      if (blockedUserIds.includes(receiverId)) {
        throw new Error('You have blocked this user.');
      }
      if (blockedByThemIds.includes(receiverId)) {
        // Silently fail to keep the block stealthy
        return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content }])
        .select()
        .single();
      
      if (error) throw error;
      
      set((state) => {
        const exists = state.messages.find(m => m.id === data.id);
        if (exists) return state;
        return { messages: [...state.messages, data as Message] };
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
    }
  },

  reactToMessage: async (messageId: string, reaction: string | null) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ reaction })
        .eq('id', messageId);
        
      if (error) throw error;
      
      // Update local state immediately for better UX
      set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === messageId ? { ...msg, reaction } : msg
        )
      }));
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  },

  subscribeToMessages: (currentUserId: string) => {
    // If already subscribed, unsubscribe first
    get().unsubscribeFromMessages();

    // Listen for new messages where the current user is either sender or receiver
    messageChannel = supabase.channel(`public:messages:user_${currentUserId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const { activeRecipientId, messages } = get();
          
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            if (activeRecipientId) {
              const belongsToActiveChat = 
                (newMessage.sender_id === currentUserId && newMessage.receiver_id === activeRecipientId) ||
                (newMessage.sender_id === activeRecipientId && newMessage.receiver_id === currentUserId);
                
              if (belongsToActiveChat) {
                if (!messages.find(m => m.id === newMessage.id)) {
                  set({ messages: [...messages, newMessage] });
                  if (newMessage.receiver_id === currentUserId) {
                    get().markMessagesRead(currentUserId, activeRecipientId);
                  }
                }
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          set((state) => ({
            messages: state.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          }));
        }
      )
      .subscribe();
  },

  unsubscribeFromMessages: () => {
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      messageChannel = null;
    }
  },

  subscribeToPresence: (currentUserId: string, recipientId: string) => {
    const roomName = `chat_presence_${[currentUserId, recipientId].sort().join('_')}`;
    
    const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${roomName}`);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }
    
    const presenceChannel = supabase.channel(roomName);

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        let isPartnerTyping = false;
        
        for (const [key, value] of Object.entries(state)) {
          if (key !== currentUserId) {
            // Check if partner is typing
            if (value.some((presence: any) => presence.typing)) {
              isPartnerTyping = true;
            }
          }
        }
        
        set({ partnerTyping: isPartnerTyping });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial status
          await presenceChannel.track({ typing: false });
        }
      });
      
    // Store it so we can update typing status
    (window as any).__chatPresenceChannel = presenceChannel;
  },

  setTypingStatus: async (isTyping: boolean) => {
    const channel = (window as any).__chatPresenceChannel;
    if (channel) {
      await channel.track({ typing: isTyping });
    }
  },

  deleteChat: async (currentUserId: string, recipientId: string) => {
    try {
      // 1. Client-side local soft-delete (guarantees immediate effect even if DB fails)
      markChatDeleted(recipientId);
      
      // 2. Instantly clear from local state for both the chat window and the inbox list
      set((state) => ({ 
        messages: [],
        inboxChats: state.inboxChats.filter(chat => chat.userId !== recipientId)
      }));

      // 3. Attempt DB deletion as a backup (will fail silently if SQL migration wasn't run)
      try {
        const { data } = await supabase
          .from('messages')
          .select('id, sender_id, receiver_id')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`);
          
        if (data && data.length > 0) {
          const sentIds = data.filter(m => m.sender_id === currentUserId).map(m => m.id);
          if (sentIds.length > 0) {
            await supabase.from('messages').update({ deleted_by_sender: true }).in('id', sentIds);
          }
          
          const receivedIds = data.filter(m => m.receiver_id === currentUserId).map(m => m.id);
          if (receivedIds.length > 0) {
            await supabase.from('messages').update({ deleted_by_receiver: true }).in('id', receivedIds);
          }
        }
      } catch (dbErr) {
        console.warn('DB delete failed, relying on local soft-delete', dbErr);
      }
      
    } catch (err) {
      console.error('Failed to delete chat:', err);
      throw err;
    }
  }
}));
