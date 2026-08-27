import React, { useEffect, useState } from 'react';
import { useFeedStore } from '../../../store/feedStore';

interface FeedCommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

const FeedCommentsPanel: React.FC<FeedCommentsPanelProps> = ({ isOpen, onClose, entityId }) => {
  const { postComments, fetchComments, addComment } = useFeedStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && entityId) {
      fetchComments(entityId);
    }
  }, [isOpen, entityId, fetchComments]);

  if (!isOpen) return null;

  const comments = postComments[entityId] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(entityId, newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }}>
      <div style={{ flex: 1 }} onClick={onClose} />
      
      <div style={{
        backgroundColor: '#121212',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        height: '70vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Comments</h3>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#a8a8a8', marginTop: '2rem' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(comment => {
                const username = comment.profiles?.username?.replace('@', '') || comment.profiles?.full_name.replace(/\s+/g, '').toLowerCase() || 'user';
                const avatar = comment.profiles?.avatar_url || 'https://via.placeholder.com/150';
                
                return (
                  <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                    <img src={avatar} alt={username} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{username}</span>
                        <span style={{ color: '#a8a8a8', fontSize: '12px' }}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ color: '#fff', fontSize: '14px', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} style={{
          padding: '16px',
          borderTop: '1px solid #262626',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input 
            type="text" 
            placeholder="Add a comment..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              color: newComment.trim() ? '#0095f6' : '#005c98',
              fontWeight: 600,
              cursor: newComment.trim() ? 'pointer' : 'default'
            }}
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedCommentsPanel;
