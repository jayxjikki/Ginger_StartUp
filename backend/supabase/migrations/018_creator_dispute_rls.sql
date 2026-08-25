-- Allow creators to update their own submissions only to raise a dispute (change status to 'disputed')
CREATE POLICY "Creators can dispute rejected submissions"
  ON public.submissions FOR UPDATE
  USING (creator_id = auth.uid() AND status = 'rejected')
  WITH CHECK (creator_id = auth.uid() AND status = 'disputed');
