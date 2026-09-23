import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiMapPin, FiCheckCircle, FiArrowRight, FiUsers, FiStar } from 'react-icons/fi';
import './FeaturedCreatorsCarousel.css';

export interface FeaturedCreatorItem {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  coverUrl?: string;
  bio?: string;
  location?: string;
  isVerified?: boolean;
  followers?: number;
  followersStr?: string;
  category?: string;
  tagline?: string;
  featuredTitle?: string;
  platforms?: string[];
}

interface FeaturedCreatorsCarouselProps {
  creators: FeaturedCreatorItem[];
  title?: string;
  subtitle?: string;
}

const FeaturedCreatorsCarousel: React.FC<FeaturedCreatorsCarouselProps> = ({
  creators,
  title = 'Featured Creators',
  subtitle = 'Top verified influencers and trending talent'
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use up to 10 top creators
  const featuredList = useMemo(() => {
    return creators.slice(0, 10);
  }, [creators]);

  const count = featuredList.length;

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Autoplay timer
  useEffect(() => {
    if (isHovered || isInteracting || count <= 1) return;

    // Respect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const interval = setInterval(() => {
      handleNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, isInteracting, count, handleNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - (touchStartY || touchEndY);

    // Responsive swipe detection (effortless 28px threshold with horizontal dominance check)
    if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    const resumeTimer = setTimeout(() => setIsInteracting(false), 2500);
    return () => clearTimeout(resumeTimer);
  };

  if (!featuredList || featuredList.length === 0) {
    return null;
  }

  // Calculate 3D card layout position based on offset
  const getCardPosition = (index: number) => {
    let offset = index - currentIndex;

    // Seamless circular wrapping
    if (offset > count / 2) {
      offset -= count;
    } else if (offset < -count / 2) {
      offset += count;
    }

    // Positions: -2, -1, 0, 1, 2
    if (offset === 0) {
      return {
        x: '0%',
        scale: isMobile ? 1.02 : 1.05,
        rotateY: 0,
        opacity: 1,
        dimOpacity: 0,
        zIndex: 10,
        pointerEvents: 'auto' as const,
        isVisible: true
      };
    } else if (offset === -1) {
      return {
        x: isMobile ? '-58%' : '-62%',
        scale: isMobile ? 0.88 : 0.86,
        rotateY: isMobile ? 10 : 18,
        opacity: isMobile ? 0.6 : 0.7,
        dimOpacity: 0.35,
        zIndex: 5,
        pointerEvents: 'auto' as const,
        isVisible: true
      };
    } else if (offset === 1) {
      return {
        x: isMobile ? '58%' : '62%',
        scale: isMobile ? 0.88 : 0.86,
        rotateY: isMobile ? -10 : -18,
        opacity: isMobile ? 0.6 : 0.7,
        dimOpacity: 0.35,
        zIndex: 5,
        pointerEvents: 'auto' as const,
        isVisible: true
      };
    } else if (offset === -2) {
      return {
        x: isMobile ? '-98%' : '-108%',
        scale: 0.74,
        rotateY: isMobile ? 16 : 26,
        opacity: 0.25,
        dimOpacity: 0.65,
        zIndex: 2,
        pointerEvents: 'none' as const,
        isVisible: true
      };
    } else if (offset === 2) {
      return {
        x: isMobile ? '98%' : '108%',
        scale: 0.74,
        rotateY: isMobile ? -16 : -26,
        opacity: 0.25,
        dimOpacity: 0.65,
        zIndex: 2,
        pointerEvents: 'none' as const,
        isVisible: true
      };
    }

    return {
      x: offset > 0 ? '150%' : '-150%',
      scale: 0.6,
      rotateY: offset > 0 ? -30 : 30,
      opacity: 0,
      dimOpacity: 0.9,
      zIndex: 0,
      pointerEvents: 'none' as const,
      isVisible: false
    };
  };

  return (
    <section 
      className="featured-carousel-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Featured Creators Carousel"
    >
      {/* Header */}
      <div className="featured-carousel-header">
        <div className="featured-header-title-row">
          <div className="featured-badge-icon">
            <FiStar size={13} className="sparkle-icon" />
            <span>TOP PICKS</span>
          </div>
          <h2 className="featured-carousel-title">{title}</h2>
        </div>
        <p className="featured-carousel-subtitle">{subtitle}</p>
      </div>

      {/* 3D Carousel Stage */}
      <div 
        className="carousel-3d-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Chevrons */}
        {count > 1 && (
          <>
            <button
              type="button"
              className="carousel-nav-btn prev"
              onClick={handlePrev}
              aria-label="Previous creator"
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="carousel-nav-btn next"
              onClick={handleNext}
              aria-label="Next creator"
            >
              <FiChevronRight size={22} />
            </button>
          </>
        )}

        {/* 3D Cards Container */}
        <div className="carousel-cards-track">
          {featuredList.map((creator, index) => {
            const pos = getCardPosition(index);
            const isActive = index === currentIndex;
            const primaryCategory = (creator.category || 'Creator').split(',')[0].trim();
            const formattedHandle = creator.handle 
              ? (creator.handle.startsWith('@') ? creator.handle : `@${creator.handle}`)
              : '';

            const posterTitle = creator.featuredTitle || primaryCategory.toUpperCase();

            return (
              <motion.div
                key={creator.id}
                className={`carousel-card-3d ${isActive ? 'is-active' : ''}`}
                animate={{
                  x: pos.x,
                  scale: pos.scale,
                  rotateY: pos.rotateY,
                  opacity: pos.opacity,
                  zIndex: pos.zIndex,
                }}
                transition={{
                  duration: pos.isVisible ? 0.38 : 0, // Instant transition for wrapping invisible cards so they never sweep across the screen
                  ease: [0.25, 1, 0.5, 1], // Snappy and butter-smooth ease
                }}
                style={{
                  pointerEvents: pos.pointerEvents,
                }}
                onClick={() => {
                  if (isActive) {
                    navigate(`/profile/${creator.id}`);
                  } else {
                    setCurrentIndex(index);
                  }
                }}
                role="button"
                tabIndex={isActive ? 0 : -1}
                aria-label={`View ${creator.fullName}'s profile`}
              >
                {/* Poster Artwork Cover Background */}
                <div 
                  className="card-bg-artwork"
                  style={{
                    backgroundImage: `url(${creator.coverUrl || creator.avatarUrl})`
                  }}
                >
                  <div className="card-gradient-overlay" />
                  <div className="card-darken-overlay" style={{ opacity: pos.dimOpacity }} />
                </div>

                {/* Editorial Top Section (Inspired by reference videos) */}
                <div className="card-top-editorial">
                  <div className="card-top-tags">
                    <span className="card-category-pill">{primaryCategory}</span>
                    {creator.isVerified !== false && (
                      <span className="card-verified-badge" title="Verified Creator">
                        <FiCheckCircle size={13} />
                      </span>
                    )}
                  </div>
                  <h3 className="card-editorial-title">{posterTitle}</h3>
                  {creator.tagline && (
                    <p className="card-editorial-tagline">{creator.tagline}</p>
                  )}
                </div>

                {/* Card Bottom Creator Info */}
                <div className="card-bottom-info">
                  <div className="card-creator-row">
                    <img 
                      src={creator.avatarUrl} 
                      alt={creator.fullName} 
                      className="card-creator-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
                      }}
                    />
                    <div className="card-creator-meta">
                      <div className="card-name-line">
                        <span className="card-creator-name">{creator.fullName}</span>
                      </div>
                      <span className="card-creator-handle">{formattedHandle}</span>
                    </div>
                  </div>

                  <div className="card-details-strip">
                    {creator.followersStr ? (
                      <span className="card-stat-chip">
                        <FiUsers size={12} />
                        {creator.followersStr}
                      </span>
                    ) : creator.followers ? (
                      <span className="card-stat-chip">
                        <FiUsers size={12} />
                        {creator.followers >= 1000 
                          ? `${(creator.followers / 1000).toFixed(1)}M` 
                          : `${creator.followers}K`}
                      </span>
                    ) : null}

                    {creator.location && (
                      <span className="card-location-chip" title={creator.location}>
                        <FiMapPin size={11} />
                        <span className="location-text">{creator.location.split(',')[0]}</span>
                      </span>
                    )}
                  </div>

                  {/* Action Link button */}
                  <button 
                    type="button"
                    className="card-view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${creator.id}`);
                    }}
                  >
                    <span>View Profile</span>
                    <FiArrowRight size={14} className="btn-arrow" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pagination Indicators */}
        {count > 1 && (
          <div className="carousel-dots-wrap">
            {featuredList.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                className={`carousel-dot ${dotIdx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(dotIdx)}
                aria-label={`Jump to creator ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCreatorsCarousel;
