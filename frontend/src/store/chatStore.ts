import { create } from 'zustand';
import { supabase } from '../lib/supabase';
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
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

  // Actions
  setActiveRecipient: (id: string | null) => void;
  fetchInbox: (currentUserId: string) => Promise<void>;
  fetchHistory: (currentUserId: string, recipientId: string) => Promise<void>;
  sendMessage: (senderId: string, receiverId: string, content: string) => Promise<void>;
  subscribeToMessages: (currentUserId: string) => void;
  unsubscribeFromMessages: () => void;
}

// Keep track of the active channel so we can unsubscribe
let messageChannel: any = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  inboxChats: [],
  isLoading: false,
  error: null,
  activeRecipientId: null,

  setActiveRecipient: (id: string | null) => {
    set({ activeRecipientId: id, messages: [] }); // clear messages on switch
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
      messages.forEach((msg: Message) => {
        const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, msg);
        }
      });

      const partnerIds = Array.from(partnerMap.keys());

      // 3. Fetch partner profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', partnerIds);

      if (profError) throw profError;

      // 4. Map to InboxChat array
      const inboxChats: InboxChat[] = partnerIds.map(partnerId => {
        const msg = partnerMap.get(partnerId)!;
        const profile = profiles?.find(p => p.id === partnerId);
        return {
          userId: partnerId,
          name: profile?.full_name || 'Unknown User',
          avatar: profile?.avatar_url || null,
          lastMessage: msg.content,
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
      set({ messages: data as Message[] });
    } catch (err: any) {
      console.error('Failed to fetch chat history:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (senderId: string, receiverId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Optimistically append the message to the state (the realtime subscription might also broadcast it, 
      // but typically we can rely on our insert response or filter out duplicates)
      set((state) => {
        // Prevent duplicate if realtime event arrives exactly at the same time
        const exists = state.messages.find(m => m.id === data.id);
        if (exists) return state;
        return { messages: [...state.messages, data as Message] };
      });
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
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
          // Supabase Realtime filters can only filter on one column easily, so we listen to all inserts 
          // and filter locally if RLS allows receiving them, OR we can omit the filter and let RLS block unauthorized payloads.
          // Wait, RLS applies to Realtime if set up correctly, but filtering locally is safer for the active chat window.
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const { activeRecipientId, messages } = get();
          
          // Verify it belongs to the current user's session
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            
            // Only append if it belongs to the CURRENT open chat
            if (activeRecipientId) {
              const belongsToActiveChat = 
                (newMessage.sender_id === currentUserId && newMessage.receiver_id === activeRecipientId) ||
                (newMessage.sender_id === activeRecipientId && newMessage.receiver_id === currentUserId);
                
              if (belongsToActiveChat) {
                // Prevent duplicate if already optimistically added
                if (!messages.find(m => m.id === newMessage.id)) {
                  set({ messages: [...messages, newMessage] });
                }
              } else {
                // Belongs to another chat. We could show a notification toast here!
                // For now, silently ignore in the active chat view.
              }
            }
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromMessages: () => {
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      messageChannel = null;
    }
  }
}));
