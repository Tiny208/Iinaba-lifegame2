-- Migration: Add recurrence field to calendar_events table
-- Options: null, 'daily', 'weekly', 'monthly', 'yearly'

ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('daily', 'weekly', 'monthly', 'yearly'));

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence 
ON public.calendar_events(user_id, recurrence) 
WHERE recurrence IS NOT NULL;
