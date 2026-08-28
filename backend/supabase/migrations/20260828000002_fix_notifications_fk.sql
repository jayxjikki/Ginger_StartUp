-- ═══════════════════════════════════════════════════════════
-- GINGER — Safely Upgrade Notifications Table Schema & Foreign Keys
-- ═══════════════════════════════════════════════════════════

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add all missing columns to notifications table
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS actor_id UUID,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 3. Populate 'content' from 'body' or 'title' if null
UPDATE public.notifications 
SET content = COALESCE(content, 'Notification')
WHERE content IS NULL;

-- 4. Safely ensure Foreign Key constraint for actor_id -> profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_actor_id_fkey' 
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 5. Safely ensure Foreign Key constraint for user_id -> profiles(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_user_id_fkey' 
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Enable RLS and setup policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
