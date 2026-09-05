import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './CampaignImageSlideshow.css';

export interface CampaignImageSlideshowProps {
  images: string[];
  alt?: string;
  className?: string;
  intervalMs?: number;
  showIndicators?: boolean;
  showBadge?: boolean;
  showNavArrows?: boolean;
  onClick?: () => void;
  aspectRatio?: string;
}

export const CampaignImageSlideshow: React.FC<CampaignImageSlideshowProps> = ({
  images,
  alt = 'Campaign image',
  className = '',
  intervalMs = 3500,
  showIndicators = true,
  showBadge = false,
  showNavArrows = false,
  onClick,
  aspectRatio,
}) => {
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // Touch swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-advance slideshow when more than 1 image is provided
  useEffect(() => {
    if (validImages.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [validImages.length, intervalMs, isPaused]);

  // Reset index if validImages length changes
  useEffect(() => {
    if (currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [validImages.length, currentIndex]);

  if (validImages.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 45) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
      } else if (diff < -45) {
        // Swiped right -> prev
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Single image: Render directly without slideshow wrapper overhead
  if (validImages.length === 1) {
    return (
      <div 
        className={`campaign-single-image-wrapper ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
        onClick={onClick}
      >
        <img
          src={validImages[0]}
          alt={alt}
          className="campaign-slideshow-img"
          loading="lazy"
        />
      </div>
    );
  }

  // Multiple images: Interactive Automatic Slideshow
  return (
    <div
      className={`campaign-slideshow-container ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={`${currentIndex}-${validImages[currentIndex]}`}
          src={validImages[currentIndex]}
          alt={`${alt} (Photo ${currentIndex + 1} of ${validImages.length})`}
          className="campaign-slideshow-img active"
          initial={{ opacity: 0.15, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.1, scale: 0.98 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          loading="lazy"
        />
      </AnimatePresence>

      {/* Bottom subtle gradient scrim for legibility */}
      <div className="campaign-slideshow-scrim" />

      {/* Top-right count badge (e.g. "1 / 3") */}
      {showBadge && (
        <div className="campaign-slideshow-badge">
          <span className="slideshow-pulse-dot" />
          <span>{currentIndex + 1} / {validImages.length}</span>
        </div>
      )}

      {/* Manual Left/Right Navigation Arrows */}
      {showNavArrows && validImages.length > 1 && (
        <>
          <button
            type="button"
            className="slideshow-nav-btn slideshow-nav-prev"
            onClick={handlePrev}
            aria-label="Previous photo"
          >
            <FiChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="slideshow-nav-btn slideshow-nav-next"
            onClick={handleNext}
            aria-label="Next photo"
          >
            <FiChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showIndicators && validImages.length > 1 && (
        <div 
          className="campaign-slideshow-indicators" 
          onClick={(e) => e.stopPropagation()}
        >
          {validImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`slideshow-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignImageSlideshow;
