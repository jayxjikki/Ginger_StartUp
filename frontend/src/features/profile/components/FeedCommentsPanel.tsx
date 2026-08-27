import React, { useEffect, useState, useRef } from 'react';
import { useFeedStore } from '../../../store/feedStore';
import { formatDistanceToNow } from 'date-fns';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import './FeedCommentsPanel.css';

interface FeedCommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

const FeedCommentsPanel: React.FC<FeedCommentsPanelProps> = ({ isOpen, onClose, entityId }) => {
  const { postComments, fetchComments, addComment } = useFeedStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && entityId) {
      fetchComments(entityId);
    }
  }, [isOpen, entityId, fetchComments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  if (!isOpen) return null;

  const comments = postComments[entityId] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(entityId, newComment.trim());
      setNewComment('');
      setShowEmojiPicker(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewComment(prev => prev + emojiData.emoji);
  };

  return (
    <div className="comments-panel-overlay">
      <div style={{ flex: 1 }} onClick={onClose} />
      
      <div className="comments-panel-content">
        <div className="comments-panel-header">
          <div style={{ width: '32px' }} />
          <h3 className="comments-panel-title">Comments</h3>
          <button onClick={onClose} className="comments-panel-close-btn" aria-label="Close">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
        
        <div className="comments-list-container">
          {comments.length === 0 ? (
            <div className="comment-empty-state">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {comments.map(comment => {
                const username = comment.profiles?.username?.replace('@', '') || comment.profiles?.full_name.replace(/\s+/g, '').toLowerCase() || 'user';
                const avatar = comment.profiles?.avatar_url || 'https://via.placeholder.com/150';
                
                return (
                  <div key={comment.id} className="comment-item">
                    <img src={avatar} alt={username} className="comment-avatar" />
                    <div className="comment-content-wrapper">
                      <div className="comment-header">
                        <span className="comment-username">{username}</span>
                        <span className="comment-date">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="comment-text">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="comments-input-area">
          {showEmojiPicker && (
            <div className="emoji-picker-container" ref={emojiPickerRef}>
              <EmojiPicker 
                theme={Theme.DARK}
                onEmojiClick={onEmojiClick}
                lazyLoadEmojis={true}
              />
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="comments-form">
            <button 
              type="button" 
              className="emoji-toggle-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Add emoji"
            >
              <span className="material-symbols-outlined">sentiment_satisfied</span>
            </button>
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="comments-input"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="comments-submit-btn"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedCommentsPanel;
