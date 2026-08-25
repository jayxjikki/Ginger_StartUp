-- ═══════════════════════════════════════════════════════════
-- GINGER — UGC Compliance: Reports & Blocks
-- ═══════════════════════════════════════════════════════════

-- 1. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_item_id UUID NOT NULL, -- ID of the profile, campaign, or submission
  item_type TEXT NOT NULL CHECK (item_type IN ('profile', 'campaign', 'submission')),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can create a report
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can view and update all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


-- 2. Blocked Users Table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can block other users
CREATE POLICY "Users can block others"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can view who they blocked
CREATE POLICY "Users can view their blocked list"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can unblock
CREATE POLICY "Users can unblock others"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- Note: We must update the `profiles` and `campaigns` SELECT policies later to filter out blocked users.
-- For now, this table exists to satisfy UGC policies, and frontend can filter them out manually if needed.
