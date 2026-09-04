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

export function getVideoThumbnail(url: string): string | null {
  if (!url) return null;
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }
  return null;
}

export function getEmbedInfo(url: string): {
  type: 'youtube' | 'direct' | 'instagram' | 'external';
  embedUrl: string;
  youtubeId?: string;
  instagramCode?: string;
} {
  if (!url) return { type: 'external', embedUrl: '' };

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

  return { type: 'external', embedUrl: url };
}
