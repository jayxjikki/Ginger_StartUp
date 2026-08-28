-- ═══════════════════════════════════════════════════════════
-- GINGER — Setup Like & Comment Notifications Triggers
-- ═══════════════════════════════════════════════════════════

-- 1. Ensure all columns exist and remove NOT NULL restrictions from legacy columns
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS actor_id UUID,
  ADD COLUMN IF NOT EXISTS entity_id UUID,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT;

-- Drop legacy NOT NULL constraints if present
ALTER TABLE public.notifications ALTER COLUMN title DROP NOT NULL;

-- 2. Ensure Foreign Keys exist
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

-- 3. Trigger for Likes on Posts / Achievements / Media Kits
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  actor_name TEXT;
BEGIN
  -- Find author in posts
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.entity_id;
  
  -- If not found, try achievements
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.achievements WHERE id = NEW.entity_id;
  END IF;

  -- If not found, try media_kit_items
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.media_kit_items WHERE id = NEW.entity_id;
  END IF;

  -- Get actor name for title
  SELECT COALESCE(full_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.user_id;

  -- Insert notification if the author exists AND the liker is not the author
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id, 
      actor_id, 
      type, 
      entity_id, 
      content,
      title,
      body,
      is_read
    )
    VALUES (
      post_author, 
      NEW.user_id, 
      'like', 
      NEW.entity_id, 
      'liked your post.',
      COALESCE(actor_name, 'Someone') || ' liked your post',
      'liked your post.',
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for Comments on Posts / Achievements / Media Kits
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  actor_name TEXT;
  comment_snippet TEXT;
BEGIN
  -- Find author in posts
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.entity_id;
  
  -- If not found, try achievements
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.achievements WHERE id = NEW.entity_id;
  END IF;

  -- If not found, try media_kit_items
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.media_kit_items WHERE id = NEW.entity_id;
  END IF;

  -- Get actor name for title
  SELECT COALESCE(full_name, username, 'Someone') INTO actor_name FROM public.profiles WHERE id = NEW.user_id;

  -- Generate a short snippet of the comment
  comment_snippet := SUBSTRING(NEW.content, 1, 40);
  IF LENGTH(NEW.content) > 40 THEN
    comment_snippet := comment_snippet || '...';
  END IF;

  -- Insert notification if the author exists AND the commenter is not the author
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id, 
      actor_id, 
      type, 
      entity_id, 
      content,
      title,
      body,
      is_read
    )
    VALUES (
      post_author, 
      NEW.user_id, 
      'comment', 
      NEW.entity_id, 
      'commented: "' || comment_snippet || '"',
      COALESCE(actor_name, 'Someone') || ' commented on your post',
      comment_snippet,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Triggers to interactions tables
DROP TRIGGER IF EXISTS on_like_inserted ON public.interactions_likes;
CREATE TRIGGER on_like_inserted
  AFTER INSERT ON public.interactions_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

DROP TRIGGER IF EXISTS on_comment_inserted ON public.interactions_comments;
CREATE TRIGGER on_comment_inserted
  AFTER INSERT ON public.interactions_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- 6. Enable Realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
