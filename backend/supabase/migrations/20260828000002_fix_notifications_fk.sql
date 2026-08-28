-- ═══════════════════════════════════════════════════════════
-- GINGER — Fix Notifications Table Foreign Key & Schema Cache
-- ═══════════════════════════════════════════════════════════

-- 1. Ensure table exists with all columns
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'system', 'admin')),
  entity_id UUID,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add Foreign Key constraint for actor_id -> profiles(id)
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

-- 3. Safely add Foreign Key constraint for user_id -> profiles(id)
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

-- 4. Enable RLS and create policies
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

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
