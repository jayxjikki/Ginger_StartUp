// ═══════════════════════════════════════════════════════════
// GINGER — Submission Helpers
// Bulletproof detection & encoding of submission types
// (Compatible with remote database even when submission_type column is missing)
// ═══════════════════════════════════════════════════════════

export type SubmissionType = 'all_rewards' | 'direct_discount';

export interface EncodedVoucherData {
  voucher_code?: string;
  voucher_status?: 'active' | 'redeemed';
  discount_percent?: number;
  voucher_details?: Record<string, any>;
}

/**
 * Extracts voucher code, details, and discount percentage from video_id string
 */
export const extractVoucherDataFromVideoId = (videoId?: string): EncodedVoucherData | null => {
  if (!videoId || typeof videoId !== 'string' || !videoId.includes('::vdata::')) return null;
  try {
    const parts = videoId.split('::vdata::');
    if (parts.length < 2) return null;
    const jsonStr = decodeURIComponent(parts[1]);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('Failed to parse voucher data from video_id:', e);
    return null;
  }
};

/**
 * Encodes voucher and bill data into video_id string for persistent storage
 */
export const encodeVideoIdWithVoucher = (
  existingVideoId: string | undefined,
  voucherData: EncodedVoucherData
): string => {
  const base = (existingVideoId || 'direct_discount::auto-sub').split('::vdata::')[0];
  const encoded = encodeURIComponent(JSON.stringify(voucherData));
  return `${base}::vdata::${encoded}`;
};

/**
 * Checks if a submission is a direct discount video
 * Checks submission_type column, video_id prefix, voucher_code, and encoded voucher data
 */
export const isDirectDiscountSubmission = (s: any): boolean => {
  if (!s) return false;
  if (s.submission_type === 'direct_discount') return true;
  if (typeof s.video_id === 'string' && s.video_id.includes('direct_discount')) return true;
  if (s.voucher_code) return true;
  if (extractVoucherDataFromVideoId(s.video_id)) return true;
  return false;
};

/**
 * Returns normalized submission_type ('direct_discount' | 'all_rewards')
 */
export const getSubmissionType = (s: any): SubmissionType => {
  return isDirectDiscountSubmission(s) ? 'direct_discount' : 'all_rewards';
};

/**
 * Fallback to generate a deterministic, unique voucher code from a submission ID
 * Ensures no submission ever repeats a fallback code like 'VCH-ACTIVE'
 */
export const getFallbackUniqueVoucherCode = (subId?: string): string => {
  if (!subId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = '';
    for (let i = 0; i < 6; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
    return `VCH-GNG-${r}`;
  }
  const clean = subId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const p1 = clean.slice(0, 4) || 'GNG1';
  const p2 = clean.slice(-4) || 'VCH9';
  return `VCH-GNG-${p1}-${p2}`;
};

/**
 * Normalizes a submission object to always have reliable submission_type,
 * voucher_code, discount_percent, and voucher_details properties even on legacy DB schema
 */
export const normalizeSubmission = <T extends Record<string, any>>(s: T): T & { 
  submission_type: SubmissionType;
  voucher_code?: string;
  voucher_status?: string;
  discount_percent?: number;
  voucher_details?: Record<string, any>;
} => {
  if (!s) return s as any;

  // Extract any embedded voucher data in video_id
  const vData = extractVoucherDataFromVideoId(s.video_id);

  let voucherCode = s.voucher_code || vData?.voucher_code || undefined;
  if (voucherCode === 'VCH-ACTIVE' || (!voucherCode && (s.status === 'verified' || s.status === 'paid' || isDirectDiscountSubmission(s)))) {
    if (s.id) {
      voucherCode = getFallbackUniqueVoucherCode(s.id);
    }
  }

  const voucherStatus = s.voucher_status || vData?.voucher_status || (voucherCode ? 'active' : undefined);
  const discountPercent = s.discount_percent != null ? s.discount_percent : vData?.discount_percent;
  const voucherDetails = {
    ...(vData?.voucher_details || {}),
    ...(typeof s.voucher_details === 'object' && s.voucher_details ? s.voucher_details : {}),
  };

  const normalized = {
    ...s,
    voucher_code: voucherCode,
    voucher_status: voucherStatus,
    discount_percent: discountPercent,
    voucher_details: Object.keys(voucherDetails).length > 0 ? voucherDetails : (s.voucher_details || undefined),
  };

  return {
    ...normalized,
    submission_type: getSubmissionType(normalized),
  };
};

/**
 * Encodes submission type into a video_id string for persistent storage
 */
export const encodeVideoId = (type: SubmissionType, baseId?: string): string => {
  const cleanId = (baseId || `auto-${Math.random().toString(36).substring(7)}`)
    .replace(/^(direct_discount::|all_rewards::)/, '');
  return `${type}::${cleanId}`;
};

/**
 * Checks if a submission is a review / rate us submission
 */
export const isReviewSubmission = (s: any): boolean => {
  if (!s) return false;
  if (s.platform === 'review') return true;
  const term = (s.voucher_details?.action_term || '').toLowerCase();
  if (term.includes('review') || term.includes('rate')) return true;
  if (typeof s.video_id === 'string' && s.video_id.toLowerCase().includes('review')) return true;
  if (typeof s.video_url === 'string' && (s.video_url.includes('google.com/search') || s.video_url.includes('maps') || s.video_url.includes('reviews'))) return true;
  return false;
};

/**
 * Ensures a URL starts with http:// or https:// so window.open doesn't treat it as relative path
 */
export const ensureHttpUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/**
 * Resolves the direct review URL for a campaign/submission set by the owner
 */
export const getSubmissionReviewUrl = (submission?: any, campaign?: any): string => {
  // 1. From submission voucher details
  const voucherUrl = submission?.voucher_details?.review_url;
  if (voucherUrl && typeof voucherUrl === 'string' && voucherUrl.trim()) {
    return ensureHttpUrl(voucherUrl);
  }

  // 2. From submission video_url if it is an external URL (stored on review submissions)
  const videoUrl = submission?.video_url;
  if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://') || videoUrl.includes('google.') || videoUrl.includes('maps.'))) {
    return ensureHttpUrl(videoUrl);
  }

  // 3. From campaign terms.direct_discount_tiers
  let termsObj = campaign?.terms;
  if (typeof termsObj === 'string') {
    try {
      termsObj = JSON.parse(termsObj);
    } catch {}
  }
  const tiers = Array.isArray(termsObj?.direct_discount_tiers) ? termsObj.direct_discount_tiers : [];
  const reviewTier = tiers.find((t: any) => {
    const term = (t?.term || '').toLowerCase();
    return (term.includes('review') || term.includes('rate')) && t?.review_url?.trim();
  });
  if (reviewTier?.review_url?.trim()) {
    return ensureHttpUrl(reviewTier.review_url);
  }

  // 4. From campaign payout_tiers or top-level review_url
  if (campaign?.review_url && typeof campaign.review_url === 'string' && campaign.review_url.trim()) {
    return ensureHttpUrl(campaign.review_url);
  }

  // 5. Fallback: Google Maps / Search query for the business
  const businessName = campaign?.title || 'Business';
  const location = campaign?.location && campaign.location !== 'None' ? ` ${campaign.location}` : '';
  const query = encodeURIComponent(`${businessName}${location} reviews`.trim());
  return `https://www.google.com/search?q=${query}`;
};

