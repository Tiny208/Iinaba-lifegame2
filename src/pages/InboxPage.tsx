import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  Circle,
  Archive,
  Trash2,
  ArrowRight,
  FileText,
  CheckSquare,
  Link as LinkIcon,
  Paperclip,
  ExternalLink,
  Download,
} from 'lucide-react';
import { useInbox } from '@/hooks/useInbox';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useAttachments } from '@/hooks/useAttachments';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { InboxItem, NoteType, TaskPriority } from '@/types/database';
import { formatDate, formatFileSize } from '@/lib/utils';

export const InboxPage: React.FC = () => {
  const [showProcessed, setShowProcessed] = useState(false);
  const {
    items,
    isLoading,
    captureItem,
    updateItem,
    toggleProcessed,
    convertToTask,
    convertToNote,
    deleteItem,
  } = useInbox({ showProcessed });

  const { projects } = useProjects();
  const { areas } = useAreas();

  const [newItemText, setNewItemText] = useState('');
  const [selectedItemForTask, setSelectedItemForTask] = useState<InboxItem | null>(null);
  const [selectedItemForNote, setSelectedItemForNote] = useState<InboxItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Conversion form state
  const [conversionTitle, setConversionTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('idea');
  const [linkedProjectId, setLinkedProjectId] = useState<string>('');
  const [linkedAreaId, setLinkedAreaId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    await captureItem.mutateAsync({ content: newItemText.trim() });
    setNewItemText('');
  };

  const handleOpenTaskConvert = (item: InboxItem) => {
    setSelectedItemForTask(item);
    setConversionTitle(item.content.split('\n')[0].substring(0, 80));
    setTaskPriority('medium');
    setTaskDueDate('');
    setLinkedProjectId('');
    setLinkedAreaId('');
  };

  const handleOpenNoteConvert = (item: InboxItem) => {
    setSelectedItemForNote(item);
    setConversionTitle(item.content.split('\n')[0].substring(0, 80));
    setNoteType('idea');
    setLinkedProjectId('');
    setLinkedAreaId('');
  };

  const handleExecuteConvertToTask = async () => {
    if (!selectedItemForTask || !conversionTitle.trim()) return;
    setIsConverting(true);
    try {
      await convertToTask.mutateAsync({
        inboxItem: selectedItemForTask,
        title: conversionTitle.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || null,
        projectId: linkedProjectId || null,
        areaId: linkedAreaId || null,
      });
      setSelectedItemForTask(null);
    } catch (err) {
      console.error('Task conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleExecuteConvertToNote = async () => {
    if (!selectedItemForNote || !conversionTitle.trim()) return;
    setIsConverting(true);
    try {
      await convertToNote.mutateAsync({
        inboxItem: selectedItemForNote,
        title: conversionTitle.trim(),
        noteType,
        projectId: linkedProjectId || null,
        areaId: linkedAreaId || null,
      });
      setSelectedItemForNote(null);
    } catch (err) {
      console.error('Note conversion error:', err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#858176] font-mono">Capture & Process</div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-1">
            Inbox
          </h2>
          <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5">
            Collect without categorization. Review and triage when calm.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowProcessed(false)}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              !showProcessed
                ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614]'
                : 'text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]'
            }`}
          >
            Unprocessed
          </button>
          <button
            onClick={() => setShowProcessed(true)}
            className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
              showProcessed
                ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614]'
                : 'text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]'
            }`}
          >
            All Items
          </button>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="Capture a thought, quote, link, or note to review later..."
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="flex-1 p-3 text-sm bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] placeholder-[#858176]/70 focus:outline-none focus:border-[#9B8963]"
        />
        <Button type="submit" variant="primary" disabled={!newItemText.trim()}>
          Capture
        </Button>
      </form>

      {/* Inbox Items List */}
      {isLoading ? (
        <CardSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 stroke-1 text-[#858176]" />}
          title={showProcessed ? 'No inbox items recorded' : 'Your inbox is clear'}
          description="Everything has been processed and organized into action or reference."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <InboxCard
              key={item.id}
              item={item}
              onToggle={() =>
                toggleProcessed.mutate({
                  id: item.id,
                  isProcessed: item.is_processed,
                })
              }
              onConvertToTask={() => handleOpenTaskConvert(item)}
              onConvertToNote={() => handleOpenNoteConvert(item)}
              onDelete={() => setItemToDelete(item.id)}
            />
          ))}
        </div>
      )}

      {/* Convert to Task Modal */}
      <Modal
        isOpen={!!selectedItemForTask}
        onClose={() => setSelectedItemForTask(null)}
        title="Convert into Task"
        subtitle="The original inbox item will remain preserved in your history."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Task Title</label>
            <input
              type="text"
              value={conversionTitle}
              onChange={(e) => setConversionTitle(e.target.value)}
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
              </input>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Project (Optional)</label>
              <select
                value={linkedProjectId}
                onChange={(e) => setLinkedProjectId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Area (Optional)</label>
              <select
                value={linkedAreaId}
                onChange={(e) => setLinkedAreaId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">No Area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#F5F3ED] dark:bg-[#2A2824] rounded-[4px] text-xs text-[#858176] max-h-24 overflow-y-auto">
            <span className="font-semibold text-[11px] block text-[#242424] dark:text-[#EAE7DF] mb-0.5">Original Item:</span>
            {selectedItemForTask?.content}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedItemForTask(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isConverting}
              onClick={handleExecuteConvertToTask}
              disabled={!conversionTitle.trim()}
            >
              Create Task & Preserve Inbox
            </Button>
          </div>
        </div>
      </Modal>

      {/* Convert to Note Modal */}
      <Modal
        isOpen={!!selectedItemForNote}
        onClose={() => setSelectedItemForNote(null)}
        title="Convert into Note"
        subtitle="The original inbox item will remain preserved in your history."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Note Title</label>
            <input
              type="text"
              value={conversionTitle}
              onChange={(e) => setConversionTitle(e.target.value)}
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Note Type</label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            >
              <option value="knowledge">Knowledge</option>
              <option value="idea">Idea</option>
              <option value="reference">Reference</option>
              <option value="principle">Principle</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Project (Optional)</label>
              <select
                value={linkedProjectId}
                onChange={(e) => setLinkedProjectId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Area (Optional)</label>
              <select
                value={linkedAreaId}
                onChange={(e) => setLinkedAreaId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">No Area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedItemForNote(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isConverting}
              onClick={handleExecuteConvertToNote}
              disabled={!conversionTitle.trim()}
            >
              Create Note & Preserve Inbox
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            await deleteItem.mutateAsync(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="Delete Inbox Item"
        message="Are you sure you want to permanently delete this inbox item? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

const InboxCard: React.FC<{
  item: InboxItem;
  onToggle: () => void;
  onConvertToTask: () => void;
  onConvertToNote: () => void;
  onDelete: () => void;
}> = ({ item, onToggle, onConvertToTask, onConvertToNote, onDelete }) => {
  const { attachments } = useAttachments('inbox', item.id);

  return (
    <div className="p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            onClick={onToggle}
            className="text-[#858176] hover:text-[#9B8963] transition-colors mt-0.5"
            title={item.is_processed ? 'Mark as unprocessed' : 'Mark as processed'}
          >
            {item.is_processed ? (
              <CheckCircle2 className="w-4 h-4 text-[#7B8D7A]" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                item.is_processed
                  ? 'text-[#858176] dark:text-[#8C877D]'
                  : 'text-[#242424] dark:text-[#EAE7DF]'
              }`}
            >
              {item.content}
            </p>

            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#9B8963] hover:underline mt-2"
              >
                <LinkIcon className="w-3 h-3" />
                <span className="truncate max-w-sm">{item.source_url}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}

            {/* Preserved conversion badge */}
            {item.converted_to_type && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#9B8963]/10 text-[#9B8963]">
                Converted to {item.converted_to_type}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] font-mono text-[#858176] flex-shrink-0">
          {formatDate(item.created_at, 'MMM d, HH:mm')}
        </div>
      </div>

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="pl-7 pt-1 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <a
              key={att.id}
              href={att.download_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-[#F5F3ED] dark:bg-[#2A2824] border border-[#E5E1D8] dark:border-[#2E2C28] rounded hover:border-[#9B8963] transition-colors"
            >
              <Paperclip className="w-3 h-3 text-[#858176]" />
              <span className="truncate max-w-[150px]">{att.file_name}</span>
              <span className="text-[10px] text-[#858176]">({formatFileSize(att.file_size)})</span>
              <Download className="w-3 h-3 text-[#858176] ml-0.5" />
            </a>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E1D8]/50 dark:border-[#2E2C28]/50 pl-7">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onConvertToTask}
            className="text-xs text-[#858176] hover:text-[#242424]"
          >
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Convert to Task
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onConvertToNote}
            className="text-xs text-[#858176] hover:text-[#242424]"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            Convert to Note
          </Button>
        </div>

        <button
          onClick={onDelete}
          className="text-[#858176] hover:text-red-600 p-1 transition-colors"
          title="Delete item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
