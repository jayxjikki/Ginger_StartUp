// ═══════════════════════════════════════════════════════════
// GINGER — Marketplace Page (Discover Influencers)
// Search, filter, and hire influencers by their media kits
// ═══════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiSliders, FiMapPin } from 'react-icons/fi';
import { FaYoutube, FaInstagram } from 'react-icons/fa';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { formatCount, formatCurrency } from '../../../utils/formatters';
import { CATEGORIES } from '../../../types/user.types';
import { supabase } from '../../../lib/supabase';
import type { Profile } from '../../../types/user.types';

const MarketplacePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [influencers, setInfluencers] = useState<Profile[]>([]);

  React.useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('follower_count', { ascending: false });
        
        if (error) throw error;

        // Fetch social links and completed submissions for stats
        const [{ data: links }, { data: subs }] = await Promise.all([
          supabase.from('social_links').select('*'),
          supabase.from('submissions').select('creator_id, status').eq('status', 'paid')
        ]);

        const mergedProfiles = (profiles || []).map((p: any) => {
          const userLinks = (links || []).filter(l => l.profile_id === p.id);
          const userSubs = (subs || []).filter(s => s.creator_id === p.id);
          return {
            ...p,
            platforms: userLinks.map(l => l.platform.toLowerCase()),
            completedCampaigns: userSubs.length
          };
        });

        setInfluencers(mergedProfiles);
      } catch (err) {
        console.error('Error fetching marketplace influencers:', err);
      }
    };
    fetchInfluencers();
  }, []);

  const filtered = influencers.filter((inf) => {
    const matchesSearch = !search ||
      (inf.full_name?.toLowerCase().includes(search.toLowerCase()) || 
       inf.username?.toLowerCase().includes(search.toLowerCase()) ||
       inf.category?.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCategory || inf.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
                  <Avatar src={inf.avatar_url} name={inf.full_name || 'User'} size="lg" verified={inf.is_verified} />
                  <div className="inf-info">
                    <h5 className="inf-name">{inf.full_name}</h5>
                    <p className="text-xs text-secondary">{inf.username}</p>
                    <div className="inf-meta">
                      {inf.location && <span className="inf-location"><FiMapPin size={10} /> {inf.location}</span>}
                    </div>
                  </div>
                </div>

                <p className="inf-bio text-sm line-clamp-2">{inf.bio || 'No bio available'}</p>

                <div className="inf-stats">
                  <div className="inf-stat">
                    <span className="inf-stat-value">{formatCount(inf.follower_count || 0)}</span>
                    <span className="inf-stat-label">Followers</span>
                  </div>
                  <div className="inf-stat">
                    <span className="inf-stat-value">{(inf as any).completedCampaigns || 0}</span>
                    <span className="inf-stat-label">Campaigns</span>
                  </div>
                  <div className="inf-stat">
                    <span className="inf-stat-value">{formatCurrency(inf.rates?.per_post || 0, true)}</span>
                    <span className="inf-stat-label">Per Post</span>
                  </div>
                </div>

                <div className="inf-footer">
                  <div className="inf-platforms">
                    {!(inf as any).platforms?.length && <span className="text-secondary text-xs">No links</span>}
                    {(inf as any).platforms?.includes('instagram') && <span className="inf-platform-icon platform-instagram"><FaInstagram /></span>}
                    {(inf as any).platforms?.includes('youtube') && <span className="inf-platform-icon platform-youtube"><FaYoutube /></span>}
                  </div>
                  {inf.category && <Badge variant="ginger" size="sm">{inf.category}</Badge>}
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
