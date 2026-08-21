-- ═══════════════════════════════════════════════════════════
-- GINGER — Row Level Security Policies
-- Every table gets RLS for production-grade security
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ══ PROFILES ══════════════════════════════════════════════

-- Anyone can view profiles (public marketplace)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ══ SOCIAL LINKS ══════════════════════════════════════════

CREATE POLICY "Social links are viewable by everyone"
  ON public.social_links FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own social links"
  ON public.social_links FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ══ MEDIA KITS ════════════════════════════════════════════

CREATE POLICY "Media kits are viewable by everyone"
  ON public.media_kits FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own media kit"
  ON public.media_kits FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ══ CAMPAIGNS ═════════════════════════════════════════════

-- Anyone can view active campaigns
CREATE POLICY "Active campaigns are viewable by everyone"
  ON public.campaigns FOR SELECT
  USING (status = 'active' OR advertiser_id = auth.uid());

-- Advertisers can create campaigns
CREATE POLICY "Authenticated users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

-- Advertisers can update their own campaigns
CREATE POLICY "Advertisers can update own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = advertiser_id)
  WITH CHECK (auth.uid() = advertiser_id);

-- ══ PAYOUT TIERS ══════════════════════════════════════════

CREATE POLICY "Payout tiers are viewable by everyone"
  ON public.payout_tiers FOR SELECT
  USING (true);

CREATE POLICY "Campaign owners can manage payout tiers"
  ON public.payout_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND advertiser_id = auth.uid()
    )
  );

-- ══ SUBMISSIONS ═══════════════════════════════════════════

-- Creators see their own; advertisers see submissions on their campaigns
CREATE POLICY "Users can view relevant submissions"
  ON public.submissions FOR SELECT
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND advertiser_id = auth.uid()
    )
  );

-- Creators can submit videos
CREATE POLICY "Creators can submit videos"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- ══ WALLET TRANSACTIONS ═══════════════════════════════════

-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (service_role) can insert transactions
-- Frontend cannot directly insert wallet transactions
CREATE POLICY "Only service role can create transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (false); -- Blocked for anon/authenticated; use edge functions

-- ══ NOTIFICATIONS ═════════════════════════════════════════

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