/**
 * Opens an external review page safely in a new tab with fallback for strict mobile popup blockers
 */
export const openReviewPage = (url: string) => {
  const targetUrl = ensureHttpUrl(url);
  if (!targetUrl) return;
  const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');
  if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
    window.location.href = targetUrl;
  }
};

/**
 * Resolves the specific direct discount action/tier name
 * (e.g., "Shoot a Video", "Visit us", "Post Story / Highlight", "Write a Review")
 */
export const getDirectDiscountActionLabel = (sub: any, campaign?: any): string => {
  if (!sub) return 'Direct Discount';

  // 1. Direct from voucher_details.action_term
  if (sub.voucher_details?.action_term && typeof sub.voucher_details.action_term === 'string') {
    const t = sub.voucher_details.action_term.trim();
    if (t) return t;
  }

  // 2. Direct from voucher_details.reward_text if action_term is not set
  if (sub.voucher_details?.reward_text && typeof sub.voucher_details.reward_text === 'string') {
    const rt = sub.voucher_details.reward_text.trim();
    if (rt && !rt.includes('%') && !rt.toLowerCase().includes('off')) return rt;
  }

  // 3. Inspect video_id encoding (e.g. direct_discount::visit_us::12345)
  if (typeof sub.video_id === 'string') {
    const vid = sub.video_id.toLowerCase();
    if (vid.includes('visit')) return 'Visit us';
    if (vid.includes('story') || vid.includes('highlight')) return 'Post Story / Highlight';
    if (vid.includes('shoot') || vid.includes('video')) return 'Shoot a Video';
    if (vid.includes('review') || vid.includes('rate')) return 'Write a Review';

    const match = sub.video_id.match(/direct_discount::([^:]+)/);
    if (match && match[1]) {
      const raw = match[1].replace(/_/g, ' ');
      return raw.replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  }

  // 4. Inspect platform and video_url
  if (sub.platform === 'review' || isReviewSubmission(sub)) {
    return 'Write a Review';
  }

  const vUrl = (sub.video_url || '').toLowerCase();
  if (vUrl.includes('story') || vUrl.includes('stories') || vUrl.includes('highlight')) {
    return 'Post Story / Highlight';
  }

  if (
    vUrl.includes('visit') ||
    sub.voucher_details?.submitted_media_type === 'image' ||
    sub.voucher_details?.submitted_media_type === 'video' ||
    sub.platform === 'image'
  ) {
    return 'Visit us';
  }

  // 5. Match against campaign's configured direct discount tiers
  let termsObj = campaign?.terms;
  if (typeof termsObj === 'string') {
    try { termsObj = JSON.parse(termsObj); } catch {}
  }
  const tiers = Array.isArray(termsObj?.direct_discount_tiers) ? termsObj.direct_discount_tiers : [];
  if (tiers.length === 1 && tiers[0]?.term) {
    return tiers[0].term;
  }

  // 6. If video URL is standard video platform (YouTube, TikTok, Instagram Reels)
  if (vUrl.includes('youtube') || vUrl.includes('youtu.be') || vUrl.includes('tiktok') || vUrl.includes('/reel/')) {
    return 'Shoot a Video';
  }

  return 'Direct Discount';
};

/**
 * Returns an appropriate emoji icon for the given direct discount action
 */
export const getDirectDiscountIcon = (label: string): string => {
  const l = (label || '').toLowerCase();
  if (l.includes('visit')) return '📍';
  if (l.includes('story') || l.includes('highlight')) return '📱';
  if (l.includes('shoot') || l.includes('video')) return '🎬';
  if (l.includes('review') || l.includes('rate')) return '⭐';
  return '🏷️';
};

/**
 * Returns formatted badge text with icon: e.g. "📍 Visit us" or "🎬 Shoot a Video"
 */
export const getDirectDiscountBadgeText = (sub: any, campaign?: any): string => {
  const label = getDirectDiscountActionLabel(sub, campaign);
  const icon = getDirectDiscountIcon(label);
  return `${icon} ${label}`;
};
