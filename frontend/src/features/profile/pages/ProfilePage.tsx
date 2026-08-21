// ═══════════════════════════════════════════════════════════
// GINGER — Profile Dashboard Page
// Full profile with stats, social links, portfolio, blogs and achievements
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiEdit2, FiMapPin, FiLink, FiSettings, FiLogOut,
  FiYoutube, FiInstagram, FiPlus, FiImage, FiAward
} from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { useAuthStore } from '../../../store/authStore';
import { useProfileStore } from '../../../store/profileStore';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Input, { Textarea } from '../../../components/ui/Input';
import ImageUpload from '../../../components/ui/ImageUpload';
import { formatCount, formatCurrency } from '../../../utils/formatters';
import './ProfilePage.css';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const targetUserId = id || user?.id;
  const isPublicView = id && id !== user?.id;
  
  const { 
    profile, 
    achievements, 
    posts, 
    socialLinks, 
    stats, 
    isLoading, 
    fetchProfileData,
    createPost,
    createAchievement
  } = useProfileStore();

  // New Feature States
  const [activeTab, setActiveTab] = useState<'portfolio' | 'blogs'>('portfolio');
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showAddBlog, setShowAddBlog] = useState(false);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState('');

  // Achievement form state
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achImage, setAchImage] = useState('');

  const handlePublishPost = async () => {
    if (!postTitle || !postContent) return;
    try {
      await createPost({
        title: postTitle,
        content: postContent,
        image_url: postImage,
      });
      setShowAddBlog(false);
      setPostTitle('');
      setPostContent('');
      setPostImage('');
    } catch (err) {
      console.error('Failed to publish post', err);
    }
  };

  const handleSaveAchievement = async () => {
    if (!achTitle) return;
    try {
      await createAchievement({
        title: achTitle,
        description: achDesc,
        icon_url: achImage,
      });
      setShowAddAchievement(false);
      setAchTitle('');
      setAchDesc('');
      setAchImage('');
    } catch (err) {
      console.error('Failed to save achievement', err);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload failed:', error.message);
  };

  React.useEffect(() => {
    if (targetUserId) {
      fetchProfileData(targetUserId);
    }
  }, [targetUserId, fetchProfileData]);

  if (isLoading || !profile) {
    return (
      <div className="page-content flex justify-center items-center h-full">
        <p>Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <motion.div
        className="container profile-page"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Header Actions */}
        <motion.div className="profile-header-actions" variants={fadeUp}>
          <h4>{isPublicView ? profile.full_name : 'Profile'}</h4>
          {!isPublicView && (
            <div className="profile-header-btns">
              <button className="icon-btn" onClick={() => navigate('/profile/edit')} aria-label="Edit Profile">
                <FiEdit2 />
              </button>
              <button className="icon-btn" aria-label="Settings">
                <FiSettings />
              </button>
            </div>
          )}
        </motion.div>

        {/* Profile Card */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" padding="lg" className="profile-card">
            <div className="profile-info">
              <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" verified={profile.is_verified} />
              <div className="profile-details">
                <h2 className="profile-name">{profile.full_name}</h2>
                <p className="profile-username">{profile.username}</p>
                {profile.location && (
                  <span className="profile-location">
                    <FiMapPin size={12} /> {profile.location}
                  </span>
                )}
              </div>
            </div>
            <p className="profile-bio">{profile.bio}</p>
            <div className="profile-tags">
              <Badge variant="ginger">{profile.category}</Badge>
              <Badge variant="default">{formatCount(profile.follower_count)} followers</Badge>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div className="stats-grid" variants={fadeUp}>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value gradient-text">{formatCurrency(stats.totalEarnings, true)}</span>
            <span className="stat-label">Total Earned</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value text-ginger">{stats.activeCampaigns}</span>
            <span className="stat-label">Active</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value">{stats.completedCampaigns}</span>
            <span className="stat-label">Completed</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value">{formatCount(stats.totalViews)}</span>
            <span className="stat-label">Total Views</span>
          </Card>
        </motion.div>

        {/* Social Links */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Connected Platforms</h5>
          <div className="social-links-list">
            {socialLinks.length > 0 ? socialLinks.map((link) => (
              <Card key={link.id} variant="default" padding="md" className="social-link-card">
                <div className="social-link-info">
                  <span className={`social-icon social-${link.platform}`}>
                    {link.platform === 'youtube' && <FiYoutube />}
                    {link.platform === 'instagram' && <FiInstagram />}
                    {link.platform === 'tiktok' && <FaTiktok />}
                  </span>
                  <div>
                    <p className="social-username">@{link.username}</p>
                    <p className="social-followers">{formatCount(link.followers)} followers</p>
                  </div>
                </div>
                <FiLink size={14} className="text-tertiary" />
              </Card>
            )) : (
              <p className="text-sm text-secondary">No social platforms connected yet.</p>
            )}
          </div>
        </motion.div>

        {/* Tabs for Portfolio/Achievements vs Blogs */}
        <motion.div variants={fadeUp} className="profile-tabs mt-8">
          <button 
            className={`profile-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio & Achievements
          </button>
          <button 
            className={`profile-tab ${activeTab === 'blogs' ? 'active' : ''}`}
            onClick={() => setActiveTab('blogs')}
          >
            Blog Posts
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'portfolio' && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Achievements Section */}
              <div className="flex justify-between items-center mb-4">
                <h5 className="section-title mb-0">Achievements</h5>
                {!isPublicView && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAddAchievement(!showAddAchievement)}>
                    {showAddAchievement ? 'Cancel' : <><FiPlus className="mr-1" /> Add</>}
                  </Button>
                )}
              </div>

              {showAddAchievement && (
                <Card variant="default" padding="lg" className="mb-6">
                  <h6 className="mb-4">Add New Achievement</h6>
                  <div className="flex flex-col gap-4">
                    <Input 
                      label="Achievement Title" 
                      placeholder="e.g. YouTube Silver Play Button" 
                      value={achTitle}
                      onChange={(e) => setAchTitle(e.target.value)}
                    />
                    <Input 
                      label="Description (Optional)" 
                      placeholder="Short description" 
                      value={achDesc}
                      onChange={(e) => setAchDesc(e.target.value)}
                    />
                    <ImageUpload 
                      label="Achievement Badge / Certificate (Cloudinary)" 
                      onUploadSuccess={(url) => setAchImage(url)}
                      onUploadError={handleUploadError}
                    />
                    <Button fullWidth onClick={handleSaveAchievement}>Save Achievement</Button>
                  </div>
                </Card>
              )}

              <div className={isPublicView ? "carousel-container mb-8" : "achievements-list mb-8"}>
                {achievements.length > 0 ? achievements.map((ach) => (
                  <Card key={ach.id} variant="glass" padding="md" className={`achievement-card flex items-center gap-4 ${isPublicView ? 'carousel-item' : 'mb-3'}`}>
                    <div className="achievement-icon text-ginger text-2xl p-3 bg-black/20 rounded-full min-w-max">
                      {ach.icon_url ? <img src={ach.icon_url} alt="" className="w-8 h-8 rounded-full" /> : <FiAward />}
                    </div>
                    <div>
                      <h6 className="mb-1 text-sm font-medium">{ach.title}</h6>
                      <p className="text-xs text-tertiary">{ach.description}</p>
                    </div>
                  </Card>
                )) : (
                  <p className="text-sm text-secondary">No achievements to display.</p>
                )}
              </div>

              {/* Portfolio Grid */}
              <h5 className="section-title">Past Work</h5>
              <div className={isPublicView ? "carousel-container portfolio-carousel" : "portfolio-grid"}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`portfolio-item ${isPublicView ? 'carousel-item' : ''}`}>
                    <div className="portfolio-placeholder">
                      <FiImage size={24} />
                    </div>
                  </div>
                ))}
                {!isPublicView && (
                  <div className="portfolio-item add-new">
                    <div className="portfolio-placeholder">
                      <FiPlus size={24} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'blogs' && (
            <motion.div
              key="blogs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h5 className="section-title mb-0">Blog Posts</h5>
                {!isPublicView && (
                  <Button variant="primary" size="sm" onClick={() => setShowAddBlog(!showAddBlog)}>
                    {showAddBlog ? 'Cancel' : <><FiPlus className="mr-1" /> New Post</>}
                  </Button>
                )}
              </div>

              {showAddBlog && (
                <Card variant="glass" padding="lg" className="mb-6">
                  <h6 className="mb-4">Create Blog Post</h6>
                  <div className="flex flex-col gap-4">
                    <Input 
                      label="Post Title" 
                      placeholder="What's on your mind?" 
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                    />
                    <Textarea 
                      label="Content"
                      placeholder="Write your post content here..."
                      rows={4}
                      style={{ resize: 'vertical' }}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    />
                    <ImageUpload 
                      label="Cover Image (Cloudinary)" 
                      onUploadSuccess={(url) => setPostImage(url)}
                      onUploadError={handleUploadError}
                    />
                    <Button fullWidth onClick={handlePublishPost}>Publish Post</Button>
                  </div>
                </Card>
              )}

              <div className={isPublicView ? "carousel-container" : "blogs-list flex flex-col gap-4"}>
                {posts.length > 0 ? posts.map((post) => (
                  <Card key={post.id} variant="default" padding="none" className={`blog-card overflow-hidden ${isPublicView ? 'carousel-item' : ''}`}>
                    <div className="blog-image h-32 bg-white/5 flex items-center justify-center relative overflow-hidden">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <FiImage size={32} className="text-white/20" />
                      )}
                    </div>
                    <div className="p-4">
                      <h6 className="text-md mb-2">{post.title}</h6>
                      <p className="text-sm text-secondary mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      <span className="text-xs text-tertiary">Posted on {new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </Card>
                )) : (
                  <p className="text-sm text-secondary">No blog posts yet.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sign Out (Only for own profile) */}
        {!isPublicView && (
          <motion.div variants={fadeUp} className="mt-8 mb-6">
            <Button
              variant="ghost"
              fullWidth
              icon={<FiLogOut />}
              onClick={signOut}
              className="signout-btn text-red-500"
            >
              Sign Out
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
