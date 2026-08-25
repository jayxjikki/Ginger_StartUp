import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, type Message } from '../../store/chatStore';
import { useUgcStore } from '../../store/ugcStore';
import './ChatModal.css';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName, 
  recipientAvatar 
}) => {
  const { user } = useAuthStore();
  const { 
    messages, 
    isLoading, 
    partnerTyping,
    fetchHistory, 
    sendMessage, 
    subscribeToMessages, 
    unsubscribeFromMessages,
    setActiveRecipient,
    subscribeToPresence,
    setTypingStatus
  } = useChatStore();
  
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const { blockedUserIds, checkIfBlockedByThem } = useUgcStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && user && recipientId) {
      setActiveRecipient(recipientId);
      fetchHistory(user.id, recipientId);
      subscribeToMessages(user.id);
      subscribeToPresence(user.id, recipientId);
      checkIfBlockedByThem(recipientId).then(setIsBlockedByThem);
    } else {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    }
    
    return () => {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    };
  }, [isOpen, user, recipientId, fetchHistory, subscribeToMessages, unsubscribeFromMessages, setActiveRecipient, checkIfBlockedByThem]);

  const isBlockedByMe = blockedUserIds.includes(recipientId);
  const isBlocked = isBlockedByMe || isBlockedByThem;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !recipientId) return;

    setIsSending(true);
    try {
      await sendMessage(user.id, recipientId, content.trim());
      setContent('');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Typing logic
  useEffect(() => {
    if (content.trim().length > 0) {
      setTypingStatus(true);
      const timeoutId = setTimeout(() => {
        setTypingStatus(false);
      }, 3000);
      return () => clearTimeout(timeoutId);
    } else {
      setTypingStatus(false);
    }
  }, [content, setTypingStatus]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="chat-detail-overlay popup-enter">
          
          <header className="chat-detail-header">
            <button className="chat-detail-icon-btn" onClick={onClose} aria-label="Close chat">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="chat-detail-user-info">
              <Avatar src={recipientAvatar} name={recipientName} size="sm" />
              <div className="chat-detail-title-group">
                <h2 className="chat-detail-name">{recipientName}</h2>
                {partnerTyping && <span className="chat-detail-typing text-xs text-primary-500">Typing...</span>}
              </div>
            </div>
            <button className="chat-detail-icon-btn" aria-label="More options">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </header>

          <div className="chat-detail-messages">
            {isLoading ? (
              <div className="chat-detail-loading">
                <div className="btn-spinner" style={{ width: '30px', height: '30px' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-detail-empty">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#8c90a0', marginBottom: '16px' }}>chat_bubble_outline</span>
                <p>Say hello to {recipientName}!</p>
              </div>
            ) : (
              messages.map((msg: Message) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}
                  >
                    <div className="chat-bubble">
                      <p className="chat-bubble-text">{msg.content}</p>
                      <span className="chat-bubble-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMine && msg.read && <span className="chat-bubble-seen text-[10px] ml-1 text-primary-400">Seen</span>}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-detail-input-area">
            {isBlocked ? (
              <div className="chat-detail-input-wrap" style={{ justifyContent: 'center', backgroundColor: 'rgba(255,68,68,0.1)', padding: '12px' }}>
                <p style={{ color: '#ff4444', fontSize: '14px', textAlign: 'center' }}>
                  {isBlockedByMe ? "You have blocked this user. Unblock them to send a message." : "You cannot send messages to this user."}
                </p>
              </div>
            ) : (
              <form className="chat-detail-input-wrap" onSubmit={handleSend}>
                <button type="button" className="chat-detail-add-btn" aria-label="Add attachment">
                  <span className="material-symbols-outlined">add</span>
                </button>
                <input 
                  className="chat-detail-input"
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                />
                <button 
                  type="submit" 
                  className="chat-detail-send-btn"
                  disabled={!content.trim() || isSending}
                  aria-label="Send message"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;
