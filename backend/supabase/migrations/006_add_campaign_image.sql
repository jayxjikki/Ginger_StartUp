-- ═══════════════════════════════════════════════════════════
-- Add Image URL to Campaigns Table
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS image_url TEXT;
