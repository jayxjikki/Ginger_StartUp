-- GINGER - Add manager_approved status to submissions check constraint

ALTER TABLE public.submissions DROP CONSTRAINT submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check CHECK (status IN ('pending', 'verified', 'paid', 'disputed', 'rejected', 'flagged', 'manager_approved'));
