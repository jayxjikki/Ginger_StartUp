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
import { uploadToCloudinary } from '../../lib/cloudinary';
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
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video' | null>(null);
  const [activeMessageOptions, setActiveMessageOptions] = useState<Message | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { blockedUserIds, fetchBlockedUsers, checkIfBlockedByThem, blockUser, unblockUser, reportItem } = useUgcStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const startPressTimer = (msg: Message) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setActiveMessageOptions(msg);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 450);
  };

  const cancelPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
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

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !recipientId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }
    setIsAttachmentMenuOpen(false);
    setIsUploadingMedia(true);
    setUploadMediaType('image');
    try {
      const url = await uploadToCloudinary(file);
      await sendMessage(user.id, recipientId, `[IMAGE]${url}[/IMAGE]`);
      toast.success('Image sent!');
    } catch (err: any) {
      console.error('Failed to send image:', err);
      toast.error(err.message || 'Failed to send image');
    } finally {
      setIsUploadingMedia(false);
      setUploadMediaType(null);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !recipientId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Video size must be less than 10MB');
      return;
    }
    setIsAttachmentMenuOpen(false);
    setIsUploadingMedia(true);
    setUploadMediaType('video');
    try {
      const url = await uploadToCloudinary(file);
      await sendMessage(user.id, recipientId, `[VIDEO]${url}[/VIDEO]`);
      toast.success('Video sent!');
    } catch (err: any) {
      console.error('Failed to send video:', err);
      toast.error(err.message || 'Failed to send video');
    } finally {
      setIsUploadingMedia(false);
      setUploadMediaType(null);
      e.target.value = '';
    }
  };

  const handleSendOfferClick = () => {
    setIsAttachmentMenuOpen(false);
    toast.success('Send Offer feature is coming soon!');
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

                // Regular, Image, or Video message
                const isImage = msg.content.startsWith('[IMAGE]') && msg.content.endsWith('[/IMAGE]');
                const isVideo = msg.content.startsWith('[VIDEO]') && msg.content.endsWith('[/VIDEO]');
                const mediaUrl = (isImage || isVideo) ? msg.content.slice(7, -8) : null;

                return (
                  <div 
                    key={msg.id} 
                    className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}
                  >
                    <div 
                      className={`chat-bubble ${isImage || isVideo ? 'media-bubble' : ''}`}
                      onMouseDown={() => startPressTimer(msg)}
                      onMouseUp={cancelPressTimer}
                      onMouseLeave={cancelPressTimer}
                      onTouchStart={() => startPressTimer(msg)}
                      onTouchEnd={cancelPressTimer}
                      onTouchMove={cancelPressTimer}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setActiveMessageOptions(msg);
                      }}
                    >
                      {isImage ? (
                        <div className="chat-msg-media-container">
                          <img 
                            src={mediaUrl!} 
                            alt="Shared photo" 
                            className="chat-msg-photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(mediaUrl!, '_blank');
                            }}
                          />
                        </div>
                      ) : isVideo ? (
                        <div className="chat-msg-media-container">
                          <video 
                            src={mediaUrl!} 
                            controls 
                            playsInline 
                            preload="metadata"
                            className="chat-msg-video"
                          />
                        </div>
                      ) : (
                        <p className="chat-bubble-text">{msg.content}</p>
                      )}
                      <span className="chat-bubble-time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Long-Press / Options Modal */}
          {activeMessageOptions && (
            <div 
              className="chat-msg-options-overlay"
              onClick={() => setActiveMessageOptions(null)}
            >
              <div 
                className="chat-msg-options-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="chat-msg-options-header">
                  <div className="chat-msg-preview-box">
                    <p className="chat-msg-preview-text">{activeMessageOptions.content}</p>
                  </div>
                </div>

                <div className="chat-msg-info-list">
                  <div className="chat-msg-info-row">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>schedule</span>
                    <span>Sent: {new Date(activeMessageOptions.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(activeMessageOptions.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {activeMessageOptions.sender_id === user?.id && (
                    <div className="chat-msg-info-row">
                      <span 
                        className="material-symbols-outlined" 
                        style={{ fontSize: '18px', color: activeMessageOptions.read ? '#60a5fa' : 'var(--text-tertiary)' }}
                      >
                        {activeMessageOptions.read ? 'done_all' : 'done'}
                      </span>
                      <span style={{ color: activeMessageOptions.read ? '#60a5fa' : 'var(--text-tertiary)', fontWeight: activeMessageOptions.read ? 600 : 400 }}>
                        {activeMessageOptions.read ? 'Seen by recipient' : 'Delivered'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="chat-msg-action-btns">
                  <button 
                    className="chat-msg-action-btn primary"
                    onClick={() => {
                      navigator.clipboard.writeText(activeMessageOptions.content);
                      toast.success('Message copied to clipboard');
                      setActiveMessageOptions(null);
                    }}
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                    Copy Message
                  </button>

                  <button 
                    className="chat-msg-action-btn close"
                    onClick={() => setActiveMessageOptions(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="chat-detail-input-area">
            {isUploadingMedia && (
              <div className="chat-uploading-indicator">
                <span className="material-symbols-outlined icon-spin" style={{ fontSize: '16px', color: '#f9c846' }}>sync</span>
                <span>Uploading {uploadMediaType === 'video' ? 'video' : 'image'}... (Max 10MB)</span>
              </div>
            )}

            {isBlocked ? (
              <div className="chat-detail-input-wrap" style={{ justifyContent: 'center', backgroundColor: 'rgba(255,68,68,0.1)', padding: '12px' }}>
                <p style={{ color: '#ff4444', fontSize: '14px', textAlign: 'center' }}>
                  {isBlockedByMe ? "You have blocked this user. Unblock them to send a message." : "You cannot send messages to this user."}
                </p>
              </div>
            ) : (
              <div className="chat-input-row" style={{ position: 'relative', width: '100%' }}>
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  accept="image/*" 
                  id="chat-image-file-input"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/quicktime,video/*" 
                  id="chat-video-file-input"
                  style={{ display: 'none' }}
                  onChange={handleVideoFileChange}
                />

                {/* Attachment Popup Menu */}
                {isAttachmentMenuOpen && (
                  <div className="chat-attachment-menu" ref={attachmentMenuRef}>
                    <button 
                      type="button" 
                      className="chat-attachment-item"
                      onClick={() => {
                        document.getElementById('chat-image-file-input')?.click();
                      }}
                    >
                      <div className="chat-attachment-icon-circle image">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                      <span>Send Image</span>
                    </button>

                    <button 
                      type="button" 
                      className="chat-attachment-item"
                      onClick={() => {
                        document.getElementById('chat-video-file-input')?.click();
                      }}
                    >
                      <div className="chat-attachment-icon-circle video">
                        <span className="material-symbols-outlined">videocam</span>
                      </div>
                      <span>Send Video</span>
                    </button>

                    <button 
                      type="button" 
                      className="chat-attachment-item offer"
                      onClick={handleSendOfferClick}
                    >
                      <div className="chat-attachment-offer-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>auto_awesome</span>
                        <span>Send Offer</span>
                      </div>
                    </button>
                  </div>
                )}

                <form className="chat-detail-input-wrap" onSubmit={handleSend}>
                  <button 
                    type="button" 
                    className={`chat-detail-add-btn ${isAttachmentMenuOpen ? 'active' : ''}`}
                    aria-label="Add attachment"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
                    }}
                    disabled={isUploadingMedia}
                  >
                    <span className="material-symbols-outlined">{isAttachmentMenuOpen ? 'close' : 'add'}</span>
                  </button>
                  <input 
                    className="chat-detail-input"
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={isUploadingMedia ? `Uploading ${uploadMediaType}...` : "Type a message..."}
                    disabled={isSending || isUploadingMedia}
                  />
                  <button 
                    type="submit" 
                    className="chat-detail-send-btn"
                    disabled={!content.trim() || isSending || isUploadingMedia}
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;
