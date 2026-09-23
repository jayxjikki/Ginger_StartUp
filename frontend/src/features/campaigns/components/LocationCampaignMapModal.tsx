// ═══════════════════════════════════════════════════════════
// GINGER — Location Campaign Map Modal ("Pokémon GO / Uber" Style)
// Interactive pixel-animated radar map with live geolocation & local sponsorships
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  // Dynamic placement for floating tag to avoid collisions
  tagPlacement: 'top' | 'bottom';
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
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.4x to 3.0x
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Hardware-accelerated interaction refs for buttery 60/120fps direct DOM transforms
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomRef = useRef<number>(1);
  const isDraggingRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  const worldLayerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const hudZoomRef = useRef<HTMLDivElement>(null);

  // Touch gesture tracking for mobile: two-finger pinch-to-zoom and 1-finger panning
  const touchStateRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startDistance: number;
    startZoom: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    startDistance: 0,
    startZoom: 1,
  });

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
        setPanOffset({ x: 0, y: 0 });
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

  // Process, project and declutter location-based campaigns
  const mappedPins: MappedCampaignPin[] = useMemo(() => {
    const list: (Omit<MappedCampaignPin, 'tagPlacement'> & { tagPlacement?: 'top' | 'bottom' })[] = [];

    campaigns.forEach((camp) => {
      // Must have a valid physical location that isn't empty, online, or none
      if (
        !camp.location || 
        camp.location.toLowerCase() === 'online' || 
        camp.location.toLowerCase() === 'none' ||
        camp.location.toLowerCase().startsWith('none') ||
        camp.location.toLowerCase().includes('online / none')
      ) {
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
      // 1 km ~= 22 pixels at 1x zoom
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

    // ── Collision Resolution / Force Separation ───────────────────
    // Prevent overlapping pins when campaigns share city or close proximity.
    // Minimum 88px clearance ensures pins and tags don't overlap or block tapping.
    const MIN_PIN_SPACING = 88; // pixels
    const iterations = 30;

    for (let iter = 0; iter < iterations; iter++) {
      let moved = false;
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          let dx = list[j].offsetX - list[i].offsetX;
          let dy = list[j].offsetY - list[i].offsetY;
          let dist = Math.hypot(dx, dy);

          if (dist < 0.001) {
            // Exactly overlapping: give an angular separation
            const angle = (j / Math.max(1, list.length)) * 2 * Math.PI;
            dx = Math.cos(angle) * 4;
            dy = Math.sin(angle) * 4;
            dist = 4;
          }

          if (dist < MIN_PIN_SPACING) {
            moved = true;
            const overlap = MIN_PIN_SPACING - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const halfOverlap = overlap * 0.5;

            list[i].offsetX -= nx * halfOverlap;
            list[i].offsetY -= ny * halfOverlap;
            list[j].offsetX += nx * halfOverlap;
            list[j].offsetY += ny * halfOverlap;
          }
        }
      }
      if (!moved) break;
    }

    // ── Smart Floating Tag Placement ──────────────────────────────
    // Assign 'top' or 'bottom' dynamically based on nearest neighbor to eliminate label collisions
    const finalizedList: MappedCampaignPin[] = list.map((pin, i) => {
      let closestDist = Infinity;
      let closestNeighbor: typeof pin | null = null;

      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const d = Math.hypot(list[j].offsetX - pin.offsetX, list[j].offsetY - pin.offsetY);
        if (d < closestDist) {
          closestDist = d;
          closestNeighbor = list[j];
        }
      }

      let tagPlacement: 'top' | 'bottom' = i % 2 === 0 ? 'bottom' : 'top';
      if (closestNeighbor && closestDist < 120) {
        // If closest neighbor is below, put tag on top; if neighbor is above, put tag on bottom
        tagPlacement = closestNeighbor.offsetY >= pin.offsetY ? 'top' : 'bottom';
      }

      return {
        ...pin,
        tagPlacement,
      };
    });

    // Sort closest first
    return finalizedList.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [campaigns, userLocation, activeRadiusKm, activeTypeFilter]);

  // Direct DOM hardware-accelerated transform without React re-render overhead
  const applyTransform = (x: number, y: number, zoom: number) => {
    if (worldLayerRef.current) {
      worldLayerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
      worldLayerRef.current.style.setProperty('--zoom-level', String(zoom));
    }
    if (gridLayerRef.current) {
      const cellSize = 40 * zoom;
      const gx = ((x % cellSize) + cellSize) % cellSize;
      const gy = ((y % cellSize) + cellSize) % cellSize;
      gridLayerRef.current.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
    }
    if (hudZoomRef.current) {
      hudZoomRef.current.textContent = `${Math.round(zoom * 100)}%`;
    }
  };

  // Sync state changes (recenter, city change, zoom buttons) to refs & DOM
  useEffect(() => {
    panRef.current = panOffset;
    zoomRef.current = zoomLevel;
    applyTransform(panOffset.x, panOffset.y, zoomLevel);
  }, [panOffset, zoomLevel]);

  // Non-passive Native Touch Listeners for butter-smooth 60/120fps mobile pan & pinch
  useEffect(() => {
    if (!isOpen) return;
    const el = viewportRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (worldLayerRef.current) {
        worldLayerRef.current.style.transition = 'none';
      }
      isDraggingRef.current = true;

      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          startDistance: 0,
          startZoom: zoomRef.current,
        };
      } else if (e.touches.length >= 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        touchStateRef.current = {
          mode: 'pinch',
          startX: (t1.clientX + t2.clientX) / 2,
          startY: (t1.clientY + t2.clientY) / 2,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          startDistance: dist,
          startZoom: zoomRef.current,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // Prevent browser default page scroll or pull-to-refresh
      if (e.cancelable) {
        e.preventDefault();
      }

      if (touchStateRef.current.mode === 'pan' && e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - touchStateRef.current.startX;
        const dy = t.clientY - touchStateRef.current.startY;
        panRef.current = {
          x: touchStateRef.current.startPanX + dx,
          y: touchStateRef.current.startPanY + dy,
        };
      } else if (e.touches.length >= 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

        if (touchStateRef.current.mode !== 'pinch') {
          touchStateRef.current = {
            mode: 'pinch',
            startX: (t1.clientX + t2.clientX) / 2,
            startY: (t1.clientY + t2.clientY) / 2,
            startPanX: panRef.current.x,
            startPanY: panRef.current.y,
            startDistance: currentDist,
            startZoom: zoomRef.current,
          };
          return;
        }

        if (touchStateRef.current.startDistance > 0) {
          const scale = currentDist / touchStateRef.current.startDistance;
          const nextZoom = Math.min(3.0, Math.max(0.4, touchStateRef.current.startZoom * scale));
          zoomRef.current = Number(nextZoom.toFixed(2));
        }

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const dx = midX - touchStateRef.current.startX;
        const dy = midY - touchStateRef.current.startY;
        panRef.current = {
          x: touchStateRef.current.startPanX + dx,
          y: touchStateRef.current.startPanY + dy,
        };
      }

      // Hardware transform via requestAnimationFrame (0 React re-renders while moving)
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(() => {
          applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);
          rafIdRef.current = null;
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          startDistance: 0,
          startZoom: zoomRef.current,
        };
      } else if (e.touches.length === 0) {
        touchStateRef.current.mode = 'none';
        isDraggingRef.current = false;

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);

        // Sync final values to React state upon touch release
        setPanOffset({ ...panRef.current });
        setZoomLevel(zoomRef.current);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isOpen]);

  // Handle Pan Events (Mouse) with RAF
  const handleMouseDown = (e: React.MouseEvent) => {
    if (worldLayerRef.current) {
      worldLayerRef.current.style.transition = 'none';
    }
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    panRef.current = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    };
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);
        rafIdRef.current = null;
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    applyTransform(panRef.current.x, panRef.current.y, zoomRef.current);
    setPanOffset({ ...panRef.current });
  };

  // Desktop Mouse Wheel Zoom
  useEffect(() => {
    if (!isOpen) return;
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      const next = Math.min(3.0, Math.max(0.4, zoomRef.current * factor));
      const rounded = Number(next.toFixed(2));
      zoomRef.current = rounded;
      applyTransform(panRef.current.x, panRef.current.y, rounded);
      setZoomLevel(rounded);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [isOpen]);

  // Recenter map smoothly
  const handleRecenter = () => {
    if (worldLayerRef.current) {
      worldLayerRef.current.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    applyTransform(0, 0, 1);
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    setSelectedPin(null);
  };

  // Zoom button handler with smooth animation
  const handleZoomChange = (delta: number) => {
    if (worldLayerRef.current) {
      worldLayerRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    const next = Math.min(3.0, Math.max(0.4, Number((zoomRef.current + delta).toFixed(2))));
    zoomRef.current = next;
    applyTransform(panRef.current.x, panRef.current.y, next);
    setZoomLevel(next);
  };

  // Dynamic radar dimensions (22px per km matches campaign pin distance projection)
  const SCALE_PX_PER_KM = 22;
  const radarRadius = activeRadiusKm * SCALE_PX_PER_KM;
  const radarDiameter = radarRadius * 2;
  // Capped rotating sweep beam diameter to prevent mobile GPU tile memory exhaustion (>2000px causes memory drops on mobile)
  const visualBeamDiameter = Math.min(radarDiameter, 640);

  const radarRings = useMemo(() => {
    return [
      {
        ratio: 0.33,
        km: Math.round(activeRadiusKm * 0.33),
        diameter: Math.round(radarDiameter * 0.33),
        isBoundary: false,
      },
      {
        ratio: 0.66,
        km: Math.round(activeRadiusKm * 0.66),
        diameter: Math.round(radarDiameter * 0.66),
        isBoundary: false,
      },
      {
        ratio: 1.0,
        km: activeRadiusKm,
        diameter: radarDiameter,
        isBoundary: true,
      },
    ];
  }, [activeRadiusKm, radarDiameter]);

  // Open direct chat
  const handleOpenChat = (ownerId: string, ownerName: string, ownerAvatar: string | null) => {
    setActiveChatRecipient({ id: ownerId, name: ownerName, avatar: ownerAvatar });
    setIsChatOpen(true);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
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
          ref={viewportRef}
          className="map-viewport-wrapper"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Futuristic Radar Grid Background */}
          <div 
            ref={gridLayerRef}
            className="map-grid-layer" 
            style={{
              backgroundSize: `${40 * zoomLevel}px ${40 * zoomLevel}px`,
            }}
          />

          {/* Draggable & Scalable World Layer */}
          <div 
            ref={worldLayerRef}
            className="map-world-layer"
            style={{
              transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
              transformOrigin: '0 0',
              ['--zoom-level' as any]: zoomLevel,
            }}
          >
            {/* ── Radar System Fixed to User Location Center (0, 0) ── */}
            <div className="user-radar-system">
              {/* Rotating Radar Sweep Beam (Capped to safe GPU dimensions) */}
              <div 
                className="radar-sweep-beam" 
                style={{
                  width: `${visualBeamDiameter}px`,
                  height: `${visualBeamDiameter}px`,
                  marginTop: `-${visualBeamDiameter / 2}px`,
                  marginLeft: `-${visualBeamDiameter / 2}px`,
                }}
              />

              {/* Crosshair Cardinal Bearing Lines */}
              <div className="radar-crosshairs">
                <div 
                  className="crosshair axis-h" 
                  style={{ 
                    width: `${radarDiameter}px`, 
                    marginLeft: `-${radarDiameter / 2}px` 
                  }}
                >
                  <span className="bearing-tag tag-w">W</span>
                  <span className="bearing-tag tag-e">E</span>
                </div>
                <div 
                  className="crosshair axis-v" 
                  style={{ 
                    height: `${radarDiameter}px`, 
                    marginTop: `-${radarDiameter / 2}px` 
                  }}
                >
                  <span className="bearing-tag tag-n">N</span>
                  <span className="bearing-tag tag-s">S</span>
                </div>
                <div 
                  className="crosshair axis-diag-1" 
                  style={{ 
                    width: `${radarDiameter}px`, 
                    marginLeft: `-${radarDiameter / 2}px` 
                  }} 
                />
                <div 
                  className="crosshair axis-diag-2" 
                  style={{ 
                    width: `${radarDiameter}px`, 
                    marginLeft: `-${radarDiameter / 2}px` 
                  }} 
                />
              </div>

              {/* Concentric Distance Rings scaled to active radius */}
              <div className="radar-concentric-circles">
                {radarRings.map((ring, idx) => (
                  <div
                    key={idx}
                    className={`circle circle-dynamic ${ring.isBoundary ? 'boundary-ring' : ''}`}
                    style={{
                      width: `${ring.diameter}px`,
                      height: `${ring.diameter}px`,
                      marginTop: `-${ring.diameter / 2}px`,
                      marginLeft: `-${ring.diameter / 2}px`,
                    }}
                  >
                    <span className="ring-distance-badge">
                      {ring.km} km{ring.isBoundary ? ' Boundary' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                  className={`map-campaign-pin type-${pin.campaign.type} ${isSelected ? 'selected' : ''} tag-${pin.tagPlacement}`}
                  style={{
                    left: `${pin.offsetX}px`,
                    top: `${pin.offsetY}px`,
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
                      {pin.campaign.type === 'video_ad' && 'play_circle'}
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
            <div ref={hudZoomRef} className="hud-zoom-indicator" title="Current Zoom">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button className="hud-btn" onClick={() => handleZoomChange(0.25)} title="Zoom In">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="hud-btn" onClick={() => handleZoomChange(-0.25)} title="Zoom Out">
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
    </div>,
    document.body
  );
};
export default LocationCampaignMapModal;
