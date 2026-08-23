import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import Avatar from '../../../components/ui/Avatar';
import ChatModal from '../../../components/ui/ChatModal';
import { formatDistanceToNow } from 'date-fns';
import './InboxPage.css';

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { inboxChats, fetchInbox, isLoading } = useChatStore();
  
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, avatar: string | null} | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInbox(user.id);
    }
  }, [user, fetchInbox]);

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
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go Back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="inbox-title">Messages</h1>
        <div style={{ width: '40px' }} /> {/* Spacer for centering */}
      </header>

      <main className="inbox-content">
        {isLoading ? (
          <div className="inbox-loading">
            <div className="btn-spinner" style={{ width: '30px', height: '30px', borderColor: 'rgba(255,255,255,0.1)', borderTopColor: '#F7931E' }} />
          </div>
        ) : inboxChats.length === 0 ? (
          <div className="inbox-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}>forum</span>
            <p>No messages yet.</p>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)' }}>Start a conversation from the Discover page!</span>
          </div>
        ) : (
          <div className="inbox-list">
            {inboxChats.map((chat) => (
              <div 
                key={chat.userId} 
                className={`inbox-item ${chat.unread ? 'unread' : ''}`}
                onClick={() => handleOpenChat(chat.userId, chat.name, chat.avatar)}
              >
                <Avatar src={chat.avatar} name={chat.name} size="md" />
                <div className="inbox-item-content">
                  <div className="inbox-item-header">
                    <span className="inbox-item-name">{chat.name}</span>
                    <span className="inbox-item-time">
                      {formatDistanceToNow(new Date(chat.timestamp), { addSuffix: false }).replace('about ', '')}
                    </span>
                  </div>
                  <div className="inbox-item-preview">
                    <span className="inbox-item-msg">{chat.lastMessage}</span>
                    {chat.unread && <span className="inbox-unread-dot" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
