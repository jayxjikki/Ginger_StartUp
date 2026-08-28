-- Enable Realtime for all tables that need instant updates
-- Messages, Profiles, and Notifications are already enabled in previous migrations.

BEGIN;

-- Add posts to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    END IF;
END $$;

-- Add interactions_likes to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interactions_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions_likes;
    END IF;
END $$;

-- Add interactions_comments to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interactions_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions_comments;
    END IF;
END $$;

-- Add submissions to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'submissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
    END IF;
END $$;

-- Add wallet_transactions to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wallet_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
    END IF;
END $$;

-- Add campaigns to realtime (optional, but good for status changes)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaigns'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
    END IF;
END $$;

COMMIT;
