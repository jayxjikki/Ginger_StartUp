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
import { useChatStore } from '../../../store/chatStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import ProfileFeedViewer from '../components/ProfileFeedViewer';
import ImageUpload from '../../../components/ui/ImageUpload';
import { uploadToCloudinary, getPdfViewerUrl, triggerFileDownload } from '../../../lib/cloudinary';
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
    deleteItem,
    messages,
    mediaKitItems,
    verifiedChannels
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState(1);

  const [isFeedViewerOpen, setIsFeedViewerOpen] = useState(false);
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
  const [mediaKitFileType, setMediaKitFileType] = useState<'image' | 'pdf' | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');

  const { inboxChats } = useChatStore();
  const unreadChatCount = inboxChats.filter(chat => chat.unread).length;

  const { notifications, unreadCount: unreadNotifCount, markAllAsRead, markAsRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id);
    }
  }, [user?.id, fetchNotifications]);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showTelegramChannels, setShowTelegramChannels] = useState(false);
  const [showMediaKitModal, setShowMediaKitModal] = useState(false);
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
      // Find the post in achievements or regular posts
      const achievementItems = achievements.filter(ach => ach.icon_url).map(ach => ({
        id: ach.id, title: ach.title, description: ach.description, image_url: ach.icon_url!, created_at: (ach as any).created_at, type: 'achievement' as const
      }));
      
      let index = achievementItems.findIndex(p => p.id === state.openPostId);
      if (index !== -1) {
        setActiveTab(0);
        setFeedPosts(achievementItems);
        setFeedStartIndex(index);
        setIsFeedViewerOpen(true);
        if (state.returnToChat) setReturnToChat(state.returnToChat);
        // Clear state to avoid reopening on normal navigations
        window.history.replaceState({}, document.title);
        return;
      }
      
      const validPosts = posts.filter(post => post.image_url).map(p => ({ ...p, type: 'post' as const }));
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
    // For media_kit, only require an image URL; title is auto-set
    if (postType !== 'media_kit' && !title) return;
    if (postType === 'media_kit' && !imageUrl) { 
      toast.error('Please upload an image or PDF for your media kit.');
      return;
    }
    try {
      if (postType === 'media_kit') {
        // If a media kit already exists, confirm replacement
        if (mediaKitItems && mediaKitItems.length > 0) {
          const { showConfirm } = useGlobalModalStore.getState();
          const confirmed = await showConfirm(
            "Your previous media kit will get replaced with this new one. Do you want to continue?",
            "Replace Media Kit"
          );
          if (!confirmed) return;

          for (const oldItem of mediaKitItems) {
            try {
              await deleteItem(oldItem.id, 'media_kit');
            } catch (err) {
              console.error("Failed to delete previous media kit item", err);
            }
          }
        }

        // Save Media Kit Item — auto-generate title if not set
        await createMediaKitItem({
          title: title || (mediaKitFileType === 'pdf' ? 'Media Kit Document' : 'Media Kit Image'),
          description: '',
          image_url: imageUrl,
        });
        toast.success("Media Kit saved!");
        setMediaKitFileType(null);
        setShowAddForm(false);
        setTitle('');
        setDesc('');
        setImageUrl('');
        handleTabClick(0);
        return;
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
            <button className="top-action-btn" style={{ position: 'relative' }} onClick={() => navigate('/inbox')} title="Messages">
              <span className="material-symbols-outlined">mail</span>
              {unreadChatCount > 0 && (
                <span 
                  className="chat-unread-green-dot-glow"
                  style={{ 
                    position: 'absolute', 
                    top: '7px', 
                    right: '7px', 
                    width: '9px', 
                    height: '9px', 
                    background: '#34d399', 
                    borderRadius: '50%', 
                    border: '2px solid #0C0C0C',
                    boxShadow: '0 0 8px #34d399'
                  }} 
                />
              )}
            </button>
            <button 
              className={`top-action-btn ${unreadNotifCount > 0 ? 'notif-bell-glowing' : ''}`} 
              style={{ position: 'relative' }} 
              onClick={() => {
                setShowNotifications(true);
                if (user?.id) {
                  markAllAsRead(user.id);
                }
              }}
              title="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotifCount > 0 && (
                <span className="global-chat-badge notif-badge-red-glow">{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
              )}
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
          style={{ ...bannerStyle }}
        >
          <img 
            src={actualAvatarUrl} 
            alt={profile.full_name} 
            className="profile-avatar"
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

          {profile.category && profile.category.trim() !== '' && (
            <div className="profile-pinned-categories" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              {profile.category.split(',').map((s: string) => s.trim()).filter(Boolean).map((cat: string) => (
                <span 
                  key={cat} 
                  className="profile-category-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: 'rgba(247, 147, 30, 0.12)',
                    border: '1px solid rgba(247, 147, 30, 0.4)',
                    color: '#ff9d33',
                    boxShadow: '0 0 10px rgba(247, 147, 30, 0.15)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1", color: '#F7931E' }}>push_pin</span>
                  {cat}
                </span>
              ))}
            </div>
          )}

          {isPublicView && !isBlockedByMe && !isBlockedByThem && (
            <div className="profile-public-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button 
                className="fancy-message-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatModalOpen(true);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat_bubble</span>
                Message
              </button>
            </div>
          )}
        </section>

        {isBlockedByMe ? (
          <section className="liquid-card" style={{ padding: '32px 24px', textAlign: 'center', marginTop: '16px' }}>
             <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: '16px'}}>block</span>
             <h3 style={{margin: '0 0 8px 0', color: 'var(--text-primary)'}}>You blocked {profile.full_name}</h3>
             <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>Unblock them to view their posts, stats, and send messages.</p>
             <button className="fancy-message-btn" style={{ margin: '0 auto' }} onClick={(e) => { 
                e.stopPropagation(); 
                unblockUser(profile.id); 
             }}>Unblock User</button>
          </section>
        ) : isBlockedByThem ? (
          <section className="liquid-card" style={{ padding: '32px 24px', textAlign: 'center', marginTop: '16px' }}>
             <span className="material-symbols-outlined" style={{fontSize: '48px', color: 'var(--text-tertiary)', marginBottom: '16px'}}>lock_person</span>
             <h3 style={{margin: '0 0 8px 0', color: 'var(--text-primary)'}}>Profile Unavailable</h3>
             <p style={{color: 'var(--text-secondary)'}}>You cannot view this profile's details.</p>
          </section>
        ) : (
          <>
        {/* Social Stats Bar with fixed middle + button, right media kit, left scrollable logos */}
        <section className="social-stats-bar-wrapper">
          {/* Left scrollable area for linked platform logos */}
          <div className="social-logos-scroll-area">
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
          </div>

          {/* Fixed center/right actions that do not scroll or move */}
          <div className="social-fixed-actions">
            {!isPublicView && (
              <button className="social-add-btn" aria-label="Add Platform" onClick={() => navigate('/profile/account')}>
                <span className="material-symbols-outlined">add</span>
              </button>
            )}
            <button
              className={`media-kit-btn ${(mediaKitItems && mediaKitItems.length > 0) ? 'active-shine' : 'empty-inactive'}`}
              title={(mediaKitItems && mediaKitItems.length > 0) ? "Download Media Kit" : "Media Kit not uploaded"}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (mediaKitItems && mediaKitItems.length > 0) {
                  setShowMediaKitModal(true);
                }
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
              <span>Media Kit</span>
            </button>
          </div>
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
          {isLinked('YouTube') && (
            <div 
              className="liquid-card stat-box"
              onClick={() => {
                const url = getPlatformUrl('YouTube');
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
              style={{ cursor: getPlatformUrl('YouTube') ? 'pointer' : 'default' }}
              title={getPlatformUrl('YouTube') ? "Open YouTube Channel" : "YouTube Subscribers"}
            >
              <span className="stat-value text-primary">
                {formatCount(socialLinks.find(l => l.platform.toLowerCase() === 'youtube')?.followers || 0)}
              </span>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={youtubeIcon} alt="YouTube" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
                Subs
              </span>
            </div>
          )}
          {(profile?.ig_username || isLinked('Instagram')) && (
            <div 
              className="liquid-card stat-box"
              onClick={() => {
                const igUser = profile?.ig_username || socialLinks.find(l => l.platform.toLowerCase() === 'instagram')?.username;
                const url = getPlatformUrl('Instagram') || (igUser ? `https://www.instagram.com/${igUser.replace('@', '')}` : '');
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
              style={{ cursor: 'pointer' }}
              title={profile?.ig_username ? `Open @${profile.ig_username} on Instagram` : "Instagram Followers"}
            >
              <span className="stat-value text-primary">
                {formatCount(profile?.ig_followers_count || socialLinks.find(l => l.platform.toLowerCase() === 'instagram')?.followers || 0)}
              </span>
              <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src={instagramIcon} alt="Instagram" style={{ width: '12px', height: '12px', objectFit: 'contain' }} />
                Followers
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
              <div className="premium-post-form-container popup-enter">
                <div className="premium-post-header">
                  <h2>Create New Post</h2>
                  <button className="premium-close-btn" onClick={() => handleTabClick(0)} aria-label="Close">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="premium-post-body">
                  <div className="premium-input-group">
                    <label>Post Type</label>
                    <div className="premium-select-wrapper">
                      <select 
                        value={postType}
                        onChange={(e) => { setPostType(e.target.value as any); setMediaKitFileType(null); }}
                        className="premium-select"
                      >
                        <option value="portfolio">Portfolio & Achievement</option>
                        <option value="blog">Blog Post</option>
                        <option value="media_kit">Media Kit Item</option>
                      </select>
                      <span className="material-symbols-outlined select-icon">expand_more</span>
                    </div>
                  </div>

                  {/* Only show Title & Description for non-media-kit types */}
                  {postType !== 'media_kit' && (
                    <>
                      <div className="premium-input-group">
                        <label>Title</label>
                        <input 
                          type="text"
                          className="premium-input"
                          placeholder="Give your post a catchy title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>

                      <div className="premium-input-group">
                        <label>Description</label>
                        <textarea 
                          className="premium-textarea"
                          placeholder="What's this post about?"
                          rows={3}
                          value={desc}
                          onChange={(e) => setDesc(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {postType === 'media_kit' ? (
                    /* Media Kit: accept image OR pdf, single file */
                    <div className="premium-input-group">
                      {mediaKitItems && mediaKitItems.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(249, 200, 70, 0.08)',
                          border: '1px solid rgba(249, 200, 70, 0.25)',
                          color: '#f9c846',
                          fontSize: '12px',
                          marginBottom: '12px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                          <span>Uploading a new media kit will replace your previous media kit.</span>
                        </div>
                      )}
                      <label>Upload File <span style={{fontSize:'12px',color:'var(--text-tertiary)',fontWeight:400}}>· 1 JPG/PNG or 1 PDF · max 10MB</span></label>
                      {!mediaKitFileType ? (
                        <div style={{display:'flex',gap:'10px',marginBottom:'8px'}}>
                          <button
                            type="button"
                            className="media-kit-type-btn"
                            onClick={() => setMediaKitFileType('image')}
                          >
                            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>image</span>
                            Image
                          </button>
                          <button
                            type="button"
                            className="media-kit-type-btn"
                            onClick={() => setMediaKitFileType('pdf')}
                          >
                            <span className="material-symbols-outlined" style={{fontSize:'20px'}}>picture_as_pdf</span>
                            PDF
                          </button>
                        </div>
                      ) : mediaKitFileType === 'image' ? (
                        <ImageUpload
                          label=""
                          className="premium-image-upload"
                          onUploadSuccess={(url: string) => { setImageUrl(url); setTitle('Media Kit Image'); }}
                          onUploadError={(err: Error) => console.error(err)}
                        />
                      ) : (
                        /* PDF upload via uploadToCloudinary */
                        <div 
                          className={`premium-pdf-upload ${isUploadingPdf ? 'uploading' : ''}`}
                          onClick={() => {
                            if (!isUploadingPdf) {
                              document.getElementById('media-kit-pdf-input')?.click();
                            }
                          }}
                        >
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            style={{ display: 'none' }}
                            id="media-kit-pdf-input"
                            disabled={isUploadingPdf}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) { 
                                toast.error('PDF size must be under 10MB'); 
                                return; 
                              }
                              setIsUploadingPdf(true);
                              try {
                                const url = await uploadToCloudinary(file, user?.id);
                                setImageUrl(url);
                                const cleanName = file.name.replace(/\.[^/.]+$/, "");
                                setTitle(cleanName || 'Media Kit Document');
                                setPdfFileName(file.name);
                                toast.success('PDF uploaded successfully!');
                              } catch (err: any) {
                                console.error("PDF upload error:", err);
                                toast.error(err.message || 'Failed to upload PDF');
                              } finally {
                                setIsUploadingPdf(false);
                              }
                            }}
                          />
                          {isUploadingPdf ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <span className="material-symbols-outlined icon-spin" style={{ fontSize: '32px', color: '#f9c846' }}>sync</span>
                              <span style={{ fontSize: '13px', color: '#f9c846', fontWeight: 600 }}>Uploading PDF...</span>
                            </div>
                          ) : imageUrl && pdfFileName ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#4ade80' }}>check_circle</span>
                              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{pdfFileName}</span>
                              <span style={{ fontSize: '11px', color: '#4ade80' }}>Ready to share (click to replace)</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#f9c846' }}>picture_as_pdf</span>
                              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Click to upload PDF</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Max file size: 10MB</span>
                            </div>
                          )}
                        </div>
                      )}
                      {mediaKitFileType && (
                        <button type="button" style={{fontSize:'12px',color:'var(--text-tertiary)',background:'none',border:'none',cursor:'pointer',marginTop:'8px',padding:'0'}} onClick={() => { setMediaKitFileType(null); setImageUrl(''); setTitle(''); setPdfFileName(''); }}>
                          ← Change file type
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="premium-input-group">
                      <ImageUpload 
                        label="Upload Image" 
                        className="premium-image-upload"
                        onUploadSuccess={(url: string) => setImageUrl(url)}
                        onUploadError={(err: Error) => console.error(err)}
                      />
                    </div>
                  )}

                  <button className="premium-submit-btn" onClick={handleSave}>
                    <span className="material-symbols-outlined">send</span>
                    Share Post
                  </button>
                </div>
              </div>
            )}

            {/* Grid Content */}
            {!showAddForm && activeTab !== 2 && (
              <div className="profile-grid-container">
                {activeTab === 0 && (
                  <>
                    {/* Render Achievements/Portfolio */}
                    {(() => {
                      const achievementItems = achievements.filter(ach => ach.icon_url).map(ach => ({
                        id: ach.id,
                        title: ach.title,
                        description: ach.description,
                        image_url: ach.icon_url!,
                        created_at: (ach as any).created_at,
                        type: 'achievement' as const
                      }));

                      if (achievementItems.length === 0) {
                        return (
                          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                            No portfolio images yet.
                          </div>
                        );
                      }

                      return achievementItems.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="profile-grid-item"
                          onClick={() => {
                            setFeedPosts(achievementItems);
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
          </>
        )}
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
              {notifications.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.2 }}>notifications_off</span>
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  const isGingerNotif = notification.type === 'admin' || notification.content.includes('Ginger Notification');
                  const isCustomReward = !isGingerNotif && (notification.content.includes('🎁') || notification.content.includes('Reward Issued'));
                  const isBillNotif = !isGingerNotif && (notification.content.includes('🧾') || notification.content.toLowerCase().includes('bill'));
                  const isVoucherNotif = !isGingerNotif && (notification.content.includes('🎟️') || notification.content.includes('VCH-') || notification.content.toLowerCase().includes('voucher'));
                  const isApprovedNotif = !isGingerNotif && (notification.content.includes('✅') || notification.content.toLowerCase().includes('approved'));
                  const voucherMatch = notification.content.match(/(VCH-[A-Z0-9-]+)/i);
                  const extractedVoucherCode = voucherMatch ? voucherMatch[1].toUpperCase() : '';

                  return (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                      style={
                        isGingerNotif
                          ? { borderLeft: '3px solid #ff4d4d', background: 'rgba(255, 77, 77, 0.08)' }
                          : isCustomReward
                          ? { borderLeft: '3px solid #f59e0b', background: 'rgba(245, 158, 11, 0.06)' }
                          : isBillNotif
                          ? { borderLeft: '3px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }
                          : isVoucherNotif 
                          ? { borderLeft: '3px solid #34d399', background: 'rgba(52, 211, 153, 0.04)' } 
                          : isApprovedNotif
                          ? { borderLeft: '3px solid #10b981', background: 'rgba(16, 185, 129, 0.04)' }
                          : undefined
                      }
                      onClick={() => {
                        if (!notification.is_read) markAsRead(notification.id);
                        setShowNotifications(false);
                        if (notification.entity_id) {
                          navigate(`/campaigns/${notification.entity_id}`);
                        } else if (isVoucherNotif || isCustomReward || isBillNotif) {
                          navigate(`/campaigns/joined`);
                        }
                      }}
                    >
                      {isGingerNotif ? (
                        <div className="notification-avatar" style={{ border: '1px solid rgba(255, 77, 77, 0.4)', borderRadius: '50%', padding: '2px', background: 'rgba(255, 77, 77, 0.15)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src="/images/brand/logo.png" alt="Ginger Notification" style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                        </div>
                      ) : notification.actor && !isVoucherNotif && !isCustomReward && !isBillNotif && !isApprovedNotif ? (
                        <div className="notification-avatar">
                          <img src={notification.actor.avatar_url || 'https://via.placeholder.com/150'} alt={notification.actor.full_name} />
                        </div>
                      ) : (
                        <div 
                          className="notification-icon-wrap" 
                          style={
                            isCustomReward
                              ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
                              : isBillNotif 
                              ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' } 
                              : isVoucherNotif 
                              ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' } 
                              : isApprovedNotif
                              ? { background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }
                              : undefined
                          }
                        >
                          <span className="material-symbols-outlined">
                            {isCustomReward
                              ? 'redeem'
                              : isBillNotif 
                              ? 'receipt_long' 
                              : isVoucherNotif 
                              ? 'confirmation_number' 
                              : isApprovedNotif
                              ? 'verified'
                              : 'campaign'}
                          </span>
                        </div>
                      )}
                      
                      <div className="notification-text" style={{ width: '100%' }}>
                        {isGingerNotif ? (
                          <>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span style={{ background: 'linear-gradient(135deg, #ff4d4d 0%, #f97316 100%)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Official Ginger
                              </span>
                              <strong style={{ color: '#ff6b6b', fontSize: '12px' }}>Ginger Notification</strong>
                            </div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.4 }}>
                              {notification.content.replace(/^📢\s*Ginger Notification:\s*/, '')}
                            </div>
                          </>
                        ) : notification.actor && !notification.content.startsWith('🎁') && !notification.content.startsWith('🧾') && !notification.content.startsWith('🎟️') && !notification.content.startsWith('✅') ? (
                          <><strong>{notification.actor.full_name}</strong> {notification.content}</>
                        ) : (
                          <>{notification.content}</>
                        )}

                        {/* Clean voucher code tag and campaign navigation hint */}
                        {(isVoucherNotif || isCustomReward || isBillNotif) && (
                          <div className="mt-1.5 flex items-center justify-between flex-wrap gap-1">
                            {extractedVoucherCode && (
                              <span 
                                className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded"
                                style={
                                  isCustomReward
                                    ? { color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }
                                    : { color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }
                                }
                              >
                                {isBillNotif ? '🧾' : isCustomReward ? '🎁' : '🎟️'} {extractedVoucherCode}
                              </span>
                            )}
                            {notification.entity_id && (
                              <span className="text-[11px] text-emerald-400 font-medium">
                                View Campaign Page →
                              </span>
                            )}
                          </div>
                        )}

                        <div className="notification-time mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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

      {/* Media Kit Download Modal */}
      {showMediaKitModal && (
        <div className="media-kit-modal-overlay" onClick={() => setShowMediaKitModal(false)}>
          <div
            className="media-kit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="media-kit-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f9c846' }}>auto_awesome</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Media Kit</h3>
              </div>
              <button 
                className="media-kit-close-btn" 
                onClick={() => setShowMediaKitModal(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            
            <p className="media-kit-subtitle">Download {profile?.full_name}'s media kit assets</p>
            
            <div className="media-kit-items-list">
              {(mediaKitItems || []).map((item) => {
                const isPdf = item.image_url?.toLowerCase().endsWith('.pdf') || 
                              item.image_url?.includes('/raw/upload') || 
                              item.title?.toLowerCase().includes('.pdf') ||
                              item.title?.toLowerCase().includes('document');
                const viewerUrl = isPdf ? getPdfViewerUrl(item.image_url) : item.image_url;

                return (
                  <div key={item.id} className="media-kit-download-item">
                    <div className="media-kit-item-info">
                      {isPdf ? (
                        <div className="media-kit-pdf-thumb">
                          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f9c846' }}>picture_as_pdf</span>
                        </div>
                      ) : (
                        item.image_url && (
                          <img src={item.image_url} alt={item.title} className="media-kit-thumb" />
                        )
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="media-kit-item-title">{item.title || (isPdf ? 'Media Kit Document' : 'Media Kit Image')}</div>
                        <div className="media-kit-item-desc">{isPdf ? 'PDF Document' : 'Image File'}</div>
                      </div>
                    </div>
                    <div className="media-kit-download-btns">
                      {/* View Online */}
                      <a
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="media-kit-dl-btn"
                        style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#fff' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                        View
                      </a>

                      {/* Direct Reliable Download */}
                      <button
                        type="button"
                        onClick={() => {
                          const filename = isPdf ? `${item.title || 'media-kit'}.pdf` : `${item.title || 'media-kit'}.jpg`;
                          triggerFileDownload(item.image_url, filename);
                        }}
                        className={`media-kit-dl-btn ${isPdf ? 'pdf' : 'img'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          download
                        </span>
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
              {(!mediaKitItems || mediaKitItems.length === 0) && (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '20px' }}>
                  No media kit items available.
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
