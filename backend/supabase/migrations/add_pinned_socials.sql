-- Add pinned_socials array to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_socials text[] DEFAULT '{}';
