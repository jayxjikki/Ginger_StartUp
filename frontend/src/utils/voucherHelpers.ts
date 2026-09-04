// ═══════════════════════════════════════════════════════════
// GINGER — Voucher Code Helpers (Generation, Lookup, Redemption)
// ═══════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';

/**
 * Generate a unique, user-friendly voucher code
 * Format: VCH-GNG-XXXXX (5 uppercase alphanumeric chars)
 */
export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars like 0/O, 1/I
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VCH-GNG-${randomPart}`;
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
    const { data, error } = await supabase
      .from('submissions')
      .select('*, campaign:campaigns(*), creator:profiles(*)')
      .eq('voucher_code', cleanCode)
      .maybeSingle();

    if (error) {
      console.warn('Voucher query error:', error);
      return { isValid: false, error: 'Failed to verify voucher code from database.' };
    }

    if (!data) {
      return { isValid: false, error: 'Invalid voucher code. No matching record found.' };
    }

    const isRedeemed = data.voucher_status === 'redeemed';
    return {
      isValid: true,
      isRedeemed,
      submission: data,
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
    const { error } = await supabase
      .from('submissions')
      .update({
        voucher_status: 'redeemed',
        voucher_redeemed_at: new Date().toISOString(),
      })
      .eq('voucher_code', cleanCode);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark voucher as redeemed.' };
  }
}
