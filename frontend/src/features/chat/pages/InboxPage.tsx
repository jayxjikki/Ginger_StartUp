import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import Avatar from '../../../components/ui/Avatar';
import ChatModal from '../../../components/ui/ChatModal';
import { formatDistanceToNow } from 'date-fns';
import './InboxPage.css';

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { inboxChats, fetchInbox, isLoading } = useChatStore();
  
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, avatar: string | null} | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

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
      // Clear state via React Router to avoid reopening on close
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, isChatModalOpen, navigate]);

  const handleOpenChat = (id: string, name: string, avatar: string | null) => {
    setActiveChatUser({ id, name, avatar });
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    // Refresh inbox to get latest message after closing chat
    if (user) {
      fetchInbox(user.id);
    }
  };

  return (
    <div className="inbox-page">
      <header className="inbox-header">
        <button className="inbox-icon-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="inbox-title">Messages</h1>
        <div style={{ width: '40px' }} /> {/* Spacer */}
      </header>

      <main className="inbox-content">
        <div className="inbox-search-container">
          <span className="material-symbols-outlined inbox-search-icon">search</span>
          <input 
            className="inbox-search-input" 
            placeholder="Search messages..." 
            type="text"
          />
        </div>

        <div className="inbox-list">
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
          ) : inboxChats.length === 0 ? (
            <div className="inbox-empty">
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#8c90a0', marginBottom: '16px' }}>forum</span>
              <p style={{ color: '#c2c6d7' }}>No messages yet.</p>
            </div>
          ) : (
            inboxChats.map((chat) => (
              <button 
                key={chat.userId} 
                className="chat-item-hover"
                onClick={() => handleOpenChat(chat.userId, chat.name, chat.avatar)}
              >
                <div className="chat-item-avatar-wrap">
                  <Avatar src={chat.avatar} name={chat.name} size="md" />
                  {chat.unread && <div className="chat-item-online-dot"></div>}
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-header">
                    <h2 className="chat-item-name">{chat.name}</h2>
                    <span className="chat-item-time">
                      {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: false }).replace('about ', '')}
                    </span>
                  </div>
                  <p className="chat-item-msg">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </main>

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
