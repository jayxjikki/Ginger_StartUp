import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import SharedPostCard from './SharedPostCard';
import { useAuthStore } from '../../store/authStore';
import { useChatStore, type Message } from '../../store/chatStore';
import { useUgcStore } from '../../store/ugcStore';
import { useGlobalModalStore } from '../../store/globalModalStore';
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
    setTypingStatus,
    reactToMessage,
    deleteChat
  } = useChatStore();
  
  const navigate = useNavigate();
  
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { blockedUserIds, fetchBlockedUsers, checkIfBlockedByThem, blockUser, unblockUser, reportItem } = useUgcStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && user && recipientId) {
      setActiveRecipient(recipientId);
      fetchHistory(user.id, recipientId);
      subscribeToMessages(user.id);
      checkIfBlockedByThem(recipientId).then(setIsBlockedByThem);
      fetchBlockedUsers();
    } else {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    }
    
    return () => {
      setActiveRecipient(null);
      unsubscribeFromMessages();
    };
  }, [isOpen, user, recipientId, fetchHistory, subscribeToMessages, unsubscribeFromMessages, setActiveRecipient, checkIfBlockedByThem, fetchBlockedUsers]);

  const isBlockedByMe = blockedUserIds.includes(recipientId);
  const isBlocked = isBlockedByMe; // Don't show UI block if they blocked us, to keep it stealthy

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
      setTypingStatus(true, recipientId);
      const timeoutId = setTimeout(() => {
        setTypingStatus(false, recipientId);
      }, 3000);
      return () => clearTimeout(timeoutId);
    } else {
      setTypingStatus(false, recipientId);
    }
  }, [content, setTypingStatus, recipientId]);

  const handleDeleteChat = async () => {
    setIsMenuOpen(false);
    if (!user) return;
    const confirmed = await useGlobalModalStore.getState().showConfirm('Are you sure you want to delete this entire chat? This cannot be undone.', 'Delete Chat');
    if (confirmed) {
      try {
        await deleteChat(user.id, recipientId);
        toast.success('Chat deleted');
        onClose(); // Close modal after deleting
      } catch (err) {
        toast.error('Failed to delete chat');
      }
    }
  };

  const handleReportChat = async () => {
    setIsMenuOpen(false);
    const confirmed = await useGlobalModalStore.getState().showConfirm('Are you sure you want to report this chat for inappropriate behavior?', 'Report Chat');
    if (confirmed) {
      await reportItem(recipientId, 'profile', 'Inappropriate chat');
      toast.success('Chat reported to moderation');
    }
  };

  const handleToggleBlock = async () => {
    setIsMenuOpen(false);
    if (isBlockedByMe) {
      const confirmed = await useGlobalModalStore.getState().showConfirm('Unblock this user?', 'Unblock User');
      if (confirmed) unblockUser(recipientId);
    } else {
      const confirmed = await useGlobalModalStore.getState().showConfirm('Block this user? They will not be able to message you.', 'Block User');
      if (confirmed) blockUser(recipientId);
    }
  };

  const handleVisitProfile = () => {
    setIsMenuOpen(false);
    onClose();
    navigate(`/profile/${recipientId}`);
  };

  const displayName = isBlockedByThem ? 'Ginger user' : recipientName;
  const displayAvatar = isBlockedByThem ? null : recipientAvatar;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="chat-detail-overlay popup-enter">
          
          <header className="chat-detail-header">
            <button className="chat-detail-icon-btn" onClick={onClose} aria-label="Close chat">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="chat-detail-user-info">
              <Avatar src={displayAvatar} name={displayName} size="sm" />
              <div className="chat-detail-title-group">
                <h2 className="chat-detail-name">{displayName}</h2>
                {partnerTyping && <span className="chat-detail-typing text-xs text-primary-500">Typing...</span>}
              </div>
            </div>
            
            <div className="chat-detail-menu-container" ref={menuRef}>
              <button 
                className="chat-detail-icon-btn" 
                aria-label="More options"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>

              {isMenuOpen && (
                <div className="chat-detail-dropdown-menu">
                  {!isBlockedByThem && (
                    <button className="chat-menu-item" onClick={handleVisitProfile}>
                      <span className="material-symbols-outlined">person</span>
                      Visit Profile
                    </button>
                  )}
                  <button className="chat-menu-item text-danger" onClick={handleToggleBlock}>
                    <span className="material-symbols-outlined">block</span>
                    {isBlockedByMe ? 'Unblock User' : 'Block User'}
                  </button>
                  <button className="chat-menu-item text-warning" onClick={handleReportChat}>
                    <span className="material-symbols-outlined">flag</span>
                    Report Chat
                  </button>
                  <button className="chat-menu-item text-danger" onClick={handleDeleteChat}>
                    <span className="material-symbols-outlined">delete</span>
                    Delete Chat
                  </button>
                </div>
              )}
            </div>
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
                
                // Detect shared post card format
                const isSharedCard = msg.content.startsWith('[SHARE_CARD]') && msg.content.endsWith('[/SHARE_CARD]');
                
                if (isSharedCard) {
                  try {
                    const jsonStr = msg.content.replace('[SHARE_CARD]', '').replace('[/SHARE_CARD]', '');
                    const postData = JSON.parse(jsonStr);
                    return (
                      <SharedPostCard 
                        key={msg.id}
                        isMine={isMine}
                        posterName={postData.posterName}
                        posterAvatar={postData.posterAvatar}
                        imageUrl={postData.imageUrl}
                        caption={postData.caption}
                        postId={postData.postId}
                        posterId={postData.posterId}
                        messageId={msg.id}
                        initialReaction={msg.reaction || null}
                        onReact={reactToMessage}
                        chatContext={{ id: recipientId, name: recipientName, avatar: recipientAvatar }}
                      />
                    );
                  } catch (e) {
                    console.error('Failed to parse share card', e);
                    // Fallback to normal rendering if parsing fails
                  }
                }

                // Regular message
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
