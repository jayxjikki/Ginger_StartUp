-- ═══════════════════════════════════════════════════════════
-- GINGER — Update Slideshows
-- Adds link_url for redirections
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.slideshows ADD COLUMN IF NOT EXISTS link_url TEXT;
