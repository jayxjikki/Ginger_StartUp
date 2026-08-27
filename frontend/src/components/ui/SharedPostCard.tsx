import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SharedPostCard.css';

interface SharedPostCardProps {
  posterName: string;
  posterAvatar: string;
  imageUrl: string;
  caption: string;
  postId: string;
  posterId: string;
  isMine: boolean;
  messageId: string;
  initialReaction: string | null;
  onReact: (messageId: string, reaction: string | null) => void;
  chatContext?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

const EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];

const SharedPostCard: React.FC<SharedPostCardProps> = ({
  posterName,
  posterAvatar,
  imageUrl,
  caption,
  postId,
  posterId,
  isMine,
  messageId,
  initialReaction,
  onReact,
  chatContext
}) => {
  const navigate = useNavigate();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(initialReaction);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // In a full implementation, clicking the card would navigate to the post view
  const handleCardClick = () => {
    if (!posterId || posterId === 'undefined') {
      console.warn('Cannot navigate: posterId is missing from this shared post.');
      return; // Do nothing or show a toast
    }
    // Navigate to the user's profile and pass the post ID in state so the profile can open it
    navigate(`/profile/${posterId}`, { state: { openPostId: postId, returnToChat: chatContext || true } });
  };

  const handleReactionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedEmoji) {
      // Toggle off if already selected
      setSelectedEmoji(null);
      onReact(messageId, null);
    } else {
      setShowEmojiPicker(!showEmojiPicker);
    }
  };

  const selectEmoji = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
    onReact(messageId, emoji);
  };

  return (
    <div className={`shared-post-wrapper ${isMine ? 'mine' : 'theirs'}`}>
      <div className="shared-post-card" onClick={handleCardClick}>
        {/* Header */}
        <div className="shared-post-header">
          <img src={posterAvatar} alt={posterName} className="shared-post-avatar" />
          <span className="shared-post-username">{posterName}</span>
          <span className="material-symbols-outlined shared-post-verified">verified</span>
        </div>
        
        {/* Image */}
        <div className="shared-post-image-container">
          <img src={imageUrl} alt="Shared post" className="shared-post-image" />
        </div>
        
        {/* Footer (Caption) */}
        <div className="shared-post-footer">
          <span className="shared-post-footer-username">{posterName}</span>
          <span className="shared-post-caption">{caption}</span>
        </div>
      </div>
      
      {/* Reaction Popup */}
      {showEmojiPicker && (
        <div className={`shared-post-emoji-picker ${isMine ? 'mine' : 'theirs'}`}>
          {EMOJIS.map(emoji => (
            <button 
              key={emoji} 
              className="emoji-btn"
              onClick={(e) => selectEmoji(e, emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Reaction Heart / Selected Emoji */}
      <button 
        className={`shared-post-reaction-btn ${selectedEmoji ? 'liked' : ''}`}
        onClick={handleReactionClick}
        aria-label="React to shared post"
      >
        {selectedEmoji ? (
          <span style={{ fontSize: '18px' }}>{selectedEmoji}</span>
        ) : (
          <span className="material-symbols-outlined">favorite</span>
        )}
      </button>
    </div>
  );
};

export default SharedPostCard;
