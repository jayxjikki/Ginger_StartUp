// ═══════════════════════════════════════════════════════════
// GINGER — Payment Type Definitions
// ═══════════════════════════════════════════════════════════

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'earning' | 'commission' | 'escrow' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface WalletBalance {
  available: number;
  pending: number;
  total_earned: number;
  total_spent: number;
  currency: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
