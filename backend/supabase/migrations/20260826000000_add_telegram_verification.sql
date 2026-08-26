-- 1. Table to store user profiles and verification tokens
-- We are altering the existing profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS verify_token TEXT UNIQUE;

-- 2. Table to store verified public channels
CREATE TABLE IF NOT EXISTS public.verified_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel_username TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for verified_channels
ALTER TABLE public.verified_channels ENABLE ROW LEVEL SECURITY;

-- Create policies for verified_channels
CREATE POLICY "Users can view their own verified channels"
ON public.verified_channels FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own verified channels"
ON public.verified_channels FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own verified channels"
ON public.verified_channels FOR DELETE
USING (auth.uid() = profile_id);

-- 3. Enable Realtime updates for profiles
-- We simply try to add it. If it's already in the publication, you can ignore the error, or run this block:
DO $$ 
BEGIN
  -- Check if table is not already in the publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
