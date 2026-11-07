import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Task, TaskPriority, TaskStatus } from '@/types/database';

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
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: TaskStatus }) => {
      if (!user) throw new Error('Not authenticated');
      const newStatus: TaskStatus = currentStatus === 'completed' ? 'todo' : 'completed';
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null;

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
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
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
