import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Note, NoteType } from '@/types/database';

export function useNotes(filters?: {
  noteType?: NoteType;
  tag?: string;
  projectId?: string;
  areaId?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ['notes', user?.id, filters],
    queryFn: async (): Promise<Note[]> => {
      if (!user) return [];
      let query = supabase
        .from('notes')
        .select('*, project:projects(*), area:areas(*)')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (filters?.noteType) {
        query = query.eq('note_type', filters.noteType);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.areaId) {
        query = query.eq('area_id', filters.areaId);
      }
      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Note[];
    },
    enabled: !!user,
  });

  const createNote = useMutation({
    mutationFn: async (newNote: {
      title: string;
      content?: string;
      note_type?: NoteType;
      tags?: string[];
      project_id?: string | null;
      area_id?: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: newNote.title.trim() || 'Untitled Note',
          content: newNote.content || '',
          note_type: newNote.note_type || 'knowledge',
          tags: newNote.tags || [],
          project_id: newNote.project_id || null,
          area_id: newNote.area_id || null,
        })
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Note> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, project:projects(*), area:areas(*)')
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['note', user?.id, data.id] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['note_links', user?.id] });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    createNote,
    updateNote,
    deleteNote,
  };
}

export function useNote(noteId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['note', user?.id, noteId],
    queryFn: async (): Promise<Note | null> => {
      if (!user || !noteId) return null;
      const { data, error } = await supabase
        .from('notes')
        .select('*, project:projects(*), area:areas(*)')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Note;
    },
    enabled: !!user && !!noteId,
  });
}
