-- ═══════════════════════════════════════════════════════════
-- GINGER — Slideshow Table & Seed Data
-- ═══════════════════════════════════════════════════════════

-- 1. Create Slideshows table
CREATE TABLE IF NOT EXISTS public.slideshows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_url TEXT NOT NULL,
  badge_text TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  theme_color TEXT NOT NULL, -- e.g., 'blue', 'purple', 'emerald'
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS Policies
ALTER TABLE public.slideshows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slideshows are viewable by everyone"
  ON public.slideshows FOR SELECT
  USING (is_active = true);

-- 3. Seed initial dummy data
INSERT INTO public.slideshows (title, subtitle, image_url, badge_text, badge_icon, theme_color, order_index)
VALUES 
  (
    'Weekly Leaderboard',
    'See who''s topping the charts this week.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDQkq5wFQ2wFMwpdsPcvLmVSnOlDdExfDzQ2OHyRuDpao76DXhNPrStIKvGVYf-cmnSpcPeNkr5vGX7ZV39DUSf--EYJfqzRQoIvxXezdpLQPggaZZ2DmrY3wEySOwXOCChyUtlbikJ_5QTaxp2ea08erI-RExGU2_Wuo99q70W1fW4IrYzCOMiar0lHC_gAYHozOrKy25thMXVcEozI47a5nb3-VXonJ76lZeQtkk4VPa7s6AnAmrY',
    'TOP EARNERS',
    'emoji_events',
    'blue',
    1
  ),
  (
    'Creator Highlights',
    'Top performing campaigns of the month.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBMuNiiPGcmYzRpmWeIdFe6qsnqfvRNb_WJNBFL9PwGuzVeWIWxcLxnYXqtyDrhMOCQ9lnbpaIcuGPS_C8wa19towtBzUKHyeJU1V5o5_MltEIP_4Z2d6sSmV26p06an7L_pZtwAsUrzBSV-OMUz898yo_AGEvmyWnLBPCmor1KZJSi3j4PID1n_qxIZP9nJoo_Fj9u-D571FKjiBMO0rqmJC6wnL-MSg3YySSIEW5obRgwynX8UnKF',
    'MONTHLY STARS',
    'star',
    'purple',
    2
  ),
  (
    'New Creators',
    'Fresh talent making waves.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDkafrXKcG2BeERv1xzaW-kTI4YPsdqneuw0VUWReHJbxkuygXIb0uPadE4OfkmiM1QTJLWY_ho1UFjhnbTpmctzZYBot0aD5Ym0UcnbmDqw2HVkT3Cr3dzp7qaPixuowrvvuCztKuJ7O64eIDl7tYeO4oyot0VFw_FPxrnz2xLsP00q4JJCz-81M4qk-ehf1NLaeng2IBvcCpXtd6E4flAfTW13ULlpJqUmbpEF7Fh2XiI3Becbkux',
    'RISING',
    'trending_up',
    'emerald',
    3
  );
