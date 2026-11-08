import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent, Task, EventRecurrence } from '@/types/database';
import {
  subMonths,
  addMonths,
  addWeeks,
  addDays,
  getDaysInMonth,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns';

export interface CalendarItem {
  id: string;
  type: 'event' | 'task_scheduled' | 'task_deadline';
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (only for events)
  allDay?: boolean;
  rawEvent?: CalendarEvent;
  rawTask?: Task;
}

export function useCalendar(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch independent calendar events
  const eventsQuery = useQuery({
    queryKey: ['calendar_events', user?.id, startDate, endDate],
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!user) return [];
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (startDate) {
        query = query.gte('start_time', startDate);
      }
      if (endDate) {
        query = query.lte('end_time', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
    enabled: !!user,
  });

  // Fetch tasks with scheduled_date or due_date
  const tasksCalendarQuery = useQuery({
    queryKey: ['tasks_calendar', user?.id, startDate, endDate],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*, project:projects(*), area:areas(*)')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .or('scheduled_date.not.is.null,due_date.not.is.null');

      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!user,
  });

  const createEvent = useMutation({
    mutationFn: async (newEvent: {
      title: string;
      description?: string;
      start_time: string;
      end_time: string;
      is_all_day?: boolean;
      location?: string;
      recurrence?: EventRecurrence | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: newEvent.title.trim(),
          description: newEvent.description?.trim() || null,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          is_all_day: newEvent.is_all_day || false,
          location: newEvent.location?.trim() || null,
          recurrence: newEvent.recurrence || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', user?.id] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalendarEvent> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', user?.id] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', user?.id] });
    },
  });

  // Combine independent events + task scheduled dates + task deadlines into a unified view
  const unifiedItems: CalendarItem[] = [];

  // Active horizon for recurring events expansion: -6 months to +18 months
  const now = new Date();
  const windowStart = subMonths(now, 6);
  const windowEnd = addMonths(now, 18);

  (eventsQuery.data || []).forEach((ev) => {
    const timePart = !ev.is_all_day && ev.start_time.includes('T')
      ? ev.start_time.split('T')[1].substring(0, 5)
      : undefined;

    if (!ev.recurrence) {
      // Single one-time event
      const datePart = ev.start_time.split('T')[0];
      unifiedItems.push({
        id: `event-${ev.id}`,
        type: 'event',
        title: ev.title,
        description: ev.description,
        date: datePart,
        time: timePart,
        allDay: ev.is_all_day,
        rawEvent: ev,
      });
      return;
    }

    // Recurring events: Expand across active window
    const [origYear, origMonth, origDay] = ev.start_time.split('T')[0].split('-').map(Number);
    const origDate = new Date(origYear, origMonth - 1, origDay);

    if (ev.recurrence === 'yearly') {
      // Perfect for birthdays and anniversaries
      const startY = windowStart.getFullYear();
      const endY = windowEnd.getFullYear();
      for (let y = startY; y <= endY; y++) {
        const maxDays = getDaysInMonth(new Date(y, origMonth - 1, 1));
        const clampedDay = Math.min(origDay, maxDays);
        const occDate = new Date(y, origMonth - 1, clampedDay);
        if (
          occDate >= startOfDay(windowStart) &&
          occDate <= endOfDay(windowEnd) &&
          occDate >= startOfDay(origDate)
        ) {
          unifiedItems.push({
            id: `event-${ev.id}-${y}`,
            type: 'event',
            title: ev.title,
            description: ev.description,
            date: format(occDate, 'yyyy-MM-dd'),
            time: timePart,
            allDay: ev.is_all_day,
            rawEvent: ev,
          });
        }
      }
    } else if (ev.recurrence === 'monthly') {
      let curr = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);
      const end = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
      while (curr <= end) {
        const y = curr.getFullYear();
        const m = curr.getMonth();
        const maxDays = getDaysInMonth(new Date(y, m, 1));
        const clampedDay = Math.min(origDay, maxDays);
        const occDate = new Date(y, m, clampedDay);
        if (
          occDate >= startOfDay(windowStart) &&
          occDate <= endOfDay(windowEnd) &&
          occDate >= startOfDay(origDate)
        ) {
          unifiedItems.push({
            id: `event-${ev.id}-${format(occDate, 'yyyy-MM')}`,
            type: 'event',
            title: ev.title,
            description: ev.description,
            date: format(occDate, 'yyyy-MM-dd'),
            time: timePart,
            allDay: ev.is_all_day,
            rawEvent: ev,
          });
        }
        curr = addMonths(curr, 1);
      }
    } else if (ev.recurrence === 'weekly') {
      let curr = origDate;
      while (curr < startOfDay(windowStart)) {
        curr = addWeeks(curr, 1);
      }
      while (curr <= endOfDay(windowEnd)) {
        unifiedItems.push({
          id: `event-${ev.id}-${format(curr, 'yyyy-MM-dd')}`,
          type: 'event',
          title: ev.title,
          description: ev.description,
          date: format(curr, 'yyyy-MM-dd'),
          time: timePart,
          allDay: ev.is_all_day,
          rawEvent: ev,
        });
        curr = addWeeks(curr, 1);
      }
    } else if (ev.recurrence === 'daily') {
      let curr = origDate < startOfDay(windowStart) ? startOfDay(windowStart) : origDate;
      while (curr <= endOfDay(windowEnd)) {
        unifiedItems.push({
          id: `event-${ev.id}-${format(curr, 'yyyy-MM-dd')}`,
          type: 'event',
          title: ev.title,
          description: ev.description,
          date: format(curr, 'yyyy-MM-dd'),
          time: timePart,
          allDay: ev.is_all_day,
          rawEvent: ev,
        });
        curr = addDays(curr, 1);
      }
    }
  });

  (tasksCalendarQuery.data || []).forEach((task) => {
    if (task.scheduled_date) {
      unifiedItems.push({
        id: `task-sched-${task.id}`,
        type: 'task_scheduled',
        title: `Plan: ${task.title}`,
        description: task.description,
        date: task.scheduled_date,
        allDay: true,
        // Tasks NEVER have time in Calendar
        time: undefined,
        rawTask: task,
      });
    }

    if (task.due_date) {
      const datePart = task.due_date.split('T')[0];
      unifiedItems.push({
        id: `task-due-${task.id}`,
        type: 'task_deadline',
        title: `Due: ${task.title}`,
        description: task.description,
        date: datePart,
        allDay: true,
        // Tasks NEVER have time in Calendar
        time: undefined,
        rawTask: task,
      });
    }
  });

  return {
    events: eventsQuery.data || [],
    calendarTasks: tasksCalendarQuery.data || [],
    unifiedItems,
    isLoading: eventsQuery.isLoading || tasksCalendarQuery.isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
