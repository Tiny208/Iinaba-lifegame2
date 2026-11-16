-- Migration: Add recurrence date range fields to tasks and calendar_events
-- Enables setting start date ("bắt đầu từ") and end date ("đến ngày") for recurrence

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS recurrence_start_date date,
ADD COLUMN IF NOT EXISTS recurrence_end_date date;

ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS recurrence_start_date date,
ADD COLUMN IF NOT EXISTS recurrence_end_date date;

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_range 
ON public.tasks(user_id, recurrence_start_date, recurrence_end_date)
WHERE recurrence IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_range 
ON public.calendar_events(user_id, recurrence_start_date, recurrence_end_date)
WHERE recurrence IS NOT NULL;
