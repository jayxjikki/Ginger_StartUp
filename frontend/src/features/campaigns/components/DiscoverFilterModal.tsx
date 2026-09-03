// ═══════════════════════════════════════════════════════════
// GINGER — Discover Filter Modal
// Advanced filters with dual-range sliders and India states & cities
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DualRangeSlider from '../../../components/ui/DualRangeSlider';
import { INDIAN_STATES_AND_CITIES, ALL_INDIAN_STATES } from '../../../lib/indianLocations';
import './DiscoverFilterModal.css';

export interface FilterState {
  platforms: string[]; // 'youtube', 'instagram', 'tiktok', 'telegram'
  minFollowers: number; // in thousands (0 to 10000)
  maxFollowers: number; // in thousands (0 to 10000)
  minRate: number; // in thousands (0 to 500)
  maxRate: number; // in thousands (0 to 500)
  state?: string;
  city?: string;
  location: string;
}

interface DiscoverFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const PLATFORM_OPTIONS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'telegram', label: 'Telegram' },
];

const DiscoverFilterModal: React.FC<DiscoverFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply,
  currentFilters 
}) => {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [selectedState, setSelectedState] = useState<string>(currentFilters.state || '');
  const [selectedCity, setSelectedCity] = useState<string>(currentFilters.city || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
      setSelectedState(currentFilters.state || '');
      setSelectedCity(currentFilters.city || '');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, currentFilters]);

  if (!mounted) return null;

  const togglePlatform = (platformId: string) => {
    setFilters(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedCity('');
    setFilters(prev => ({
      ...prev,
      state: stateName,
      city: '',
      location: stateName
    }));
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setFilters(prev => ({
      ...prev,
      city: cityName,
      location: cityName || selectedState
    }));
  };

  const handleFollowersChange = (vals: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      minFollowers: vals[0],
      maxFollowers: vals[1]
    }));
  };

  const handleRateChange = (vals: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      minRate: vals[0],
      maxRate: vals[1]
    }));
  };

  const formatFollowers = (valInThousands: number, isMax?: boolean) => {
    if (valInThousands === 0) return '0';
    if (valInThousands >= 10000 && isMax) return '10M+';
    if (valInThousands >= 1000) {
      const millions = (valInThousands / 1000).toFixed(1).replace(/\.0$/, '');
      return `${millions}M`;
    }
    return `${valInThousands.toLocaleString()}K`;
  };

  const formatRate = (valInThousands: number, isMax?: boolean) => {
    const rupees = valInThousands * 1000;
    if (rupees === 0) return '₹0';
    if (valInThousands >= 500 && isMax) return '₹500,000+';
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  const handleClear = () => {
    const cleared: FilterState = {
      platforms: [],
      minFollowers: 0,
      maxFollowers: 10000,
      minRate: 0,
      maxRate: 500,
      state: '',
      city: '',
      location: ''
    };
    setFilters(cleared);
    setSelectedState('');
    setSelectedCity('');
  };

  const handleApply = () => {
    onApply({
      ...filters,
      state: selectedState,
      city: selectedCity,
      location: selectedCity || selectedState
    });
    onClose();
  };

  // Cities available for current state or major top cities
  const availableCities = selectedState && INDIAN_STATES_AND_CITIES[selectedState]
    ? INDIAN_STATES_AND_CITIES[selectedState]
    : [
        'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
        'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
        'Kochi', 'Surat', 'Bhopal', 'Nagpur', 'Patna', 'Ranchi', 'Jamshedpur'
      ];

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
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div 
            key="filter-sheet"
            className="filter-modal-sheet liquid-card"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="filter-drag-handle">
              <div className="filter-drag-indicator" />
            </div>

            <div className="filter-header">
              <h2 className="filter-title">Filters</h2>
              <button className="filter-clear-btn" onClick={handleClear} type="button">
                Clear All
              </button>
            </div>

            <div className="filter-body hide-scrollbar">
              
              {/* 1. Social Platforms */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <h3 className="filter-section-title">Social Platforms</h3>
                  <span className="filter-section-hint">Filter creators by active accounts</span>
                </div>
                <div className="filter-chips">
                  {PLATFORM_OPTIONS.map(p => {
                    const isActive = filters.platforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`filter-chip ${isActive ? 'active' : ''}`}
                        onClick={() => togglePlatform(p.id)}
                      >
                        <span className={`chip-dot ${isActive ? 'active' : ''}`} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Followers Range Slider */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <h3 className="filter-section-title">Followers Count</h3>
                  <span className="filter-section-hint">Drag sliders to adjust follower range</span>
                </div>
                <DualRangeSlider
                  min={0}
                  max={10000}
                  step={10}
                  value={[filters.minFollowers, filters.maxFollowers]}
                  onChange={handleFollowersChange}
                  formatValue={formatFollowers}
                  unitSuffix=" Followers"
                />
              </div>

              {/* 3. Rate Per Post Range Slider */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <h3 className="filter-section-title">Rate Per Post (₹)</h3>
                  <span className="filter-section-hint">Slide to match your budget per sponsored post</span>
                </div>
                <DualRangeSlider
                  min={0}
                  max={500}
                  step={5}
                  value={[filters.minRate, filters.maxRate]}
                  onChange={handleRateChange}
                  formatValue={formatRate}
                />
              </div>

              {/* 4. Location: Indian States & Cities */}
              <div className="filter-section">
                <div className="filter-section-header">
                  <h3 className="filter-section-title">Location (India)</h3>
                  <span className="filter-section-hint">Select by State and City</span>
                </div>

                <div className="filter-location-grid">
                  {/* State Select */}
                  <div className="filter-select-group">
                    <label className="filter-field-label">State / Union Territory</label>
                    <select 
                      className="filter-select"
                      value={selectedState}
                      onChange={(e) => handleStateChange(e.target.value)}
                    >
                      <option value="">All States (All India)</option>
                      {ALL_INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* City Select */}
                  <div className="filter-select-group">
                    <label className="filter-field-label">
                      {selectedState ? `City in ${selectedState}` : 'City'}
                    </label>
                    <select 
                      className="filter-select"
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                    >
                      <option value="">
                        {selectedState ? `All Cities in ${selectedState}` : 'All Cities'}
                      </option>
                      {availableCities.map(ct => (
                        <option key={ct} value={ct}>{ct}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            <div className="filter-footer">
              <button 
                className="liquid-btn apply-filters-btn" 
                onClick={handleApply}
                type="button"
              >
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
