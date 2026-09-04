-- Migration: Add submission_type to submissions table
-- Supports 'all_rewards' (all milestone & cash rewards) and 'direct_discount' (direct discount / perk submissions)

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'all_rewards';

-- Add comment explaining valid values
COMMENT ON COLUMN public.submissions.submission_type IS 'Type of submission: all_rewards (all milestones & rewards) or direct_discount (direct discount code/perk)';
