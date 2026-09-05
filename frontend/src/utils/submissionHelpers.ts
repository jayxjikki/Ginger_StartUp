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

  const voucherCode = s.voucher_code || vData?.voucher_code || undefined;
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


