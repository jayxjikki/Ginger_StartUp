import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiDownload, FiX } from 'react-icons/fi';
import { triggerFileDownload, getVideoThumbnailUrl } from '../../lib/cloudinary';
import toast from 'react-hot-toast';
import './CampaignVideoSlideshow.css';

export interface CampaignVideoSlideshowProps {
  videos: string[];
  thumbnails?: string[];
  title?: string;
  className?: string;
  aspectRatio?: string;
}

export const CampaignVideoSlideshow: React.FC<CampaignVideoSlideshowProps> = ({
  videos,
  thumbnails = [],
  title = 'Campaign Video',
  className = '',
  aspectRatio = '16/9',
}) => {
  const validVideos = Array.isArray(videos) ? videos.filter(Boolean) : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedThumbs, setGeneratedThumbs] = useState<Record<number, string>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const currentVideo = validVideos[currentIndex];
  const currentThumb =
    thumbnails[currentIndex] ||
    generatedThumbs[currentIndex] ||
    getVideoThumbnailUrl(currentVideo);

  // Auto-extract thumbnail frame from video if no thumbnail is available
  useEffect(() => {
    if (!currentThumb && currentVideo && !generatedThumbs[currentIndex]) {
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.crossOrigin = 'anonymous';
      vid.src = currentVideo;
      vid.muted = true;
      vid.playsInline = true;

      vid.onloadeddata = () => {
        vid.currentTime = Math.min(0.5, Math.max(0, (vid.duration || 1) / 2));
      };

      vid.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = vid.videoWidth || 640;
          canvas.height = vid.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setGeneratedThumbs((prev) => ({ ...prev, [currentIndex]: dataUrl }));
          }
        } catch {
          // CORS or cross-origin canvas issue; fallback handled in UI
        }
      };
    }
  }, [currentIndex, currentVideo, currentThumb, generatedThumbs]);

  if (validVideos.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + validVideos.length) % validVideos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % validVideos.length);
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
      if (diff > 45 && validVideos.length > 1) {
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % validVideos.length);
      } else if (diff < -45 && validVideos.length > 1) {
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + validVideos.length) % validVideos.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentVideo) return;
    try {
      setIsDownloading(true);
      toast.loading('Starting video download...', { id: 'video-download' });
      const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
      const filename = `${safeTitle}-video-${currentIndex + 1}.mp4`;
      await triggerFileDownload(currentVideo, filename);
      toast.success('Video downloaded!', { id: 'video-download' });
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Download failed. Opening video in new tab.', { id: 'video-download' });
      window.open(currentVideo, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
  };

  const handleStopVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      className={`campaign-video-slideshow-container ${className}`}
      style={{ aspectRatio }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top-Right Download Button ── */}
      <button
        type="button"
        className="video-download-btn"
        onClick={handleDownload}
        disabled={isDownloading}
        title="Download Video"
        aria-label="Download Video"
      >
        <FiDownload size={18} />
        <span className="download-btn-text">Download</span>
      </button>

      {/* ── Video Badge (Top Left) ── */}
      <div className="video-count-badge">
        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
          videocam
        </span>
        <span>
          {validVideos.length > 1
            ? `Video ${currentIndex + 1}/${validVideos.length}`
            : 'Video Ad'}
        </span>
      </div>

      {/* ── Video Content / Thumbnail ── */}
      <div className="video-player-frame">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key={`playing-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="active-video-wrapper"
            >
              <video
                ref={videoRef}
                src={currentVideo}
                controls
                autoPlay
                playsInline
                className="campaign-native-video"
                onEnded={() => setIsPlaying(false)}
              />
              <button
                type="button"
                className="video-close-btn"
                onClick={handleStopVideo}
                title="Exit video playback"
              >
                <FiX size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`thumb-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="video-thumbnail-wrapper"
              onClick={handlePlayClick}
            >
              {currentThumb ? (
                <img
                  src={currentThumb}
                  alt={`${title} video thumbnail`}
                  className="video-thumbnail-img"
                  loading="lazy"
                />
              ) : (
                <div className="video-thumbnail-fallback">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '48px', color: '#F59E0B' }}
                  >
                    movie
                  </span>
                </div>
              )}

              {/* ── Center Play Logo / Icon ── */}
              <div className="video-play-overlay">
                <div className="video-play-button" title="Click to play video">
                  <span className="material-symbols-outlined play-icon">play_arrow</span>
                </div>
                <span className="video-play-hint">Tap to play video</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Slideshow Controls (when 2 videos exist) ── */}
      {validVideos.length > 1 && (
        <>
          <button
            type="button"
            className="video-nav-arrow prev"
            onClick={handlePrev}
            aria-label="Previous video"
          >
            <FiChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="video-nav-arrow next"
            onClick={handleNext}
            aria-label="Next video"
          >
            <FiChevronRight size={22} />
          </button>

          {/* Indicators */}
          <div className="video-indicators-row">
            {validVideos.map((_, idx) => (
              <button
                type="button"
                key={idx}
                className={`video-indicator-dot ${currentIndex === idx ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to video ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignVideoSlideshow;
