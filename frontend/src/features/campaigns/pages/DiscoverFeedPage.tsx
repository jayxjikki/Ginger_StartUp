import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverFilterModal from '../components/DiscoverFilterModal';
import type { FilterState } from '../components/DiscoverFilterModal';
import ChatModal from '../../../components/ui/ChatModal';
import { supabase } from '../../../lib/supabase';
import youtubeIcon from '../../../assets/youtube.png';
import instagramIcon from '../../../assets/instagram.png';
import tiktokIcon from '../../../assets/tiktok.png';
import './DiscoverFeedPage.css';

const DiscoverFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Media Kit state




  // Filter Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Chat Modal state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, avatar: string | null} | null>(null);

  const [activeFilters, setActiveFilters] = useState<FilterState>({
    platforms: [],
    minFollowers: 0,
    maxFollowers: 10000, // 10M
    minRate: 0,
    maxRate: 500, // 500K
    location: ''
  });

  const openChat = (id: string, name: string, avatar: string | null) => {
    setActiveChatUser({ id, name, avatar });
    setIsChatModalOpen(true);
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

  const [creators, setCreators] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchCreators = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('follower_count', { ascending: false });
        
        if (error) throw error;

        const { data: links } = await supabase.from('social_links').select('*');

        const mappedCreators = (profiles || []).map((p: any) => {
          const userLinks = (links || []).filter((l: any) => l.profile_id === p.id);
          return {
            id: p.id,
            fullName: p.full_name || 'Unknown',
            handle: p.username || '',
            category: p.category || 'Other',
            followers: p.follower_count || 0,
            perPost: p.rates?.per_post || 0,
            location: p.location || '',
            avatarUrl: p.avatar_url || 'https://via.placeholder.com/150/333/fff?text=?',
            platforms: userLinks.map((l: any) => l.platform.toLowerCase()),
            socialLinks: userLinks,
            mediaKit: {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000'
            }
          };
        });

        setCreators(mappedCreators);
      } catch (err) {
        console.error('Error fetching discover creators:', err);
      }
    };
    fetchCreators();
  }, []);

  const filteredCreators = useMemo(() => {
    return creators.filter(creator => {
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

      // Followers (Filter state is in thousands)
      if (creator.followers < activeFilters.minFollowers * 1000) return false;
      if (creator.followers > activeFilters.maxFollowers * 1000) return false;

      // Rate per post (Filter state is in thousands)
      if (creator.perPost < activeFilters.minRate * 1000) return false;
      if (creator.perPost > activeFilters.maxRate * 1000) return false;

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
                      {creator.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
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
                  <div className="creator-platforms" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {creator.socialLinks?.map((link: any) => {
                      let icon = null;
                      const platform = link.platform.toLowerCase();
                      if (platform === 'youtube') icon = youtubeIcon;
                      else if (platform === 'instagram') icon = instagramIcon;
                      else if (platform === 'tiktok') icon = tiktokIcon;
                      
                      if (!icon) return null;
                      
                      return (
                        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="hover-scale">
                          <img src={icon} alt={link.platform} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                        </a>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="liquid-btn icon-only"
                      onClick={() => openChat(creator.id, creator.fullName, creator.avatarUrl)}
                      title="Send Message"
                      style={{ padding: '0 12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                    </button>
                    <button 
                      className="liquid-btn"
                      onClick={() => navigate(`/profile/${creator.id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <DiscoverFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={setActiveFilters}
        currentFilters={activeFilters}
      />

      <ChatModal 
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        recipientId={activeChatUser?.id || ''}
        recipientName={activeChatUser?.name || ''}
        recipientAvatar={activeChatUser?.avatar || null}
      />
    </div>
  );
};

export default DiscoverFeedPage;
