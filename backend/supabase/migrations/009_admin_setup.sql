-- ═══════════════════════════════════════════════════════════
-- GINGER — Admin Dashboard Setup
-- Adds role, is_banned column and Admin RLS Policies
-- ═══════════════════════════════════════════════════════════

-- 1. Add missing role and is_banned columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Create Security Definer function to check admin status safely (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Add Admin RLS Policies (Full access to Admins)
-- Drop existing policies if they already exist to avoid errors during re-run
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins have full access to submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins have full access to wallet_transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins have full access to slideshows" ON public.slideshows;

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to campaigns"
  ON public.campaigns FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to submissions"
  ON public.submissions FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to wallet_transactions"
  ON public.wallet_transactions FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins have full access to slideshows"
  ON public.slideshows FOR ALL
  USING (public.is_admin(auth.uid()));
