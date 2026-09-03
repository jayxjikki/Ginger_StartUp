-- Add Instagram Bio-Code verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ig_username TEXT,
ADD COLUMN IF NOT EXISTS ig_followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ig_verification_token TEXT,
ADD COLUMN IF NOT EXISTS ig_token_expires_at TIMESTAMPTZ;
