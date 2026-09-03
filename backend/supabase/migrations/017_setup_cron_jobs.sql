-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Setup Cron Jobs
-- Requires pg_cron and pg_net extensions
-- ═══════════════════════════════════════════════════════════

-- Make sure extensions are enabled
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Verify Video Views Cron Job (Runs every 30 minutes)
-- Make sure to replace YOUR_PROJECT_REF with your actual Supabase project reference
-- and provide the correct CRON_SECRET if you added one.
SELECT cron.schedule(
  'verify-videos-every-30-mins',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
        url:='https://gugjrgpfgkonmiqdghbe.supabase.co/functions/v1/verify-video',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cGdua3Zsenh3enVwdGF4cXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzA3ODAsImV4cCI6MjEwMjkwNjc4MH0.Reb1p2Dwz7-uV9JVE4UesNxBSmkjKwM1pjxkr1Chm3Q"}'::jsonb
    ) as request_id;
  $$
);

-- 2. Storage Cleanup Cron Job (Runs every day at midnight)
SELECT cron.schedule(
  'storage-cleanup-daily',
  '0 0 * * *',
  $$
    SELECT net.http_post(
        url:='https://gugjrgpfgkonmiqdghbe.supabase.co/functions/v1/storage-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cGdua3Zsenh3enVwdGF4cXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzA3ODAsImV4cCI6MjEwMjkwNjc4MH0.Reb1p2Dwz7-uV9JVE4UesNxBSmkjKwM1pjxkr1Chm3Q"}'::jsonb
    ) as request_id;
  $$
);
