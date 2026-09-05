// ═══════════════════════════════════════════════════════════
// GINGER — Video URL Helpers (YouTube, Instagram, Direct Video)
// ═══════════════════════════════════════════════════════════

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      const v = urlObj.searchParams.get('v');
      if (v && v.length >= 11) return v.substring(0, 11);
      if (urlObj.pathname.startsWith('/shorts/')) {
        return urlObj.pathname.split('/shorts/')[1]?.substring(0, 11) || null;
      }
      if (urlObj.pathname.startsWith('/embed/')) {
        return urlObj.pathname.split('/embed/')[1]?.substring(0, 11) || null;
      }
    } else if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.substring(1, 12) || null;
    }
  } catch {
    // fallback to regex if invalid URL format
  }
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.*[&?]v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export function extractInstagramCode(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:instagram\.com\/(?:p|reel|tv)\/)([\w-]+)/i);
  return match ? match[1] : null;
}

export function getVideoThumbnail(url: string, _platform?: string): string | null {
  if (!url) return null;
  // If it's a direct image file or Cloudinary/Supabase image upload
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) || (url.includes('cloudinary.com') && url.includes('/image/upload/'))) {
    return url;
  }
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

export function getEmbedInfo(url: string): {
  type: 'youtube' | 'direct' | 'instagram' | 'facebook' | 'image' | 'external';
  embedUrl: string;
  youtubeId?: string;
  instagramCode?: string;
} {
  if (!url) return { type: 'external', embedUrl: '' };

  // Direct image check
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) || (url.includes('cloudinary.com') && url.includes('/image/upload/'))) {
    return {
      type: 'image',
      embedUrl: url,
    };
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      youtubeId: ytId,
    };
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('video/upload')) {
    return {
      type: 'direct',
      embedUrl: url,
    };
  }

  const igCode = extractInstagramCode(url);
  if (igCode) {
    return {
      type: 'instagram',
      embedUrl: `https://www.instagram.com/p/${igCode}/embed/captioned/`,
      instagramCode: igCode,
    };
  }

  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    return {
      type: 'facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`,
    };
  }

  return { type: 'external', embedUrl: url };
}

export interface VideoValidationResult {
  isValid: boolean;
  platform: 'youtube' | 'instagram' | 'facebook' | 'invalid';
  error?: string;
}

export function validateAllowedVideoUrl(url: string): VideoValidationResult {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      isValid: false,
      platform: 'invalid',
      error: 'Please enter a video URL.',
    };
  }

  const cleanUrl = url.trim().toLowerCase();

  // Validate format starts with http:// or https://
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return {
      isValid: false,
      platform: 'invalid',
      error: 'URL must start with http:// or https://',
    };
  }

  // 1. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return { isValid: true, platform: 'youtube' };
  }

  // 2. Instagram
  if (cleanUrl.includes('instagram.com')) {
    return { isValid: true, platform: 'instagram' };
  }

  // 3. Facebook
  if (
    cleanUrl.includes('facebook.com') ||
    cleanUrl.includes('fb.watch') ||
    cleanUrl.includes('fb.com')
  ) {
    return { isValid: true, platform: 'facebook' };
  }

  // Any other URL or spam link
  return {
    isValid: false,
    platform: 'invalid',
    error: 'Only YouTube, Instagram, or Facebook video links are allowed.',
  };
}

