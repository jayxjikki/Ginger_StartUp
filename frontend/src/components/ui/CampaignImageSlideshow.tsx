import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CampaignImageSlideshow.css';

interface CampaignImageSlideshowProps {
  images: string[];
  alt?: string;
  className?: string;
  intervalMs?: number;
  showIndicators?: boolean;
  showBadge?: boolean;
  onClick?: () => void;
  aspectRatio?: string;
}

export const CampaignImageSlideshow: React.FC<CampaignImageSlideshowProps> = ({
  images,
  alt = 'Campaign image',
  className = '',
  intervalMs = 3200,
  showIndicators = true,
  showBadge = false,
  onClick,
  aspectRatio,
}) => {
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

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

  // Multiple images: Automatic Slideshow
  return (
    <div
      className={`campaign-slideshow-container ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={onClick}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={`${currentIndex}-${validImages[currentIndex]}`}
          src={validImages[currentIndex]}
          alt={`${alt} (Photo ${currentIndex + 1} of ${validImages.length})`}
          className="campaign-slideshow-img active"
          initial={{ opacity: 0.2, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.1, scale: 0.99 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          loading="lazy"
        />
      </AnimatePresence>

      {/* Auto-slideshow subtle badge */}
      {showBadge && (
        <div className="campaign-slideshow-badge">
          <span className="slideshow-pulse-dot" />
          <span>{currentIndex + 1} / {validImages.length}</span>
        </div>
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
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignImageSlideshow;
