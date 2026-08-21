// ═══════════════════════════════════════════════════════════
// GINGER — Profile Dashboard Page (New UI)
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import ImageViewer from '../../../components/ui/ImageViewer';
import Input, { Textarea } from '../../../components/ui/Input';
import ImageUpload from '../../../components/ui/ImageUpload';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const targetUserId = id || user?.id;
  const isPublicView = id && id !== user?.id;
  
  const { 
    profile, 
    stats, 
    posts,
    achievements,
    isLoading, 
    fetchProfileData,
    createPost,
    createAchievement
  } = useProfileStore();

  const [activeTab, setActiveTab] = useState(1);
  const tabSliderRef = useRef<HTMLDivElement>(null);

  // Fullscreen Viewer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData(targetUserId);
    }
  }, [targetUserId, fetchProfileData]);

  const handleTabClick = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(index);
    setShowAddForm(false); // Close form when switching tabs
    if (tabSliderRef.current) {
      const btn = e.currentTarget;
      const container = btn.parentElement;
      if (container) {
        const width = btn.offsetWidth;
        const left = btn.offsetLeft - container.offsetLeft;
        tabSliderRef.current.style.width = `${width}px`;
        tabSliderRef.current.style.transform = `translateX(${left - 4}px)`;
      }
    }
  };

  const handleSave = async () => {
    if (!title) return;
    try {
      if (activeTab === 1) {
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
          const left = targetBtn.offsetLeft - container.offsetLeft;
          tabSliderRef.current.style.width = `${width}px`;
          tabSliderRef.current.style.transform = `translateX(${left - 4}px)`;
        }
      }
    }
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="profile-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>Loading Profile...</p>
      </div>
    );
  }

  const bannerStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAwosNMbFqAsdhEk59Za1nbASUJr88irtJHIJoApwXFXI2habJyNQRj7DjNJChImWA26tsm9xH5Jz1_ttX1BOSBQPMxrcwYajTFB96saVbnc8UddW5CTits1rrJffJogQjUU_kmc4GQgBCBKvFtjrpBXN7o0kh5Ob8oj1W5d6RNxLSoGgF33c2oQ9MneVPyQuvktuSBG1KbEUZFT_GnILLNoa5SVvgZ2qooecdc_vOSFtu2Xgmzuvai")`
  };
  
  const actualBannerUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAwosNMbFqAsdhEk59Za1nbASUJr88irtJHIJoApwXFXI2habJyNQRj7DjNJChImWA26tsm9xH5Jz1_ttX1BOSBQPMxrcwYajTFB96saVbnc8UddW5CTits1rrJffJogQjUU_kmc4GQgBCBKvFtjrpBXN7o0kh5Ob8oj1W5d6RNxLSoGgF33c2oQ9MneVPyQuvktuSBG1KbEUZFT_GnILLNoa5SVvgZ2qooecdc_vOSFtu2Xgmzuvai";
  const actualAvatarUrl = profile.avatar_url || 'https://via.placeholder.com/150';

  return (
    <div className="profile-page-wrapper">
      {/* ImageViewer Modal */}
      <ImageViewer 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage || ''} 
        onClose={() => setSelectedImage(null)} 
      />

      {/* Top App Bar */}
      <header className="profile-top-bar">
        <div className="profile-top-brand">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            blur_on
          </span>
          <h1 className="profile-brand-name">Ginger</h1>
        </div>
        {!isPublicView && (
          <div className="profile-top-actions">
            <button className="top-action-btn" onClick={() => navigate('/profile/edit')}>
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button className="top-action-btn">
              <span className="material-symbols-outlined">settings</span>
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
          <p className="profile-bio">
            {profile.bio || 'Tech professional & passionate world traveler. Exploring the intersection of innovation and global culture.'}
          </p>
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
            <span className="stat-value text-primary">{stats.totalViews}</span>
            <span className="stat-label">Total Views</span>
          </div>
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
              {!isPublicView && activeTab !== 0 && (
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
                  Add New {activeTab === 1 ? 'Project' : 'Blog Post'}
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
                    Save {activeTab === 1 ? 'Project' : 'Blog Post'}
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
                
                {!isPublicView && activeTab !== 0 && (
                  <div className="liquid-card scroll-card add-new-card" onClick={() => setShowAddForm(true)}>
                    <div className="add-new-content">
                      <span className="material-symbols-outlined add-new-icon">add_circle</span>
                      <span className="add-new-text">New Project</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
