import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { supabase } from '../../../lib/supabase';
import { useGoogleLogin } from '@react-oauth/google';
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
import ConnectTelegram from '../components/ConnectTelegram';
import './AccountCentrePage.css';

const AccountCentrePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { profile, socialLinks, updateSocialLinks, updateProfile, togglePinnedSocial } = useProfileStore();
  const pinnedSocials = profile?.pinned_socials || [];

  const actualAvatarUrl = profile?.avatar_url || 'https://via.placeholder.com/150';
  const fullName = profile?.full_name || 'Jikki Thakur';
  
  const [localEmail, setLocalEmail] = useState(user?.email || 'manis108hkumar@gmail.com');
  const [localDob, setLocalDob] = useState('October 14, 1992');

  const [isNavigating, setIsNavigating] = useState(false);
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);

  const [activeLinkPlatform, setActiveLinkPlatform] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);

  const [editField, setEditField] = useState<{ key: string, label: string, value: string } | null>(null);

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

  const renderPinIcon = (platform: string) => {
    // Only allow pinning if it's actually linked
    const isPlatformLinked = platform === 'Telegram' ? !!profile?.telegram_id : isLinked(platform);
    if (!isPlatformLinked) return null;

    const isPinned = pinnedSocials.includes(platform);
    const pinIndex = pinnedSocials.indexOf(platform) + 1;

    return (
      <button 
        className={`pin-btn ${isPinned ? 'active' : ''}`}
        onClick={async (e) => {
          e.stopPropagation();
          try {
            await togglePinnedSocial(platform);
          } catch (err: any) {
            toast.error(err.message);
          }
        }}
        title={isPinned ? "Unpin from feed" : "Pin to feed (Max 3)"}
      >
        {isPinned ? (
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>push_pin</span>
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 0" }}>push_pin</span>
        )}
        {isPinned && <span className="pin-badge">{pinIndex}</span>}
      </button>
    );
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

  const openLinkModal = async (platform: string) => {
    if (platform === 'YouTube') {
      loginWithGoogle();
      return;
    }
    if (platform === 'Instagram') {
      const clientId = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;
      if (!clientId) {
        toast.error("Instagram Client ID is not configured.");
        return;
      }
      
      // Meta requires HTTPS for redirect URIs, even for localhost
      const redirectUri = `${window.location.origin}/auth/instagram/callback`;
      const authUrl = `https://api.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=instagram_business_basic,instagram_business_manage_insights`;
      window.location.href = authUrl;
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to delete account');
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


  const loginWithGoogle = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const channel = data.items[0];
          let username = channel.snippet.customUrl || channel.snippet.title;
          const url = `https://youtube.com/${channel.snippet.customUrl || '@' + username}`;
          const followers = parseInt(channel.statistics.subscriberCount, 10) || 0;
          if (username.startsWith('@')) username = username.slice(1);
          await useProfileStore.getState().addVerifiedSocialLink('YouTube', username, url, followers);
          toast.success("YouTube account linked successfully!");
        } else {
          toast.error("No YouTube channel found for this Google account.");
        }
      } catch (err) {
        console.error('Failed to fetch YouTube channel info:', err);
        toast.error("Failed to verify YouTube channel.");
      }
    },
    onError: () => {
      toast.error("Google authentication failed.");
    }
  });

  const openEditModal = (key: string, label: string, value: string) => {
    setEditField({ key, label, value });
  };

  const handleSaveEdit = () => {
    if (editField) {
      if (editField.key === 'name') {
        updateProfile({ full_name: editField.value });
      } else if (editField.key === 'username') {
        updateProfile({ username: editField.value });
      } else if (editField.key === 'location') {
        updateProfile({ location: editField.value });
      } else if (editField.key === 'email') {
        setLocalEmail(editField.value);
      } else if (editField.key === 'dob') {
        setLocalDob(editField.value);
      }
    }
    setEditField(null);
  };

  const OTHER_PLATFORMS = [
    { name: 'Facebook', icon: facebookIcon },
    { name: 'WhatsApp', icon: whatsappIcon },
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
              {renderPinIcon('Instagram')}
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
              {renderPinIcon('YouTube')}
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
              {renderPinIcon('TikTok')}
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

            {/* Telegram Card */}
            <div className="glass-panel liquid-hover account-card" onClick={() => openLinkModal('Telegram')}>
              <div className="account-icon-wrap">
                <img 
                  src={telegramIcon} 
                  alt="Telegram" 
                  style={{ width: '24px', height: '24px', opacity: 0.8 }} 
                />
              </div>
              {renderPinIcon('Telegram')}
              <div>
                <div className="account-card-name">Telegram</div>
                <div className="account-status">
                  {profile?.telegram_id ? (
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
                {renderPinIcon(platform.name)}
                <div>
                  <div className="account-card-name">{platform.name}</div>
                  <div className="account-status">
                    <span className="status-dot"></span> Linked
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Card or Horizontal Scroll Menu */}
            {!showPlatformMenu ? (
              <div className="add-account-card" onClick={() => setShowPlatformMenu(true)}>
                <div className="add-icon-wrap">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <div className="add-account-text">Connect new platform</div>
              </div>
            ) : (
              <div className="platform-scroll-menu">
                <div className="platform-scroll-header">
                  <span style={{ fontSize: '14px', color: '#c4c7c8' }}>Select Platform</span>
                  <button className="close-scroll-menu" onClick={() => setShowPlatformMenu(false)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                </div>
                <div className="platform-scroll-container vertical-list">
                  {OTHER_PLATFORMS.filter(p => !isLinked(p.name)).length > 0 ? (
                    OTHER_PLATFORMS.filter(p => !isLinked(p.name)).map(platform => (
                      <div 
                        key={platform.name} 
                        className="platform-list-item glass-panel liquid-hover" 
                        onClick={() => { setShowPlatformMenu(false); openLinkModal(platform.name); }}
                      >
                        <div className="platform-list-icon">
                          <img src={platform.icon} alt={platform.name} />
                        </div>
                        <span className="platform-list-name">{platform.name}</span>
                        <span className="material-symbols-outlined platform-list-chevron">chevron_right</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#c4c7c8', fontSize: '14px', padding: '10px' }}>All platforms connected!</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Personal Information */}
        <section className="account-section">
          <h3 className="account-section-title">Personal Information</h3>
          <div className="glass-panel info-list-container">
            {/* Name */}
            <div className="info-item liquid-hover" onClick={() => openEditModal('name', 'Name', fullName)}>
              <div className="info-item-content">
                <span className="info-item-label">Name</span>
                <span className="info-item-value">{fullName}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Username */}
            <div className="info-item liquid-hover" onClick={() => openEditModal('username', 'Username', profile?.username || '')}>
              <div className="info-item-content">
                <span className="info-item-label">Username</span>
                <span className="info-item-value">{profile?.username || 'Not set'}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Location */}
            <div className="info-item liquid-hover" onClick={() => openEditModal('location', 'Location', profile?.location || '')}>
              <div className="info-item-content">
                <span className="info-item-label">Location</span>
                <span className="info-item-value">{profile?.location || 'Not set'}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
            {/* Email */}
            <div className="info-item liquid-hover" onClick={() => openEditModal('email', 'Email', localEmail)}>
              <div className="info-item-content">
                <span className="info-item-label">Email</span>
                <span className="info-item-value">{localEmail}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>

            {/* DOB */}
            <div className="info-item liquid-hover" onClick={() => openEditModal('dob', 'Date of Birth', localDob)}>
              <div className="info-item-content">
                <span className="info-item-label">Date of Birth</span>
                <span className="info-item-value">{localDob}</span>
              </div>
              <span className="material-symbols-outlined info-item-icon">edit</span>
            </div>
          </div>
        </section>

        {/* 3. Account Security */}
        <section className="account-section">
          <h3 className="account-section-title">Security</h3>
          <div className="glass-panel info-list-container">

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
      {activeLinkPlatform && activeLinkPlatform !== 'Telegram' && (
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

      {/* Telegram Link Modal */}
      {activeLinkPlatform === 'Telegram' && (
        <div className="link-platform-modal-overlay" onClick={closeLinkModal}>
          <div className="link-platform-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-header">
              <h3>Link Telegram</h3>
              <button className="link-modal-close" onClick={closeLinkModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="link-modal-body">
              <ConnectTelegram />
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editField && (
        <div className="link-platform-modal-overlay" onClick={() => setEditField(null)}>
          <div className="link-platform-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-header">
              <h3>Edit {editField.label}</h3>
              <button className="link-modal-close" onClick={() => setEditField(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="link-modal-body">
              <label>New {editField.label}</label>
              <input 
                type={editField.key === 'email' ? 'email' : 'text'}
                value={editField.value}
                onChange={(e) => setEditField({ ...editField, value: e.target.value })}
                className="link-url-input"
              />
            </div>
            <div className="link-modal-footer">
              <button className="link-btn-cancel" onClick={() => setEditField(null)}>Cancel</button>
              <button className="link-btn-save" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AccountCentrePage;
