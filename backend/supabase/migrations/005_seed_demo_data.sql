-- ═══════════════════════════════════════════════════════════
-- GINGER — Seed Demo Data
-- Note: Run this in your Supabase SQL Editor. 
-- It creates mock users and populates campaigns, profiles, etc.
-- ═══════════════════════════════════════════════════════════

-- Use a DO block to declare variables for UUIDs
DO $$
DECLARE
  -- Influencers
  inf1_id UUID := '11111111-1111-1111-1111-111111111111';
  inf2_id UUID := '22222222-2222-2222-2222-222222222222';
  inf3_id UUID := '33333333-3333-3333-3333-333333333333';
  
  -- Advertisers
  adv1_id UUID := 'aaaaa111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  adv2_id UUID := 'aaaaa222-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  
  -- Campaigns
  camp1_id UUID := gen_random_uuid();
  camp2_id UUID := gen_random_uuid();
BEGIN

  -- 1. Create mock users in auth.users
  -- Warning: This requires superuser/postgres role (available in SQL Editor)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (inf1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'meera@ginger.demo', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (inf2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fitraj@ginger.demo', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (inf3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'neha@ginger.demo', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (adv1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'resort@ginger.demo', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (adv2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'spice@ginger.demo', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Update Profiles (created automatically by trigger, so we UPDATE instead of INSERT)
  UPDATE public.profiles SET 
    full_name = 'Meera Travels', username = '@meeratravels', bio = 'Travel vlogger | 50+ countries explored', category = 'Travel', location = 'Mumbai, India', follower_count = 820000, rates = '{"per_post": 8000, "per_reel": 15000}'::jsonb, is_verified = true
  WHERE id = inf1_id;

  UPDATE public.profiles SET 
    full_name = 'FitRaj', username = '@fitraj_official', bio = 'Fitness coach & certified nutritionist', category = 'Fitness & Gym', location = 'Delhi, India', follower_count = 1200000, rates = '{"per_post": 12000, "per_reel": 25000}'::jsonb, is_verified = true
  WHERE id = inf2_id;

  UPDATE public.profiles SET 
    full_name = 'CodeWithNeha', username = '@codewithneha', bio = 'Tech educator | React, Python, AI tutorials', category = 'Education', location = 'Bangalore, India', follower_count = 350000, rates = '{"per_post": 5000, "per_reel": 10000}'::jsonb, is_verified = false
  WHERE id = inf3_id;

  UPDATE public.profiles SET 
    full_name = 'Himalayan Resort', username = '@cloudpeakresort', bio = 'Luxury mountain retreat', category = 'Travel', is_verified = true
  WHERE id = adv1_id;

  UPDATE public.profiles SET 
    full_name = 'Spice Garden', username = '@spicegardenblr', bio = 'Authentic South Indian', category = 'Food & Restaurant', is_verified = false
  WHERE id = adv2_id;


  -- 3. Insert Campaigns
  INSERT INTO public.campaigns (id, advertiser_id, title, description, type, prize_pool, remaining_pool, status, required_platforms, video_requirements, slogan, keywords, terms, location)
  VALUES 
    (camp1_id, adv1_id, 'Luxury Himalayan Resort Grand Opening', 'We just opened a 5-star luxury resort. Create stunning videos.', 'pool', 1000000, 850000, 'active', ARRAY['youtube', 'instagram'], 'Minimum 60 seconds.', 'Where Luxury Meets the Clouds ☁️', ARRAY['luxury resort', 'travel india'], '{"min_duration_seconds": 60}'::jsonb, 'Manali, Himachal Pradesh'),
    (camp2_id, adv2_id, 'Spice Garden Restaurant — Taste & Create', 'New authentic South Indian restaurant. Come eat our signature dishes.', 'hybrid', 200000, 180000, 'active', ARRAY['instagram'], 'Must feature 3 dishes.', 'Spice That Speaks 🌶️', ARRAY['food review', 'bangalore'], '{"min_duration_seconds": 30}'::jsonb, 'Bangalore, India')
  ON CONFLICT (id) DO NOTHING;

  -- 4. Insert Payout Tiers
  INSERT INTO public.payout_tiers (campaign_id, min_views, payout_amount, reward_type, reward_description)
  VALUES 
    (camp1_id, 1000, 1000, 'cash', NULL),
    (camp1_id, 10000, 10000, 'cash', NULL),
    (camp1_id, 100000, 200000, 'cash', 'Plus free 2-night stay!'),
    (camp2_id, 500, 500, 'cash', NULL),
    (camp2_id, 5000, 5000, 'cash', NULL)
  ON CONFLICT DO NOTHING;

  -- 5. Insert Social Links
  INSERT INTO public.social_links (profile_id, platform, platform_username, followers_count, is_verified)
  VALUES 
    (inf1_id, 'youtube', 'MeeraTravels', 300000, true),
    (inf1_id, 'instagram', 'meeratravels', 520000, true),
    (inf2_id, 'instagram', 'fitraj_official', 1200000, true),
    (inf3_id, 'youtube', 'codewithneha', 350000, false)
  ON CONFLICT DO NOTHING;

END $$;
