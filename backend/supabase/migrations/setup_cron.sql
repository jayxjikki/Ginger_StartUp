-- Ensure pg_net is enabled (it usually is by default on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every day at midnight (UTC)
SELECT cron.schedule(
  'sync-telegram-stats', -- Job name
  '0 0 * * *',           -- Every day at midnight (Cron syntax)
  $$
    SELECT net.http_post(
      url:='https://ywpgnkvlzxwzuptaxqyw.supabase.co/functions/v1/sync-telegram-stats',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);
