-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Notifications System
-- ═══════════════════════════════════════════════════════════

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Who receives the notification
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who performed the action (NULL for system/admin)
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'system', 'admin')),
  entity_id UUID, -- The post, comment, or campaign ID associated with the notification
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ══ TRIGGER FUNCTIONS ═════════════════════════════════════

-- 1. Trigger for Likes
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
BEGIN
  -- Try to find author in posts
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.entity_id;
  
  -- If not found, try media_kit_items
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.media_kit_items WHERE id = NEW.entity_id;
  END IF;

  -- If not found, try achievements
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.achievements WHERE id = NEW.entity_id;
  END IF;

  -- Insert notification if the author exists AND the liker is not the author
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    -- Check if a notification already exists for this exact like to prevent spam (optional but good practice)
    -- But since likes are unique (user_id, entity_id), it will only happen once per like unless they unlike and relike.
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id, content)
    VALUES (post_author, NEW.user_id, 'like', NEW.entity_id, 'liked your post.');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for Comments
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  comment_snippet TEXT;
BEGIN
  -- Try to find author in posts
  SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.entity_id;
  
  -- If not found, try media_kit_items
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.media_kit_items WHERE id = NEW.entity_id;
  END IF;

  -- If not found, try achievements
  IF post_author IS NULL THEN
    SELECT profile_id INTO post_author FROM public.achievements WHERE id = NEW.entity_id;
  END IF;

  -- Generate a short snippet of the comment
  comment_snippet := SUBSTRING(NEW.content, 1, 30);
  IF LENGTH(NEW.content) > 30 THEN
    comment_snippet := comment_snippet || '...';
  END IF;

  -- Insert notification if the author exists AND the commenter is not the author
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id, content)
    VALUES (post_author, NEW.user_id, 'comment', NEW.entity_id, 'commented: "' || comment_snippet || '"');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══ ATTACH TRIGGERS ═══════════════════════════════════════

DROP TRIGGER IF EXISTS on_like_inserted ON public.interactions_likes;
CREATE TRIGGER on_like_inserted
  AFTER INSERT ON public.interactions_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

DROP TRIGGER IF EXISTS on_comment_inserted ON public.interactions_comments;
CREATE TRIGGER on_comment_inserted
  AFTER INSERT ON public.interactions_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();
