-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Add Banner URL to Profiles
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
