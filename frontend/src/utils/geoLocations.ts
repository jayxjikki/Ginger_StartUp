// ═══════════════════════════════════════════════════════════
// GINGER — Geolocation Utilities & City Coordinates
// Coordinates, distance calculation & spatial mapping
// ═══════════════════════════════════════════════════════════

export interface Coordinates {
  lat: number;
  lng: number;
}

// Coordinates dictionary for Indian cities & tech/creator hubs
export const INDIAN_CITY_COORDINATES: Record<string, Coordinates> = {
  // Jharkhand
  'jamshedpur': { lat: 22.8046, lng: 86.2029 },
  'ranchi': { lat: 23.3441, lng: 85.3096 },
  'dhanbad': { lat: 23.7957, lng: 86.4304 },
  'bokaro': { lat: 23.6693, lng: 86.1511 },
  'deoghar': { lat: 24.4826, lng: 86.7001 },
  'hazaribagh': { lat: 23.9925, lng: 85.3637 },
  'giridih': { lat: 24.1856, lng: 86.3108 },

  // Metro & Major Hubs
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'surat': { lat: 21.1702, lng: 72.8311 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'kanpur': { lat: 26.4499, lng: 80.3319 },
  'nagpur': { lat: 21.1458, lng: 79.0882 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'patna': { lat: 25.5941, lng: 85.1376 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'vadodara': { lat: 22.3072, lng: 73.1812 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'kochi': { lat: 9.9312, lng: 76.2673 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'nashik': { lat: 19.9975, lng: 73.7898 },
  'amritsar': { lat: 31.6340, lng: 74.8723 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'goa': { lat: 15.2993, lng: 74.1240 },
};

// Default center: Jamshedpur / Central India hub
export const DEFAULT_COORDINATES: Coordinates = {
  lat: 22.8046,
  lng: 86.2029
};

/**
 * Calculate distance between two lat/lng coordinates in kilometers using Haversine formula
 */
export const calculateDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Human-readable distance formatter (e.g., "750 m", "2.4 km", "12 km")
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
};

/**
 * Deterministic pseudo-random number generator for consistent map scatter based on string ID
 */
const getHashFromString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Resolves coordinates from a location string (city/state)
 * Adds deterministic local jitter (offset) so multiple campaigns in the same city don't completely overlap
 */
export const resolveCoordinates = (
  locationString: string | null | undefined,
  campaignId: string = '',
  referenceUserLocation?: Coordinates | null
): Coordinates | null => {
  if (!locationString || locationString.trim() === '' || locationString.toLowerCase() === 'online') {
    return null;
  }

  const cleaned = locationString.toLowerCase().trim();
  let baseCoords: Coordinates | null = null;

  // 1. Direct match or substring match in dictionary
  for (const [cityName, coords] of Object.entries(INDIAN_CITY_COORDINATES)) {
    if (cleaned.includes(cityName)) {
      baseCoords = { ...coords };
      break;
    }
  }

  // 2. If not matched, but user location is present, distribute nearby (within 3-8 km)
  if (!baseCoords) {
    if (referenceUserLocation) {
      baseCoords = { ...referenceUserLocation };
    } else {
      baseCoords = { ...DEFAULT_COORDINATES };
    }
  }

  // 3. Add deterministic offset using campaignId to scatter pins within ~1.5 - 3 km
  const hash = getHashFromString(campaignId || locationString);
  const angle = ((hash % 360) * Math.PI) / 180;
  const radiusKm = 0.4 + ((hash % 20) / 20) * 2.6; // 0.4 to 3.0 km offset

  // 1 degree lat approx 111 km, 1 degree lng approx 111 * cos(lat) km
  const latOffset = (radiusKm * Math.cos(angle)) / 111;
  const lngOffset = (radiusKm * Math.sin(angle)) / (111 * Math.cos(baseCoords.lat * (Math.PI / 180)));

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset
  };
};
