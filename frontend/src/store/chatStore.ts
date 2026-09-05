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
  onlineUsers: string[];
  typingUsers: Record<string, boolean>; // map of partnerId -> isTyping
  subscribeToGlobalPresence: (currentUserId: string) => void;
  unsubscribeFromGlobalPresence: () => void;
  setTypingStatus: (isTyping: boolean, recipientId: string) => Promise<void>;

  // Management
  deleteChat: (currentUserId: string, recipientId: string) => Promise<void>;
}

// Keep track of the active channel so we can unsubscribe
let messageChannel: any = null;
let globalPresenceChannel: any = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inboxChats: [],
  isLoading: false,
  error: null,
  activeRecipientId: null,
  partnerTyping: false,
  onlineUsers: [],
  typingUsers: {},

  setActiveRecipient: (id: string | null) => {
    const isTyping = id ? !!get().typingUsers[id] : false;
    set({ activeRecipientId: id, messages: [], partnerTyping: isTyping });
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

      // Read local persistent read-timestamps for chats
      let readChatMap: Record<string, number> = {};
      try {
        readChatMap = JSON.parse(localStorage.getItem(`ginger_read_chats_${currentUserId}`) || '{}');
      } catch {}

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
        
        const lastReadTime = readChatMap[partnerId];
        const isLocallyRead = lastReadTime && new Date(msg.created_at).getTime() <= Number(lastReadTime);
        const isUnread = !isLocallyRead && (msg.receiver_id === currentUserId && !msg.read);

        return {
          userId: partnerId,
          name,
          avatar,
          lastMessage: lastMessageText,
          timestamp: msg.created_at,
          unread: isUnread
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
      // Save locally in readChatMap
      try {
        const key = `ginger_read_chats_${currentUserId}`;
        const readChatMap = JSON.parse(localStorage.getItem(key) || '{}');
        readChatMap[recipientId] = Date.now();
        localStorage.setItem(key, JSON.stringify(readChatMap));
      } catch {}

      // Update local state IMMEDIATELY:
      // Mark messages as read AND mark this partner's chat unread = false in inboxChats!
      set((state) => ({
        messages: state.messages.map(m => 
          m.receiver_id === currentUserId && m.sender_id === recipientId 
            ? { ...m, read: true } 
            : m
        ),
        inboxChats: state.inboxChats.map(chat =>
          chat.userId === recipientId
            ? { ...chat, unread: false }
            : chat
        )
      }));

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', recipientId)
        .eq('read', false);
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
          const { activeRecipientId, messages, fetchInbox } = get();
          
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            
            // Sync inbox to update unread counts globally
            fetchInbox(currentUserId);
            
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

  subscribeToGlobalPresence: (currentUserId: string) => {
    if (globalPresenceChannel) return;
    
    globalPresenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: currentUserId } },
    });

    globalPresenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = globalPresenceChannel.presenceState();
        const onlineUsers = Object.keys(state);
        
        let isPartnerTyping = false;
        const typingUsers: Record<string, boolean> = { ...get().typingUsers };
        const { activeRecipientId } = get();
        
        for (const [key, value] of Object.entries(state)) {
          if (key !== currentUserId) {
            const isTypingToMe = (value as any[]).some(p => p.typingTo === currentUserId);
            if (isTypingToMe) {
              typingUsers[key] = true;
              if (activeRecipientId === key) {
                isPartnerTyping = true;
              }
            } else if (typingUsers[key] && (value as any[]).every(p => !p.typingTo)) {
              typingUsers[key] = false;
            }
          }
        }
        
        set({ onlineUsers, typingUsers, partnerTyping: activeRecipientId ? !!typingUsers[activeRecipientId] : isPartnerTyping });
      })
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        set((state) => ({
          onlineUsers: Array.from(new Set([...state.onlineUsers, key]))
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        set((state) => ({
          onlineUsers: state.onlineUsers.filter(u => u !== key),
          typingUsers: { ...state.typingUsers, [key]: false },
          partnerTyping: state.activeRecipientId === key ? false : state.partnerTyping
        }));
      })
      .on('broadcast', { event: 'user_typing' }, (payload: any) => {
        const data = payload?.payload || {};
        if (data.recipientId === currentUserId) {
          const senderId = data.senderId;
          const isTyping = !!data.isTyping;
          set((state) => {
            const typingUsers = { ...state.typingUsers, [senderId]: isTyping };
            const partnerTyping = state.activeRecipientId === senderId ? isTyping : state.partnerTyping;
            return { typingUsers, partnerTyping };
          });
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await globalPresenceChannel.track({ typingTo: null, onlineAt: Date.now() });
        }
      });
  },

  unsubscribeFromGlobalPresence: () => {
    if (globalPresenceChannel) {
      supabase.removeChannel(globalPresenceChannel);
      globalPresenceChannel = null;
    }
  },

  setTypingStatus: async (isTyping: boolean, recipientId: string) => {
    if (globalPresenceChannel) {
      try {
        await globalPresenceChannel.track({ typingTo: isTyping ? recipientId : null, onlineAt: Date.now() });
      } catch (e) {
        // ignore
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        if (currentUserId) {
          await globalPresenceChannel.send({
            type: 'broadcast',
            event: 'user_typing',
            payload: {
              senderId: currentUserId,
              recipientId,
              isTyping
            }
          });
        }
      } catch (e) {
        // ignore
      }
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
