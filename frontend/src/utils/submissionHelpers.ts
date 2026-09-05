// ═══════════════════════════════════════════════════════════
// GINGER — Submission Helpers
// Bulletproof detection & encoding of submission types
// (Compatible with remote database even when submission_type column is missing)
// ═══════════════════════════════════════════════════════════

export type SubmissionType = 'all_rewards' | 'direct_discount';

/**
 * Checks if a submission is a direct discount video
 * Checks submission_type column, video_id prefix, and voucher_code
 */
export const isDirectDiscountSubmission = (s: any): boolean => {
  if (!s) return false;
  if (s.submission_type === 'direct_discount') return true;
  if (typeof s.video_id === 'string' && s.video_id.includes('direct_discount')) return true;
  if (s.voucher_code) return true;
  return false;
};

/**
 * Returns normalized submission_type ('direct_discount' | 'all_rewards')
 */
export const getSubmissionType = (s: any): SubmissionType => {
  return isDirectDiscountSubmission(s) ? 'direct_discount' : 'all_rewards';
};

/**
 * Normalizes a submission object to always have a reliable submission_type property
 */
export const normalizeSubmission = <T extends Record<string, any>>(s: T): T & { submission_type: SubmissionType } => {
  if (!s) return s as any;
  return {
    ...s,
    submission_type: getSubmissionType(s),
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

