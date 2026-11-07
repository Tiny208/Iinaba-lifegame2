import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { InboxItem, TaskPriority } from '@/types/database';
import { extractUrls } from '@/lib/utils';

export function useInbox(options?: { showProcessed?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const inboxQuery = useQuery({
    queryKey: ['inbox', user?.id, options?.showProcessed],
    queryFn: async (): Promise<InboxItem[]> => {
      if (!user) return [];
      let query = supabase
        .from('inbox_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (!options?.showProcessed) {
        query = query.eq('is_processed', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as InboxItem[];
    },
    enabled: !!user,
  });

  const countQuery = useQuery({
    queryKey: ['inbox_count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_processed', false)
        .eq('is_archived', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const captureItem = useMutation({
    mutationFn: async ({ content, sourceUrl }: { content: string; sourceUrl?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const detectedUrls = extractUrls(content);
      const url = sourceUrl || (detectedUrls.length > 0 ? detectedUrls[0] : null);

      const { data, error } = await supabase
        .from('inbox_items')
        .insert({
          user_id: user.id,
          content: content.trim(),
          source_url: url,
        })
        .select()
        .single();

      if (error) throw error;
      return data as InboxItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InboxItem> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('inbox_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as InboxItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
    },
  });

  const toggleProcessed = useMutation({
    mutationFn: async ({ id, isProcessed }: { id: string; isProcessed: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('inbox_items')
        .update({ is_processed: !isProcessed })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as InboxItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
    },
  });

  // Convert to Task (Preserves original Inbox item)
  const convertToTask = useMutation({
    mutationFn: async ({
      inboxItem,
      title,
      priority = 'medium',
      dueDate,
      projectId,
      areaId,
    }: {
      inboxItem: InboxItem;
      title: string;
      priority?: TaskPriority;
      dueDate?: string | null;
      projectId?: string | null;
      areaId?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Create the task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: inboxItem.content,
          priority,
          due_date: dueDate || null,
          project_id: projectId || null,
          area_id: areaId || null,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // 2. Mark original inbox item as processed and link to created task (Preserve record!)
      const { data: updatedInbox, error: inboxError } = await supabase
        .from('inbox_items')
        .update({
          is_processed: true,
          converted_to_type: 'task',
          converted_to_id: taskData.id,
        })
        .eq('id', inboxItem.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (inboxError) throw inboxError;

      return { task: taskData, inbox: updatedInbox };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
    },
  });

  // Convert to Note (Preserves original Inbox item)
  const convertToNote = useMutation({
    mutationFn: async ({
      inboxItem,
      title,
      noteType = 'knowledge',
      projectId,
      areaId,
    }: {
      inboxItem: InboxItem;
      title: string;
      noteType?: 'knowledge' | 'idea' | 'reference' | 'principle';
      projectId?: string | null;
      areaId?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Create the note
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: inboxItem.content + (inboxItem.source_url ? `\n\nSource: ${inboxItem.source_url}` : ''),
          note_type: noteType,
          project_id: projectId || null,
          area_id: areaId || null,
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // 2. Mark original inbox item as processed and link to created note (Preserve record!)
      const { data: updatedInbox, error: inboxError } = await supabase
        .from('inbox_items')
        .update({
          is_processed: true,
          converted_to_type: 'note',
          converted_to_id: noteData.id,
        })
        .eq('id', inboxItem.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (inboxError) throw inboxError;

      return { note: noteData, inbox: updatedInbox };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox_count', user?.id] });
    },
  });

  return {
    items: inboxQuery.data || [],
    unprocessedCount: countQuery.data || 0,
    isLoading: inboxQuery.isLoading,
    error: inboxQuery.error,
    captureItem,
    updateItem,
    toggleProcessed,
    convertToTask,
    convertToNote,
    deleteItem,
  };
}
