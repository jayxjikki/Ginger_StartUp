-- Add tracking columns for individual message deletion
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;

-- Update the SELECT policy so users only see messages they haven't deleted
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (
    (auth.uid() = sender_id AND deleted_by_sender = FALSE) OR 
    (auth.uid() = receiver_id AND deleted_by_receiver = FALSE)
  );

-- Add a policy allowing users to update their respective deleted flag
DROP POLICY IF EXISTS "Users can delete their copy of messages" ON public.messages;
CREATE POLICY "Users can delete their copy of messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (
    (auth.uid() = sender_id AND deleted_by_sender = TRUE) OR 
    (auth.uid() = receiver_id AND deleted_by_receiver = TRUE)
  );
