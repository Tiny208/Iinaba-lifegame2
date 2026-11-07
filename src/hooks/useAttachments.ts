import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Attachment, AttachmentParentType } from '@/types/database';

export function useAttachments(parentType: AttachmentParentType, parentId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', user?.id, parentType, parentId],
    queryFn: async (): Promise<Attachment[]> => {
      if (!user || !parentId) return [];
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('user_id', user.id)
        .eq('parent_type', parentType)
        .eq('parent_id', parentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Generate signed URLs for private downloads
      const items = (data || []) as Attachment[];
      const withUrls = await Promise.all(
        items.map(async (item) => {
          try {
            const { data: signedData } = await supabase.storage
              .from('inaba-attachments')
              .createSignedUrl(item.storage_path, 3600); // 1 hour validity
            return {
              ...item,
              download_url: signedData?.signedUrl || undefined,
            };
          } catch {
            return item;
          }
        })
      );

      return withUrls;
    },
    enabled: !!user && !!parentId,
  });

  const uploadFile = async (file: File): Promise<Attachment> => {
    if (!user || !parentId) throw new Error('Not authenticated or no parent record');
    setUploadError(null);
    setUploadProgress(10);

    const fileExt = file.name.split('.').pop() || '';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${user.id}/${parentType}/${parentId}/${Date.now()}-${cleanFileName}`;

    setUploadProgress(40);
    // 1. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('inaba-attachments')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      setUploadProgress(null);
      setUploadError(storageError.message);
      throw storageError;
    }

    setUploadProgress(80);
    // 2. Insert attachment record in PostgreSQL
    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert({
        user_id: user.id,
        parent_type: parentType,
        parent_id: parentId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      setUploadProgress(null);
      setUploadError(dbError.message);
      throw dbError;
    }

    setUploadProgress(100);
    setTimeout(() => setUploadProgress(null), 800);

    queryClient.invalidateQueries({
      queryKey: ['attachments', user.id, parentType, parentId],
    });

    return data as Attachment;
  };

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: Attachment) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Delete file from storage
      await supabase.storage
        .from('inaba-attachments')
        .remove([attachment.storage_path]);

      // 2. Delete row from table
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id)
        .eq('user_id', user.id);

      if (error) throw error;
      return attachment.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['attachments', user?.id, parentType, parentId],
      });
    },
  });

  return {
    attachments: attachmentsQuery.data || [],
    isLoading: attachmentsQuery.isLoading,
    uploadProgress,
    uploadError,
    uploadFile,
    deleteAttachment,
  };
}
