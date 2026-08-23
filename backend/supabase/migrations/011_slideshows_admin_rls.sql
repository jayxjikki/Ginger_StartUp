-- ═══════════════════════════════════════════════════════════
-- GINGER — Slideshow RLS Fix
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Admins have full access to slideshows" ON public.slideshows;

CREATE POLICY "Admins can manage slideshows"
  ON public.slideshows
  FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
