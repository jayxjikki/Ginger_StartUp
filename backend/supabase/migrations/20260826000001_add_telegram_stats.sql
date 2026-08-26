-- 1. Add member_count and last_updated to verified_channels
ALTER TABLE public.verified_channels
ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- 2. Note on cron job
-- To run the sync-telegram-stats Edge Function daily, we can use pg_cron and pg_net.
-- Due to required secrets (SERVICE_ROLE_KEY and project URL), this should be configured 
-- via the Supabase Dashboard SQL editor rather than a tracked migration file.
-- Example setup:
/*
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;

  SELECT cron.schedule(
    'sync-telegram-stats-daily',
    '0 0 * * *',
    $$
    SELECT net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-telegram-stats',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
    $$
  );
*/
