import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import Avatar from '../../../components/ui/Avatar';
import ChatModal from '../../../components/ui/ChatModal';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../../lib/supabase';
import toast from 'react-hot-toast';
import './InboxPage.css';

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { inboxChats, fetchInbox, isLoading, deleteChat, onlineUsers, typingUsers } = useChatStore();
  
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, avatar: string | null} | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Edit Mode & Selection
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInbox(user.id);
    }
  }, [user, fetchInbox]);

  useEffect(() => {
    const state = location.state as any;
    if (state?.restoreChat && !isChatModalOpen) {
      setActiveChatUser({ 
        id: state.restoreChat.id, 
        name: state.restoreChat.name, 
        avatar: state.restoreChat.avatar 
      });
      setIsChatModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, isChatModalOpen, navigate]);

  // Global Search Effect
  useEffect(() => {
    if (!searchQuery.startsWith('@') || searchQuery.length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    const searchUsername = searchQuery.slice(1).trim();
    if (!searchUsername) return;

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .ilike('username', `%${searchUsername}%`)
          .limit(10);
        
        if (error) throw error;
        setGlobalSearchResults(data || []);
      } catch (err) {
        console.error('Error searching users globally:', err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenChat = (id: string, name: string, avatar: string | null) => {
    if (isEditMode) {
      toggleSelection(id);
      return;
    }
    setActiveChatUser({ id, name, avatar });
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    if (user) {
      fetchInbox(user.id);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setSelectedChats([]);
  };

  const toggleSelection = (userId: string) => {
    setSelectedChats(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedChats.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(selectedChats.map(recipientId => deleteChat(user.id, recipientId)));
      toast.success(`${selectedChats.length} chat(s) deleted`);
      setIsEditMode(false);
      setSelectedChats([]);
      fetchInbox(user.id);
    } catch (err) {
      console.error('Failed to delete some chats:', err);
      toast.error('Failed to delete selected chats');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredChats = useMemo(() => {
    if (searchQuery.startsWith('@')) return inboxChats; 
    
    const query = searchQuery.toLowerCase();
    if (!query) return inboxChats;

    return inboxChats.filter(chat => 
      chat.name.toLowerCase().includes(query) || 
      chat.lastMessage.toLowerCase().includes(query)
    );
  }, [inboxChats, searchQuery]);

  return (
    <div className="inbox-page">
      <header className="inbox-header">
        <button className="inbox-icon-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="inbox-title">Messages</h1>
        <button 
          className={`inbox-icon-btn ${isEditMode ? 'active' : ''}`} 
          onClick={toggleEditMode} 
          aria-label="Edit Chats"
        >
          <span className="material-symbols-outlined">{isEditMode ? 'close' : 'edit'}</span>
        </button>
      </header>

      <main className="inbox-content">
        <div className="inbox-search-container">
          <span className="material-symbols-outlined inbox-search-icon">search</span>
          <input 
            className="inbox-search-input" 
            placeholder="Search or @username..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="inbox-list">
          {searchQuery.startsWith('@') && (
            <div className="global-search-section">
              <h3 className="global-search-title">Global Search Results</h3>
              {isSearchingGlobal ? (
                <div className="inbox-skeleton-item" style={{ opacity: 0.5 }}>
                  <div className="inbox-skeleton-avatar shimmer-bg"></div>
                  <div className="inbox-skeleton-lines">
                    <div className="inbox-skeleton-line short shimmer-bg" style={{ width: '25%' }}></div>
                    <div className="inbox-skeleton-line long shimmer-bg" style={{ width: '50%' }}></div>
                  </div>
                </div>
              ) : globalSearchResults.length === 0 ? (
                <p className="global-search-empty">No users found.</p>
              ) : (
                globalSearchResults.map(userResult => {
                  if (userResult.id === user?.id) return null;
                  
                  return (
                    <button 
                      key={`global-${userResult.id}`} 
                      className="chat-item-hover global-result-item"
                      onClick={() => {
                        handleOpenChat(userResult.id, userResult.full_name, userResult.avatar_url);
                      }}
                    >
                      <div className={`chat-item-avatar-wrap is-offline`}>
                        <Avatar src={userResult.avatar_url} name={userResult.full_name} size="md" />
                      </div>
                      <div className="chat-item-content">
                        <div className="chat-item-header">
                          <h2 className="chat-item-name">{userResult.full_name}</h2>
                        </div>
                        <p className="chat-item-msg" style={{ color: 'var(--chat-primary)' }}>@{userResult.username}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {(!searchQuery.startsWith('@') || filteredChats.length > 0) && (
            <>
              {searchQuery.startsWith('@') && <h3 className="global-search-title mt-4" style={{ marginTop: '16px' }}>Your Chats</h3>}
              {isLoading ? (
                <>
                  <div className="inbox-skeleton-item">
                    <div className="inbox-skeleton-avatar shimmer-bg"></div>
                    <div className="inbox-skeleton-lines">
                      <div className="inbox-skeleton-line short shimmer-bg"></div>
                      <div className="inbox-skeleton-line long shimmer-bg"></div>
                    </div>
                  </div>
                  <div className="inbox-skeleton-item" style={{ opacity: 0.5 }}>
                    <div className="inbox-skeleton-avatar shimmer-bg"></div>
                    <div className="inbox-skeleton-lines">
                      <div className="inbox-skeleton-line short shimmer-bg" style={{ width: '25%' }}></div>
                      <div className="inbox-skeleton-line long shimmer-bg" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </>
              ) : filteredChats.length === 0 ? (
                <div className="inbox-empty">
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#8c90a0', marginBottom: '16px' }}>forum</span>
                  <p style={{ color: '#c2c6d7' }}>No messages found.</p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isOnline = onlineUsers.includes(chat.userId);
                  const isTyping = typingUsers[chat.userId];

                  return (
                    <button 
                      key={chat.userId} 
                      className={`chat-item-hover ${isEditMode && selectedChats.includes(chat.userId) ? 'selected' : ''}`}
                      onClick={() => handleOpenChat(chat.userId, chat.name, chat.avatar)}
                    >
                      {isEditMode && (
                        <div className={`chat-item-checkbox ${selectedChats.includes(chat.userId) ? 'checked' : ''}`}>
                          {selectedChats.includes(chat.userId) && <span className="material-symbols-outlined check-icon" style={{ fontSize: '16px' }}>check</span>}
                        </div>
                      )}
                      <div className={`chat-item-avatar-wrap ${isOnline && !isEditMode ? 'is-online' : 'is-offline'}`}>
                        <Avatar src={chat.avatar} name={chat.name} size="md" />
                      </div>
                      <div className="chat-item-content">
                        <div className="chat-item-header">
                          <h2 className="chat-item-name" style={{ fontWeight: chat.unread ? '800' : '700', color: chat.unread ? '#ffffff' : 'var(--chat-on-background)' }}>{chat.name}</h2>
                          <span className="chat-item-time" style={{ color: chat.unread ? 'var(--chat-primary-container)' : 'var(--chat-outline)' }}>
                            {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: false }).replace('about ', '')}
                          </span>
                        </div>
                        <p className="chat-item-msg" style={{ color: chat.unread ? '#ffffff' : 'var(--chat-on-surface-variant)' }}>
                          {isTyping ? <span className="typing-text">typing...</span> : chat.lastMessage}
                        </p>
                      </div>
                      {chat.unread && !isEditMode && (
                        <div className="chat-item-unread-dot"></div>
                      )}
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </main>

      {isEditMode && selectedChats.length > 0 && (
        <div className="inbox-bulk-delete-bar popup-enter">
          <button 
            className="bulk-delete-btn" 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            <span className="material-symbols-outlined">delete</span>
            {isDeleting ? 'Deleting...' : `Delete Selected (${selectedChats.length})`}
          </button>
        </div>
      )}

      <ChatModal 
        isOpen={isChatModalOpen}
        onClose={handleCloseChat}
        recipientId={activeChatUser?.id || ''}
        recipientName={activeChatUser?.name || ''}
        recipientAvatar={activeChatUser?.avatar || null}
      />
    </div>
  );
};

export default InboxPage;
