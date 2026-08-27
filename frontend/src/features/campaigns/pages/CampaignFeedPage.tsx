// ═══════════════════════════════════════════════════════════
// GINGER — Home Menu (Campaigns)
// ═══════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaignStore } from '../../../store/campaignStore';
import { useUgcStore } from '../../../store/ugcStore';
import { formatCurrency, formatCount, formatTimeLeft } from '../../../utils/formatters';
import './CampaignFeedPage.css';

const HomeMenuPage: React.FC = () => {
  const slideshowRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const {
    filteredCampaigns,
    slideshows,
    filters,
    setFilters,
    isLoading,
    fetchCampaigns,
  } = useCampaignStore();

  useEffect(() => {
    // Reset filters on mount to ensure clean slate when switching tabs
    setFilters({
      search: '',
      location: '',
      type: '',
      minPayout: 0,
      maxPayout: 0,
      platform: '',
      category: '',
      sortBy: 'newest',
    });
    fetchCampaigns();
    
    // Also reset if the tab is clicked again
    const handleTabReset = () => {
      setFilters({
        search: '',
        location: '',
        type: '',
        minPayout: 0,
        maxPayout: 0,
        platform: '',
        category: '',
        sortBy: 'newest',
      });
    };
    window.addEventListener('reset-clipping-filters', handleTabReset);
    return () => window.removeEventListener('reset-clipping-filters', handleTabReset);
  }, [fetchCampaigns, setFilters]);

  // Slideshow Logic
  useEffect(() => {
    const container = slideshowRef.current;
    if (!container || slideshows.length === 0) return;

    let autoSlideInterval: ReturnType<typeof setInterval>;

    const nextSlide = () => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % slideshows.length;
        container.scrollTo({ left: container.clientWidth * next, behavior: 'smooth' });
        return next;
      });
    };

    const startAutoSlide = () => {
      autoSlideInterval = setInterval(nextSlide, 4000);
    };

    const stopAutoSlide = () => {
      if (autoSlideInterval) clearInterval(autoSlideInterval);
    };

    startAutoSlide();

    // Intersection observer for manual scroll updates
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1) setCurrentSlide(index);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((slide) => observer.observe(slide));

    container.addEventListener('mouseenter', stopAutoSlide);
    container.addEventListener('mouseleave', startAutoSlide);
    container.addEventListener('touchstart', stopAutoSlide, { passive: true });
    container.addEventListener('touchend', startAutoSlide, { passive: true });

    return () => {
      stopAutoSlide();
      observer.disconnect();
      container.removeEventListener('mouseenter', stopAutoSlide);
      container.removeEventListener('mouseleave', startAutoSlide);
      container.removeEventListener('touchstart', stopAutoSlide);
      container.removeEventListener('touchend', startAutoSlide);
    };
  }, [slideshows.length]);

  const handleIndicatorClick = (index: number) => {
    if (slideshowRef.current) {
      slideshowRef.current.scrollTo({
        left: slideshowRef.current.clientWidth * index,
        behavior: 'smooth',
      });
      setCurrentSlide(index);
    }
  };

  const getCampaignTypeColor = (type: string) => {
    switch (type) {
      case 'pool': return 'blue';
      case 'discount': return 'emerald';
      case 'hybrid': return 'purple';
      default: return 'blue';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'pool': return 'monetization_on';
      case 'discount': return 'sell';
      case 'hybrid': return 'bolt';
      default: return 'monetization_on';
    }
  };

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case 'pool': return 'Prize Pool';
      case 'discount': return 'Discount';
      case 'hybrid': return 'Hybrid';
      default: return type;
    }
  };

  return (
    <div className="home-menu-page">
      {/* Header Section */}
      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="home-title">Campaigns</h1>
          <p className="home-subtitle">Create videos & earn money</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button 
            className="icon-btn" 
            style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: '#e5e2e1' }}
            onClick={() => navigate('/campaigns/joined')} 
            title="Recent Joined Campaigns"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment_turned_in</span>
          </button>
          <button 
            className="icon-btn" 
            style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: '#e5e2e1' }}
            onClick={() => navigate('/manage-campaigns')} 
            title="Manage Created Campaigns"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>store</span>
          </button>
          <button 
            className="icon-btn" 
            style={{ position: 'relative', width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: '#e5e2e1' }}
            onClick={() => navigate('/inbox')}
            title="Chats"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
            <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', border: '2px solid #0C0C0C' }}></span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        {/* Search & Filter */}
        <div className="search-container">
          <div className="search-bar">
            <span className="material-symbols-outlined text-secondary">search</span>
            <input
              className="search-input"
              placeholder="Search campaigns, keywords..."
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>
          <button className="filter-btn">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="home-filter-chips">
          <button 
            className={`home-filter-chip ${filters.sortBy === 'newest' ? 'active' : ''}`}
            onClick={() => setFilters({ sortBy: 'newest' })}
          >
            Newest
          </button>
          <button 
            className={`home-filter-chip ${filters.sortBy === 'highest_pool' ? 'active' : ''}`}
            onClick={() => setFilters({ sortBy: 'highest_pool' })}
          >
            Top Prize
          </button>
          <button 
            className={`home-filter-chip ${filters.sortBy === 'ending_soon' ? 'active' : ''}`}
            onClick={() => setFilters({ sortBy: 'ending_soon' })}
          >
            Ending Soon
          </button>
          <button 
            className={`home-filter-chip ${filters.sortBy === 'most_submissions' ? 'active' : ''}`}
            onClick={() => setFilters({ sortBy: 'most_submissions' })}
          >
            Popular
          </button>
        </div>

        {/* Slideshow Section */}
        {slideshows.length > 0 && (
          <div className="slideshow-wrapper">
            <div className="slideshow-container" ref={slideshowRef}>
              {slideshows.map((slide) => {
                const SlideContent = (
                  <>
                    <div className={`slide-gradient ${slide.theme_color}`}></div>
                    <img
                      alt={slide.title}
                      className="slide-img"
                      src={slide.image_url}
                    />
                    <div className="slide-content">
                      <span className={`slide-badge ${slide.theme_color}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          {slide.badge_icon}
                        </span>{' '}
                        {slide.badge_text}
                      </span>
                      <h2 className="slide-title">{slide.title}</h2>
                      <p className="slide-subtitle">{slide.subtitle}</p>
                    </div>
                  </>
                );

                if (slide.link_url) {
                  return (
                    <a 
                      key={slide.id} 
                      href={slide.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="slide cursor-pointer block"
                    >
                      {SlideContent}
                    </a>
                  );
                }

                return (
                  <div className="slide" key={slide.id}>
                    {SlideContent}
                  </div>
                );
              })}
            </div>
            
            <div className="slideshow-indicators">
              {slideshows.map((_, index) => (
                <button 
                  key={index}
                  className={`indicator ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => handleIndicatorClick(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Campaign List */}
        <div className="campaign-list">
          {isLoading ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading campaigns...</div>
          ) : (() => {
            const { blockedUserIds, blockedByThemIds } = useUgcStore.getState();
            const allBlocked = new Set([...blockedUserIds, ...blockedByThemIds]);
            const visibleCampaigns = filteredCampaigns.filter(c => !allBlocked.has(c.advertiser_id));
            
            if (visibleCampaigns.length === 0) {
              return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>No campaigns found.</div>;
            }

            return visibleCampaigns.map((campaign) => {
              const themeColor = getCampaignTypeColor(campaign.type);
              
              return (
                <article 
                  className="campaign-item" 
                  key={campaign.id}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {campaign.image_url && (
                    <div className="campaign-images">
                      <img
                        alt={campaign.title}
                        className="campaign-img"
                        src={campaign.image_url}
                      />
                    </div>
                  )}
                  
                  <div className="campaign-content">
                    <div className="campaign-header-row">
                      <div className="campaign-tags">
                        <span className={`tag-badge ${themeColor}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                            {getCampaignTypeIcon(campaign.type)}
                          </span>{' '}
                          {getCampaignTypeLabel(campaign.type)}
                        </span>
                        <span className="tag-expired">{formatTimeLeft(campaign.end_date)}</span>
                      </div>
                      {campaign.prize_pool > 0 && (
                        <div className="campaign-prize-col">
                          <div className="campaign-prize-label">PRIZE POOL</div>
                          <div className="campaign-prize-amount">{formatCurrency(campaign.prize_pool, true)}</div>
                        </div>
                      )}
                    </div>

                    <h3 className="campaign-card-title">{campaign.title}</h3>
                    <p className="campaign-card-desc">{campaign.description}</p>

                    <div className="campaign-footer-row">
                      <div className="campaign-brand">
                        <div className="brand-logo">
                          {campaign.advertiser?.avatar_url ? (
                            <img
                              alt={campaign.advertiser.full_name}
                              src={campaign.advertiser.avatar_url}
                            />
                          ) : (
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>
                              store
                            </span>
                          )}
                        </div>
                        <span className="brand-name">{campaign.advertiser?.full_name || 'Advertiser'}</span>
                      </div>
                      {campaign.payout_tiers && campaign.payout_tiers.length > 0 && (
                        <div className="campaign-payout-tiers">
                          {campaign.payout_tiers.slice(0, 2).map((tier) => (
                            <span className="payout-tier" key={tier.id}>
                              {formatCount(tier.min_views)} -&gt; {formatCurrency(tier.payout_amount, true)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            });
          })()}
        </div>
      </main>
    </div>
  );
};

export default HomeMenuPage;
