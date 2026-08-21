// ═══════════════════════════════════════════════════════════
// GINGER — Marketplace Page (Discover Influencers)
// Search, filter, and hire influencers by their media kits
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiSliders, FiMapPin, FiStar } from 'react-icons/fi';
import { FaYoutube, FaInstagram, FaTiktok } from 'react-icons/fa';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { formatCount, formatCurrency } from '../../../utils/formatters';
import { CATEGORIES } from '../../../types/user.types';
import './MarketplacePage.css';

// Demo influencer data
const demoInfluencers = [
  {
    id: '1', name: 'Meera Travels', username: '@meeratravels', avatar: null,
    bio: 'Travel vlogger | 50+ countries explored | Luxury travel & budget hacks',
    category: 'Travel', location: 'Mumbai, India', verified: true,
    followers: 820000, rating: 4.9, completedCampaigns: 45,
    ratePerPost: 8000, ratePerReel: 15000,
    platforms: ['youtube', 'instagram'],
  },
  {
    id: '2', name: 'FitRaj', username: '@fitraj_official', avatar: null,
    bio: 'Fitness coach & certified nutritionist | Transform your body & mind',
    category: 'Fitness & Gym', location: 'Delhi, India', verified: true,
    followers: 1200000, rating: 4.8, completedCampaigns: 72,
    ratePerPost: 12000, ratePerReel: 25000,
    platforms: ['youtube', 'instagram', 'tiktok'],
  },
  {
    id: '3', name: 'CodeWithNeha', username: '@codewithneha', avatar: null,
    bio: 'Tech educator | React, Python, AI tutorials | Making coding fun',
    category: 'Education', location: 'Bangalore, India', verified: false,
    followers: 350000, rating: 4.7, completedCampaigns: 18,
    ratePerPost: 5000, ratePerReel: 10000,
    platforms: ['youtube'],
  },
  {
    id: '4', name: 'TastyAnkit', username: '@tastyankit', avatar: null,
    bio: 'Food reviewer | Street food to fine dining | 500+ restaurants reviewed',
    category: 'Food & Restaurant', location: 'Pune, India', verified: true,
    followers: 680000, rating: 4.9, completedCampaigns: 89,
    ratePerPost: 6000, ratePerReel: 12000,
    platforms: ['instagram', 'youtube'],
  },
  {
    id: '5', name: 'GamerPriya', username: '@gamerpriya', avatar: null,
    bio: 'Pro gamer & streamer | Valorant, BGMI | Esports enthusiast',
    category: 'Gaming', location: 'Hyderabad, India', verified: false,
    followers: 450000, rating: 4.6, completedCampaigns: 22,
    ratePerPost: 4000, ratePerReel: 8000,
    platforms: ['youtube', 'instagram', 'tiktok'],
  },
  {
    id: '6', name: 'StyleByRiya', username: '@stylebyriya', avatar: null,
    bio: 'Fashion & beauty creator | Affordable fashion tips | Brand collaborations',
    category: 'Fashion & Beauty', location: 'Jaipur, India', verified: true,
    followers: 920000, rating: 4.8, completedCampaigns: 56,
    ratePerPost: 10000, ratePerReel: 20000,
    platforms: ['instagram', 'youtube'],
  },
];

const MarketplacePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filtered = demoInfluencers.filter((inf) => {
    const matchesSearch = !search ||
      inf.name.toLowerCase().includes(search.toLowerCase()) ||
      inf.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || inf.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <FaYoutube />;
      case 'instagram': return <FaInstagram />;
      case 'tiktok': return <FaTiktok />;
      default: return null;
    }
  };

  return (
    <div className="page-content">
      <div className="container marketplace">
        {/* Header */}
        <motion.div
          className="market-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h3>Discover Creators</h3>
            <p className="text-secondary text-sm">Find the perfect influencer for your brand</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className="feed-search"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              id="marketplace-search"
            />
            <button className="search-filter-btn" aria-label="Filters">
              <FiSliders />
            </button>
          </div>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          className="category-pills"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <button
            className={`sort-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              className={`sort-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Influencer Grid */}
        <div className="influencer-list">
          {filtered.map((inf, idx) => (
            <motion.div
              key={inf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: 'spring' as const, stiffness: 300, damping: 30 }}
            >
              <Card variant="glass" padding="md" className="influencer-card" onClick={() => {}}>
                <div className="inf-header">
                  <Avatar src={inf.avatar} name={inf.name} size="lg" verified={inf.verified} />
                  <div className="inf-info">
                    <h5 className="inf-name">{inf.name}</h5>
                    <p className="text-xs text-secondary">{inf.username}</p>
                    <div className="inf-meta">
                      <span className="inf-location"><FiMapPin size={10} /> {inf.location}</span>
                      <span className="inf-rating"><FiStar size={10} /> {inf.rating}</span>
                    </div>
                  </div>
                </div>

                <p className="inf-bio text-sm line-clamp-2">{inf.bio}</p>

                <div className="inf-stats">
                  <div className="inf-stat">
                    <span className="inf-stat-value">{formatCount(inf.followers)}</span>
                    <span className="inf-stat-label">Followers</span>
                  </div>
                  <div className="inf-stat">
                    <span className="inf-stat-value">{inf.completedCampaigns}</span>
                    <span className="inf-stat-label">Campaigns</span>
                  </div>
                  <div className="inf-stat">
                    <span className="inf-stat-value">{formatCurrency(inf.ratePerPost, true)}</span>
                    <span className="inf-stat-label">Per Post</span>
                  </div>
                </div>

                <div className="inf-footer">
                  <div className="inf-platforms">
                    {inf.platforms.map((p) => (
                      <span key={p} className={`inf-platform-icon platform-${p}`}>
                        {getPlatformIcon(p)}
                      </span>
                    ))}
                  </div>
                  <Badge variant="ginger" size="sm">{inf.category}</Badge>
                </div>

                <Button variant="outline" size="sm" fullWidth className="mt-3">
                  View Media Kit
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
