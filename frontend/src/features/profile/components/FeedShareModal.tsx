import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useFeedStore } from '../../../store/feedStore';
import { useUgcStore } from '../../../store/ugcStore';
import toast from 'react-hot-toast';
import './FeedShareModal.css';

interface FeedShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    image_url: string;
    title: string;
    caption?: string;
  };
  posterName: string;
  posterAvatar: string;
  posterId: string;
}

const FeedShareModal: React.FC<FeedShareModalProps> = ({ isOpen, onClose, post, posterName, posterAvatar, posterId }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [messageText, setMessageText] = useState('');
  
  const { sharePost } = useFeedStore();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Reset state when closed
      setSelectedUserIds(new Set());
      setMessageText('');
      setSearch('');
    }
  }, [isOpen, search]);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', session.user.id)
        .limit(20);

      if (search.trim()) {
        query = query.ilike('full_name', `%${search}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        const { blockedUserIds, blockedByThemIds } = useUgcStore.getState();
        const allBlocked = new Set([...blockedUserIds, ...blockedByThemIds]);
        setUsers(data.filter(u => !allBlocked.has(u.id)));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedUserIds.size === 0) return;
    setIsSending(true);
    try {
      const promises = Array.from(selectedUserIds).map(userId => 
        sharePost(userId, {
          postId: post.id,
          imageUrl: post.image_url,
          caption: post.caption || post.title || '',
          posterName,
          posterAvatar,
          posterId,
          customMessage: messageText
        })
      );
      
      await Promise.all(promises);
      toast.success('Sent successfully');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to share post');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay">
      <div style={{ flex: 1 }} onClick={onClose} />
      
      <div className="share-modal-container">
        
        <div className="share-modal-header">
          <div className="share-drag-handle"></div>
          <h3 className="share-modal-title">Share</h3>
          <button className="share-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
        
        <div className="share-modal-search">
          <div className="share-search-input-wrap">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Search people..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="share-search-input"
            />
          </div>
        </div>

        <div className="share-modal-list">
          {users.map(user => {
            const username = user.username ? `@${user.username.replace('@', '')}` : `@${user.full_name.replace(/\s+/g, '').toLowerCase()}`;
            const avatar = user.avatar_url || 'https://via.placeholder.com/150';
            const isSelected = selectedUserIds.has(user.id);
            
            return (
              <div 
                key={user.id} 
                className={`share-user-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleUser(user.id)}
              >
                <div className="share-user-info">
                  <img src={avatar} alt={username} className="share-avatar" />
                  <div className="share-username-group">
                    <span className="share-fullname">{user.full_name}</span>
                    <span className="share-username">{username}</span>
                  </div>
                </div>
                
                <div className="share-checkbox">
                  <span className="material-symbols-outlined">check</span>
                </div>
              </div>
            );
          })}
          
          {users.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8c90a0', marginTop: '40px' }}>
              No users found
            </div>
          )}
        </div>
        
        <div className="share-modal-footer">
          <div className="share-input-row">
            <input 
              type="text" 
              placeholder="Write a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="share-message-input"
            />
            <button 
              className="share-send-btn"
              onClick={handleSend}
              disabled={selectedUserIds.size === 0 || isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedShareModal;
