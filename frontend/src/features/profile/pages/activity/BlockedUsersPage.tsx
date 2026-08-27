import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../../../../components/ui/TransitionLoader';
import { supabase } from '../../../../lib/supabase';
import { useAuthStore } from '../../../../store/authStore';
import { toast } from 'react-hot-toast';
import '../ActivityPage.css';

const BlockedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [userToUnblock, setUserToUnblock] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('blocked_users')
          .select('*, blocked:profiles!blocked_id(id, full_name, username, avatar_url)')
          .eq('blocker_id', user.id);
          
        if (error) throw error;
        setBlockedUsers(data || []);
      } catch (err) {
        console.error('Error fetching blocked users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlockedUsers();
  }, [user]);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile/activity', { state: { fromTransition: true } });
    }, 400);
  };

  const confirmUnblock = async () => {
    if (!user || !userToUnblock) return;
    const blockedId = userToUnblock.id;
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .match({ blocker_id: user.id, blocked_id: blockedId });
        
      if (error) throw error;
      
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
      toast.success('User unblocked successfully');
    } catch (err: any) {
      toast.error('Failed to unblock user');
    } finally {
      setUserToUnblock(null);
    }
  };

  return (
    <>
      <TransitionLoader isActive={isNavigating} />
      <div className="activity-page">
        <div className="activity-ambient-bg"></div>
        <header className="activity-top-bar">
          <button className="activity-back-btn" onClick={handleBack} aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="activity-brand">Blocked Users</span>
        </header>
        <main className="activity-main" style={{ paddingTop: '88px', alignItems: 'center', padding: '88px 24px 24px 24px' }}>
          
          {isLoading ? (
            <div style={{ marginTop: '100px' }} className="btn-spinner" />
          ) : blockedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.5)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px' }}>block</span>
              <h2>No Blocked Users</h2>
              <p>Users you have blocked will be listed here.</p>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {blockedUsers.map((blockRecord) => {
                const blockedProfile = blockRecord.blocked;
                if (!blockedProfile) return null;
                
                return (
                  <div key={blockRecord.id} className="activity-glass-card" style={{ justifyContent: 'space-between', padding: '16px' }}>
                    <div className="activity-card-left" style={{ gap: '12px' }}>
                      <img 
                        src={blockedProfile.avatar_url || 'https://via.placeholder.com/150'} 
                        alt={blockedProfile.full_name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="activity-card-text">{blockedProfile.full_name}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>@{blockedProfile.username}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUserToUnblock({ id: blockedProfile.id, name: blockedProfile.full_name })}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        color: '#FFF', 
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Unblock Confirmation Modal */}
      {userToUnblock && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            background: 'rgba(30, 30, 30, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              width: '64px', height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#fff' }}>no_accounts</span>
            </div>
            
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0' }}>Unblock {userToUnblock.name}?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: '0 0 32px 0', lineHeight: 1.5 }}>
              They will be able to see your posts and interact with you again.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setUserToUnblock(null)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmUnblock}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F7931E',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1A1A1A',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockedUsersPage;
