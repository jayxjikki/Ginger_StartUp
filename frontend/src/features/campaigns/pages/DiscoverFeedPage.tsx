import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DiscoverFilterModal from '../components/DiscoverFilterModal';
import type { FilterState } from '../components/DiscoverFilterModal';
import ChatModal from '../../../components/ui/ChatModal';
import { supabase } from '../../../lib/supabase';
import { getSocialIcon } from '../../../utils/socialHelpers';
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
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchCreators = async () => {
      setIsLoading(true);
      try {
        setIsLoading(true);
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
            pinnedSocials: p.pinned_socials || [],
            telegramUsername: p.telegram_username,
            mediaKit: {
              type: 'image',
              url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000'
            }
          };
        });

        setCreators(mappedCreators);
      } catch (err) {
        console.error('Error fetching discover creators:', err);
      } finally {
        setIsLoading(false);
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

      // Followers (filter inputs are in thousands)
      if (creator.followers < activeFilters.minFollowers * 1000) return false;
      if (creator.followers > activeFilters.maxFollowers * 1000) return false;

      // Rate per post (filter inputs are in thousands)
      if (creator.perPost < activeFilters.minRate * 1000) return false;
      if (creator.perPost > activeFilters.maxRate * 1000) return false;

      // Location
      if (activeFilters.location && !creator.location.toLowerCase().includes(activeFilters.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [creators, activeCategory, searchQuery, activeFilters]);

  // Reset filters when the category tab changes, or when 'reset-feed-filters' event fires
  React.useEffect(() => {
    const resetFilters = () => {
      setSearchQuery('');
      setActiveFilters({
        platforms: [],
        minFollowers: 0,
        maxFollowers: 10000, // 10M
        minRate: 0,
        maxRate: 500, // 500K
        location: ''
      });
    };

    const handleTabReset = () => {
      setActiveCategory('All');
      resetFilters();
    };

    // Force reset on mount in case state is cached
    handleTabReset();

    window.addEventListener('reset-feed-filters', handleTabReset);
    
    return () => {
      window.removeEventListener('reset-feed-filters', handleTabReset);
    };
  }, []);

  // Also reset search and advanced filters when clicking a different category chip
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setActiveFilters({
      platforms: [],
      minFollowers: 0,
      maxFollowers: 10000,
      minRate: 0,
      maxRate: 500,
      location: ''
    });
  };



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
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Creator Cards List */}
        <div className="creator-list">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', width: '100%' }}>
              <span className="material-symbols-outlined spin-animation" style={{ fontSize: '32px', color: '#34d399' }}>sync</span>
            </div>
          ) : creators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#c4c7c8' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>inbox</span>
              <p>No creators available yet.</p>
            </div>
          ) : filteredCreators.length === 0 ? (
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
              <div 
                key={creator.id} 
                className="discover-glass-card" 
                onClick={() => navigate(`/profile/${creator.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="creator-header">
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
                  </div>
                  
                  <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <button 
                      className="liquid-btn icon-only"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(creator.id, creator.fullName, creator.avatarUrl);
                      }}
                      title="Send Message"
                      style={{ padding: '8px', minWidth: 'unset', height: 'unset', borderRadius: '50%' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                    </button>
                    
                    {creator.pinnedSocials && creator.pinnedSocials.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {creator.pinnedSocials.map((platform: string) => {
                          const link = platform === 'Telegram' 
                            ? { platform: 'Telegram', url: creator.telegramUsername ? `https://t.me/${creator.telegramUsername}` : '#' }
                            : creator.socialLinks.find((l: any) => l.platform.toLowerCase() === platform.toLowerCase());
                          
                          if (!link) return null;

                          return (
                            <button
                              key={link.platform}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (link.url !== '#') window.open(link.url, '_blank');
                              }}
                              title={link.platform}
                              style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px', 
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                              <img 
                                src={getSocialIcon(link.platform)} 
                                alt={link.platform} 
                                style={{ width: '18px', height: '18px', objectFit: 'contain' }} 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px; color: #a1a1aa">link</span>';
                                }} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Fallback if no pinned socials, show none or prioritize telegram if available? 
                      // Wait, the prompt said: "only 3 icons which the user pins in the account centre ... whatever the pin platform is it should be visible in the feed tab in that order"
                      // "also note : if i have only telegram linked i can only link telegram and only that will be visible in the feed below the message icon."
                      // If there's no pinned socials, we don't show any.
                      <></>
                    )}
                  </div>
                </div>
                
                <div className="creator-stats-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div className="creator-stat-box" style={{ flex: 1, textAlign: 'left', padding: '0 8px' }}>
                    <div className="stat-value">{creator.followersStr}</div>
                    <div className="stat-label">Followers</div>
                  </div>
                  <div className="creator-location" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8fa696', fontSize: '12px', padding: '0 8px', paddingBottom: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                    <span>{creator.location || 'Unknown'}</span>
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
