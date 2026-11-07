import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useInbox } from '@/hooks/useInbox';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Paperclip, X, Check, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
  uploadedPath?: string;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { captureItem } = useInbox();

  const [content, setContent] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newPending: PendingFile[] = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = '';
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && pendingFiles.length === 0) return;
    if (!user) {
      setSubmitError('Please sign in to save items.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create the Inbox item first (preserves content even if file upload fails later)
      const inboxItem = await captureItem.mutateAsync({
        content: content.trim() || 'Untitled capture with attachments',
        sourceUrl: sourceUrl.trim() || undefined,
      });

      // 2. Upload any attached files to private bucket inaba-attachments
      if (pendingFiles.length > 0) {
        for (let i = 0; i < pendingFiles.length; i++) {
          const item = pendingFiles[i];
          const cleanFileName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `${user.id}/inbox/${inboxItem.id}/${Date.now()}-${cleanFileName}`;

          try {
            // Upload to Supabase Storage
            const { error: storageError } = await supabase.storage
              .from('inaba-attachments')
              .upload(storagePath, item.file);

            if (storageError) {
              console.warn('Storage upload error:', storageError.message);
              // Non-blocking for remaining files, record continues
              continue;
            }

            // Save attachment record in DB
            await supabase.from('attachments').insert({
              user_id: user.id,
              parent_type: 'inbox',
              parent_id: inboxItem.id,
              file_name: item.file.name,
              file_size: item.file.size,
              mime_type: item.file.type || 'application/octet-stream',
              storage_path: storagePath,
            });
          } catch (fileErr) {
            console.error('File attach error:', fileErr);
          }
        }
      }

      // Reset and close
      setContent('');
      setSourceUrl('');
      setShowUrlField(false);
      setPendingFiles([]);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to save to inbox. Your written content was not lost.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Capture" subtitle="Empty your mind. Process later." maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div>
          <textarea
            autoFocus
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Capture an idea, quote, obligation, or link..."
            className="w-full resize-none p-3 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/60 dark:placeholder-[#8C877D]/60 focus:outline-none focus:border-[#9B8963] focus:ring-1 focus:ring-[#9B8963]"
          />
        </div>

        {showUrlField && (
          <div>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#F5F3ED]/40 dark:bg-[#171614]/40">
              <LinkIcon className="w-3.5 h-3.5 text-[#858176]" />
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/reference..."
                className="w-full text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Pending attachments preview */}
        {pendingFiles.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-medium text-[#858176] uppercase tracking-wider">Attachments ({pendingFiles.length})</div>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {pendingFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between text-xs p-1.5 px-2 bg-[#F5F3ED] dark:bg-[#2A2824] rounded border border-[#E5E1D8]/60 dark:border-[#2E2C28]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-[#858176] flex-shrink-0" />
                    <span className="truncate max-w-[240px] text-[#242424] dark:text-[#EAE7DF]">{f.file.name}</span>
                    <span className="text-[10px] text-[#858176]">({formatFileSize(f.file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingFile(f.id)}
                    className="text-[#858176] hover:text-red-500 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs"
              title="Attach files or images"
            >
              <Paperclip className="w-3.5 h-3.5 mr-1" />
              Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlField(!showUrlField)}
              className="text-xs"
            >
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
              URL
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!content.trim() && pendingFiles.length === 0}
            >
              Save to Inbox
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
