-- Add access_token column to social_links for API usage
ALTER TABLE public.social_links ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Schedule the edge function to run every 15 minutes
SELECT cron.schedule(
  'sync-instagram-stats', -- Job name
  '*/15 * * * *',       -- Every 15 minutes (Cron syntax)
  $$
    SELECT net.http_post(
      url:='https://gugjrgpfgkonmiqdghbe.supabase.co/functions/v1/sync-instagram-stats',
      headers:='{"Content-Type": "application/json"}'::jsonb
    )
  $$
);
