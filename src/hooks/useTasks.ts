import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskPriority, TaskStatus, TaskRecurrence } from '@/types/database';
import {
  addDays,
  addWeeks,
  addMonths,
  format,
  startOfDay,
  isBefore,
} from 'date-fns';

/**
 * Calculates the next scheduled date (YYYY-MM-DD) for a recurring task.
 * Ensures the next occurrence is always in the future relative to today.
 */
export function calculateNextScheduledDate(
  recurrence: TaskRecurrence,
  scheduledDate?: string | null
): string {
  const today = startOfDay(new Date());
  let baseDate: Date;
  if (scheduledDate) {
    const [y, m, d] = scheduledDate.split('-').map(Number);
    baseDate = new Date(y, m - 1, d);
  } else {
    baseDate = today;
  }

  let next: Date;
  if (recurrence === 'daily') {
    next = addDays(baseDate, 1);
    if (isBefore(startOfDay(next), addDays(today, 1))) {
      next = addDays(today, 1);
    }
  } else if (recurrence === 'weekly') {
    next = addWeeks(baseDate, 1);
    if (isBefore(startOfDay(next), today)) {
      next = addWeeks(today, 1);
    }
  } else if (recurrence === 'monthly') {
    next = addMonths(baseDate, 1);
    if (isBefore(startOfDay(next), today)) {
      next = addMonths(today, 1);
    }
  } else {
    next = addDays(today, 1);
  }

  return format(next, 'yyyy-MM-dd');
}

/**
 * Calculates the next due date (ISO string) for a recurring task, preserving time.
 */
export function calculateNextDueDate(
  recurrence: TaskRecurrence,
  dueDateStr?: string | null
): string | null {
  if (!dueDateStr) return null;
  const today = startOfDay(new Date());
  const baseDate = new Date(dueDateStr);
  if (isNaN(baseDate.getTime())) return null;

  let next: Date;
  if (recurrence === 'daily') {
    next = addDays(baseDate, 1);
    if (isBefore(startOfDay(next), addDays(today, 1))) {
      const timeMs = baseDate.getTime() - startOfDay(baseDate).getTime();
      next = new Date(addDays(today, 1).getTime() + timeMs);
    }
  } else if (recurrence === 'weekly') {
    next = addWeeks(baseDate, 1);
    if (isBefore(startOfDay(next), today)) {
      const timeMs = baseDate.getTime() - startOfDay(baseDate).getTime();
      next = new Date(addWeeks(today, 1).getTime() + timeMs);
    }
  } else if (recurrence === 'monthly') {
    next = addMonths(baseDate, 1);
    if (isBefore(startOfDay(next), today)) {
      const timeMs = baseDate.getTime() - startOfDay(baseDate).getTime();
      next = new Date(addMonths(today, 1).getTime() + timeMs);
    }
  } else {
    return null;
  }

  return next.toISOString();
}

export function useTasks(filters?: {
  status?: TaskStatus;
  projectId?: string;
  areaId?: string;
  isTodayPriority?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id, filters],
    queryFn: async (): Promise<Task[]> => {
      if (!user) return [];
      let query = supabase
        .from('tasks')
        .select('*, project:projects(*), area:areas(*)')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.areaId) {
        query = query.eq('area_id', filters.areaId);
      }
      if (filters?.isTodayPriority !== undefined) {
        query = query.eq('is_today_priority', filters.isTodayPriority);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (newTask: {
      title: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      recurrence?: TaskRecurrence | null;
      due_date?: string | null;
      scheduled_date?: string | null;
      project_id?: string | null;
      area_id?: string | null;
      is_today_priority?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description?.trim() || null,
          status: newTask.status || 'todo',
          priority: newTask.priority || 'medium',
          recurrence: newTask.recurrence || null,
          due_date: newTask.due_date || null,
          scheduled_date: newTask.scheduled_date || null,
          project_id: newTask.project_id || null,
          area_id: newTask.area_id || null,
          is_today_priority: newTask.is_today_priority || false,
        })
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks_calendar', user?.id] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');

      const payload: any = { ...updates };
      if (updates.status === 'completed') {
        payload.completed_at = new Date().toISOString();
      } else if (updates.status) {
        payload.completed_at = null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      const updatedTask = data as Task;

      // When a recurring task is completed via edit modal:
      // Archive old completed task and generate the next occurrence
      if (updates.status === 'completed' && updatedTask.recurrence) {
        await supabase
          .from('tasks')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
          })
          .eq('id', updatedTask.id)
          .eq('user_id', user.id);

        const nextScheduledDate = updatedTask.scheduled_date
          ? calculateNextScheduledDate(updatedTask.recurrence, updatedTask.scheduled_date)
          : (!updatedTask.due_date ? calculateNextScheduledDate(updatedTask.recurrence, null) : null);

        const nextDueDate = calculateNextDueDate(updatedTask.recurrence, updatedTask.due_date);

        await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: 'todo',
            priority: updatedTask.priority,
            project_id: updatedTask.project_id,
            area_id: updatedTask.area_id,
            recurrence: updatedTask.recurrence,
            scheduled_date: nextScheduledDate,
            due_date: nextDueDate,
            is_today_priority: false,
            is_archived: false,
          });
      }

      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks_calendar', user?.id] });
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: TaskStatus }) => {
      if (!user) throw new Error('Not authenticated');
      const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

      // 1. Mark status
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: completedAt,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      const updatedTask = data as Task;

      // 2. If completing a recurring task:
      // - Archive old completed task so it leaves active view ("task cũ sẽ mất")
      // - Generate the next occurrence with new deadline ("thay vào đó là task y chang project và area, nhưng lại hiện deadline (ngày làm) mới")
      if (newStatus === 'completed' && updatedTask.recurrence) {
        await supabase
          .from('tasks')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
          })
          .eq('id', updatedTask.id)
          .eq('user_id', user.id);

        const nextScheduledDate = updatedTask.scheduled_date
          ? calculateNextScheduledDate(updatedTask.recurrence, updatedTask.scheduled_date)
          : (!updatedTask.due_date ? calculateNextScheduledDate(updatedTask.recurrence, null) : null);

        const nextDueDate = calculateNextDueDate(updatedTask.recurrence, updatedTask.due_date);

        await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            title: updatedTask.title,
            description: updatedTask.description,
            status: 'todo',
            priority: updatedTask.priority,
            project_id: updatedTask.project_id,
            area_id: updatedTask.area_id,
            recurrence: updatedTask.recurrence,
            scheduled_date: nextScheduledDate,
            due_date: nextDueDate,
            is_today_priority: false,
            is_archived: false,
          });
      }

      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks_calendar', user?.id] });
    },
  });

  const toggleTodayPriority = useMutation({
    mutationFn: async ({ id, currentFlag }: { id: string; currentFlag: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('tasks')
        .update({ is_today_priority: !currentFlag })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks_calendar', user?.id] });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask,
    updateTask,
    toggleTaskStatus,
    toggleTodayPriority,
    deleteTask,
  };
}
