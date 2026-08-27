// ═══════════════════════════════════════════════════════════
// GINGER — Profile Dashboard Page (New UI)
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { useUgcStore } from '../../../store/ugcStore';
import { useProfileStore } from '../../../store/profileStore';
import ProfileFeedViewer from '../components/ProfileFeedViewer';
import Input, { Textarea } from '../../../components/ui/Input';
import ImageUpload from '../../../components/ui/ImageUpload';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import SettingsModal from '../components/SettingsModal';
import VerifiedChannelsModal from '../components/VerifiedChannelsModal';
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

  const [isFeedViewerOpen, setIsFeedViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [feedStartIndex, setFeedStartIndex] = useState(0);
  const [returnToChat, setReturnToChat] = useState<any>(false);

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
  const [postType, setPostType] = useState<'media_kit' | 'portfolio' | 'blog'>('portfolio');
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

  // Handle openPostId from state
  useEffect(() => {
    const state = location.state as any;
    if (state?.openPostId && profile && !isLoading) {
      // Find the post in all possible collections
      const combinedItems = [
        ...achievements.filter(ach => ach.icon_url).map(ach => ({
          id: ach.id, title: ach.title, description: ach.description, image_url: ach.icon_url!, created_at: (ach as any).created_at
        })),
        ...(mediaKitItems || []).filter(mk => mk.image_url).map(mk => ({
          id: mk.id, title: mk.title, description: mk.description, image_url: mk.image_url!, created_at: mk.created_at
        }))
      ];
      
      let index = combinedItems.findIndex(p => p.id === state.openPostId);
      if (index !== -1) {
        setActiveTab(0);
        setFeedPosts(combinedItems);
        setFeedStartIndex(index);
        setIsFeedViewerOpen(true);
        if (state.returnToChat) setReturnToChat(state.returnToChat);
        // Clear state to avoid reopening on normal navigations
        window.history.replaceState({}, document.title);
        return;
      }
      
      const validPosts = posts.filter(post => post.image_url);
      index = validPosts.findIndex(p => p.id === state.openPostId);
      if (index !== -1) {
        setActiveTab(1);
        setFeedPosts(validPosts);
        setFeedStartIndex(index);
        setIsFeedViewerOpen(true);
        if (state.returnToChat) setReturnToChat(state.returnToChat);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, profile, isLoading, achievements, mediaKitItems, posts]);

  const isBlockedByMe = profile ? blockedUserIds.includes(profile.id) : false;

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    if (index === 2) {
      setShowAddForm(true);
    } else {
      setShowAddForm(false);
    }
  };

  const handleSave = async () => {
    if (!title) return;
    try {
      if (postType === 'media_kit') {
        // Save Media Kit Item
        await createMediaKitItem({
          title,
          description: desc,
          image_url: imageUrl,
        });
        toast.success("Media Kit item saved!");
      } else if (postType === 'blog') {
        // Save as Post
        await createPost({
          title,
          content: desc,
          image_url: imageUrl,
        });
        toast.success("Blog post saved!");
      } else if (postType === 'portfolio') {
        // Save as Achievement
        await createAchievement({
          title,
          description: desc,
          icon_url: imageUrl,
        });
        toast.success("Portfolio item saved!");
      }
      setShowAddForm(false);
      setTitle('');
      setDesc('');
      setImageUrl('');
    } catch (err) {
      console.error('Failed to save item', err);
    }
  };

  // Removed tabSliderRef initialization

  if (location.state?.openPostId && !isFeedViewerOpen) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
         <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ff5722', opacity: 0.8, animation: 'pulse 1.5s infinite' }}>blur_on</span>
         <p style={{ color: '#fff', marginTop: '16px' }}>Opening post...</p>
      </div>
    );
  }

  if (isLoading && (!profile || profile.id !== targetUserId)) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ff5722', opacity: 0.8, animation: 'pulse 1.5s infinite' }}>blur_on</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}>person_off</span>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Profile Unavailable</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>This profile may have been deleted, or you don't have permission to view it.</p>
        <button 
          onClick={() => navigate(-1)} 
          style={{ marginTop: '24px', padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          Go Back
        </button>
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

  const getHighestAudience = () => {
    let maxCount = profile.follower_count || 0;
    let label = 'Followers';

    if (socialLinks && socialLinks.length > 0) {
      socialLinks.forEach(link => {
        if (link.followers && link.followers > maxCount) {
          maxCount = link.followers;
          if (link.platform.toLowerCase() === 'youtube') label = 'Subscribers';
          else if (link.platform.toLowerCase() === 'instagram') label = 'Followers';
          else if (link.platform.toLowerCase() === 'tiktok') label = 'Followers';
          else label = 'Followers';
        }
      });
    }

    if (verifiedChannels && verifiedChannels.length > 0) {
      verifiedChannels.forEach(channel => {
        if (channel.member_count && channel.member_count > maxCount) {
          maxCount = channel.member_count;
          label = 'Members';
        }
      });
    }

    return { count: maxCount, label };
  };

  const audienceInfo = getHighestAudience();

  return (
    <>
      <TransitionLoader isActive={isEntering} />
      {selectedImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Expanded view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
        </div>
      )}
      <div className="profile-page-wrapper">
        {/* FeedViewer Modal */}
      <ProfileFeedViewer 
        isOpen={isFeedViewerOpen} 
        onClose={() => {
          if (returnToChat) {
            setReturnToChat(false);
            if (typeof returnToChat === 'object' && (returnToChat as any).id) {
              navigate('/inbox', { state: { restoreChat: returnToChat } });
            } else {
              navigate(-1);
            }
          } else {
            setIsFeedViewerOpen(false);
          }
        }} 
        posts={feedPosts}
        initialPostIndex={feedStartIndex}
        profile={{
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: actualAvatarUrl,
          username: profile.username || undefined,
          location: profile.location || undefined
        }}
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
              <span><strong style={{ color: '#fff' }}>{formatCount(audienceInfo.count)}</strong> {audienceInfo.label}</span>
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
            <button onClick={() => handleTabClick(0)} className={`tab-btn ${activeTab === 0 ? 'active' : 'inactive'}`}>
              <span className="material-symbols-outlined tab-icon">grid_on</span>
            </button>
            <button onClick={() => handleTabClick(1)} className={`tab-btn ${activeTab === 1 ? 'active' : 'inactive'}`}>
              <span className="material-symbols-outlined tab-icon">article</span>
            </button>
            {!isPublicView && (
              <button onClick={() => handleTabClick(2)} className={`tab-btn ${activeTab === 2 ? 'active' : 'inactive'}`}>
                <span className="material-symbols-outlined tab-icon">add_box</span>
              </button>
            )}
          </div>

          {/* Tab Content area */}
          <div>
            {/* Add Form Overlay / Section */}
            {showAddForm && activeTab === 2 && (
              <Card variant="glass" padding="lg" className="mb-6 unified-add-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h6 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Post</h6>
                  <button onClick={() => handleTabClick(0)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Post Type</label>
                    <select 
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as any)}
                      style={{ 
                        width: '100%', padding: '12px', borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'var(--text-primary)', outline: 'none'
                      }}
                    >
                      <option value="portfolio" style={{ background: '#121212' }}>Portfolio & Achievement</option>
                      <option value="blog" style={{ background: '#121212' }}>Blog Post</option>
                      <option value="media_kit" style={{ background: '#121212' }}>Media Kit Item</option>
                    </select>
                  </div>

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
                    Share Post
                  </Button>
                </div>
              </Card>
            )}

            {/* Grid Content */}
            {!showAddForm && activeTab !== 2 && (
              <div className="profile-grid-container">
                {activeTab === 0 && (
                  <>
                    {/* Render Achievements/Portfolio */}
                    {(() => {
                      // Combine achievements and media kits for the feed
                      const combinedItems = [
                        ...achievements.filter(ach => ach.icon_url).map(ach => ({
                          id: ach.id,
                          title: ach.title,
                          description: ach.description,
                          image_url: ach.icon_url!,
                          created_at: (ach as any).created_at,
                          type: 'achievement' as const
                        })),
                        ...(mediaKitItems || []).filter(mk => mk.image_url).map(mk => ({
                          id: mk.id,
                          title: mk.title,
                          description: mk.description,
                          image_url: mk.image_url!,
                          created_at: mk.created_at,
                          type: 'media_kit' as const
                        }))
                      ];

                      if (combinedItems.length === 0) {
                        return (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                            No portfolio images yet.
                          </div>
                        );
                      }

                      return combinedItems.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="profile-grid-item"
                          onClick={() => {
                            setFeedPosts(combinedItems);
                            setFeedStartIndex(index);
                            setIsFeedViewerOpen(true);
                          }}
                        >
                          <img src={item.image_url} alt={item.title} />
                        </div>
                      ));
                    })()}
                  </>
                )}

                {activeTab === 1 && (
                  <>
                    {(() => {
                      const validPosts = posts.filter(post => post.image_url).map(post => ({ ...post, type: 'post' as const }));
                      if (validPosts.length === 0) {
                        return (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                            No blog post images yet.
                          </div>
                        );
                      }

                      return validPosts.map((post, index) => (
                        <div 
                          key={post.id} 
                          className="profile-grid-item"
                          onClick={() => {
                            setFeedPosts(validPosts);
                            setFeedStartIndex(index);
                            setIsFeedViewerOpen(true);
                          }}
                        >
                          <img src={post.image_url!} alt={post.title} />
                        </div>
                      ));
                    })()}
                  </>
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

      {/* Telegram Channels Modal */}
      {showTelegramChannels && (
        <VerifiedChannelsModal 
          isOpen={showTelegramChannels}
          onClose={() => setShowTelegramChannels(false)}
          telegramUsername={profile?.telegram_username}
          verifiedChannels={verifiedChannels || []}
        />
      )}

    </div>
    </>
  );
};

export default ProfilePage;
