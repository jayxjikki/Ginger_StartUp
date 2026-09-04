-- ═══════════════════════════════════════════════════════════
-- GINGER — Add images TEXT[] array column to campaigns table
-- Supports up to 3 campaign images for automatic slideshow
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
