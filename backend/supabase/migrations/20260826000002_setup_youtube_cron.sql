-- Ensure pg_net is enabled (it usually is by default on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every 15 minutes
SELECT cron.schedule(
  'sync-youtube-stats', -- Job name
  '*/15 * * * *',       -- Every 15 minutes (Cron syntax)
  $$
    SELECT net.http_post(
      url:='https://ywpgnkvlzxwzuptaxqyw.supabase.co/functions/v1/sync-youtube-stats',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);
