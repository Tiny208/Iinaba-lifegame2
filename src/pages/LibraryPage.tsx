import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Trash2,
  Tag,
  Folder,
  Bookmark,
  Link as LinkIcon,
  Search,
  Paperclip,
  Check,
  Cloud,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { useNotes, useNote } from '@/hooks/useNotes';
import { useNoteLinks } from '@/hooks/useNoteLinks';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useAttachments } from '@/hooks/useAttachments';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusPill } from '@/components/common/StatusPill';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { Note, NoteType } from '@/types/database';
import { formatDate, formatFileSize } from '@/lib/utils';

export const LibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedNoteId = searchParams.get('noteId') || undefined;

  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { notes, isLoading, createNote, deleteNote } = useNotes({
    noteType: typeFilter === 'all' ? undefined : typeFilter,
  });

  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Filter notes client-side for fast search & tag query
  const filteredNotes = notes.filter((note) => {
    if (tagFilter && !note.tags.includes(tagFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
  });

  // Collect all unique tags across notes
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  const handleSelectNote = (id: string) => {
    setSearchParams({ noteId: id });
  };

  const handleCreateNewNote = async () => {
    const created = await createNote.mutateAsync({
      title: 'Untitled Note',
      content: '',
      note_type: typeFilter === 'all' ? 'knowledge' : typeFilter,
    });
    setSearchParams({ noteId: created.id });
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#858176] font-mono">Knowledge & Principles</div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-1">
            Library
          </h2>
          <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5">
            Your personal second brain: concepts, ideas, references, and timeless principles.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleCreateNewNote}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Note
        </Button>
      </div>

      {/* Main Two-Column Library Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols on lg): Note List & Filters */}
        <div className="lg:col-span-4 space-y-4">
          {/* Note Type Filters */}
          <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#21201D] p-1 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs font-medium overflow-x-auto">
            {(['all', 'knowledge', 'idea', 'reference', 'principle'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-[3px] capitalize whitespace-nowrap transition-colors ${
                  typeFilter === t
                    ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614]'
                    : 'text-[#858176] hover:text-[#242424]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Bar in Library */}
          <div className="flex items-center px-3 py-1.5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28]">
            <Search className="w-3.5 h-3.5 text-[#858176] mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/60 focus:outline-none"
            />
          </div>

          {/* Tag cloud (if any) */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center text-xs">
              <span className="text-[10px] text-[#858176] font-mono mr-1">Tags:</span>
              {tagFilter && (
                <button
                  onClick={() => setTagFilter(null)}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#242424] text-white dark:bg-[#EAE7DF] dark:text-[#171614]"
                >
                  All
                </button>
              )}
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    tagFilter === tag
                      ? 'border-[#9B8963] bg-[#9B8963]/15 text-[#857451]'
                      : 'border-[#E5E1D8] dark:border-[#2E2C28] text-[#858176] hover:text-[#242424]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Note List */}
          {isLoading ? (
            <CardSkeleton rows={4} />
          ) : filteredNotes.length === 0 ? (
            <EmptyState
              title="No notes found"
              description="Capture your first knowledge note or idea."
              action={
                <Button variant="outline" size="sm" onClick={handleCreateNewNote}>
                  Create Note
                </Button>
              }
            />
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={`p-3 rounded-[4px] border cursor-pointer transition-all shadow-subtle ${
                      isSelected
                        ? 'border-[#9B8963] bg-[#FFFFFF] dark:bg-[#21201D] ring-1 ring-[#9B8963]/30'
                        : 'border-[#E5E1D8] dark:border-[#2E2C28] bg-[#FFFFFF]/70 dark:bg-[#21201D]/70 hover:bg-[#FFFFFF] dark:hover:bg-[#21201D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-medium text-[#242424] dark:text-[#EAE7DF] truncate">
                        {note.title}
                      </h4>
                      <StatusPill type="noteType" value={note.note_type} />
                    </div>

                    <p className="text-xs text-[#858176] dark:text-[#8C877D] line-clamp-2 mt-1">
                      {note.content || 'Empty note...'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#858176] font-mono mt-2 pt-2 border-t border-[#E5E1D8]/40 dark:border-[#2E2C28]/40">
                      <span>{formatDate(note.updated_at, 'MMM d, yyyy')}</span>
                      {note.tags.length > 0 && (
                        <span>#{note.tags[0]}{note.tags.length > 1 ? ` +${note.tags.length - 1}` : ''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (8 cols on lg): Active Note Editor & Backlinks */}
        <div className="lg:col-span-8">
          {selectedNoteId ? (
            <ActiveNoteEditor
              noteId={selectedNoteId}
              allNotes={notes}
              onDelete={() => setNoteToDelete(selectedNoteId)}
            />
          ) : (
            <div className="p-12 text-center border border-dashed border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#FFFFFF]/40 dark:bg-[#21201D]/40">
              <BookOpen className="w-8 h-8 mx-auto text-[#858176] stroke-1 mb-2" />
              <h4 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF]">Select a note to read or edit</h4>
              <p className="text-xs text-[#858176] mt-1">Or create a new note to start writing.</p>
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={handleCreateNewNote}>
                  New Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={async () => {
          if (noteToDelete) {
            await deleteNote.mutateAsync(noteToDelete);
            setNoteToDelete(null);
            setSearchParams({});
          }
        }}
        title="Delete Note"
        message="Are you sure you want to delete this note? Links to this note will also be safely removed."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

// ==============================================================================
// ACTIVE NOTE EDITOR WITH AUTO-SAVE & BI-DIRECTIONAL BACKLINKS
// ==============================================================================
const ActiveNoteEditor: React.FC<{
  noteId: string;
  allNotes: Note[];
  onDelete: () => void;
}> = ({ noteId, allNotes, onDelete }) => {
  const { data: note, isLoading } = useNote(noteId);
  const { updateNote } = useNotes();
  const { outgoingLinks, backlinks, createLink, removeLink } = useNoteLinks(noteId);
  const { projects } = useProjects();
  const { areas } = useAreas();
  const { attachments, uploadFile, deleteAttachment, uploadProgress } = useAttachments('note', noteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('knowledge');
  const [projectId, setProjectId] = useState<string>('');
  const [areaId, setAreaId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [targetLinkNoteId, setTargetLinkNoteId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state on note load
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setNoteType(note.note_type);
      setProjectId(note.project_id || '');
      setAreaId(note.area_id || '');
      setTags(note.tags || []);
      setSaveStatus('saved');
    }
  }, [note?.id]);

  // Debounced auto-save handler
  const triggerAutoSave = (newTitle: string, newContent: string, newType: NoteType, newProj: string, newArea: string, newTags: string[]) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote.mutateAsync({
          id: noteId,
          title: newTitle.trim() || 'Untitled Note',
          content: newContent,
          note_type: newType,
          project_id: newProj || null,
          area_id: newArea || null,
          tags: newTags,
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 800); // 800ms debounce
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    triggerAutoSave(val, content, noteType, projectId, areaId, tags);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    triggerAutoSave(title, val, noteType, projectId, areaId, tags);
  };

  const handleTypeChange = (val: NoteType) => {
    setNoteType(val);
    triggerAutoSave(title, content, val, projectId, areaId, tags);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(clean)) {
        const next = [...tags, clean];
        setTags(next);
        triggerAutoSave(title, content, noteType, projectId, areaId, next);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const next = tags.filter((t) => t !== tagToRemove);
    setTags(next);
    triggerAutoSave(title, content, noteType, projectId, areaId, next);
  };

  const handleCreateLink = async () => {
    if (!targetLinkNoteId) return;
    await createLink.mutateAsync({ targetNoteId: targetLinkNoteId });
    setTargetLinkNoteId('');
    setIsLinkingOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    await uploadFile(file);
    e.target.value = '';
  };

  if (isLoading || !note) {
    return <CardSkeleton rows={6} />;
  }

  // Available notes to link to (prevent self-link and duplicate link)
  const linkedTargetIds = new Set(outgoingLinks.map((l) => l.target_note_id));
  const availableToLink = allNotes.filter(
    (n) => n.id !== noteId && !linkedTargetIds.has(n.id)
  );

  return (
    <div className="rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] p-6 shadow-subtle space-y-6">
      {/* Top Metadata & Auto-save Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 text-xs">
        <div className="flex items-center gap-3">
          {/* Note Type selector */}
          <select
            value={noteType}
            onChange={(e) => handleTypeChange(e.target.value as NoteType)}
            className="p-1 text-xs font-mono uppercase bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="knowledge">Knowledge</option>
            <option value="idea">Idea</option>
            <option value="reference">Reference</option>
            <option value="principle">Principle</option>
          </select>

          {/* Project selector */}
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              triggerAutoSave(title, content, noteType, e.target.value, areaId, tags);
            }}
            className="p-1 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#858176]"
          >
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Area selector */}
          <select
            value={areaId}
            onChange={(e) => {
              setAreaId(e.target.value);
              triggerAutoSave(title, content, noteType, projectId, e.target.value, tags);
            }}
            className="p-1 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded text-[#858176]"
          >
            <option value="">No Area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Auto-save status feedback */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#858176]">
            {saveStatus === 'saving' && (
              <>
                <Cloud className="w-3.5 h-3.5 animate-pulse text-[#9B8963]" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-[#7B8D7A]" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500">Auto-save error</span>
            )}
          </div>

          <button onClick={onDelete} className="p-1 text-[#858176] hover:text-red-600" title="Delete note">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="w-full font-serif text-2xl sm:text-3xl font-medium bg-transparent border-0 text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/50 focus:outline-none"
        />
      </div>

      {/* Tags management */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <Tag className="w-3.5 h-3.5 text-[#858176]" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#F5F3ED] dark:bg-[#2A2824] border border-[#E5E1D8] dark:border-[#2E2C28] text-[#858176]"
          >
            #{tag}
            <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 ml-0.5">×</button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag (Press Enter)..."
          className="text-xs bg-transparent text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/60 p-1 focus:outline-none"
        />
      </div>

      {/* Long-form Editorial Markdown Content Body */}
      <div>
        <textarea
          rows={15}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Begin writing your thoughts, synthesis, or distilled principles in Markdown..."
          className="w-full resize-y p-3 text-sm leading-relaxed bg-[#F5F3ED]/30 dark:bg-[#171614]/30 border border-[#E5E1D8]/80 dark:border-[#2E2C28]/80 rounded-[4px] text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/60 font-sans focus:outline-none focus:border-[#9B8963]"
        />
      </div>

      {/* Attachments for Note */}
      <div className="space-y-2 pt-2 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-serif font-medium text-[#242424] dark:text-[#EAE7DF]">
            Attachments ({attachments.length})
          </span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs text-[#858176]"
          >
            <Paperclip className="w-3.5 h-3.5 mr-1" />
            Add Attachment
          </Button>
        </div>

        {uploadProgress !== null && (
          <div className="w-full bg-[#EAE6DD] dark:bg-[#2A2824] rounded-full h-1">
            <div className="bg-[#9B8963] h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 p-1.5 px-2 bg-[#F5F3ED] dark:bg-[#2A2824] rounded border border-[#E5E1D8] dark:border-[#2E2C28] text-xs"
              >
                <Paperclip className="w-3 h-3 text-[#858176]" />
                <a
                  href={att.download_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-[#242424] dark:text-[#EAE7DF] truncate max-w-[140px]"
                >
                  {att.file_name}
                </a>
                <span className="text-[10px] text-[#858176]">({formatFileSize(att.file_size)})</span>
                <button
                  onClick={() => deleteAttachment.mutate(att)}
                  className="hover:text-red-500 text-[#858176] ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Graph Connections: Outgoing Links & Backlinks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 text-xs">
        {/* Outgoing links */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-serif font-medium text-[#242424] dark:text-[#EAE7DF]">
              Linked Notes ({outgoingLinks.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLinkingOpen(true)}
              className="text-xs text-[#9B8963]"
            >
              <LinkIcon className="w-3.5 h-3.5 mr-1" />
              Link Note
            </Button>
          </div>

          {outgoingLinks.length === 0 ? (
            <p className="text-[11px] text-[#858176] italic">No outgoing links connected.</p>
          ) : (
            <div className="space-y-1">
              {outgoingLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded bg-[#F5F3ED] dark:bg-[#2A2824] border border-[#E5E1D8]/60 dark:border-[#2E2C28]"
                >
                  <span className="font-medium truncate max-w-[200px]">
                    {link.target_note?.title || 'Unknown Note'}
                  </span>
                  <button
                    onClick={() => removeLink.mutate(link.id)}
                    className="text-[#858176] hover:text-red-500 text-xs"
                  >
                    Unlink
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backlinks (Incoming Links) */}
        <div className="space-y-2">
          <span className="font-serif font-medium text-[#242424] dark:text-[#EAE7DF]">
            Backlinks ({backlinks.length})
          </span>
          {backlinks.length === 0 ? (
            <p className="text-[11px] text-[#858176] italic">No other notes link to this note.</p>
          ) : (
            <div className="space-y-1">
              {backlinks.map((link) => (
                <div
                  key={link.id}
                  className="p-2 rounded bg-[#F5F3ED] dark:bg-[#2A2824] border border-[#E5E1D8]/60 dark:border-[#2E2C28] flex items-center justify-between"
                >
                  <span className="truncate max-w-[220px]">
                    {link.source_note?.title || 'Referencing Note'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#858176]" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link Note Modal */}
      <Modal
        isOpen={isLinkingOpen}
        onClose={() => setIsLinkingOpen(false)}
        title="Connect Note"
        subtitle="Establish a bi-directional association between thoughts."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Target Note</label>
            <select
              value={targetLinkNoteId}
              onChange={(e) => setTargetLinkNoteId(e.target.value)}
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            >
              <option value="">Select a note to link...</option>
              {availableToLink.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsLinkingOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateLink}
              disabled={!targetLinkNoteId}
            >
              Connect
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
