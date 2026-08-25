-- 1. DROP the old check constraint that didn't allow 'flagged' status
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- 2. ADD the new check constraint to include 'flagged'
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('pending', 'verified', 'paid', 'disputed', 'rejected', 'flagged'));

-- 3. DROP the old policy if it exists (so we can recreate it)
DROP POLICY IF EXISTS "Advertisers can flag submissions on their campaigns" ON public.submissions;

-- 4. CREATE the new RLS policy allowing advertisers to flag submissions
-- (Allowing them to flag pending, verified, or paid submissions)
CREATE POLICY "Advertisers can flag submissions on their campaigns"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = submissions.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
    AND status IN ('pending', 'verified', 'paid')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = submissions.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
    AND status = 'flagged'
  );
