import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './MediaKitViewer.css';

interface MediaKitViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string; // The URL of the image or PDF
  mediaType: 'image' | 'pdf';
}

const MediaKitViewer: React.FC<MediaKitViewerProps> = ({ isOpen, onClose, mediaUrl, mediaType }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="media-kit-overlay"
          className="media-kit-overlay"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Close button */}
          <button className="media-kit-close-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Media Content */}
          <div className="media-kit-content">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Media Kit" className="media-kit-image" />
            ) : (
              <iframe src={mediaUrl} title="Media Kit PDF" className="media-kit-pdf" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MediaKitViewer;
