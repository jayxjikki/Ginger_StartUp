-- ═══════════════════════════════════════════════════════════
-- GINGER — Database Migration: Feed Interactions (Likes & Comments)
-- ═══════════════════════════════════════════════════════════

-- Create Interactions Likes Table
CREATE TABLE IF NOT EXISTS public.interactions_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL, -- The ID of the post, achievement, or media kit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_likes_entity ON public.interactions_likes(entity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_likes_user ON public.interactions_likes(user_id);

-- Create Interactions Comments Table
CREATE TABLE IF NOT EXISTS public.interactions_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_comments_entity ON public.interactions_comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_interactions_comments_created ON public.interactions_comments(created_at ASC);

-- Enable RLS
ALTER TABLE public.interactions_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions_comments ENABLE ROW LEVEL SECURITY;

-- ══ LIKES POLICIES ════════════════════════════════════════

-- Anyone can view likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.interactions_likes FOR SELECT
  USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes"
  ON public.interactions_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON public.interactions_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ══ COMMENTS POLICIES ═════════════════════════════════════

-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.interactions_comments FOR SELECT
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON public.interactions_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.interactions_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.interactions_comments FOR DELETE
  USING (auth.uid() = user_id);
