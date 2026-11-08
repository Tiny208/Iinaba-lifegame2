-- Migration: Add recurrence field to tasks table
-- Options: null, 'daily', 'weekly', 'monthly'

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('daily', 'weekly', 'monthly'));

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON public.tasks(user_id, recurrence) WHERE recurrence IS NOT NULL;
