-- Add change-tracking timestamp columns to profiles for rate limiting
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS name_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;
