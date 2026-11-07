import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'area' | 'note' | 'inbox' | 'reflection' | 'event';
  title: string;
  snippet?: string;
  url: string;
  metadata?: string;
}

export function useGlobalSearch() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const searchQuery = useQuery({
    queryKey: ['global_search', user?.id, searchTerm],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!user || !searchTerm.trim() || searchTerm.trim().length < 2) return [];

      const queryStr = searchTerm.trim().toLowerCase();
      const results: SearchResult[] = [];

      try {
        // 1. Search Tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, status, priority')
          .eq('user_id', user.id)
          .or(`title.ilike.%${queryStr}%,description.ilike.%${queryStr}%`)
          .limit(5);

        tasks?.forEach((t) => {
          results.push({
            id: t.id,
            type: 'task',
            title: t.title,
            snippet: t.description || undefined,
            url: `/focus?tab=tasks&taskId=${t.id}`,
            metadata: `${t.status} • ${t.priority} priority`,
          });
        });

        // 2. Search Projects
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, description, goal, status')
          .eq('user_id', user.id)
          .or(`name.ilike.%${queryStr}%,description.ilike.%${queryStr}%,goal.ilike.%${queryStr}%`)
          .limit(5);

        projects?.forEach((p) => {
          results.push({
            id: p.id,
            type: 'project',
            title: p.name,
            snippet: p.goal || p.description || undefined,
            url: `/focus?tab=projects&projectId=${p.id}`,
            metadata: `Project • ${p.status}`,
          });
        });

        // 3. Search Areas
        const { data: areas } = await supabase
          .from('areas')
          .select('id, name, description')
          .eq('user_id', user.id)
          .or(`name.ilike.%${queryStr}%,description.ilike.%${queryStr}%`)
          .limit(3);

        areas?.forEach((a) => {
          results.push({
            id: a.id,
            type: 'area',
            title: a.name,
            snippet: a.description || undefined,
            url: `/focus?tab=areas`,
            metadata: 'Area of Responsibility',
          });
        });

        // 4. Search Notes
        const { data: notes } = await supabase
          .from('notes')
          .select('id, title, content, note_type')
          .eq('user_id', user.id)
          .or(`title.ilike.%${queryStr}%,content.ilike.%${queryStr}%`)
          .limit(5);

        notes?.forEach((n) => {
          results.push({
            id: n.id,
            type: 'note',
            title: n.title,
            snippet: n.content ? n.content.substring(0, 100) + '...' : undefined,
            url: `/library?noteId=${n.id}`,
            metadata: `Note • ${n.note_type}`,
          });
        });

        // 5. Search Inbox
        const { data: inbox } = await supabase
          .from('inbox_items')
          .select('id, content, source_url')
          .eq('user_id', user.id)
          .ilike('content', `%${queryStr}%`)
          .limit(4);

        inbox?.forEach((i) => {
          results.push({
            id: i.id,
            type: 'inbox',
            title: i.content.substring(0, 60),
            snippet: i.source_url || undefined,
            url: `/inbox`,
            metadata: 'Inbox Item',
          });
        });

        // 6. Search Reflections
        const { data: reflections } = await supabase
          .from('reflections')
          .select('id, title, reflection_type, entry_date')
          .eq('user_id', user.id)
          .ilike('title', `%${queryStr}%`)
          .limit(3);

        reflections?.forEach((r) => {
          results.push({
            id: r.id,
            type: 'reflection',
            title: r.title || `${r.reflection_type} on ${r.entry_date}`,
            snippet: `Recorded on ${r.entry_date}`,
            url: `/reflect?tab=${r.reflection_type}`,
            metadata: `Reflection • ${r.reflection_type}`,
          });
        });

        // 7. Search Calendar Events
        const { data: events } = await supabase
          .from('calendar_events')
          .select('id, title, description, start_time')
          .eq('user_id', user.id)
          .or(`title.ilike.%${queryStr}%,description.ilike.%${queryStr}%`)
          .limit(4);

        events?.forEach((e) => {
          results.push({
            id: e.id,
            type: 'event',
            title: e.title,
            snippet: e.description || undefined,
            url: `/focus?tab=calendar`,
            metadata: `Event • ${e.start_time.split('T')[0]}`,
          });
        });
      } catch (err) {
        console.error('Search query error:', err);
      }

      return results;
    },
    enabled: !!user && searchTerm.trim().length >= 2,
  });

  return {
    searchTerm,
    setSearchTerm,
    results: searchQuery.data || [],
    isLoading: searchQuery.isLoading,
  };
}
