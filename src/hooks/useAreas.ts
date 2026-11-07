import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Area } from '@/types/database';

export function useAreas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const areasQuery = useQuery({
    queryKey: ['areas', user?.id],
    queryFn: async (): Promise<Area[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as Area[];
    },
    enabled: !!user,
  });

  const createArea = useMutation({
    mutationFn: async (newArea: { name: string; description?: string | null; color?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const sortOrder = (areasQuery.data?.length || 0) + 1;
      const { data, error } = await supabase
        .from('areas')
        .insert({
          user_id: user.id,
          name: newArea.name.trim(),
          description: newArea.description?.trim() || null,
          color: newArea.color || '#9B8963',
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Area;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', user?.id] });
    },
  });

  const updateArea = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Area> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('areas')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Area;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', user?.id] });
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  return {
    areas: areasQuery.data || [],
    isLoading: areasQuery.isLoading,
    error: areasQuery.error,
    createArea,
    updateArea,
    deleteArea,
  };
}
