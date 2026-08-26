// ═══════════════════════════════════════════════════════════
// GINGER — Profile Dashboard Page (New UI)
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { useUgcStore } from '../../../store/ugcStore';
import { useProfileStore } from '../../../store/profileStore';
import ImageViewer from '../../../components/ui/ImageViewer';
import Input, { Textarea } from '../../../components/ui/Input';
import ImageUpload from '../../../components/ui/ImageUpload';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import SettingsModal from '../components/SettingsModal';
import ChatModal from '../../../components/ui/ChatModal';
import TransitionLoader from '../../../components/ui/TransitionLoader';
import youtubeIcon from '../../../assets/youtube.png';
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
import brandBg from '../../../assets/brand.jpg';
import businessBg from '../../../assets/bussiness.jpg';
import clothingBg from '../../../assets/clothing.jpg';
import entrepreneurBg from '../../../assets/Entrepreneur.jpg';
import foodieBg from '../../../assets/foodie.png';
import influencerBg from '../../../assets/Influencer.jpg';
import gamingBg from '../../../assets/gaming.jpg';
import travelBg from '../../../assets/travel.jpg';
import { formatCount } from '../../../utils/formatters';
import './ProfilePage.css';

export const getCategoryBanner = (category?: string | null) => {
  switch (category) {
    case 'Brand': return brandBg;
    case 'Business': return businessBg;
    case 'Clothing': return clothingBg;
    case 'Entrepreneur': return entrepreneurBg;
    case 'Foodie': return foodieBg;
    case 'Influencer': return influencerBg;
    case 'Gaming': return gamingBg;
    case 'Travel': return travelBg;
    default: return "https://lh3.googleusercontent.com/aida-public/AB6AXuAwosNMbFqAsdhEk59Za1nbASUJr88irtJHIJoApwXFXI2habJyNQRj7DjNJChImWA26tsm9xH5Jz1_ttX1BOSBQPMxrcwYajTFB96saVbnc8UddW5CTits1rrJffJogQjUU_kmc4GQgBCBKvFtjrpBXN7o0kh5Ob8oj1W5d6RNxLSoGgF33c2oQ9MneVPyQuvktuSBG1KbEUZFT_GnILLNoa5SVvgZ2qooecdc_vOSFtu2Xgmzuvai";
  }
};

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  
  const targetUserId = id || user?.id;
  const isPublicView = id && id !== user?.id;
  
  const { 
    profile, 
    stats, 
    posts,
    achievements,
    socialLinks,
    isLoading, 
    fetchProfileData,
    createPost,
    createAchievement,
    createMediaKitItem,
    messages,
    mediaKitItems,
    verifiedChannels
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState(1);
  const tabSliderRef = useRef<HTMLDivElement>(null);

  // Fullscreen Viewer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);

  const { 
    blockedUserIds, 
    fetchBlockedUsers, 
    blockUser, 
    unblockUser, 
    checkIfBlockedByThem 
  } = useUgcStore();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showTelegramChannels, setShowTelegramChannels] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [isEntering, setIsEntering] = useState((location.state as any)?.fromTransition || false);

  useEffect(() => {
    if (isEntering) {
      setTimeout(() => setIsEntering(false), 400);
    }
  }, [isEntering]);

  useEffect(() => {
    if (location.state && (location.state as any).openSettings) {
      setShowSettings(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData(targetUserId);
    }
  }, [targetUserId, fetchProfileData]);

  useEffect(() => {
    if (user && isPublicView && targetUserId) {
      fetchBlockedUsers();
      checkIfBlockedByThem(targetUserId).then(setIsBlockedByThem);
    }
  }, [user, isPublicView, targetUserId, fetchBlockedUsers, checkIfBlockedByThem]);

  const isBlockedByMe = profile ? blockedUserIds.includes(profile.id) : false;

  const handleTabClick = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(index);
    setShowAddForm(false); // Close form when switching tabs
    if (tabSliderRef.current) {
      const btn = e.currentTarget;
      const container = btn.parentElement;
      if (container) {
        const width = btn.offsetWidth;
        const left = btn.offsetLeft;
        tabSliderRef.current.style.width = `${width}px`;
        tabSliderRef.current.style.transform = `translateX(${left}px)`;
      }
    }
  };

  const handleSave = async () => {
    if (!title) return;
    try {
      if (activeTab === 0) {
        // Save Media Kit Item
        await createMediaKitItem({
          title,
          description: desc,
          image_url: imageUrl,
        });
        toast.success("Media Kit item saved!");
      } else if (activeTab === 1) {
        // Save as Post
        await createPost({
          title,
          content: desc,
          image_url: imageUrl,
        });
      } else if (activeTab === 2) {
        // Save as Achievement
        await createAchievement({
          title,
          description: desc,
          icon_url: imageUrl,
        });
      }
      setShowAddForm(false);
      setTitle('');
      setDesc('');
      setImageUrl('');
    } catch (err) {
      console.error('Failed to save item', err);
    }
  };

  // Set initial slider position on mount
  useEffect(() => {
    if (tabSliderRef.current && tabSliderRef.current.parentElement) {
      // 2nd button is index 1 (Portfolio & Achievements) which matches initial state 1
      const btns = tabSliderRef.current.parentElement.querySelectorAll('.tab-btn');
      if (btns.length > 1) {
        const targetBtn = btns[1] as HTMLElement;
        const container = targetBtn.parentElement;
        if (container) {
          const width = targetBtn.offsetWidth;
          const left = targetBtn.offsetLeft;
          tabSliderRef.current.style.width = `${width}px`;
          tabSliderRef.current.style.transform = `translateX(${left}px)`;
        }
      }
    }
  }, []);

  if (!profile || (isLoading && profile.id !== targetUserId)) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading Profile...</p>
      </div>
    );
  }

  const actualBannerUrl = profile?.banner_url || getCategoryBanner(profile?.category);
  const actualAvatarUrl = profile.avatar_url || 'https://via.placeholder.com/150';

  const bannerStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("${actualBannerUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  const isLinked = (platformName: string) => {
    return socialLinks.some(l => l.platform.toLowerCase() === platformName.toLowerCase());
  };

  const getPlatformUrl = (platformName: string) => {
    return socialLinks.find(l => l.platform.toLowerCase() === platformName.toLowerCase())?.url;
  };

  const renderPlatformIcon = (name: string, iconSrc: string, customClass: string = '') => {
    const url = getPlatformUrl(name);
    
    // If not linked and it's public view, don't show it at all
    if (!url && isPublicView) return null;

    const content = (
      <img src={iconSrc} alt={name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
    );

    if (url) {
      return (
        <a 
          key={name}
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`social-stat-item ${customClass}`} 
          style={{ cursor: 'pointer', overflow: 'hidden' }}
        >
          {content}
        </a>
      );
    }

    // Not linked, and it's the owner viewing
    return (
      <div 
        key={name}
        className={`social-stat-item ${customClass}`} 
        style={{ overflow: 'hidden', opacity: 0.4, cursor: 'pointer' }}
        onClick={() => navigate('/profile/account')}
        title="Link account"
      >
        {content}
      </div>
    );
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

  const filteredMessages = messages.filter(m => 
    (m.sender?.full_name || '').toLowerCase().includes(messageSearch.toLowerCase()) || 
    m.content.toLowerCase().includes(messageSearch.toLowerCase())
  );

  return (
    <>
      <TransitionLoader isActive={isEntering} />
      <div className="profile-page-wrapper">
        {/* ImageViewer Modal */}
      <ImageViewer 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage || ''} 
        onClose={() => setSelectedImage(null)} 
      />

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
      {/* Chat Modal */}
      {isPublicView && profile && (
        <ChatModal 
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          recipientId={profile.id}
          recipientName={profile.full_name}
          recipientAvatar={actualAvatarUrl}
        />
      )}

      {/* Top App Bar */}
      <header className="profile-top-bar">
        <div className="profile-top-brand">
          {isPublicView ? (
            <button className="top-action-btn" onClick={() => navigate(-1)} style={{ marginRight: '8px', background: 'transparent' }}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              blur_on
            </span>
          )}
          <h1 className="profile-brand-name">{isPublicView ? profile.full_name : 'Ginger'}</h1>
        </div>
        {!isPublicView && (
          <div className="profile-top-actions">
            <button className="top-action-btn" onClick={() => navigate('/inbox')}>
              <span className="material-symbols-outlined">mail</span>
            </button>
            <button className="top-action-btn" onClick={() => setShowNotifications(true)}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="top-action-btn" onClick={() => navigate('/profile/edit')}>
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="top-action-btn" onClick={() => setShowSettings(true)}>
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        )}
        {isPublicView && profile && (
          <div className="profile-top-actions">
            {isBlockedByMe ? (
              <button className="top-action-btn" aria-label="Unblock User" onClick={async (e) => { 
                e.stopPropagation(); 
                const c = await useGlobalModalStore.getState().showConfirm('Are you sure you want to unblock this user?', 'Unblock User'); 
                if (c) unblockUser(profile.id); 
              }}>
                <span className="material-symbols-outlined" style={{ color: '#4caf50' }}>how_to_reg</span>
              </button>
            ) : (
              <button className="top-action-btn" aria-label="Block User" onClick={async (e) => { 
                e.stopPropagation(); 
                const c = await useGlobalModalStore.getState().showConfirm('Are you sure you want to block this user? They will not be able to interact with you.', 'Block User'); 
                if (c) blockUser(profile.id); 
              }}>
                <span className="material-symbols-outlined" style={{ color: '#ff4444' }}>block</span>
              </button>
            )}
            <button className="top-action-btn" aria-label="Report User" onClick={async (e) => { 
              e.stopPropagation(); 
              const c = await useGlobalModalStore.getState().showConfirm('Are you sure you want to report this profile to moderation?', 'Report Profile'); 
              if (c) useUgcStore.getState().reportItem(profile.id, 'profile', 'Inappropriate profile content'); 
            }}>
              <span className="material-symbols-outlined" style={{ color: '#ffb74d' }}>report</span>
            </button>
          </div>
        )}
      </header>

      <main className="profile-main">
        {/* Profile Header Card */}
        <section 
          className="liquid-card profile-header-card" 
          onClick={() => setSelectedImage(actualBannerUrl)}
          style={{ cursor: 'pointer', ...bannerStyle }}
        >
          <img 
            src={actualAvatarUrl} 
            alt={profile.full_name} 
            className="profile-avatar"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(actualAvatarUrl); }}
            style={{ cursor: 'zoom-in' }}
          />
          <h2 className="profile-name">{profile.full_name}</h2>
          {profile.username && (
            <p className="profile-username" style={{ color: '#8fa696', fontSize: '14px', marginTop: '-4px', marginBottom: '8px', textAlign: 'center' }}>
              {profile.username.startsWith('@') ? profile.username : `@${profile.username}`}
            </p>
          )}

          <div className="profile-meta-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#c4c7c8', fontSize: '14px', marginTop: '4px', marginBottom: '12px' }}>
            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                <span>{profile.location}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
              <span><strong style={{ color: '#fff' }}>{formatCount(profile.follower_count || 0)}</strong> Followers</span>
            </div>
          </div>
          <p className="profile-bio">
            {profile.bio || 'Tech professional & passionate world traveler. Exploring the intersection of innovation and global culture.'}
          </p>
          {isPublicView && (
            <div className="profile-public-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button 
                className="fancy-message-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isBlockedByMe) {
                    toast.error("You have blocked this user. Unblock them to send a message.");
                    return;
                  }
                  if (isBlockedByThem) {
                    toast.error("You cannot send messages to this user.");
                    return;
                  }
                  setIsChatModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat_bubble</span>
                Message
              </button>
            </div>
          )}
        </section>

        {/* Social Stats Bar */}
        <section className="social-stats-bar">
          {renderPlatformIcon('Instagram', instagramIcon, 'instagram')}
          {renderPlatformIcon('TikTok', tiktokIcon, 'tiktok')}
          {renderPlatformIcon('YouTube', youtubeIcon, 'youtube')}
          
          {profile?.telegram_id && (
            <div 
              key="Telegram"
              className="social-stat-item telegram" 
              style={{ cursor: 'pointer', overflow: 'hidden' }}
              onClick={() => setShowTelegramChannels(true)}
              title="Verified Channels"
            >
              <img src={telegramIcon} alt="Telegram" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            </div>
          )}

          {OTHER_PLATFORMS.filter(p => isLinked(p.name)).map(platform => 
            renderPlatformIcon(platform.name, platform.icon)
          )}
          {!isPublicView && (
            <button className="social-add-btn" aria-label="Add Platform" onClick={() => navigate('/profile/account')}>
              <span className="material-symbols-outlined">add</span>
            </button>
          )}
        </section>

        {/* Stats Grid */}
        <section className="profile-stats-grid">
          <div className="liquid-card stat-box">
            <span className="stat-value text-accent">{stats.activeCampaigns}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="liquid-card stat-box">
            <span className="stat-value text-primary">{stats.completedCampaigns}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="liquid-card stat-box">
            <span className="stat-value text-primary">{formatCount(stats.totalViews)}</span>
            <span className="stat-label">Total Views</span>
          </div>
          {profile?.telegram_id && (
            <div className="liquid-card stat-box">
              <span className="stat-value text-primary">{formatCount(stats.telegramMembers)}</span>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={telegramIcon} alt="Telegram" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
                Members
              </span>
            </div>
          )}
        </section>

        {/* Content Tabs */}
        <section>
          <div className="tabs-container">
            <div id="tab-slider" ref={tabSliderRef} className="tab-slider"></div>
            <button onClick={(e) => handleTabClick(0, e)} className={`tab-btn ${activeTab === 0 ? 'active' : 'inactive'}`}>
              Media Kit
            </button>
            <button onClick={(e) => handleTabClick(1, e)} className={`tab-btn ${activeTab === 1 ? 'active' : 'inactive'}`}>
              Portfolio & Achievements
            </button>
            <button onClick={(e) => handleTabClick(2, e)} className={`tab-btn ${activeTab === 2 ? 'active' : 'inactive'}`}>
              Blog Posts
            </button>
          </div>

          {/* Tab Content area */}
          <div>
            <div className="section-header">
              <h3 className="section-title">
                {activeTab === 0 && 'Media Kit'}
                {activeTab === 1 && 'Past Work'}
                {activeTab === 2 && 'Blog Posts'}
              </h3>
              {!isPublicView && (
                <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {showAddForm ? 'close' : 'add'}
                  </span> 
                  {showAddForm ? 'Cancel' : 'Add'}
                </button>
              )}
            </div>

            {/* Add Form Overlay / Section */}
            {showAddForm && (
              <Card variant="glass" padding="lg" className="mb-6">
                <h6 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  Add New {activeTab === 0 ? 'Media Kit Item' : activeTab === 1 ? 'Project' : 'Blog Post'}
                </h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Input 
                    label="Title" 
                    placeholder="Enter title..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Textarea 
                    label="Description" 
                    placeholder="Write a description..." 
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                  <ImageUpload 
                    label="Upload Image (Cloudinary)" 
                    onUploadSuccess={(url) => setImageUrl(url)}
                    onUploadError={(err) => console.error(err)}
                  />
                  <Button fullWidth onClick={handleSave}>
                    Save {activeTab === 0 ? 'Media Kit Item' : activeTab === 1 ? 'Project' : 'Blog Post'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Horizontal Scroll Cards */}
            {!showAddForm && (
              <div className="horizontal-scroll">
                {activeTab === 1 && posts.length > 0 ? (
                  posts.map(post => (
                    <div 
                      key={post.id} 
                      className="liquid-card scroll-card"
                      onClick={() => post.image_url && setSelectedImage(post.image_url)}
                      style={{ cursor: post.image_url ? 'zoom-in' : 'default' }}
                    >
                      <div className="scroll-card-bg"></div>
                      {post.image_url ? (
                        <img src={post.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 5, position: 'relative' }} />
                      ) : (
                        <span className="material-symbols-outlined scroll-card-icon">image</span>
                      )}
                    </div>
                  ))
                ) : activeTab === 2 && achievements.length > 0 ? (
                   achievements.map(ach => (
                    <div 
                      key={ach.id} 
                      className="liquid-card scroll-card"
                      onClick={() => ach.icon_url && setSelectedImage(ach.icon_url)}
                      style={{ cursor: ach.icon_url ? 'zoom-in' : 'default' }}
                    >
                      <div className="scroll-card-bg"></div>
                      {ach.icon_url ? (
                        <img src={ach.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 5, position: 'relative' }} />
                      ) : (
                        <span className="material-symbols-outlined scroll-card-icon">award_star</span>
                      )}
                    </div>
                  ))
                ) : activeTab === 0 && mediaKitItems && mediaKitItems.length > 0 ? (
                  mediaKitItems.map(item => (
                    <div 
                      key={item.id} 
                      className="liquid-card scroll-card"
                      onClick={() => item.image_url && setSelectedImage(item.image_url)}
                      style={{ cursor: item.image_url ? 'zoom-in' : 'default' }}
                    >
                      <div className="scroll-card-bg"></div>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 5, position: 'relative' }} />
                      ) : (
                        <span className="material-symbols-outlined scroll-card-icon">image</span>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="liquid-card scroll-card">
                      <div className="scroll-card-bg"></div>
                      <span className="material-symbols-outlined scroll-card-icon">image</span>
                    </div>
                    <div className="liquid-card scroll-card">
                      <div className="scroll-card-bg"></div>
                      <span className="material-symbols-outlined scroll-card-icon">image</span>
                    </div>
                  </>
                )}
                
                {!isPublicView && (
                  <div className="liquid-card scroll-card add-new-card" onClick={() => setShowAddForm(true)}>
                    <div className="add-new-content">
                      <span className="material-symbols-outlined add-new-icon">add_circle</span>
                      <span className="add-new-text">
                        {activeTab === 0 ? 'New Media Kit Item' : activeTab === 1 ? 'New Project' : 'New Blog Post'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="drawer-overlay" onClick={() => setShowNotifications(false)}>
          <div className="drawer-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Notifications</h3>
              <button className="drawer-close" onClick={() => setShowNotifications(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="drawer-body">
              <div className="notification-item unread">
                <div className="notification-avatar">
                  <img src="https://i.pravatar.cc/150?img=1" alt="User" />
                </div>
                <div className="notification-text">
                  <strong>Sarah Jenkins</strong> liked your new Media Kit item.
                  <div className="notification-time">2m ago</div>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-avatar">
                  <img src="https://i.pravatar.cc/150?img=2" alt="User" />
                </div>
                <div className="notification-text">
                  <strong>TechCorp</strong> sent you a collaboration request!
                  <div className="notification-time">1h ago</div>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon-wrap bg-accent">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <div className="notification-text">
                  Your campaign "Summer Vibes" has officially ended.
                  <div className="notification-time">3h ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages Drawer */}
      {showMessages && (
        <div className="drawer-overlay" onClick={() => setShowMessages(false)}>
          <div className="drawer-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Messages</h3>
              <button className="drawer-close" onClick={() => setShowMessages(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="drawer-body">
              <div className="drawer-search-container">
                <span className="material-symbols-outlined drawer-search-icon">search</span>
                <input 
                  type="text" 
                  className="drawer-search-input" 
                  placeholder="Search messages..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                />
              </div>

              <div className="messages-list">
                {filteredMessages.map(msg => (
                  <div key={msg.id} className={`message-item liquid-hover ${msg.read ? '' : 'unread'}`}>
                    <div className="message-avatar">
                      <img src={msg.sender?.avatar_url || 'https://via.placeholder.com/150'} alt="Sender" />
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-name">{msg.sender?.full_name || 'Unknown'}</span>
                        <span className="message-time">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="message-preview">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {filteredMessages.length === 0 && (
                  <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '2rem', fontSize: '14px' }}>
                    No messages found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Channels Drawer */}
      {showTelegramChannels && (
        <div className="drawer-overlay" onClick={() => setShowTelegramChannels(false)}>
          <div className="drawer-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Verified Channels</h3>
              <button className="drawer-close" onClick={() => setShowTelegramChannels(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="drawer-body">
              {profile?.telegram_username ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#4ade80' }}>person</span>
                      <span style={{ fontWeight: '500' }}>@{profile.telegram_username}</span>
                    </div>
                    <a 
                      href={`https://t.me/${profile.telegram_username}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ background: '#0088cc', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}
                    >
                      Visit
                    </a>
                  </div>

                  {verifiedChannels && verifiedChannels.length > 0 && verifiedChannels.map(ch => (
                    <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#4ade80' }}>verified</span>
                        <span style={{ fontWeight: '500' }}>{ch.channel_username}</span>
                      </div>
                      <a 
                        href={`https://t.me/${ch.channel_username.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ background: '#0088cc', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}
                      >
                        Visit
                      </a>
                    </div>
                  ))}
                </div>
              ) : (verifiedChannels && verifiedChannels.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {verifiedChannels.map(ch => (
                    <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#4ade80' }}>verified</span>
                        <span style={{ fontWeight: '500' }}>{ch.channel_username}</span>
                      </div>
                      <a 
                        href={`https://t.me/${ch.channel_username.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ background: '#0088cc', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}
                      >
                        Visit
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '2rem', fontSize: '14px' }}>
                  No channels verified yet.
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

export default ProfilePage;
