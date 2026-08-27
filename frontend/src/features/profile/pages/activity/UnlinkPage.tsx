import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../../../../components/ui/TransitionLoader';
import { useAuthStore } from '../../../../store/authStore';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'react-hot-toast';
import '../ActivityPage.css';

const platformStyles: Record<string, { color: string; bg: string; icon: string; name: string }> = {
  youtube: { color: '#FF0000', bg: 'rgba(255, 0, 0, 0.2)', icon: 'smart_display', name: 'YouTube' },
  instagram: { color: '#E1306C', bg: 'rgba(225, 48, 108, 0.2)', icon: 'photo_camera', name: 'Instagram' },
  tiktok: { color: '#00F2FE', bg: 'rgba(0, 242, 254, 0.2)', icon: 'music_note', name: 'TikTok' },
  facebook: { color: '#1877F2', bg: 'rgba(24, 119, 242, 0.2)', icon: 'facebook', name: 'Facebook' },
  twitter: { color: '#1DA1F2', bg: 'rgba(29, 161, 242, 0.2)', icon: 'flutter_dash', name: 'Twitter' },
  linkedin: { color: '#0A66C2', bg: 'rgba(10, 102, 194, 0.2)', icon: 'work', name: 'LinkedIn' },
  reddit: { color: '#FF4500', bg: 'rgba(255, 69, 0, 0.2)', icon: 'forum', name: 'Reddit' },
  snapchat: { color: '#FFFC00', bg: 'rgba(255, 252, 0, 0.2)', icon: 'ghost', name: 'Snapchat' },
  default: { color: '#FFFFFF', bg: 'rgba(255, 255, 255, 0.2)', icon: 'link', name: 'Platform' }
};

const UnlinkPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User to unlink modal
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string, name: string, type: 'telegram' | 'social' } | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      if (!profile) return;
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('profile_id', profile.id);
        
        if (error) throw error;
        setSocialLinks(data || []);
      } catch (err) {
        console.error('Error fetching social links:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLinks();
  }, [profile]);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile/activity', { state: { fromTransition: true } });
    }, 400);
  };

  const confirmUnlink = async () => {
    if (!profile || !unlinkTarget) return;
    setIsUnlinking(true);
    
    try {
      if (unlinkTarget.type === 'telegram') {
        const { error } = await supabase
          .from('profiles')
          .update({ telegram_id: null, telegram_username: null })
          .eq('id', profile.id);

        if (error) throw error;
        await updateProfile({ telegram_id: undefined, telegram_username: undefined });
        toast.success('Telegram unlinked successfully');
      } else {
        const { error } = await supabase
          .from('social_links')
          .delete()
          .eq('id', unlinkTarget.id);

        if (error) throw error;
        setSocialLinks(prev => prev.filter(link => link.id !== unlinkTarget.id));
        toast.success(`${unlinkTarget.name} unlinked successfully`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlink platform');
    } finally {
      setIsUnlinking(false);
      setUnlinkTarget(null);
    }
  };

  const hasLinkedPlatforms = !!profile?.telegram_username || socialLinks.length > 0;

  return (
    <>
      <TransitionLoader isActive={isNavigating || isUnlinking} />
      <div className="activity-page">
        <div className="activity-ambient-bg"></div>
        <header className="activity-top-bar">
          <button className="activity-back-btn" onClick={handleBack} aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="activity-brand">Unlink Platforms</span>
        </header>
        <main className="activity-main" style={{ paddingTop: '88px', alignItems: 'center', padding: '88px 24px 24px 24px' }}>
          
          {isLoading ? (
            <div style={{ marginTop: '100px' }} className="btn-spinner" />
          ) : !hasLinkedPlatforms ? (
            <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.5)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px' }}>link_off</span>
              <h2>No Linked Platforms</h2>
              <p>Your connected platforms like YouTube or Telegram will appear here, and you can unlink them anytime.</p>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Telegram Card */}
              {profile?.telegram_username && (
                <div className="activity-glass-card" style={{ justifyContent: 'space-between', padding: '16px' }}>
                  <div className="activity-card-left" style={{ gap: '12px' }}>
                    <div className="activity-icon-wrap" style={{ background: 'rgba(0, 136, 204, 0.2)' }}>
                      <span className="material-symbols-outlined" style={{ color: '#0088cc' }}>send</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="activity-card-text">Telegram</span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>@{profile.telegram_username}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setUnlinkTarget({ id: profile.id, name: 'Telegram', type: 'telegram' })}
                    style={{ 
                      background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.2)',
                      padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    Unlink
                  </button>
                </div>
              )}

              {/* Other Social Links */}
              {socialLinks.map((link) => {
                const style = platformStyles[link.platform.toLowerCase()] || platformStyles.default;
                return (
                  <div key={link.id} className="activity-glass-card" style={{ justifyContent: 'space-between', padding: '16px' }}>
                    <div className="activity-card-left" style={{ gap: '12px' }}>
                      <div className="activity-icon-wrap" style={{ background: style.bg }}>
                        <span className="material-symbols-outlined" style={{ color: style.color }}>{style.icon}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="activity-card-text">{style.name}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>@{link.username}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setUnlinkTarget({ id: link.id, name: style.name, type: 'social' })}
                      style={{ 
                        background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.2)',
                        padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      Unlink
                    </button>
                  </div>
                );
              })}

            </div>
          )}

        </main>
      </div>

      {/* Unlink Confirmation Modal */}
      {unlinkTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px'
        }}>
          <div style={{
            background: 'rgba(30, 30, 30, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px', padding: '32px',
            width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#FF3B30' }}>link_off</span>
            </div>
            
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0' }}>Unlink {unlinkTarget.name}?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: '0 0 32px 0', lineHeight: 1.5 }}>
              Are you sure you want to disconnect your {unlinkTarget.name} account? This may affect your active campaigns.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setUnlinkTarget(null)}
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmUnlink}
                style={{ flex: 1, padding: '14px', background: '#FF3B30', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
              >
                Unlink
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnlinkPage;
