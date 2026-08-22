import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './DiscoverFilterModal.css';

export interface FilterState {
  platforms: string[]; // 'youtube', 'instagram', 'tiktok'
  minFollowers: number; // in thousands
  maxFollowers: number; // in thousands
  minRate: number; // in thousands
  maxRate: number; // in thousands
  location: string;
}

interface DiscoverFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const DiscoverFilterModal: React.FC<DiscoverFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply,
  currentFilters 
}) => {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore background scrolling
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, currentFilters]);

  if (!mounted) return null;

  const togglePlatform = (platform: string) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleClear = () => {
    const cleared: FilterState = {
      platforms: [],
      minFollowers: 0,
      maxFollowers: 10000,
      minRate: 0,
      maxRate: 500,
      location: ''
    };
    setFilters(cleared);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="filter-modal-container">
          {/* Backdrop */}
          <motion.div 
            key="filter-backdrop"
            className="filter-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div 
            key="filter-sheet"
            className="filter-modal-sheet liquid-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="filter-drag-handle">
              <div className="filter-drag-indicator"></div>
            </div>

            <div className="filter-header">
              <h2 className="filter-title">Filters</h2>
              <button className="filter-clear-btn" onClick={handleClear}>Clear All</button>
            </div>

            <div className="filter-body hide-scrollbar">
              
              {/* Platforms */}
              <div className="filter-section">
                <h3 className="filter-section-title">Social Platforms</h3>
                <div className="filter-chips">
                  {['instagram', 'youtube', 'tiktok'].map(platform => (
                    <button
                      key={platform}
                      className={`filter-chip ${filters.platforms.includes(platform) ? 'active' : ''}`}
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Followers */}
              <div className="filter-section">
                <h3 className="filter-section-title">Followers</h3>
                <div className="filter-range-inputs">
                  <div className="filter-input-group">
                    <label>Min</label>
                    <select 
                      className="filter-select"
                      value={filters.minFollowers}
                      onChange={(e) => setFilters(prev => ({ ...prev, minFollowers: Number(e.target.value) }))}
                    >
                      <option value={0}>Any</option>
                      <option value={10}>10K</option>
                      <option value={50}>50K</option>
                      <option value={100}>100K</option>
                      <option value={500}>500K</option>
                      <option value={1000}>1M</option>
                    </select>
                  </div>
                  <div className="filter-input-group">
                    <label>Max</label>
                    <select 
                      className="filter-select"
                      value={filters.maxFollowers}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxFollowers: Number(e.target.value) }))}
                    >
                      <option value={10000}>Any</option>
                      <option value={50}>50K</option>
                      <option value={100}>100K</option>
                      <option value={500}>500K</option>
                      <option value={1000}>1M</option>
                      <option value={5000}>5M</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Post Rate */}
              <div className="filter-section">
                <h3 className="filter-section-title">Rate Per Post (₹)</h3>
                <div className="filter-range-inputs">
                  <div className="filter-input-group">
                    <label>Min (₹)</label>
                    <select 
                      className="filter-select"
                      value={filters.minRate}
                      onChange={(e) => setFilters(prev => ({ ...prev, minRate: Number(e.target.value) }))}
                    >
                      <option value={0}>Any</option>
                      <option value={5}>5K</option>
                      <option value={10}>10K</option>
                      <option value={20}>20K</option>
                      <option value={50}>50K</option>
                    </select>
                  </div>
                  <div className="filter-input-group">
                    <label>Max (₹)</label>
                    <select 
                      className="filter-select"
                      value={filters.maxRate}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxRate: Number(e.target.value) }))}
                    >
                      <option value={500}>Any</option>
                      <option value={10}>10K</option>
                      <option value={20}>20K</option>
                      <option value={50}>50K</option>
                      <option value={100}>100K</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="filter-section">
                <h3 className="filter-section-title">Location</h3>
                <select 
                  className="filter-select full-width"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                >
                  <option value="">Any Location</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Pune">Pune</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Kolkata">Kolkata</option>
                </select>
              </div>

            </div>

            <div className="filter-footer">
              <button className="liquid-btn apply-filters-btn" onClick={handleApply}>
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DiscoverFilterModal;
