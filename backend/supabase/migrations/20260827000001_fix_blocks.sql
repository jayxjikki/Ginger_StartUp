-- Allow users to see if they have been blocked (required for hiding chats and preventing messages)
DROP POLICY IF EXISTS "Users can view their blocked list" ON public.blocked_users;
CREATE POLICY "Users can view blocks they are part of"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Prevent inserting messages if a block exists in either direction
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    NOT EXISTS (
      SELECT 1 FROM public.blocked_users 
      WHERE (blocker_id = sender_id AND blocked_id = receiver_id)
         OR (blocker_id = receiver_id AND blocked_id = sender_id)
    )
  );
