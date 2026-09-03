import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DiscoverFilterModal from '../components/DiscoverFilterModal';
import type { FilterState } from '../components/DiscoverFilterModal';
import ChatModal from '../../../components/ui/ChatModal';
import { supabase } from '../../../lib/supabase';
import { getSocialIcon } from '../../../utils/socialHelpers';
import VerifiedChannelsModal from '../../profile/components/VerifiedChannelsModal';
import { useUgcStore } from '../../../store/ugcStore';
import { useGlobalModalStore } from '../../../store/globalModalStore';
import { formatCount } from '../../../utils/formatters';
import { getPdfViewerUrl, triggerFileDownload } from '../../../lib/cloudinary';
import { INDIAN_STATES_AND_CITIES } from '../../../lib/indianLocations';
import { CATEGORIES_DATA } from '../../../lib/categoriesData';
import './DiscoverFeedPage.css';

const DiscoverFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 3-dot dropdown menu state
  const [activeOptionsCreatorId, setActiveOptionsCreatorId] = useState<string | null>(null);

  // Media Kit Modal state
  const [activeMediaKitCreator, setActiveMediaKitCreator] = useState<any | null>(null);

  // Filter Modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Chat Modal state
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, avatar: string | null} | null>(null);

  // Telegram Modal state
  const [telegramModalUser, setTelegramModalUser] = useState<any>(null);

  const { blockUser, reportItem } = useUgcStore();

  const [activeFilters, setActiveFilters] = useState<FilterState>({
    platforms: [],
    minFollowers: 0,
    maxFollowers: 10000, // 10M
    minRate: 0,
    maxRate: 500, // 500K
    state: '',
    city: '',
    location: ''
  });

  // Close 3-dot dropdown menu on outside click
  useEffect(() => {
    const closeDropdown = () => setActiveOptionsCreatorId(null);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  const openChat = (id: string, name: string, avatar: string | null) => {
    setActiveChatUser({ id, name, avatar });
    setIsChatModalOpen(true);
  };

  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchCreators = async () => {
      setIsLoading(true);
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('follower_count', { ascending: false });
        
        if (error) throw error;

        const { data: links } = await supabase.from('social_links').select('*');
        const { data: mediaKits } = await supabase.from('media_kit_items').select('*');
        const { data: channels } = await supabase.from('verified_channels').select('*');
        const { blockedUserIds, blockedByThemIds } = useUgcStore.getState();
        const allBlocked = new Set([...blockedUserIds, ...blockedByThemIds]);

        const mappedCreators = (profiles || [])
          .filter((p: any) => !allBlocked.has(p.id))
          .map((p: any) => {
          const userLinks = (links || []).filter((l: any) => l.profile_id === p.id);
          const userMediaKits = (mediaKits || []).filter((m: any) => m.profile_id === p.id);
          const userChannels = (channels || []).filter((c: any) => c.profile_id === p.id);
          const telegramSum = userChannels.reduce((sum: number, ch: any) => sum + (ch.member_count || 0), 0);

          const mappedPlatforms = userLinks.map((l: any) => l.platform.toLowerCase());
          if ((p.telegram_username || userChannels.length > 0) && !mappedPlatforms.includes('telegram')) {
            mappedPlatforms.push('telegram');
          }

          return {
            id: p.id,
            fullName: p.full_name || 'Unknown',
            handle: p.username || '',
            category: p.category || '',
            followers: p.follower_count || 0,
            perPost: p.rates?.per_post || 0,
            location: p.location || '',
            avatarUrl: p.avatar_url || 'https://via.placeholder.com/150/333/fff?text=?',
            platforms: mappedPlatforms,
            socialLinks: userLinks,
            pinnedSocials: p.pinned_socials || [],
            telegramUsername: p.telegram_username,
            telegramMembers: telegramSum,
            hasMediaKit: userMediaKits.length > 0,
            mediaKitItems: userMediaKits,
            verifiedChannels: userChannels
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
      // 1. Category & Subcategory Filter
      if (activeCategory !== 'All') {
        const creatorCatStr = (creator.category || '').toLowerCase();
        if (activeSubcategory) {
          if (!creatorCatStr.includes(activeSubcategory.toLowerCase())) {
            return false;
          }
        } else {
          const group = CATEGORIES_DATA.find(c => c.name === activeCategory);
          const matchesParent = creatorCatStr.includes(activeCategory.toLowerCase());
          const matchesSub = group?.subcategories.some(sub => creatorCatStr.includes(sub.toLowerCase()));
          if (!matchesParent && !matchesSub) {
            return false;
          }
        }
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

      // Location (Smart matching on City and State)
      if (activeFilters.city) {
        if (!creator.location.toLowerCase().includes(activeFilters.city.toLowerCase())) return false;
      } else if (activeFilters.state) {
        const stateLower = activeFilters.state.toLowerCase();
        const matchesState = creator.location.toLowerCase().includes(stateLower);
        const stateCities = INDIAN_STATES_AND_CITIES[activeFilters.state] || [];
        const matchesCity = stateCities.some((c: string) => creator.location.toLowerCase().includes(c.toLowerCase()));
        if (!matchesState && !matchesCity) return false;
      } else if (activeFilters.location && !creator.location.toLowerCase().includes(activeFilters.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [creators, activeCategory, activeSubcategory, searchQuery, activeFilters]);

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
        state: '',
        city: '',
        location: ''
      });
    };

    const handleTabReset = () => {
      setActiveCategory('All');
      setActiveSubcategory('');
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
    setActiveSubcategory('');
    setSearchQuery('');
    setActiveFilters({
      platforms: [],
      minFollowers: 0,
      maxFollowers: 10000,
      minRate: 0,
      maxRate: 500,
      state: '',
      city: '',
      location: ''
    });
  };

  const handleSubcategoryChange = (sub: string) => {
    setActiveSubcategory(prev => (prev === sub ? '' : sub));
  };

  return (
    <div className="discover-page">
      {/* TopAppBar */}
      <header className="discover-top-bar">
        <div className="discover-title-wrap">
          <span className="material-symbols-outlined text-primary discover-brand-logo" style={{ fontVariationSettings: "'FILL' 1" }}>
            blur_on
          </span>
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

        {/* Horizontal Category Chips */}
        <div className="chips-scroll-area hide-scrollbar">
          <button 
            className={`discover-chip ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('All')}
          >
            All
          </button>
          {CATEGORIES_DATA.map(group => (
            <button 
              key={group.id}
              className={`discover-chip ${activeCategory === group.name ? 'active' : ''}`}
              onClick={() => handleCategoryChange(group.name)}
            >
              {group.name}
            </button>
          ))}
        </div>

        {/* Dynamic Subcategory Chips Row (shown when a category is selected) */}
        {activeCategory !== 'All' && (() => {
          const currentGroup = CATEGORIES_DATA.find(c => c.name === activeCategory);
          if (!currentGroup) return null;
          return (
            <div className="subchips-scroll-area hide-scrollbar">
              <button
                className={`discover-subchip ${activeSubcategory === '' ? 'active' : ''}`}
                onClick={() => handleSubcategoryChange('')}
              >
                All {currentGroup.shortName}
              </button>
              {currentGroup.subcategories.map(sub => (
                <button
                  key={sub}
                  className={`discover-subchip ${activeSubcategory === sub ? 'active' : ''}`}
                  onClick={() => handleSubcategoryChange(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          );
        })()}

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
                  <div className="creator-main-left">
                    <div className="creator-identity-row">
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
                    </div>

                    {/* Pinned Category Filters in Left Space Above The Line */}
                    {creator.category && creator.category.trim() !== '' && (
                      <div className="creator-category-badge-list">
                        {creator.category.split(',').map((s: string) => s.trim()).filter(Boolean).map((cat: string) => (
                          <div key={cat} className="creator-category-badge">
                            <span className="category-bullet">•</span>
                            <span className="category-text">{cat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="creator-card-actions-col">
                    <div className="creator-top-buttons-row">
                      {/* 3-Dot Options Button */}
                      <div className="creator-options-menu-wrap">
                        <button 
                          className="creator-options-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveOptionsCreatorId(activeOptionsCreatorId === creator.id ? null : creator.id);
                          }}
                          title="More Options"
                          aria-label="Options"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                        </button>

                        {activeOptionsCreatorId === creator.id && (
                          <div className="creator-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="creator-menu-item"
                              onClick={() => {
                                setActiveOptionsCreatorId(null);
                                navigate(`/profile/${creator.id}`);
                              }}
                            >
                              <span className="material-symbols-outlined">person</span>
                              Visit Profile
                            </button>
                            <button 
                              className="creator-menu-item"
                              onClick={() => {
                                setActiveOptionsCreatorId(null);
                                navigator.clipboard.writeText(`${window.location.origin}/profile/${creator.id}`);
                                toast.success('Profile link copied!');
                              }}
                            >
                              <span className="material-symbols-outlined">share</span>
                              Share Profile
                            </button>
                            <button 
                              className="creator-menu-item text-warning"
                              onClick={async () => {
                                setActiveOptionsCreatorId(null);
                                const conf = await useGlobalModalStore.getState().showConfirm('Report this creator for inappropriate content?', 'Report Creator');
                                if (conf) {
                                  await reportItem(creator.id, 'profile', 'Inappropriate content');
                                  toast.success('Creator reported');
                                }
                              }}
                            >
                              <span className="material-symbols-outlined">flag</span>
                              Report User
                            </button>
                            <button 
                              className="creator-menu-item text-danger"
                              onClick={async () => {
                                setActiveOptionsCreatorId(null);
                                const conf = await useGlobalModalStore.getState().showConfirm('Block this user? You will no longer see their profile or messages.', 'Block User');
                                if (conf) {
                                  await blockUser(creator.id);
                                  setCreators(prev => prev.filter(c => c.id !== creator.id));
                                  toast.success('User blocked');
                                }
                              }}
                            >
                              <span className="material-symbols-outlined">block</span>
                              Block User
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Message Button */}
                      <button 
                        className="creator-msg-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(creator.id, creator.fullName, creator.avatarUrl);
                        }}
                        title="Send Message"
                        aria-label="Message"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                      </button>
                    </div>

                    {/* Pinned Socials with Count below Logo */}
                    {creator.pinnedSocials && creator.pinnedSocials.length > 0 && (
                      <div className="creator-pinned-socials-row">
                        {creator.pinnedSocials.slice(0, 3).map((platform: string) => {
                          const isTelegram = platform.toLowerCase() === 'telegram';
                          const link = isTelegram 
                            ? { platform: 'Telegram', url: creator.telegramUsername ? `https://t.me/${creator.telegramUsername}` : '#' }
                            : creator.socialLinks.find((l: any) => l.platform.toLowerCase() === platform.toLowerCase());
                          
                          if (!link && !isTelegram) return null;

                          let countText = 'NA';
                          if (isTelegram) {
                            const members = creator.telegramMembers;
                            countText = (members !== undefined && members !== null && members > 0) ? formatCount(members) : (creator.telegramUsername ? '0' : 'NA');
                          } else if (link) {
                            if (link.followers !== undefined && link.followers !== null && link.followers > 0) {
                              countText = formatCount(link.followers);
                            } else if (link.followers === 0) {
                              countText = '0';
                            } else {
                              countText = 'NA';
                            }
                          }

                          return (
                            <div 
                              key={platform}
                              className="creator-pinned-pill"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (isTelegram) {
                                  setTelegramModalUser(creator);
                                } else if (link?.url && link.url !== '#') {
                                  window.open(link.url, '_blank');
                                }
                              }}
                              title={`${platform} · ${countText}`}
                            >
                              <div className="creator-pinned-icon-circle">
                                <img 
                                  src={getSocialIcon(platform)} 
                                  alt={platform} 
                                  className="creator-pinned-icon-img"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }} 
                                />
                              </div>
                              <span className="creator-pinned-count">{countText}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom Row: Media Kit + Location */}
                <div className="creator-card-bottom-row">
                  <button
                    className={`creator-media-kit-btn ${creator.hasMediaKit ? 'active-shine' : 'empty-inactive'}`}
                    title={creator.hasMediaKit ? "View Media Kit" : "Media Kit not uploaded"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (creator.hasMediaKit) {
                        setActiveMediaKitCreator(creator);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_awesome</span>
                    <span>Media Kit</span>
                  </button>

                  {creator.location && (
                    <div className="creator-location-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span>
                      <span>{creator.location}</span>
                    </div>
                  )}
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

      {/* Telegram Verified Channels Modal */}
      {telegramModalUser && (
        <VerifiedChannelsModal 
          isOpen={!!telegramModalUser}
          onClose={() => setTelegramModalUser(null)}
          telegramUsername={telegramModalUser.telegramUsername}
          verifiedChannels={telegramModalUser.verifiedChannels || []}
        />
      )}

      {/* Media Kit Viewer Modal for Discover Page */}
      {activeMediaKitCreator && (
        <div className="media-kit-modal-overlay" onClick={() => setActiveMediaKitCreator(null)}>
          <div className="media-kit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="media-kit-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f9c846' }}>auto_awesome</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Media Kit</h3>
              </div>
              <button 
                className="media-kit-close-btn" 
                onClick={() => setActiveMediaKitCreator(null)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>
            
            <p className="media-kit-subtitle">{activeMediaKitCreator.fullName}'s media kit assets</p>
            
            <div className="media-kit-items-list">
              {(activeMediaKitCreator.mediaKitItems || []).map((item: any) => {
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

                    <div className="media-kit-item-actions">
                      {isPdf ? (
                        <>
                          <a
                            href={viewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="media-kit-action-btn view-btn"
                            title="View Document"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                            <span>View</span>
                          </a>
                          <button
                            type="button"
                            className="media-kit-action-btn dl-btn"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                toast.loading('Preparing download...', { id: 'pdf-dl' });
                                await triggerFileDownload(item.image_url, item.title ? `${item.title}.pdf` : 'media-kit.pdf');
                                toast.success('Download started!', { id: 'pdf-dl' });
                              } catch (err) {
                                window.open(item.image_url, '_blank');
                                toast.dismiss('pdf-dl');
                              }
                            }}
                            title="Download Document"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                            <span>Download</span>
                          </button>
                        </>
                      ) : (
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="media-kit-action-btn view-btn"
                          title="View Full Size"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          <span>View</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <VerifiedChannelsModal 
        isOpen={!!telegramModalUser}
        onClose={() => setTelegramModalUser(null)}
        telegramUsername={telegramModalUser?.telegramUsername}
        verifiedChannels={telegramModalUser?.verifiedChannels || []}
      />
    </div>
  );
};

export default DiscoverFeedPage;
