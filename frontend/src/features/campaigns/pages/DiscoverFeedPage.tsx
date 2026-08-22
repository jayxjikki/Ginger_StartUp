import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaKitViewer from '../components/MediaKitViewer';
import DiscoverFilterModal from '../components/DiscoverFilterModal';
import type { FilterState } from '../components/DiscoverFilterModal';
import { DUMMY_CREATORS } from '../data/dummyData';
import youtubeIcon from '../../../assets/youtube.png';
import instagramIcon from '../../../assets/instagram.png';
import tiktokIcon from '../../../assets/tiktok.png';
import './DiscoverFeedPage.css';

const DiscoverFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Media Kit state
  const [isMediaKitOpen, setIsMediaKitOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'pdf'>('image');

  // Filter Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    platforms: [],
    minFollowers: 0,
    maxFollowers: 10000, // 10M
    minRate: 0,
    maxRate: 500, // 500K
    location: ''
  });

  const openMediaKit = (url: string, type: 'image' | 'pdf') => {
    setMediaUrl(url);
    setMediaType(type);
    setIsMediaKitOpen(true);
  };

  const categories = [
    'All',
    'Education',
    'Fitness & Gym',
    'Gaming',
    'Travel',
    'Food & Restaurant',
    'Technology',
    'Fashion'
  ];

  const filteredCreators = useMemo(() => {
    return DUMMY_CREATORS.filter(creator => {
      // 1. Category Filter
      if (activeCategory !== 'All' && creator.category !== activeCategory) {
        return false;
      }

      // 2. Search Query (Name, Handle, or Category)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = creator.fullName.toLowerCase().includes(query);
        const matchesHandle = creator.handle.toLowerCase().includes(query);
        const matchesCategory = creator.category.toLowerCase().includes(query);
        if (!matchesName && !matchesHandle && !matchesCategory) return false;
      }

      // 3. Advanced Filters
      // Platforms (Must have ALL selected platforms if any are selected)
      if (activeFilters.platforms.length > 0) {
        const hasAllPlatforms = activeFilters.platforms.every(p => creator.platforms.includes(p));
        if (!hasAllPlatforms) return false;
      }

      // Followers
      if (creator.followers < activeFilters.minFollowers) return false;
      if (creator.followers > activeFilters.maxFollowers) return false;

      // Rate per post
      if (creator.perPost < activeFilters.minRate) return false;
      if (creator.perPost > activeFilters.maxRate) return false;

      // Location
      if (activeFilters.location && !creator.location.toLowerCase().includes(activeFilters.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [activeCategory, searchQuery, activeFilters]);

  return (
    <div className="discover-page">
      {/* TopAppBar */}
      <header className="discover-top-bar">
        <div className="discover-title-wrap">
          <span className="material-symbols-outlined discover-search-icon" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          <h1 className="discover-brand">Discover</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="discover-main">
        {/* Search & Filter Bar */}
        <div className="search-filter-wrap">
          <div className="search-input-wrap">
            <span className="material-symbols-outlined search-input-icon">search</span>
            <input 
              className="discover-search-input" 
              placeholder="Search by name, category..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="discover-filter-btn" onClick={() => setIsFilterModalOpen(true)}>
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* Horizontal Chips */}
        <div className="chips-scroll-area hide-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              className={`discover-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Creator Cards List */}
        <div className="creator-list">
          {filteredCreators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#c4c7c8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>sentiment_dissatisfied</span>
              <p>No creators match your current filters.</p>
              <button className="liquid-btn" onClick={() => {
                setActiveCategory('All');
                setSearchQuery('');
                setActiveFilters({ platforms: [], minFollowers: 0, maxFollowers: 10000, minRate: 0, maxRate: 500, location: '' });
              }} style={{ marginTop: '16px' }}>Clear Filters</button>
            </div>
          ) : (
            filteredCreators.map(creator => (
              <div key={creator.id} className="discover-glass-card">
                <div className="creator-header" onClick={() => navigate(`/profile/${creator.id}`)} style={{ cursor: 'pointer' }}>
                  {creator.avatarUrl.includes('placeholder.com') ? (
                    <div className="creator-avatar-placeholder">
                      {creator.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  ) : (
                    <img alt={creator.fullName} className="creator-avatar" src={creator.avatarUrl} />
                  )}
                  
                  <div className="creator-info">
                    <div className="creator-name-row">
                      <h3 className="creator-name">{creator.fullName}</h3>
                      {creator.isVerified && (
                        <span className="material-symbols-outlined creator-verified" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                    <p className="creator-handle">{creator.handle}</p>
                    <div className="creator-location">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                      <span>{creator.location}</span>
                    </div>
                  </div>
                </div>
                
                <p className="creator-bio">{creator.bio}</p>
                
                <div className="creator-stats-grid">
                  <div className="creator-stat-box">
                    <div className="stat-value">{creator.followersStr}</div>
                    <div className="stat-label">Followers</div>
                  </div>
                  <div className="creator-stat-box bordered">
                    <div className="stat-value">{creator.campaigns}</div>
                    <div className="stat-label">Campaigns</div>
                  </div>
                  <div className="creator-stat-box">
                    <div className="stat-value gold">{creator.perPostStr}</div>
                    <div className="stat-label gold">Per Post</div>
                  </div>
                </div>
                
                <div className="creator-footer">
                  <div className="creator-platforms" style={{ alignItems: 'center', gap: '16px' }}>
                    {creator.platforms.includes('youtube') && (
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                        <img src={youtubeIcon} alt="YouTube" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                      </a>
                    )}
                    {creator.platforms.includes('instagram') && (
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <img src={instagramIcon} alt="Instagram" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                      </a>
                    )}
                    {creator.platforms.includes('tiktok') && (
                      <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                        <img src={tiktokIcon} alt="TikTok" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                      </a>
                    )}
                  </div>
                  <button 
                    className="liquid-btn"
                    onClick={() => openMediaKit('https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000&auto=format&fit=crop', 'image')}
                  >
                    View Media Kit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <MediaKitViewer 
        isOpen={isMediaKitOpen}
        onClose={() => setIsMediaKitOpen(false)}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
      />

      <DiscoverFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={activeFilters}
        onApply={(newFilters) => setActiveFilters(newFilters)}
      />
    </div>
  );
};

export default DiscoverFeedPage;
