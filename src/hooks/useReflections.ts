import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Reflection, ReflectionType } from '@/types/database';

export function useReflections(type?: ReflectionType, entryDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reflectionsQuery = useQuery({
    queryKey: ['reflections', user?.id, type, entryDate],
    queryFn: async (): Promise<Reflection[]> => {
      if (!user) return [];
      let query = supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('reflection_type', type);
      }
      if (entryDate) {
        query = query.eq('entry_date', entryDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Reflection[];
    },
    enabled: !!user,
  });

  const saveReflection = useMutation({
    mutationFn: async ({
      id,
      reflection_type,
      title,
      content,
      entry_date = new Date().toISOString().split('T')[0],
    }: {
      id?: string;
      reflection_type: ReflectionType;
      title?: string | null;
      content: any;
      entry_date?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (id) {
        const { data, error } = await supabase
          .from('reflections')
          .update({
            title: title || null,
            content,
            entry_date,
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data as Reflection;
      } else {
        const { data, error } = await supabase
          .from('reflections')
          .insert({
            user_id: user.id,
            reflection_type,
            title: title || null,
            content,
            entry_date,
          })
          .select()
          .single();

        if (error) throw error;
        return data as Reflection;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections', user?.id] });
    },
  });

  const deleteReflection = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reflections')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections', user?.id] });
    },
  });

  return {
    reflections: reflectionsQuery.data || [],
    isLoading: reflectionsQuery.isLoading,
    error: reflectionsQuery.error,
    saveReflection,
    deleteReflection,
  };
}
