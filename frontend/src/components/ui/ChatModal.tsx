import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, type Message } from '../../store/chatStore';
import { formatDistanceToNow } from 'date-fns';
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
    fetchHistory, 
    sendMessage, 
    subscribeToMessages, 
    unsubscribeFromMessages,
    setActiveRecipient
  } = useChatStore();
  
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && user && recipientId) {
      setActiveRecipient(recipientId);
      fetchHistory(user.id, recipientId);
      subscribeToMessages(user.id);
    } else {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    }
    
    return () => {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    };
  }, [isOpen, user, recipientId, fetchHistory, subscribeToMessages, unsubscribeFromMessages, setActiveRecipient]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="chat-modal-overlay">
          <motion.div
            className="chat-modal-container glass-strong"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-user">
                <Avatar src={recipientAvatar} name={recipientName} size="sm" />
                <div className="chat-header-info">
                  <span className="chat-header-name">{recipientName}</span>
                </div>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Close Chat">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="chat-messages">
              {isLoading ? (
                <div className="chat-loading">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  Say hi to {recipientName}! 👋
                </div>
              ) : (
                messages.map((msg: Message) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                      {!isMine && (
                        <Avatar src={recipientAvatar} name={recipientName} size="xs" className="chat-bubble-avatar" />
                      )}
                      <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <p className="chat-content">{msg.content}</p>
                        <span className="chat-timestamp">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="chat-input-area">
              <input 
                type="text" 
                className="chat-input"
                placeholder="Type a message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
              <button 
                type="submit" 
                className="chat-send-btn" 
                disabled={!content.trim() || isSending}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;
