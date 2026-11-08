import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Folder,
  Bookmark,
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Repeat,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useAreas } from '@/hooks/useAreas';
import { useCalendar, CalendarItem } from '@/hooks/useCalendar';
import { useNotes } from '@/hooks/useNotes';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusPill } from '@/components/common/StatusPill';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { Task, Project, Area, TaskStatus, TaskPriority, TaskRecurrence, ProjectStatus, CalendarEvent } from '@/types/database';
import { formatDate, formatRelativeDate } from '@/lib/utils';

type FocusTab = 'today' | 'calendar' | 'tasks' | 'projects' | 'areas';

export const FocusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as FocusTab) || 'today';

  const setTab = (tab: FocusTab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#858176] font-mono">Action & Responsibility</div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-1">
            Focus
          </h2>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#21201D] p-1 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs font-medium overflow-x-auto">
          {(['today', 'calendar', 'tasks', 'projects', 'areas'] as FocusTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-3 py-1.5 rounded-[3px] transition-colors whitespace-nowrap capitalize ${
                currentTab === tab
                  ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614]'
                  : 'text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-view Content */}
      {currentTab === 'today' && <TodayView />}
      {currentTab === 'calendar' && <CalendarView />}
      {currentTab === 'tasks' && <TasksView />}
      {currentTab === 'projects' && <ProjectsView />}
      {currentTab === 'areas' && <AreasView />}
    </div>
  );
};

// ==============================================================================
// 1. TODAY VIEW
// ==============================================================================
const TodayView: React.FC = () => {
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const { tasks, isLoading, toggleTaskStatus, toggleTodayPriority, createTask } = useTasks();
  const [newTitle, setNewTitle] = useState('');

  const todayPriorities = tasks.filter((t) => t.is_today_priority);
  const scheduledForToday = tasks.filter((t) => t.scheduled_date === todayDateStr && !t.is_today_priority);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTitle.trim(),
      scheduled_date: todayDateStr,
      status: 'todo',
      priority: 'medium',
    });
    setNewTitle('');
  };

  if (isLoading) return <CardSkeleton rows={4} />;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Top 3 Priorities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">Today&rsquo;s Three Priorities</h3>
            <p className="text-xs text-[#858176]">The needle-movers for your day.</p>
          </div>
          <span className="text-xs font-mono text-[#858176]">{todayPriorities.length} / 3 selected</span>
        </div>

        {todayPriorities.length === 0 ? (
          <EmptyState
            title="No top priorities selected"
            description="Star up to 3 tasks to commit to today."
          />
        ) : (
          <div className="space-y-2">
            {todayPriorities.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleStatus={() => toggleTaskStatus.mutate({ id: task.id, currentStatus: task.status })}
                onTogglePriority={() => toggleTodayPriority.mutate({ id: task.id, currentFlag: task.is_today_priority })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Scheduled for Today */}
      <section className="space-y-3">
        <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">Scheduled For Today</h3>

        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task scheduled for today..."
            className="flex-1 p-2 text-sm bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
          />
          <Button type="submit" size="sm" variant="primary" disabled={!newTitle.trim()}>
            Add
          </Button>
        </form>

        {scheduledForToday.length === 0 ? (
          <div className="text-xs text-[#858176] py-4 text-center">No other tasks scheduled for today.</div>
        ) : (
          <div className="space-y-2">
            {scheduledForToday.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggleStatus={() => toggleTaskStatus.mutate({ id: task.id, currentStatus: task.status })}
                onTogglePriority={() => toggleTodayPriority.mutate({ id: task.id, currentFlag: task.is_today_priority })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ==============================================================================
// 2. TASKS VIEW
// ==============================================================================
const TasksView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const { tasks, isLoading, createTask, updateTask, toggleTaskStatus, toggleTodayPriority, deleteTask } = useTasks({
    status: statusFilter === 'all' ? undefined : statusFilter,
    projectId: projectFilter === 'all' ? undefined : projectFilter,
    areaId: areaFilter === 'all' ? undefined : areaFilter,
  });

  const { projects } = useProjects();
  const { areas } = useAreas();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formRecurrence, setFormRecurrence] = useState<TaskRecurrence | ''>('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [formTodayPriority, setFormTodayPriority] = useState(false);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormStatus('todo');
    setFormRecurrence('');
    setFormDueDate('');
    setFormScheduledDate('');
    setFormProjectId(projectFilter !== 'all' ? projectFilter : '');
    setFormAreaId(areaFilter !== 'all' ? areaFilter : '');
    setFormTodayPriority(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormRecurrence(task.recurrence || '');
    setFormDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setFormScheduledDate(task.scheduled_date || '');
    setFormProjectId(task.project_id || '');
    setFormAreaId(task.area_id || '');
    setFormTodayPriority(task.is_today_priority);
    setIsCreateOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      await updateTask.mutateAsync({
        id: editingTask.id,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        priority: formPriority,
        status: formStatus,
        recurrence: formRecurrence || null,
        due_date: formDueDate || null,
        scheduled_date: formScheduledDate || null,
        project_id: formProjectId || null,
        area_id: formAreaId || null,
        is_today_priority: formTodayPriority,
      });
    } else {
      await createTask.mutateAsync({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        priority: formPriority,
        status: formStatus,
        recurrence: formRecurrence || null,
        due_date: formDueDate || null,
        scheduled_date: formScheduledDate || null,
        project_id: formProjectId || null,
        area_id: formAreaId || null,
        is_today_priority: formTodayPriority,
      });
    }

    setIsCreateOpen(false);
  };

  // Client-side priority filter if needed
  const filteredTasks = priorityFilter === 'all' ? tasks : tasks.filter((t) => t.priority === priorityFilter);

  return (
    <div className="space-y-6">
      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-1.5 text-xs bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[3px] text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="all">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="p-1.5 text-xs bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[3px] text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Project filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="p-1.5 text-xs bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[3px] text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Area filter */}
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="p-1.5 text-xs bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[3px] text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Task
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton rows={4} />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description="Clear filters or create a new task."
          action={
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              Create Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleStatus={() => toggleTaskStatus.mutate({ id: task.id, currentStatus: task.status })}
              onTogglePriority={() => toggleTodayPriority.mutate({ id: task.id, currentFlag: task.is_today_priority })}
              onEdit={() => openEditModal(task)}
              onDelete={() => setTaskToDelete(task.id)}
            />
          ))}
        </div>
      )}

      {/* Task Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Context or notes..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="todo" className="bg-[#FFFFFF] dark:bg-[#21201D]">Todo</option>
                <option value="in_progress" className="bg-[#FFFFFF] dark:bg-[#21201D]">In Progress</option>
                <option value="completed" className="bg-[#FFFFFF] dark:bg-[#21201D]">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="low" className="bg-[#FFFFFF] dark:bg-[#21201D]">Low</option>
                <option value="medium" className="bg-[#FFFFFF] dark:bg-[#21201D]">Medium</option>
                <option value="high" className="bg-[#FFFFFF] dark:bg-[#21201D]">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Repeat (Lặp lại)</label>
              <select
                value={formRecurrence}
                onChange={(e) => setFormRecurrence(e.target.value as TaskRecurrence | '')}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="" className="bg-[#FFFFFF] dark:bg-[#21201D]">None (Không)</option>
                <option value="daily" className="bg-[#FFFFFF] dark:bg-[#21201D]">Daily (Hàng ngày)</option>
                <option value="weekly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Weekly (Hàng tuần)</option>
                <option value="monthly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Monthly (Hàng tháng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Scheduled Date</label>
              <input
                type="date"
                value={formScheduledDate}
                onChange={(e) => setFormScheduledDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Due Date</label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Project</label>
              <select
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Area</label>
              <select
                value={formAreaId}
                onChange={(e) => setFormAreaId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">None</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#242424] dark:text-[#EAE7DF] pt-1">
            <input
              type="checkbox"
              checked={formTodayPriority}
              onChange={(e) => setFormTodayPriority(e.target.checked)}
              className="rounded"
            />
            <span>Make this one of Today&rsquo;s 3 Priorities</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={async () => {
          if (taskToDelete) {
            await deleteTask.mutateAsync(taskToDelete);
            setTaskToDelete(null);
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

const TaskRow: React.FC<{
  task: Task;
  onToggleStatus: () => void;
  onTogglePriority: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}> = ({ task, onToggleStatus, onTogglePriority, onEdit, onDelete }) => {
  const isCompleted = task.status === 'completed';

  return (
    <div className="p-3 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onToggleStatus}
          className="text-[#858176] hover:text-[#9B8963] transition-colors flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-[#7B8D7A]" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium truncate ${
                isCompleted ? 'line-through text-[#858176]' : 'text-[#242424] dark:text-[#EAE7DF]'
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-[#858176]">
            {task.project && (
              <span className="font-mono uppercase bg-[#F5F3ED] dark:bg-[#2A2824] px-1.5 py-0.5 rounded">
                {task.project.name}
              </span>
            )}
            {task.area && <span>{task.area.name}</span>}
            {task.recurrence && (
              <span className="flex items-center gap-1 font-mono text-[#9B8963] bg-[#9B8963]/10 dark:bg-[#9B8963]/20 px-1.5 py-0.5 rounded capitalize" title={`Repeats ${task.recurrence}`}>
                <Repeat className="w-3 h-3" />
                {task.recurrence}
              </span>
            )}
            {task.scheduled_date && <span>Sched: {task.scheduled_date}</span>}
            {task.due_date && <span>Due: {formatRelativeDate(task.due_date)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusPill type="priority" value={task.priority} />
        <button
          onClick={onTogglePriority}
          className={`p-1 transition-colors ${
            task.is_today_priority ? 'text-[#9B8963]' : 'text-[#858176] hover:text-[#9B8963]'
          }`}
          title={task.is_today_priority ? 'Remove from today priorities' : 'Set as today priority'}
        >
          <Star className={`w-3.5 h-3.5 ${task.is_today_priority ? 'fill-current' : ''}`} />
        </button>

        {onEdit && (
          <button onClick={onEdit} className="p-1 text-[#858176] hover:text-[#242424]">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-1 text-[#858176] hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ==============================================================================
// 3. PROJECTS VIEW
// ==============================================================================
const ProjectsView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('active');
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { areas } = useAreas();
  const { tasks } = useTasks();
  const { notes } = useNotes();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [areaId, setAreaId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setGoal('');
    setAreaId('');
    setStatus('active');
    setStartDate('');
    setTargetDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setGoal(p.goal || '');
    setAreaId(p.area_id || '');
    setStatus(p.status);
    setStartDate(p.start_date || '');
    setTargetDate(p.target_date || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      await updateProject.mutateAsync({
        id: editingProject.id,
        name: name.trim(),
        description: description.trim() || null,
        goal: goal.trim() || null,
        area_id: areaId || null,
        status,
        start_date: startDate || null,
        target_date: targetDate || null,
      });
    } else {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        goal: goal.trim() || null,
        area_id: areaId || null,
        status,
        start_date: startDate || null,
        target_date: targetDate || null,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['active', 'paused', 'completed', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614] font-medium'
                  : 'text-[#858176] hover:text-[#242424]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton rows={3} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects in this view"
          description="Projects bridge long-term vision with deliberate daily action."
          action={
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const projectTasks = tasks.filter((t) => t.project_id === proj.id);
            const projectNotes = notes.filter((n) => n.project_id === proj.id);

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className="p-5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] hover:border-[#9B8963] transition-colors shadow-subtle cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF] truncate">
                      {proj.name}
                    </h4>
                    <StatusPill type="projectStatus" value={proj.status} />
                  </div>

                  {proj.goal && (
                    <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-1.5 line-clamp-2">
                      {proj.goal}
                    </p>
                  )}

                  {proj.area && (
                    <div className="text-[10px] text-[#858176] tracking-wider uppercase font-mono mt-3">
                      Area: {proj.area.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#858176] pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span>{projectTasks.length} tasks</span>
                    <span>{projectNotes.length} notes</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1 hover:text-[#242424] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(proj.id)}
                      className="p-1 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject.name}
          subtitle={selectedProject.goal || 'Project details'}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {selectedProject.description && (
              <p className="text-xs text-[#858176] dark:text-[#8C877D] leading-relaxed">
                {selectedProject.description}
              </p>
            )}

            {/* Associated Tasks */}
            <div className="space-y-2">
              <h5 className="font-serif text-sm font-medium text-[#242424] dark:text-[#EAE7DF]">
                Associated Tasks ({tasks.filter((t) => t.project_id === selectedProject.id).length})
              </h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {tasks
                  .filter((t) => t.project_id === selectedProject.id)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-[#F5F3ED] dark:bg-[#2A2824]"
                    >
                      <span className={t.status === 'completed' ? 'line-through text-[#858176]' : ''}>
                        {t.title}
                      </span>
                      <StatusPill type="status" value={t.status} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Related Notes */}
            <div className="space-y-2">
              <h5 className="font-serif text-sm font-medium text-[#242424] dark:text-[#EAE7DF]">
                Related Notes ({notes.filter((n) => n.project_id === selectedProject.id).length})
              </h5>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {notes
                  .filter((n) => n.project_id === selectedProject.id)
                  .map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-[#F5F3ED] dark:bg-[#2A2824]"
                    >
                      <span>{n.title}</span>
                      <StatusPill type="noteType" value={n.note_type} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign, Annual Report..."
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Goal / Outcome</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What defines completion?"
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Background context..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Area of Responsibility</label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="">None</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={async () => {
          if (projectToDelete) {
            await deleteProject.mutateAsync(projectToDelete);
            setProjectToDelete(null);
          }
        }}
        title="Delete Project"
        message="Are you sure you want to delete this project? Associated tasks and notes will not be deleted."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

// ==============================================================================
// 4. AREAS VIEW
// ==============================================================================
const AreasView: React.FC = () => {
  const { areas, isLoading, createArea, updateArea, deleteArea } = useAreas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#9B8963');

  const openCreateModal = () => {
    setEditingArea(null);
    setName('');
    setDescription('');
    setColor('#9B8963');
    setIsModalOpen(true);
  };

  const openEditModal = (a: Area) => {
    setEditingArea(a);
    setName(a.name);
    setDescription(a.description || '');
    setColor(a.color || '#9B8963');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingArea) {
      await updateArea.mutateAsync({
        id: editingArea.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
      });
    } else {
      await createArea.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        color,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">Areas of Responsibility</h3>
          <p className="text-xs text-[#858176]">Ongoing life domains that you maintain continuously.</p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Area
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton rows={3} />
      ) : areas.length === 0 ? (
        <EmptyState
          title="No areas configured"
          description="Areas represent standards you hold over time (Health, Finance, Work, Personal)."
          action={
            <Button variant="outline" size="sm" onClick={openCreateModal}>
              Create Area
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {areas.map((area) => (
            <div
              key={area.id}
              className="p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.color }} />
                  <span className="font-serif text-base font-medium text-[#242424] dark:text-[#EAE7DF]">{area.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(area)} className="p-1 text-[#858176] hover:text-[#242424]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setAreaToDelete(area.id)} className="p-1 text-[#858176] hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {area.description && (
                <p className="text-xs text-[#858176] dark:text-[#8C877D] line-clamp-2">
                  {area.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Area Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingArea ? 'Edit Area' : 'New Area'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Area Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Health, Work, Personal..."
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope and purpose..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Color Tag</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer"
              />
              <span className="text-xs font-mono text-[#858176]">{color}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Area
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!areaToDelete}
        onClose={() => setAreaToDelete(null)}
        onConfirm={async () => {
          if (areaToDelete) {
            await deleteArea.mutateAsync(areaToDelete);
            setAreaToDelete(null);
          }
        }}
        title="Delete Area"
        message="Are you sure you want to delete this area? Associated projects and tasks will have their area unassigned safely."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};

// ==============================================================================
// 5. CALENDAR VIEW (Month, Week, List Views with Full Interactive Details & Edit)
// ==============================================================================
const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { unifiedItems, isLoading, createEvent, updateEvent, deleteEvent } = useCalendar();
  const { updateTask, deleteTask } = useTasks();

  // Create Event state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventLocation, setEventLocation] = useState('');

  // Selected Event (View / Edit) state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDesc, setEditEventDesc] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventStartTime, setEditEventStartTime] = useState('09:00');
  const [editEventEndTime, setEditEventEndTime] = useState('10:00');
  const [editIsAllDay, setEditIsAllDay] = useState(false);
  const [editEventLocation, setEditEventLocation] = useState('');
  const [isDeleteEventConfirmOpen, setIsDeleteEventConfirmOpen] = useState(false);

  // Selected Task (View / Edit from Calendar) state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo');
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('medium');
  const [editTaskRecurrence, setEditTaskRecurrence] = useState<TaskRecurrence | ''>('');
  const [editTaskScheduledDate, setEditTaskScheduledDate] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);

  // Month intervals
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthCalendarStart = startOfWeek(monthStart);
  const monthCalendarEnd = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: monthCalendarStart, end: monthCalendarEnd });

  // Week intervals
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
  };

  // Open item modal depending on whether it's an independent event or a task
  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'event' && item.rawEvent) {
      const ev = item.rawEvent;
      setSelectedEvent(ev);
      setEditEventTitle(ev.title);
      setEditEventDesc(ev.description || '');
      const datePart = ev.start_time.split('T')[0];
      const startTimePart = ev.start_time.includes('T') ? ev.start_time.split('T')[1].substring(0, 5) : '09:00';
      const endTimePart = ev.end_time.includes('T') ? ev.end_time.split('T')[1].substring(0, 5) : '10:00';
      setEditEventDate(datePart);
      setEditEventStartTime(startTimePart);
      setEditEventEndTime(endTimePart);
      setEditIsAllDay(ev.is_all_day);
      setEditEventLocation(ev.location || '');
    } else if (item.rawTask) {
      const t = item.rawTask;
      setSelectedTask(t);
      setEditTaskTitle(t.title);
      setEditTaskDesc(t.description || '');
      setEditTaskStatus(t.status);
      setEditTaskPriority(t.priority);
      setEditTaskRecurrence(t.recurrence || '');
      setEditTaskScheduledDate(t.scheduled_date || '');
      setEditTaskDueDate(t.due_date || '');
    }
  };

  const handleSaveNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const startIso = isAllDay
      ? `${eventDate}T00:00:00Z`
      : `${eventDate}T${eventStartTime}:00`;
    const endIso = isAllDay
      ? `${eventDate}T23:59:59Z`
      : `${eventDate}T${eventEndTime}:00`;

    await createEvent.mutateAsync({
      title: eventTitle.trim(),
      description: eventDesc.trim() || undefined,
      start_time: startIso,
      end_time: endIso,
      is_all_day: isAllDay,
      location: eventLocation.trim() || undefined,
    });

    setIsEventModalOpen(false);
    setEventTitle('');
    setEventDesc('');
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editEventTitle.trim()) return;

    const startIso = editIsAllDay
      ? `${editEventDate}T00:00:00Z`
      : `${editEventDate}T${editEventStartTime}:00`;
    const endIso = editIsAllDay
      ? `${editEventDate}T23:59:59Z`
      : `${editEventDate}T${editEventEndTime}:00`;

    await updateEvent.mutateAsync({
      id: selectedEvent.id,
      title: editEventTitle.trim(),
      description: editEventDesc.trim() || null,
      start_time: startIso,
      end_time: endIso,
      is_all_day: editIsAllDay,
      location: editEventLocation.trim() || null,
    });

    setSelectedEvent(null);
  };

  const handleDeleteSelectedEvent = async () => {
    if (!selectedEvent) return;
    await deleteEvent.mutateAsync(selectedEvent.id);
    setSelectedEvent(null);
    setIsDeleteEventConfirmOpen(false);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTaskTitle.trim()) return;

    await updateTask.mutateAsync({
      id: selectedTask.id,
      title: editTaskTitle.trim(),
      description: editTaskDesc.trim() || null,
      status: editTaskStatus,
      priority: editTaskPriority,
      recurrence: editTaskRecurrence || null,
      scheduled_date: editTaskScheduledDate || null,
      due_date: editTaskDueDate || null,
    });

    setSelectedTask(null);
  };

  const handleDeleteSelectedTask = async () => {
    if (!selectedTask) return;
    await deleteTask.mutateAsync(selectedTask.id);
    setSelectedTask(null);
    setIsDeleteTaskConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-2xl font-medium text-[#242424] dark:text-[#EAE7DF]">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center gap-1 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] p-0.5">
            <button onClick={handlePrev} className="p-1 text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              Today
            </button>
            <button onClick={handleNext} className="p-1 text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#FFFFFF] dark:bg-[#21201D] p-1 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs">
            {(['month', 'week', 'list'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded capitalize transition-colors ${
                  viewMode === m
                    ? 'bg-[#242424] text-[#F5F3ED] dark:bg-[#EAE7DF] dark:text-[#171614] font-medium'
                    : 'text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button variant="primary" size="sm" onClick={() => setIsEventModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Event
          </Button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-[#E5E1D8] dark:border-[#2E2C28] text-center text-xs font-mono text-[#858176] py-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Days */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {monthDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isSameDay(day, new Date());
              const itemsForDay = unifiedItems.filter((i) => i.date === dayStr);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[96px] p-1.5 border-b border-r border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 flex flex-col ${
                    !isCurrMonth ? 'bg-[#F5F3ED]/40 dark:bg-[#171614]/40 text-[#858176]/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[11px] font-mono px-1 rounded ${
                        isCurrentDay ? 'bg-[#9B8963] text-white font-bold' : 'text-[#858176]'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-y-auto flex-1">
                    {itemsForDay.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full text-left text-[10px] p-1 rounded leading-tight truncate cursor-pointer transition-all hover:opacity-85 active:scale-[0.98] ${
                          item.type === 'event'
                            ? 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3] hover:ring-1 hover:ring-[#9B8963]/50'
                            : item.type === 'task_deadline'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:ring-1 hover:ring-red-400/50'
                            : 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7] hover:ring-1 hover:ring-[#7B8D7A]/50'
                        }`}
                        title={`${item.title} (Click to view/edit)`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isCurrentDay = isSameDay(day, new Date());
            const itemsForDay = unifiedItems.filter((i) => i.date === dayStr);

            return (
              <div
                key={day.toISOString()}
                className={`p-3 rounded-[4px] border ${
                  isCurrentDay
                    ? 'border-[#9B8963] bg-[#FFFFFF] dark:bg-[#21201D]'
                    : 'border-[#E5E1D8] dark:border-[#2E2C28] bg-[#FFFFFF]/70 dark:bg-[#21201D]/70'
                } shadow-subtle min-h-[160px] flex flex-col`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 font-mono text-xs">
                  <span className="font-semibold text-[#242424] dark:text-[#EAE7DF]">{format(day, 'EEE')}</span>
                  <span className={isCurrentDay ? 'text-[#9B8963] font-bold' : 'text-[#858176]'}>{format(day, 'MMM d')}</span>
                </div>

                <div className="space-y-1.5 flex-1">
                  {itemsForDay.length === 0 ? (
                    <span className="text-[11px] text-[#858176]/60 italic">Free day</span>
                  ) : (
                    itemsForDay.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full text-left text-xs p-1.5 rounded cursor-pointer transition-all hover:opacity-85 active:scale-[0.98] ${
                          item.type === 'event'
                            ? 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3] hover:ring-1 hover:ring-[#9B8963]/50'
                            : item.type === 'task_deadline'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:ring-1 hover:ring-red-400/50'
                            : 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7] hover:ring-1 hover:ring-[#7B8D7A]/50'
                        }`}
                        title="Click to view/edit"
                      >
                        <div className="font-medium truncate">{item.title}</div>
                        {item.time && <div className="text-[10px] opacity-75 font-mono">{item.time}</div>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {unifiedItems.length === 0 ? (
            <EmptyState title="No scheduled items" description="Create an event or schedule a task to see it in your timeline." />
          ) : (
            unifiedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="p-3.5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle flex items-center justify-between cursor-pointer hover:border-[#9B8963] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-[#9B8963]" />
                  <div>
                    <div className="text-sm font-medium text-[#242424] dark:text-[#EAE7DF] group-hover:text-[#9B8963] transition-colors">
                      {item.title}
                    </div>
                    <div className="text-xs text-[#858176] font-mono">
                      {item.date} {item.time && `• ${item.time}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F5F3ED] dark:bg-[#2A2824] text-[#858176]">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[#858176] group-hover:text-[#242424] dark:group-hover:text-[#EAE7DF] px-2 py-1 border border-[#E5E1D8] dark:border-[#2E2C28] rounded">
                    Edit →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Create Event Modal */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="New Calendar Event"
        subtitle="Independent event (will not duplicate task data)."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Doctor appointment, Team sync..."
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Location</label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Office, Zoom, Home..."
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#242424] dark:text-[#EAE7DF]">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <span>All-day event</span>
          </label>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Start Time</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">End Time</label>
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description</label>
            <textarea
              rows={2}
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              placeholder="Notes, agenda, or reminders..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* Edit / View Event Modal */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details & Edit"
        subtitle="Update event timeline, location, or notes."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={editEventTitle}
              onChange={(e) => setEditEventTitle(e.target.value)}
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Date</label>
              <input
                type="date"
                required
                value={editEventDate}
                onChange={(e) => setEditEventDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Location</label>
              <input
                type="text"
                value={editEventLocation}
                onChange={(e) => setEditEventLocation(e.target.value)}
                placeholder="Office, Zoom, Home..."
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#242424] dark:text-[#EAE7DF]">
            <input
              type="checkbox"
              checked={editIsAllDay}
              onChange={(e) => setEditIsAllDay(e.target.checked)}
              className="rounded"
            />
            <span>All-day event</span>
          </label>

          {!editIsAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Start Time</label>
                <input
                  type="time"
                  value={editEventStartTime}
                  onChange={(e) => setEditEventStartTime(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">End Time</label>
                <input
                  type="time"
                  value={editEventEndTime}
                  onChange={(e) => setEditEventEndTime(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description</label>
            <textarea
              rows={3}
              value={editEventDesc}
              onChange={(e) => setEditEventDesc(e.target.value)}
              placeholder="Notes, agenda, or reminders..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <button
              type="button"
              onClick={() => setIsDeleteEventConfirmOpen(true)}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Event
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Event Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteEventConfirmOpen}
        onClose={() => setIsDeleteEventConfirmOpen(false)}
        onConfirm={handleDeleteSelectedEvent}
        title="Delete Calendar Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
      />

      {/* ------------------------------------------------------------- */}
      {/* Edit / View Task Modal (for scheduled tasks clicked from Calendar) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details & Edit"
        subtitle="Manage scheduled dates, deadlines, priority, and status."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
              className="w-full p-2 text-sm bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Status</label>
              <select
                value={editTaskStatus}
                onChange={(e) => setEditTaskStatus(e.target.value as TaskStatus)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="todo" className="bg-[#FFFFFF] dark:bg-[#21201D]">To Do</option>
                <option value="in_progress" className="bg-[#FFFFFF] dark:bg-[#21201D]">In Progress</option>
                <option value="completed" className="bg-[#FFFFFF] dark:bg-[#21201D]">Completed</option>
                <option value="cancelled" className="bg-[#FFFFFF] dark:bg-[#21201D]">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Priority</label>
              <select
                value={editTaskPriority}
                onChange={(e) => setEditTaskPriority(e.target.value as TaskPriority)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="low" className="bg-[#FFFFFF] dark:bg-[#21201D]">Low</option>
                <option value="medium" className="bg-[#FFFFFF] dark:bg-[#21201D]">Medium</option>
                <option value="high" className="bg-[#FFFFFF] dark:bg-[#21201D]">High</option>
                <option value="urgent" className="bg-[#FFFFFF] dark:bg-[#21201D]">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Repeat (Lặp lại)</label>
              <select
                value={editTaskRecurrence}
                onChange={(e) => setEditTaskRecurrence(e.target.value as TaskRecurrence | '')}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              >
                <option value="" className="bg-[#FFFFFF] dark:bg-[#21201D]">None (Không)</option>
                <option value="daily" className="bg-[#FFFFFF] dark:bg-[#21201D]">Daily (Hàng ngày)</option>
                <option value="weekly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Weekly (Hàng tuần)</option>
                <option value="monthly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Monthly (Hàng tháng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Scheduled Date</label>
              <input
                type="date"
                value={editTaskScheduledDate}
                onChange={(e) => setEditTaskScheduledDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#858176] mb-1">Due Date</label>
              <input
                type="date"
                value={editTaskDueDate}
                onChange={(e) => setEditTaskDueDate(e.target.value)}
                className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={editTaskDesc}
              onChange={(e) => setEditTaskDesc(e.target.value)}
              placeholder="Context, sub-tasks, or notes..."
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
            <button
              type="button"
              onClick={() => setIsDeleteTaskConfirmOpen(true)}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTask(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Task
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Task Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteTaskConfirmOpen}
        onClose={() => setIsDeleteTaskConfirmOpen(false)}
        onConfirm={handleDeleteSelectedTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
