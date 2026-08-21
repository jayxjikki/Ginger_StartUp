-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Campaigns & Related Tables
-- ═══════════════════════════════════════════════════════════

-- Social Links
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  url TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_links_profile ON public.social_links(profile_id);

-- Media Kits
CREATE TABLE IF NOT EXISTS public.media_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  images TEXT[] DEFAULT '{}',
  pdf_url TEXT,
  description TEXT,
  rate_per_post DECIMAL(12, 2),
  rate_per_story DECIMAL(12, 2),
  rate_per_reel DECIMAL(12, 2),
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pool', 'discount', 'hybrid')),
  prize_pool DECIMAL(12, 2) DEFAULT 0,
  remaining_pool DECIMAL(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'completed', 'expired', 'draft')),
  required_platforms TEXT[] DEFAULT '{}',
  video_requirements TEXT,
  slogan TEXT,
  keywords TEXT[] DEFAULT '{}',
  terms JSONB DEFAULT '{}',
  location TEXT,
  discount_percent DECIMAL(5, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  verification_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON public.campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON public.campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_location ON public.campaigns(location);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON public.campaigns(created_at DESC);

-- Payout Tiers
CREATE TABLE IF NOT EXISTS public.payout_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  min_views INTEGER NOT NULL,
  payout_amount DECIMAL(12, 2) NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'cash' CHECK (reward_type IN ('cash', 'discount', 'gift', 'refund')),
  reward_description TEXT
);

CREATE INDEX IF NOT EXISTS idx_payout_tiers_campaign ON public.payout_tiers(campaign_id);

-- Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL,
  video_id TEXT,
  current_views INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'paid', 'disputed', 'rejected')),
  earned_amount DECIMAL(12, 2) DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  UNIQUE(campaign_id, creator_id) -- One submission per creator per campaign
);

CREATE INDEX IF NOT EXISTS idx_submissions_campaign ON public.submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_submissions_creator ON public.submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'earning', 'commission', 'escrow', 'refund')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_created ON public.wallet_transactions(created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Updated_at triggers for tables that need it
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER media_kits_updated_at BEFORE UPDATE ON public.media_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
