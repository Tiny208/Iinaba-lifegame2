import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Project, ProjectStatus } from '@/types/database';

export function useProjects(statusFilter?: ProjectStatus) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects', user?.id, statusFilter],
    queryFn: async (): Promise<Project[]> => {
      if (!user) return [];
      let query = supabase
        .from('projects')
        .select('*, area:areas(*)')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (newProject: {
      name: string;
      description?: string | null;
      goal?: string | null;
      area_id?: string | null;
      status?: ProjectStatus;
      start_date?: string | null;
      target_date?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: newProject.name.trim(),
          description: newProject.description?.trim() || null,
          goal: newProject.goal?.trim() || null,
          area_id: newProject.area_id || null,
          status: newProject.status || 'active',
          start_date: newProject.start_date || null,
          target_date: newProject.target_date || null,
        })
        .select('*, area:areas(*)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, area:areas(*)')
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });

  return {
    projects: projectsQuery.data || [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    createProject,
    updateProject,
    deleteProject,
  };
}
