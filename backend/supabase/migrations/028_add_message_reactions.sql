-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Add Message Reactions
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reaction TEXT DEFAULT NULL;

-- Drop the old update policy which only allowed receivers
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;

-- Create new update policy to allow both sender and receiver to update the message (e.g., adding reactions or marking read)
CREATE POLICY "Users can update messages they are part of"
  ON public.messages
  FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
  WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);
