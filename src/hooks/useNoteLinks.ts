import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { NoteLink } from '@/types/database';

export function useNoteLinks(noteId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Outgoing links (notes referenced by this note)
  const outgoingQuery = useQuery({
    queryKey: ['note_outgoing_links', user?.id, noteId],
    queryFn: async (): Promise<NoteLink[]> => {
      if (!user || !noteId) return [];
      const { data, error } = await supabase
        .from('note_links')
        .select('*, target_note:notes!target_note_id(*)')
        .eq('user_id', user.id)
        .eq('source_note_id', noteId);

      if (error) throw error;
      return (data || []) as NoteLink[];
    },
    enabled: !!user && !!noteId,
  });

  // Backlinks (notes that reference this note)
  const backlinksQuery = useQuery({
    queryKey: ['note_backlinks', user?.id, noteId],
    queryFn: async (): Promise<NoteLink[]> => {
      if (!user || !noteId) return [];
      const { data, error } = await supabase
        .from('note_links')
        .select('*, source_note:notes!source_note_id(*)')
        .eq('user_id', user.id)
        .eq('target_note_id', noteId);

      if (error) throw error;
      return (data || []) as NoteLink[];
    },
    enabled: !!user && !!noteId,
  });

  const createLink = useMutation({
    mutationFn: async ({ targetNoteId }: { targetNoteId: string }) => {
      if (!user || !noteId) throw new Error('Not authenticated or no note selected');
      if (noteId === targetNoteId) throw new Error('Cannot link a note to itself');

      const { data, error } = await supabase
        .from('note_links')
        .insert({
          user_id: user.id,
          source_note_id: noteId,
          target_note_id: targetNoteId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as NoteLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note_outgoing_links', user?.id, noteId] });
      queryClient.invalidateQueries({ queryKey: ['note_backlinks', user?.id] });
    },
  });

  const removeLink = useMutation({
    mutationFn: async (linkId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('note_links')
        .delete()
        .eq('id', linkId)
        .eq('user_id', user.id);

      if (error) throw error;
      return linkId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note_outgoing_links', user?.id, noteId] });
      queryClient.invalidateQueries({ queryKey: ['note_backlinks', user?.id] });
    },
  });

  return {
    outgoingLinks: outgoingQuery.data || [],
    backlinks: backlinksQuery.data || [],
    isLoading: outgoingQuery.isLoading || backlinksQuery.isLoading,
    createLink,
    removeLink,
  };
}
