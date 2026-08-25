-- Allow advertisers to update submission status to 'flagged' for their own campaigns
CREATE POLICY "Advertisers can flag submissions on their campaigns"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = submissions.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = submissions.campaign_id
      AND campaigns.advertiser_id = auth.uid()
    )
    AND status = 'flagged'
  );
