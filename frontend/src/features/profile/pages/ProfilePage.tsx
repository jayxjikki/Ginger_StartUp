// ═══════════════════════════════════════════════════════════
// GINGER — Profile Dashboard Page
// Full profile with stats, social links, portfolio
// ═══════════════════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiEdit2, FiMapPin, FiLink, FiSettings, FiLogOut,
  FiYoutube, FiInstagram
} from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { useAuthStore } from '../../../store/authStore';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { formatCount, formatCurrency } from '../../../utils/formatters';
import './ProfilePage.css';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

// Demo profile data
const demoProfile = {
  full_name: 'Alex Creator',
  username: '@alexcreator',
  avatar_url: null,
  bio: 'Content creator | Travel & Food lover 🌍🍔 | 500K+ community | Open for collaborations',
  category: 'Travel',
  location: 'Mumbai, India',
  is_verified: true,
  follower_count: 524000,
  rates: { per_post: 5000, per_story: 2000, per_reel: 8000, per_video: 15000, currency: 'INR' },
};

const demoStats = {
  totalEarnings: 285000,
  activeCampaigns: 4,
  completedCampaigns: 23,
  totalViews: 12400000,
};

const demoSocialLinks = [
  { platform: 'youtube', username: 'AlexCreator', followers: 280000, icon: <FiYoutube /> },
  { platform: 'instagram', username: 'alexcreator', followers: 524000, icon: <FiInstagram /> },
  { platform: 'tiktok', username: 'alexcreator', followers: 180000, icon: <FaTiktok /> },
];

const ProfilePage: React.FC = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const profile = demoProfile;

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
          <h4>Profile</h4>
          <div className="profile-header-btns">
            <button className="icon-btn" onClick={() => navigate('/profile/edit')} aria-label="Edit Profile">
              <FiEdit2 />
            </button>
            <button className="icon-btn" aria-label="Settings">
              <FiSettings />
            </button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" padding="lg" className="profile-card">
            <div className="profile-info">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name}
                size="xl"
                verified={profile.is_verified}
              />
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
            <span className="stat-value gradient-text">{formatCurrency(demoStats.totalEarnings, true)}</span>
            <span className="stat-label">Total Earned</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value text-ginger">{demoStats.activeCampaigns}</span>
            <span className="stat-label">Active</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value">{demoStats.completedCampaigns}</span>
            <span className="stat-label">Completed</span>
          </Card>
          <Card variant="default" padding="md" className="stat-card">
            <span className="stat-value">{formatCount(demoStats.totalViews)}</span>
            <span className="stat-label">Total Views</span>
          </Card>
        </motion.div>

        {/* Social Links */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Connected Platforms</h5>
          <div className="social-links-list">
            {demoSocialLinks.map((link) => (
              <Card key={link.platform} variant="default" padding="md" className="social-link-card">
                <div className="social-link-info">
                  <span className={`social-icon social-${link.platform}`}>{link.icon}</span>
                  <div>
                    <p className="social-username">@{link.username}</p>
                    <p className="social-followers">{formatCount(link.followers)} followers</p>
                  </div>
                </div>
                <FiLink size={14} className="text-tertiary" />
              </Card>
            ))}
            <Button variant="ghost" size="sm" fullWidth className="add-social-btn">
              + Add Platform
            </Button>
          </div>
        </motion.div>

        {/* Rates */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">My Rates</h5>
          <Card variant="ginger" padding="md">
            <div className="rates-grid">
              {profile.rates && (
                <>
                  <div className="rate-item">
                    <span className="rate-label">Per Post</span>
                    <span className="rate-value">{formatCurrency(profile.rates.per_post!)}</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Per Story</span>
                    <span className="rate-value">{formatCurrency(profile.rates.per_story!)}</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Per Reel</span>
                    <span className="rate-value">{formatCurrency(profile.rates.per_reel!)}</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Per Video</span>
                    <span className="rate-value">{formatCurrency(profile.rates.per_video!)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Media Kit Upload Section */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Media Kit</h5>
          <Card variant="default" padding="lg" className="media-kit-upload">
            <div className="media-kit-placeholder">
              <span className="media-kit-icon">📎</span>
              <p>Upload your media kit (PDF, images)</p>
              <p className="text-tertiary text-xs">Brands will see this when considering you</p>
              <Button variant="outline" size="sm" className="mt-4">
                Upload Media Kit
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Portfolio */}
        <motion.div variants={fadeUp}>
          <h5 className="section-title">Portfolio & Achievements</h5>
          <div className="portfolio-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="portfolio-item">
                <div className="portfolio-placeholder">
                  <span>+</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div variants={fadeUp} className="mt-8 mb-6">
          <Button
            variant="ghost"
            fullWidth
            icon={<FiLogOut />}
            onClick={signOut}
            className="signout-btn"
          >
            Sign Out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
