-- Policy: Users can delete messages they are part of
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
CREATE POLICY "Users can delete own messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
