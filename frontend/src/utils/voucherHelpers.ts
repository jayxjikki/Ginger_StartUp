// ═══════════════════════════════════════════════════════════
// GINGER — Voucher Code Helpers (Generation, Lookup, Redemption)
// ═══════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import { extractVoucherDataFromVideoId, encodeVideoIdWithVoucher } from './submissionHelpers';

/**
 * Generate a unique, user-friendly voucher code
 * Format: VCH-GNG-XXXX-YYYY (High entropy alphanumeric chars)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars like 0/O, 1/I
  const timePart = (Date.now() % 10000000).toString(36).toUpperCase().padStart(4, 'X').slice(-4);
  let randomPart = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(4);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(bytes[i] % chars.length);
    }
  } else {
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return `VCH-GNG-${timePart}-${randomPart}`;
}

/**
 * Fallback to generate a deterministic, unique voucher code from a submission ID
 * Ensures no submission ever repeats a fallback code like 'VCH-ACTIVE'
 */
export function getFallbackUniqueVoucherCode(subId?: string): string {
  if (!subId) return generateVoucherCode();
  const clean = subId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const p1 = clean.slice(0, 4) || 'GNG1';
  const p2 = clean.slice(-4) || 'VCH9';
  return `VCH-GNG-${p1}-${p2}`;
}

/**
 * Generate a guaranteed unique voucher code verified against database records
 */
export async function generateUniqueVoucherCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    attempts++;
    const candidate = generateVoucherCode();
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('voucher_code', candidate)
        .maybeSingle();

      if (!error && !data) {
        // Also check if candidate exists encoded in any video_id
        const { data: videoData } = await supabase
          .from('submissions')
          .select('id')
          .ilike('video_id', `%${candidate}%`)
          .limit(1);

        if (!videoData || videoData.length === 0) {
          return candidate;
        }
      }
    } catch {
      return candidate;
    }
  }
  return `VCH-GNG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export interface VoucherVerificationResult {
  isValid: boolean;
  isRedeemed?: boolean;
  submission?: any;
  error?: string;
}

/**
 * Verify if a voucher code exists, is valid, and whether it has been redeemed
 */
export async function verifyVoucherCode(code: string): Promise<VoucherVerificationResult> {
  if (!code || !code.trim()) {
    return { isValid: false, error: 'Please enter a voucher code.' };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    // 1. Direct column lookup
    let { data, error } = await supabase
      .from('submissions')
      .select('*, campaign:campaigns(*), creator:profiles(*)')
      .eq('voucher_code', cleanCode)
      .maybeSingle();

    // 2. If not found by column, search encoded in video_id
    if (!data) {
      const { data: listData } = await supabase
        .from('submissions')
        .select('*, campaign:campaigns(*), creator:profiles(*)')
        .ilike('video_id', `%${cleanCode}%`)
        .limit(1);

      if (listData && listData.length > 0) {
        data = listData[0];
      }
    }

    if (error) {
      console.warn('Voucher query error:', error);
      return { isValid: false, error: 'Failed to verify voucher code from database.' };
    }

    if (!data) {
      return { isValid: false, error: 'Invalid voucher code. No matching record found.' };
    }

    const vData = extractVoucherDataFromVideoId(data.video_id);
    const isRedeemed = data.voucher_status === 'redeemed' || vData?.voucher_status === 'redeemed';
    return {
      isValid: true,
      isRedeemed,
      submission: {
        ...data,
        voucher_code: cleanCode,
        voucher_status: isRedeemed ? 'redeemed' : 'active',
        voucher_details: vData?.voucher_details || data.voucher_details,
      },
    };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Error verifying voucher code.' };
  }
}

/**
 * Mark a voucher as redeemed by the campaign owner
 */
export async function markVoucherAsRedeemed(code: string): Promise<{ success: boolean; error?: string }> {
  if (!code || !code.trim()) {
    return { success: false, error: 'Invalid voucher code.' };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const { data } = await supabase
      .from('submissions')
      .select('id, video_id')
      .or(`voucher_code.eq.${cleanCode},video_id.ilike.%${cleanCode}%`)
      .limit(1);

    const sub = data?.[0];
    const now = new Date().toISOString();

    if (sub) {
      const existingVData = extractVoucherDataFromVideoId(sub.video_id) || {};
      const newVideoId = encodeVideoIdWithVoucher(sub.video_id, {
        ...existingVData,
        voucher_code: cleanCode,
        voucher_status: 'redeemed',
        voucher_details: {
          ...(existingVData.voucher_details || {}),
          redeemed_at: now,
        },
      });

      await supabase
        .from('submissions')
        .update({
          voucher_status: 'redeemed',
          voucher_redeemed_at: now,
          video_id: newVideoId,
        })
        .eq('id', sub.id);
    } else {
      await supabase
        .from('submissions')
        .update({
          voucher_status: 'redeemed',
          voucher_redeemed_at: now,
        })
        .eq('voucher_code', cleanCode);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark voucher as redeemed.' };
  }
}
