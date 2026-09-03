// ═══════════════════════════════════════════════════════════
// GINGER — Location Campaign Map Modal ("Pokémon GO / Uber" Style)
// Interactive pixel-animated radar map with live geolocation & local sponsorships
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Campaign } from '../../../types/campaign.types';
import { 
  type Coordinates, 
  DEFAULT_COORDINATES, 
  INDIAN_CITY_COORDINATES, 
  calculateDistanceKm, 
  resolveCoordinates 
} from '../../../utils/geoLocations';
import { INDIAN_STATES_AND_CITIES } from '../../../lib/indianLocations';
import { MapCampaignCard } from './MapCampaignCard';
import ChatModal from '../../../components/ui/ChatModal';
import toast from 'react-hot-toast';
import './LocationCampaignMapModal.css';

interface LocationCampaignMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
}

interface MappedCampaignPin {
  campaign: Campaign;
  coords: Coordinates;
  distanceKm: number;
  // Normalized visual X & Y coordinates on canvas relative to user center
  offsetX: number;
  offsetY: number;
}

export const LocationCampaignMapModal: React.FC<LocationCampaignMapModalProps> = ({
  isOpen,
  onClose,
  campaigns,
}) => {
  // Geolocation state
  const [userLocation, setUserLocation] = useState<Coordinates>(DEFAULT_COORDINATES);
  const [userCityName, setUserCityName] = useState<string>('Jamshedpur');
  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isLocating, setIsLocating] = useState(false);

  // Map interactive state
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.7x to 2.0x
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filters
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(50); // km

  // Selected campaign for card preview
  const [selectedPin, setSelectedPin] = useState<MappedCampaignPin | null>(null);

  // Direct chat with campaign owner
  const [activeChatRecipient, setActiveChatRecipient] = useState<{
    id: string;
    name: string;
    avatar: string | null;
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Automatically attempt to locate user when opened for the first time
      if (gpsStatus === 'prompt') {
        requestUserLocation();
      }
    } else {
      document.body.style.overflow = '';
      setSelectedPin(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Request browser geolocation
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setGpsStatus('granted');
        setIsLocating(false);

        // Find closest recognized city name for display
        let closestCity = 'Your Location';
        let minD = Infinity;
        for (const [name, c] of Object.entries(INDIAN_CITY_COORDINATES)) {
          const d = calculateDistanceKm(coords.lat, coords.lng, c.lat, c.lng);
          if (d < minD) {
            minD = d;
            closestCity = name.charAt(0).toUpperCase() + name.slice(1);
          }
        }
        setUserCityName(closestCity);
        toast.success(`Location locked: ${closestCity}!`);
      },
      (error) => {
        console.warn('Geolocation denied or error:', error.message);
        setGpsStatus('denied');
        setIsLocating(false);
        toast('Using Jamshedpur center. You can select another city anytime.', { icon: '📍' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Change city manually
  const handleCitySelect = (cityName: string) => {
    const lower = cityName.toLowerCase();
    const found = INDIAN_CITY_COORDINATES[lower];
    if (found) {
      setUserLocation(found);
      setUserCityName(cityName);
      setPanOffset({ x: 0, y: 0 });
      toast.success(`Switched map to ${cityName}`);
    }
  };

  // Process and project location-based campaigns
  const mappedPins: MappedCampaignPin[] = useMemo(() => {
    const list: MappedCampaignPin[] = [];

    campaigns.forEach((camp) => {
      // Must have a location that isn't empty
      if (!camp.location || camp.location.toLowerCase() === 'online') {
        return;
      }

      const coords = resolveCoordinates(camp.location, camp.id, userLocation);
      if (!coords) return;

      const distanceKm = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        coords.lat,
        coords.lng
      );

      // Filter by radius
      if (activeRadiusKm > 0 && distanceKm > activeRadiusKm) {
        return;
      }

      // Filter by type
      if (activeTypeFilter !== 'all' && camp.type !== activeTypeFilter) {
        return;
      }

      // Convert geo delta (km) to pixel offset on canvas (scale factor)
      // 1 km ~= 18 pixels at 1x zoom
      const deltaLatKm = (coords.lat - userLocation.lat) * 111;
      const deltaLngKm = (coords.lng - userLocation.lng) * (111 * Math.cos(userLocation.lat * (Math.PI / 180)));

      // Note: screen Y is inverted compared to latitude (North is negative Y)
      const scale = 22; // px per km
      const offsetX = deltaLngKm * scale;
      const offsetY = -deltaLatKm * scale;

      list.push({
        campaign: camp,
        coords,
        distanceKm,
        offsetX,
        offsetY,
      });
    });

    // Sort closest first
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [campaigns, userLocation, activeRadiusKm, activeTypeFilter]);

  // Handle Pan Events
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Recenter map
  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setSelectedPin(null);
  };

  // Open direct chat
  const handleOpenChat = (ownerId: string, ownerName: string, ownerAvatar: string | null) => {
    setActiveChatRecipient({ id: ownerId, name: ownerName, avatar: ownerAvatar });
    setIsChatOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="location-map-modal-backdrop" onClick={onClose}>
      <div className="location-map-container" onClick={(e) => e.stopPropagation()}>
        
        {/* ── Top Header Bar ──────────────────────────────────── */}
        <header className="map-modal-header">
          <div className="map-header-left">
            <div className="radar-live-badge">
              <span className="radar-live-dot" />
              <span className="radar-live-text">LOCAL RADAR</span>
            </div>
            <h3 className="map-modal-title">Opportunities Near You</h3>
          </div>

          <div className="map-header-right">
            {/* GPS Lock / City Selector */}
            <div className="city-selector-wrap">
              <button 
                type="button" 
                className={`gps-lock-btn ${gpsStatus === 'granted' ? 'active' : ''}`}
                onClick={requestUserLocation}
                disabled={isLocating}
                title="Lock current GPS coordinates"
              >
                <span className={`material-symbols-outlined ${isLocating ? 'spin' : ''}`}>
                  {isLocating ? 'sync' : 'my_location'}
                </span>
                <span>{userCityName}</span>
              </button>

              <select
                className="city-dropdown-select"
                value={userCityName}
                onChange={(e) => handleCitySelect(e.target.value)}
                aria-label="Select City"
              >
                <optgroup label="Popular Hubs">
                  <option value="Jamshedpur">Jamshedpur</option>
                  <option value="Ranchi">Ranchi</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                </optgroup>
                <optgroup label="All States & Cities">
                  {Object.keys(INDIAN_STATES_AND_CITIES).map((st) => (
                    <option key={st} value={INDIAN_STATES_AND_CITIES[st][0] || st}>
                      {st} — {INDIAN_STATES_AND_CITIES[st][0] || ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Close Button */}
            <button className="map-modal-close-btn" onClick={onClose} aria-label="Close Map">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* ── Filter Controls Row ─────────────────────────────── */}
        <div className="map-controls-bar">
          {/* Campaign Type Chips */}
          <div className="map-type-chips">
            <button
              className={`map-chip ${activeTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTypeFilter('all')}
            >
              All Types
            </button>
            <button
              className={`map-chip pool ${activeTypeFilter === 'pool' ? 'active' : ''}`}
              onClick={() => setActiveTypeFilter('pool')}
            >
              💰 Prize Pool
            </button>
            <button
              className={`map-chip discount ${activeTypeFilter === 'discount' ? 'active' : ''}`}
              onClick={() => setActiveTypeFilter('discount')}
            >
              🏷️ Discount
            </button>
            <button
              className={`map-chip hybrid ${activeTypeFilter === 'hybrid' ? 'active' : ''}`}
              onClick={() => setActiveTypeFilter('hybrid')}
            >
              ⚡ Hybrid
            </button>
          </div>

          {/* Radius Selector */}
          <div className="map-radius-selector">
            <span className="radius-label">Radius:</span>
            {[10, 25, 50, 100].map((km) => (
              <button
                key={km}
                className={`radius-chip ${activeRadiusKm === km ? 'active' : ''}`}
                onClick={() => setActiveRadiusKm(km)}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* ── Interactive Radar / Pixel Map Canvas ─────────────── */}
        <div 
          className="map-viewport-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Futuristic Radar Grid Background */}
          <div className="map-grid-layer" />
          <div className="radar-sweep-beam" />
          <div className="radar-concentric-circles">
            <div className="circle circle-1" />
            <div className="circle circle-2" />
            <div className="circle circle-3" />
          </div>

          {/* Draggable & Scalable World Layer */}
          <div 
            className="map-world-layer"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            {/* User Center Beacon ("You Are Here") */}
            <div className="user-location-marker">
              <div className="beacon-pulse-ring" />
              <div className="beacon-pulse-ring delay-1" />
              <div className="user-beacon-core">
                <span className="material-symbols-outlined">navigation</span>
              </div>
              <div className="user-beacon-label">You Are Here</div>
            </div>

            {/* Rendered Location-Based Campaign Pins */}
            {mappedPins.map((pin) => {
              const isSelected = selectedPin?.campaign.id === pin.campaign.id;
              return (
                <div
                  key={pin.campaign.id}
                  className={`map-campaign-pin type-${pin.campaign.type} ${isSelected ? 'selected' : ''}`}
                  style={{
                    transform: `translate(${pin.offsetX}px, ${pin.offsetY}px)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(pin);
                  }}
                >
                  <div className="pin-beacon-glow" />
                  
                  {/* Pin Body with Icon */}
                  <div className="pin-body">
                    <span className="material-symbols-outlined">
                      {pin.campaign.type === 'pool' && 'monetization_on'}
                      {pin.campaign.type === 'discount' && 'sell'}
                      {pin.campaign.type === 'hybrid' && 'bolt'}
                    </span>
                  </div>

                  {/* Pin Floating Tag */}
                  <div className="pin-floating-tag">
                    <span className="pin-tag-title">{pin.campaign.title}</span>
                    <span className="pin-tag-distance">{pin.distanceKm < 1 ? `${Math.round(pin.distanceKm * 1000)}m` : `${pin.distanceKm.toFixed(1)}km`}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Overlay Floating HUD / Controls */}
          <div className="map-hud-controls">
            <button className="hud-btn" onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))} title="Zoom In">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="hud-btn" onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))} title="Zoom Out">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button className="hud-btn recenter" onClick={handleRecenter} title="Recenter to You">
              <span className="material-symbols-outlined">near_me</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="map-stats-pill">
            <span className="material-symbols-outlined">radar</span>
            <span>{mappedPins.length} Local Sponsorships within {activeRadiusKm} km</span>
          </div>

          {/* Selected Campaign Card Bottom Sheet */}
          {selectedPin && (
            <div className="map-selected-card-overlay">
              <MapCampaignCard
                campaign={selectedPin.campaign}
                distanceKm={selectedPin.distanceKm}
                onClose={() => setSelectedPin(null)}
                onOpenChat={handleOpenChat}
              />
            </div>
          )}

          {/* Empty State when no pins found */}
          {mappedPins.length === 0 && (
            <div className="map-empty-state">
              <div className="empty-radar-icon">
                <span className="material-symbols-outlined">explore_off</span>
              </div>
              <h4>No local campaigns in this radius</h4>
              <p>Expand your search radius or switch to another city to discover opportunities.</p>
              <button className="expand-radius-btn" onClick={() => setActiveRadiusKm(100)}>
                Search 100 km Radius
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Chat Modal with Brand Owner */}
      {isChatOpen && activeChatRecipient && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          recipientId={activeChatRecipient.id}
          recipientName={activeChatRecipient.name}
          recipientAvatar={activeChatRecipient.avatar}
        />
      )}
    </div>
  );
};
export default LocationCampaignMapModal;
