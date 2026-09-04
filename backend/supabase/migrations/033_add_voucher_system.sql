-- Migration: Add voucher system to submissions table
-- Supports direct discount voucher generation, verification, and redemption

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS voucher_code TEXT,
ADD COLUMN IF NOT EXISTS voucher_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS voucher_details JSONB,
ADD COLUMN IF NOT EXISTS voucher_redeemed_at TIMESTAMPTZ;

-- Index for fast voucher verification lookups
CREATE INDEX IF NOT EXISTS idx_submissions_voucher_code ON public.submissions(voucher_code);
CREATE INDEX IF NOT EXISTS idx_submissions_voucher_status ON public.submissions(voucher_status);

COMMENT ON COLUMN public.submissions.voucher_code IS 'Unique voucher code generated upon owner approval of direct discount submission';
COMMENT ON COLUMN public.submissions.voucher_status IS 'Status of the voucher: active or redeemed';
