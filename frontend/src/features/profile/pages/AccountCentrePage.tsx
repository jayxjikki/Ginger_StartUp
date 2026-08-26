import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { supabase } from '../../../lib/supabase';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import instagramIcon from '../../../assets/instagram.png';
import tiktokIcon from '../../../assets/tiktok.png';
import facebookIcon from '../../../assets/facebook.png';
import whatsappIcon from '../../../assets/whatsapp.png';
import telegramIcon from '../../../assets/telegram.png';
import twitchIcon from '../../../assets/twitch.png';
import discordIcon from '../../../assets/dicord.png';
import xIcon from '../../../assets/x.png';
import redditIcon from '../../../assets/reddit.png';
import linkedinIcon from '../../../assets/linkedin.png';
import quoraIcon from '../../../assets/quora.png';
import tumblrIcon from '../../../assets/tumblr.png';
import pinterestIcon from '../../../assets/pinterest.png';
import snapchatIcon from '../../../assets/snapchat.png';
import githubIcon from '../../../assets/github.png';
import './AccountCentrePage.css';

const AccountCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { profile, socialLinks, updateSocialLinks } = useProfileStore();

  const actualAvatarUrl = profile?.avatar_url || 'https://via.placeholder.com/150';
  const fullName = profile?.full_name || 'Jikki Thakur';
  const email = user?.email || 'jikki@example.com';
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);

  const [activeLinkPlatform, setActiveLinkPlatform] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  useEffect(() => {
    if (isEntering) {
      setTimeout(() => setIsEntering(false), 400);
    }
  }, [isEntering]);

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/profile', { state: { openSettings: true, fromTransition: true } });
    }, 400);
  };

  const getPlatformLink = (platform: string) => {
    const link = socialLinks.find(l => l.platform.toLowerCase() === platform.toLowerCase());
    if (link) {
      // If it's already a full URL, return it exactly as saved
      if (link.username.startsWith('http')) {
        return link.username;
      }
      return `https://${platform.toLowerCase()}.com/${link.username}`;
    }
    return '';
  };

  const handleOAuthLink = async (platform: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: platform,
        options: {
          redirectTo: `${window.location.origin}/profile/account`
        }
      });
      if (error) {
        if (error.message.includes('already linked')) {
          toast.error(`This ${platform} account is already linked to another user.`);
        } else {
          toast.error(`Failed to link ${platform}: ${error.message}`);
        }
      }
    } catch (err: any) {
      toast.error(`An unexpected error occurred: ${err.message}`);
    }
  };

  const openLinkModal = (platform: string) => {
    if (platform === 'YouTube') {
      handleOAuthLink('google');
      return;
    }
    if (platform === 'Instagram') {
      handleOAuthLink('facebook');
      return;
    }
    setActiveLinkPlatform(platform);
    setLinkUrl(getPlatformLink(platform));
  };

  const closeLinkModal = () => {
    setActiveLinkPlatform(null);
    setLinkUrl('');
  };

  const handleSaveLink = () => {
    if (activeLinkPlatform) {
      const url = linkUrl.trim();
      const newLinks = [...socialLinks];
      const existingIndex = newLinks.findIndex(l => l.platform.toLowerCase() === activeLinkPlatform.toLowerCase());
      
      if (url === '') {
        // Remove
        if (existingIndex >= 0) newLinks.splice(existingIndex, 1);
      } else {
        // Update or Add
        // Save exactly what the user pasted to prevent altering their link
        const username = url;
        
        if (existingIndex >= 0) {
          newLinks[existingIndex] = { ...newLinks[existingIndex], username, url: username };
        } else {
          newLinks.push({ id: Date.now().toString(), platform: activeLinkPlatform, username, url: username, followers: Math.floor(Math.random() * 50000) });
        }
      }
      updateSocialLinks(newLinks);
    }
    closeLinkModal();
  };

  const handleDeleteAccount = async () => {
    const { showConfirm, showAlert } = useGlobalModalStore.getState();
    const confirmed = await showConfirm(
      "Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.", 
      "Delete Account"
    );
    
    if (confirmed) {
      try {
        setIsEntering(true);
        const { error } = await supabase.functions.invoke('delete-user');
        
        if (error) {
          throw new Error(error.message || 'Failed to delete account');
        }
        
        toast.success("Account deleted successfully.");
        useAuthStore.getState().signOut();
      } catch (err: any) {
        console.error(err);
        setIsEntering(false);
        showAlert(err.message || "Failed to delete account. Please contact support.", "Error");
      }
    }
  };

  const isLinked = (platform: string) => {
    return socialLinks.some(l => l.platform.toLowerCase() === platform.toLowerCase());
  };

  // Listen for auth state changes to capture OAuth linking callback
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        const identities = session.user.identities || [];
        
        // Handle Google (YouTube) linking
        const googleIdentity = identities.find(id => id.provider === 'google');
        if (googleIdentity && !isLinked('YouTube')) {
          // In a real production app, we would use session.provider_token to fetch from YouTube API.
          // Since this requires YouTube API keys, we'll save basic verified info here.
          let rawName = googleIdentity.identity_data?.name || googleIdentity.identity_data?.full_name || googleIdentity.identity_data?.email || 'YouTubeUser';
          // Clean up for a valid handle format
          let username = rawName.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
          
          await useProfileStore.getState().addVerifiedSocialLink('YouTube', username, `https://youtube.com/@${username}`, 0);
          toast.success("YouTube account linked successfully!");
        }

        // Handle Facebook (Instagram) linking
        const facebookIdentity = identities.find(id => id.provider === 'facebook');
        if (facebookIdentity && !isLinked('Instagram')) {
          let rawName = facebookIdentity.identity_data?.name || facebookIdentity.identity_data?.full_name || facebookIdentity.identity_data?.email || 'InstagramUser';
          let username = rawName.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '');
          
          await useProfileStore.getState().addVerifiedSocialLink('Instagram', username, `https://instagram.com/${username}`, 0);
          toast.success("Instagram (via Facebook) linked successfully!");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [socialLinks, isLinked]);

  const OTHER_PLATFORMS = [
    { name: 'Facebook', icon: facebookIcon },
    { name: 'WhatsApp', icon: whatsappIcon },
    { name: 'Telegram', icon: telegramIcon },
    { name: 'Twitch', icon: twitchIcon },
    { name: 'Discord', icon: discordIcon },
    { name: 'X', icon: xIcon },
    { name: 'Reddit', icon: redditIcon },
    { name: 'LinkedIn', icon: linkedinIcon },
    { name: 'Quora', icon: quoraIcon },
    { name: 'Tumblr', icon: tumblrIcon },
    { name: 'Pinterest', icon: pinterestIcon },
    { name: 'Snapchat', icon: snapchatIcon },
    { name: 'GitHub', icon: githubIcon },
  ];

  return (
    <>
      <TransitionLoader isActive={isNavigating || isEntering} />
      <div className="account-centre-page">
      {/* Ambient Glow */}
      <div className="account-ambient-glow"></div>

      {/* TopAppBar */}
      <header className="account-top-bar">
        <button 
          aria-label="Go back" 
          className="account-back-btn"
          onClick={handleBack}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="account-brand">GINGER</h1>
        <div className="account-avatar">
          <img src={actualAvatarUrl} alt="Avatar" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="account-main">
        {/* Page Title */}
        <div className="account-header">
          <h2 className="account-title">Account Centre</h2>
          <p className="account-subtitle">Manage your identity, security, and linked platforms.</p>
        </div>

        {/* 1. Linked Accounts (Bento Style) */}
        <section className="account-section">
          <h3 className="account-section-title">Linked Accounts</h3>
          <div className="linked-accounts-grid">
            
            {/* Instagram Card */}
            <div className="glass-panel liquid-hover account-card" onClick={() => openLinkModal('Instagram')}>
              <div className="account-icon-wrap">
                <img 
                  src={instagramIcon} 
                  alt="Instagram" 
                  style={{ width: '24px', height: '24px', opacity: 0.8 }} 
                />
              </div>
              <div>
                <div className="account-card-name">Instagram</div>
                <div className="account-status">
                  {isLinked('Instagram') ? (
                    <><span className="status-dot"></span> Linked</>
                  ) : (
                    <span style={{ color: '#c4c7c8' }}>Not linked</span>
                  )}
                </div>
              </div>
            </div>

            {/* YouTube Card */}
            <div className="glass-panel liquid-hover account-card" onClick={() => openLinkModal('YouTube')}>
              <div className="account-icon-wrap">
                <span className="material-symbols-outlined" style={{ color: '#ffffff', fontSize: '24px', fontVariationSettings: "'FILL' 1", opacity: 0.8 }}>play_circle</span>
              </div>
              <div>
                <div className="account-card-name">YouTube</div>
                <div className="account-status">
                  {isLinked('YouTube') ? (
                    <><span className="status-dot"></span> Linked</>
                  ) : (
                    <span style={{ color: '#c4c7c8' }}>Not linked</span>
                  )}
                </div>
              </div>
            </div>

            {/* TikTok Card */}
            <div className="glass-panel liquid-hover account-card" onClick={() => openLinkModal('TikTok')}>
              <div className="account-icon-wrap">
                <img 
                  src={tiktokIcon} 
                  alt="TikTok" 
                  style={{ width: '24px', height: '24px', opacity: 0.8, filter: 'invert(1)' }} 
                />
              </div>
              <div>
                <div className="account-card-name">TikTok</div>
                <div className="account-status">
                  {isLinked('TikTok') ? (
                    <><span className="status-dot"></span> Linked</>
                  ) : (
                    <span style={{ color: '#c4c7c8' }}>Not linked</span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamically Rendered Linked Other Platforms */}
            {OTHER_PLATFORMS.filter(p => isLinked(p.name)).map(platform => (
              <div key={platform.name} className="glass-panel liquid-hover account-card" onClick={() => openLinkModal(platform.name)}>
                <div className="account-icon-wrap">
                  <img 
                    src={platform.icon} 
                    alt={platform.name} 
                    style={{ width: '24px', height: '24px', opacity: 0.8 }} 
                  />
                </div>
                <div>
                  <div className="account-card-name">{platform.name}</div>
                  <div className="account-status">
                    <span className="status-dot"></span> Linked
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Card */}
            <div className="add-account-card" onClick={() => setShowPlatformMenu(true)}>
              <div className="add-icon-wrap">
                <span className="material-symbols-outlined">add</span>
              </div>
              <div className="add-account-text">Connect new platform</div>
            </div>
          </div>
        </section>

        {/* 2. Personal Information */}
        <section className="account-section">
          <h3 className="account-section-title">Personal Information</h3>
          <div className="glass-panel info-list-container">
            {/* Name */}
            <div className="info-item liquid-hover" onClick={() => navigate('/profile/edit', { state: { fromTransition: true } })} style={{ cursor: 'pointer' }}>
              <div className="info-item-content">
                <span className="info-item-label">Name</span>
                <span className="info-item-value">{fullName}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Username */}
            <div className="info-item liquid-hover" onClick={() => navigate('/profile/edit', { state: { fromTransition: true } })} style={{ cursor: 'pointer' }}>
              <div className="info-item-content">
                <span className="info-item-label">Username</span>
                <span className="info-item-value">{profile?.username || 'Not set'}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Location */}
            <div className="info-item liquid-hover" onClick={() => navigate('/profile/edit', { state: { fromTransition: true } })} style={{ cursor: 'pointer' }}>
              <div className="info-item-content">
                <span className="info-item-label">Location</span>
                <span className="info-item-value">{profile?.location || 'Not set'}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Email (Read-only typically, or handled by Auth) */}
            <div className="info-item">
              <div className="info-item-content">
                <span className="info-item-label">Email</span>
                <span className="info-item-value">{email}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon" style={{ opacity: 0.3 }}>lock</span>
            </div>
          </div>
        </section>

        {/* 3. Account Security */}
        <section className="account-section">
          <h3 className="account-section-title">Security</h3>
          <div className="glass-panel info-list-container">
            {/* Password */}
            <div className="info-item liquid-hover" onClick={() => alert('Password reset emails can be managed via Supabase Auth.')}>
              <div className="info-item-content">
                <span className="info-item-label">Password</span>
                <span className="info-item-value">••••••••</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
            {/* 2FA */}
            <div className="info-item liquid-hover" onClick={() => alert('Two-factor authentication coming soon.')}>
              <div className="info-item-content">
                <span className="info-item-label">Two-factor authentication</span>
                <span className="info-item-value" style={{ color: '#c4c7c8' }}>Off</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
          </div>
        </section>

        {/* 4. Legal */}
        <section className="account-section">
          <h3 className="account-section-title">Legal</h3>
          <div className="glass-panel info-list-container">
            <div className="info-item liquid-hover" onClick={() => navigate('/privacy-policy')} style={{ cursor: 'pointer' }}>
              <div className="info-item-content">
                <span className="info-item-label">Privacy Policy</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
            <div className="info-item liquid-hover" onClick={() => navigate('/terms-of-service')} style={{ cursor: 'pointer' }}>
              <div className="info-item-content">
                <span className="info-item-label">Terms of Service</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">chevron_right</span>
            </div>
          </div>
        </section>

        {/* 5. Danger Zone */}
        <section className="danger-zone">
          <div className="danger-card" onClick={handleDeleteAccount} style={{ cursor: 'pointer' }}>
            <div className="danger-content">
              <span className="danger-title">Delete Account</span>
              <span className="danger-subtitle">Permanently remove your data</span>
            </div>
            <span className="material-symbols-outlined danger-icon">delete_forever</span>
          </div>
        </section>
      </main>

    {/* Link Platform Modal */}
      {activeLinkPlatform && (
        <div className="link-platform-modal-overlay" onClick={closeLinkModal}>
          <div className="link-platform-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-header">
              <h3>Link {activeLinkPlatform}</h3>
              <button className="link-modal-close" onClick={closeLinkModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="link-modal-body">
              <label>Profile URL</label>
              <input 
                type="text" 
                placeholder={`https://${activeLinkPlatform.toLowerCase()}.com/username`}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="link-url-input"
              />
              <p className="link-modal-hint">Paste the full URL to your profile to verify your account.</p>
            </div>
            <div className="link-modal-footer">
              <button className="link-btn-cancel" onClick={closeLinkModal}>Cancel</button>
              <button className="link-btn-save" onClick={handleSaveLink}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Select Platform Menu Modal */}
      {showPlatformMenu && (
        <div className="platform-menu-overlay" onClick={() => setShowPlatformMenu(false)}>
          <div className="platform-menu-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="platform-menu-header">
              <h3>Select Platform</h3>
              <button className="link-modal-close" onClick={() => setShowPlatformMenu(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="platform-menu-list">
              {OTHER_PLATFORMS.filter(p => !isLinked(p.name)).length > 0 ? (
                OTHER_PLATFORMS.filter(p => !isLinked(p.name)).map(platform => (
                  <div key={platform.name} className="platform-menu-item" onClick={() => { setShowPlatformMenu(false); openLinkModal(platform.name); }}>
                    <div className="platform-menu-icon">
                      <img src={platform.icon} alt={platform.name} />
                    </div>
                    <span className="platform-menu-text">{platform.name}</span>
                    <span className="material-symbols-outlined platform-menu-chevron">chevron_right</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#c4c7c8', textAlign: 'center', padding: '16px' }}>
                  All platforms connected
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default AccountCentrePage;
