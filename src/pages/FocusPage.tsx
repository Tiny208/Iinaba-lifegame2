import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar as CalendarIcon,
  Check,
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
  addDays,
  subDays,
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
import { Task, Project, Area, TaskStatus, TaskPriority, TaskRecurrence, EventRecurrence, ProjectStatus, CalendarEvent } from '@/types/database';
import { formatDate, formatRelativeDate } from '@/lib/utils';

type FocusTab = 'today' | 'calendar' | 'tasks' | 'projects' | 'areas';

export const FocusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as FocusTab) || 'today';

  const setTab = (tab: FocusTab) => {
    setSearchParams({ tab });
  };

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${currentTab === 'calendar' ? 'space-y-2' : 'space-y-4 sm:space-y-5'}`}>
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E1D8] dark:border-[#2E2C28] flex-shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#858176] font-mono">Action & Responsibility</div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#242424] dark:text-[#EAE7DF] mt-0.5">
            Focus
          </h2>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#21201D] p-1 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs font-medium overflow-x-auto">
          {(['today', 'calendar', 'tasks', 'projects', 'areas'] as FocusTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-3 py-1 rounded-[3px] transition-colors whitespace-nowrap capitalize ${
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
      <div className="flex-1 min-h-0 flex flex-col">
        {currentTab === 'today' && <TodayView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'tasks' && <TasksView />}
        {currentTab === 'projects' && <ProjectsView />}
        {currentTab === 'areas' && <AreasView />}
      </div>
    </div>
  );
};

// ==============================================================================
// 1. TODAY VIEW
// ==============================================================================
const TodayView: React.FC = () => {
  const { user } = useAuth();
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const { tasks, isLoading, toggleTaskStatus, toggleTodayPriority, createTask } = useTasks();
  const [newTitle, setNewTitle] = useState('');
  const [todayError, setTodayError] = useState<string | null>(null);

  const todayPriorities = tasks.filter((t) => t.is_today_priority && !t.is_archived && t.status !== 'completed');
  const scheduledForToday = tasks.filter((t) => t.scheduled_date === todayDateStr && !t.is_today_priority && !t.is_archived && t.status !== 'completed');

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!user) {
      setTodayError('Bạn cần đăng nhập để tạo task.');
      return;
    }
    setTodayError(null);
    try {
      await createTask.mutateAsync({
        title: newTitle.trim(),
        scheduled_date: todayDateStr,
        status: 'todo',
        priority: 'medium',
      });
      setNewTitle('');
    } catch (err: any) {
      setTodayError(err?.message || 'Không thể tạo task. Vui lòng thử lại.');
    }
  };

  if (isLoading) return <CardSkeleton rows={4} />;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl">
      {/* Top 3 Priorities */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">Today&rsquo;s Three Priorities</h3>
            <p className="text-xs text-[#858176] mt-0.5">The needle-movers for your day.</p>
          </div>
          <span className="text-xs font-mono text-[#858176]">{todayPriorities.length} / 3 selected</span>
        </div>

        {todayPriorities.length === 0 ? (
          <EmptyState
            title="No top priorities selected"
            description="Star up to 3 tasks to commit to today."
          />
        ) : (
          <div className="space-y-1.5">
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
      <section className="space-y-2">
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
        {todayError && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
            {todayError}
          </div>
        )}

        {scheduledForToday.length === 0 ? (
          <div className="text-xs text-[#858176] py-3 text-center">No other tasks scheduled for today.</div>
        ) : (
          <div className="space-y-1.5">
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
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('todo');
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
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isTaskSaving, setIsTaskSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formRecurrence, setFormRecurrence] = useState<TaskRecurrence | ''>('');
  const [formRecurrenceStartDate, setFormRecurrenceStartDate] = useState('');
  const [formRecurrenceEndDate, setFormRecurrenceEndDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const [formTodayPriority, setFormTodayPriority] = useState(false);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskError(null);
    setFormTitle('');
    setFormDescription('');
    setFormPriority('medium');
    setFormStatus('todo');
    setFormRecurrence('');
    setFormRecurrenceStartDate(format(new Date(), 'yyyy-MM-dd'));
    setFormRecurrenceEndDate('');
    setFormDueDate('');
    setFormScheduledDate('');
    setFormProjectId(projectFilter !== 'all' ? projectFilter : '');
    setFormAreaId(areaFilter !== 'all' ? areaFilter : '');
    setFormTodayPriority(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTaskError(null);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormRecurrence(task.recurrence || '');
    setFormRecurrenceStartDate(task.recurrence_start_date || '');
    setFormRecurrenceEndDate(task.recurrence_end_date || '');
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

    if (!user) {
      setTaskError('Bạn cần đăng nhập để tạo hoặc cập nhật task.');
      return;
    }

    setIsTaskSaving(true);
    setTaskError(null);

    try {
      if (editingTask) {
        await updateTask.mutateAsync({
          id: editingTask.id,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          priority: formPriority,
          status: formStatus,
          recurrence: formRecurrence || null,
          recurrence_start_date: formRecurrence ? (formRecurrenceStartDate || null) : null,
          recurrence_end_date: formRecurrence ? (formRecurrenceEndDate || null) : null,
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
          recurrence_start_date: formRecurrence ? (formRecurrenceStartDate || null) : null,
          recurrence_end_date: formRecurrence ? (formRecurrenceEndDate || null) : null,
          due_date: formDueDate || null,
          scheduled_date: formScheduledDate || null,
          project_id: formProjectId || null,
          area_id: formAreaId || null,
          is_today_priority: formTodayPriority,
        });
      }

      setIsCreateOpen(false);
    } catch (err: any) {
      console.error('Error saving task:', err);
      setTaskError(err?.message || 'Không thể lưu task. Vui lòng thử lại.');
    } finally {
      setIsTaskSaving(false);
    }
  };

  // Client-side priority filter if needed
  const filteredTasks = priorityFilter === 'all' ? tasks : tasks.filter((t) => t.priority === priorityFilter);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-1.5 text-xs bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[3px] text-[#242424] dark:text-[#EAE7DF]"
          >
            <option value="todo">Todo</option>
            <option value="completed">Completed</option>
            <option value="all">All Statuses</option>
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
        <div className="space-y-1.5">
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
          {!user && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để lưu trữ công việc.</span>
              <Link to="/auth" className="underline font-semibold ml-2">Đăng nhập</Link>
            </div>
          )}
          {taskError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              {taskError}
            </div>
          )}
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

          {formRecurrence && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[4px] bg-[#FAF8F3] dark:bg-[#1E1D1A] border border-[#E5E1D8]/80 dark:border-[#2E2C28]/80">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Lặp lại bắt đầu từ</label>
                <input
                  type="date"
                  value={formRecurrenceStartDate}
                  onChange={(e) => setFormRecurrenceStartDate(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Đến ngày (tuỳ chọn)</label>
                <input
                  type="date"
                  value={formRecurrenceEndDate}
                  onChange={(e) => setFormRecurrenceEndDate(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

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
            <Button type="submit" variant="primary" size="sm" disabled={isTaskSaving}>
              {isTaskSaving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
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
    <div className="p-2.5 sm:p-3 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
              className={`text-sm font-medium truncate leading-snug ${
                isCompleted ? 'line-through text-[#858176]' : 'text-[#242424] dark:text-[#EAE7DF]'
              }`}
            >
              {task.title}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-[#858176] leading-tight">
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
  const { user } = useAuth();
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
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isProjectSaving, setIsProjectSaving] = useState(false);

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
    setProjectError(null);
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
    setProjectError(null);
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

    if (!user) {
      setProjectError('Bạn cần đăng nhập để tạo hoặc cập nhật project.');
      return;
    }

    setIsProjectSaving(true);
    setProjectError(null);

    try {
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
    } catch (err: any) {
      console.error('Error saving project:', err);
      setProjectError(err?.message || 'Không thể lưu project. Vui lòng thử lại.');
    } finally {
      setIsProjectSaving(false);
    }
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
                className="p-3.5 sm:p-4 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] hover:border-[#9B8963] transition-colors shadow-subtle cursor-pointer flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-lg font-medium text-[#242424] dark:text-[#EAE7DF] truncate">
                      {proj.name}
                    </h4>
                    <StatusPill type="projectStatus" value={proj.status} />
                  </div>

                  {proj.goal && (
                    <p className="text-xs text-[#858176] dark:text-[#8C877D] mt-0.5 line-clamp-2">
                      {proj.goal}
                    </p>
                  )}

                  {proj.area && (
                    <div className="text-[10px] text-[#858176] tracking-wider uppercase font-mono mt-1.5">
                      Area: {proj.area.name}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#858176] pt-2 border-t border-[#E5E1D8]/60 dark:border-[#2E2C28]/60">
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
          {!user && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để lưu trữ project.</span>
              <Link to="/auth" className="underline font-semibold ml-2">Đăng nhập</Link>
            </div>
          )}
          {projectError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              {projectError}
            </div>
          )}
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
            <Button type="submit" variant="primary" size="sm" disabled={isProjectSaving}>
              {isProjectSaving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
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
  const { user } = useAuth();
  const { areas, isLoading, createArea, updateArea, deleteArea } = useAreas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [isAreaSaving, setIsAreaSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#9B8963');

  const openCreateModal = () => {
    setEditingArea(null);
    setAreaError(null);
    setName('');
    setDescription('');
    setColor('#9B8963');
    setIsModalOpen(true);
  };

  const openEditModal = (a: Area) => {
    setEditingArea(a);
    setAreaError(null);
    setName(a.name);
    setDescription(a.description || '');
    setColor(a.color || '#9B8963');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!user) {
      setAreaError('Bạn cần đăng nhập để tạo hoặc cập nhật area.');
      return;
    }

    setIsAreaSaving(true);
    setAreaError(null);

    try {
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
    } catch (err: any) {
      console.error('Error saving area:', err);
      setAreaError(err?.message || 'Không thể lưu area. Vui lòng thử lại.');
    } finally {
      setIsAreaSaving(false);
    }
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
          {!user && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để lưu trữ area.</span>
              <Link to="/auth" className="underline font-semibold ml-2">Đăng nhập</Link>
            </div>
          )}
          {areaError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              {areaError}
            </div>
          )}
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
            <Button type="submit" variant="primary" size="sm" disabled={isAreaSaving}>
              {isAreaSaving ? 'Saving...' : editingArea ? 'Save Changes' : 'Save Area'}
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
// 5. CALENDAR VIEW (Month, Week, Day, List Views with Full Interactive Details & Edit)
// ==============================================================================
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const formatHourLabel = (hour: number) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

const CalendarView: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'list' | 'month'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'day';
    }
    return 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prevent outer page scrolling on desktop calendar views (week, day, month)
  useEffect(() => {
    if (viewMode === 'week' || viewMode === 'day' || viewMode === 'month') {
      const lockOuterScroll = () => {
        if (window.innerWidth >= 768) {
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
        } else {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      };

      lockOuterScroll();
      window.addEventListener('resize', lockOuterScroll);

      return () => {
        window.removeEventListener('resize', lockOuterScroll);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      };
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }, [viewMode]);

  // Update current time every minute for red indicator
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll time grid to 8 AM on mount / view switch
  useEffect(() => {
    if ((viewMode === 'week' || viewMode === 'day') && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 8 * 48 - 12;
    }
  }, [viewMode, currentDate]);

  const { unifiedItems, isLoading, createEvent, updateEvent, deleteEvent } = useCalendar();
  const { updateTask, deleteTask, toggleTaskStatus } = useTasks();

  // Create Event state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [eventLocation, setEventLocation] = useState('');
  const [eventRecurrence, setEventRecurrence] = useState<EventRecurrence | ''>('');
  const [eventRecurrenceStartDate, setEventRecurrenceStartDate] = useState('');
  const [eventRecurrenceEndDate, setEventRecurrenceEndDate] = useState('');
  const [eventError, setEventError] = useState<string | null>(null);
  const [isEventSaving, setIsEventSaving] = useState(false);

  // Selected Event (View / Edit) state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDesc, setEditEventDesc] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventStartTime, setEditEventStartTime] = useState('09:00');
  const [editEventEndTime, setEditEventEndTime] = useState('10:00');
  const [editIsAllDay, setEditIsAllDay] = useState(false);
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventRecurrence, setEditEventRecurrence] = useState<EventRecurrence | ''>('');
  const [editEventRecurrenceStartDate, setEditEventRecurrenceStartDate] = useState('');
  const [editEventRecurrenceEndDate, setEditEventRecurrenceEndDate] = useState('');
  const [isDeleteEventConfirmOpen, setIsDeleteEventConfirmOpen] = useState(false);

  // Selected Task (View / Edit from Calendar) state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<TaskStatus>('todo');
  const [editTaskPriority, setEditTaskPriority] = useState<TaskPriority>('medium');
  const [editTaskRecurrence, setEditTaskRecurrence] = useState<TaskRecurrence | ''>('');
  const [editTaskRecurrenceStartDate, setEditTaskRecurrenceStartDate] = useState('');
  const [editTaskRecurrenceEndDate, setEditTaskRecurrenceEndDate] = useState('');
  const [editTaskScheduledDate, setEditTaskScheduledDate] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);

  // Month intervals (Monday-first)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthCalendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthCalendarStart, end: monthCalendarEnd });

  // Week intervals (Monday-first)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, d MMMM yyyy');
    }
    if (viewMode === 'week') {
      if (isSameMonth(weekStart, weekEnd)) {
        return `${format(weekStart, 'd')} – ${format(weekEnd, 'd MMMM yyyy')}`;
      }
      return `${format(weekStart, 'd MMM')} – ${format(weekEnd, 'd MMM yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const daysToDisplay = viewMode === 'day' ? [currentDate] : weekDays;

  // Handle clicking a time slot in Week / Day view to create event directly
  const handleTimeSlotClick = (day: Date, hour: number) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const startH = hour.toString().padStart(2, '0');
    const endH = ((hour + 1) % 24).toString().padStart(2, '0');
    setEventDate(dayStr);
    setEventStartTime(`${startH}:00`);
    setEventEndTime(`${endH}:00`);
    setIsAllDay(false);
    setEventTitle('');
    setEventDesc('');
    setEventLocation('');
    setEventRecurrence('');
    setEventRecurrenceStartDate(dayStr);
    setEventRecurrenceEndDate('');
    setEventError(null);
    setIsEventModalOpen(true);
  };

  // Open item modal depending on whether it's an independent event or a task
  const handleItemClick = (item: CalendarItem) => {
    if (item.type === 'event' && item.rawEvent) {
      const ev = item.rawEvent;
      setSelectedEvent(ev);
      setEventError(null);
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
      setEditEventRecurrence(ev.recurrence || '');
      setEditEventRecurrenceStartDate(ev.recurrence_start_date || datePart);
      setEditEventRecurrenceEndDate(ev.recurrence_end_date || '');
    } else if (item.rawTask) {
      const t = item.rawTask;
      setSelectedTask(t);
      setEditTaskTitle(t.title);
      setEditTaskDesc(t.description || '');
      setEditTaskStatus(t.status);
      setEditTaskPriority(t.priority);
      setEditTaskRecurrence(t.recurrence || '');
      setEditTaskRecurrenceStartDate(t.recurrence_start_date || (t.scheduled_date || ''));
      setEditTaskRecurrenceEndDate(t.recurrence_end_date || '');
      setEditTaskScheduledDate(t.scheduled_date || '');
      setEditTaskDueDate(t.due_date ? t.due_date.split('T')[0] : '');
    }
  };

  const handleSaveNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (!user) {
      setEventError('Bạn cần đăng nhập để tạo và lưu trữ sự kiện.');
      return;
    }

    setIsEventSaving(true);
    setEventError(null);

    try {
      const safeStartTime = eventStartTime ? eventStartTime.substring(0, 5) : '09:00';
      const safeEndTime = eventEndTime ? eventEndTime.substring(0, 5) : '10:00';
      const startISO = isAllDay
        ? `${eventDate}T00:00:00`
        : `${eventDate}T${safeStartTime}:00`;
      const endISO = isAllDay
        ? `${eventDate}T23:59:59`
        : `${eventDate}T${safeEndTime}:00`;

      await createEvent.mutateAsync({
        title: eventTitle.trim(),
        description: eventDesc.trim() || undefined,
        start_time: startISO,
        end_time: endISO,
        is_all_day: isAllDay,
        location: eventLocation.trim() || undefined,
        recurrence: eventRecurrence ? (eventRecurrence as EventRecurrence) : null,
        recurrence_start_date: eventRecurrence ? (eventRecurrenceStartDate || null) : null,
        recurrence_end_date: eventRecurrence ? (eventRecurrenceEndDate || null) : null,
      });

      setEventTitle('');
      setEventDesc('');
      setEventLocation('');
      setEventRecurrence('');
      setEventRecurrenceStartDate('');
      setEventRecurrenceEndDate('');
      setIsAllDay(false);
      setIsEventModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      setEventError(err?.message || 'Không thể tạo sự kiện. Vui lòng thử lại.');
    } finally {
      setIsEventSaving(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editEventTitle.trim()) return;

    if (!user) {
      setEventError('Bạn cần đăng nhập để cập nhật sự kiện.');
      return;
    }

    setIsEventSaving(true);
    setEventError(null);

    try {
      const safeStartTime = editEventStartTime ? editEventStartTime.substring(0, 5) : '09:00';
      const safeEndTime = editEventEndTime ? editEventEndTime.substring(0, 5) : '10:00';
      const startISO = editIsAllDay
        ? `${editEventDate}T00:00:00`
        : `${editEventDate}T${safeStartTime}:00`;
      const endISO = editIsAllDay
        ? `${editEventDate}T23:59:59`
        : `${editEventDate}T${safeEndTime}:00`;

      await updateEvent.mutateAsync({
        id: selectedEvent.id,
        title: editEventTitle.trim(),
        description: editEventDesc.trim() || undefined,
        start_time: startISO,
        end_time: endISO,
        is_all_day: editIsAllDay,
        location: editEventLocation.trim() || undefined,
        recurrence: editEventRecurrence ? (editEventRecurrence as EventRecurrence) : null,
        recurrence_start_date: editEventRecurrence ? (editEventRecurrenceStartDate || null) : null,
        recurrence_end_date: editEventRecurrence ? (editEventRecurrenceEndDate || null) : null,
      });

      setSelectedEvent(null);
    } catch (err: any) {
      console.error('Failed to update calendar event:', err);
      setEventError(err?.message || 'Không thể cập nhật sự kiện. Vui lòng thử lại.');
    } finally {
      setIsEventSaving(false);
    }
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
      recurrence_start_date: editTaskRecurrence ? (editTaskRecurrenceStartDate || null) : null,
      recurrence_end_date: editTaskRecurrence ? (editTaskRecurrenceEndDate || null) : null,
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
    <div className="flex flex-col min-h-0 h-full">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="font-serif text-lg sm:text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
            {getHeaderTitle()}
          </h3>
          <div className="flex items-center gap-0.5 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] p-0.5">
            <button onClick={handlePrev} className="p-1 text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 py-0.5 text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              Today
            </button>
            <button onClick={handleNext} className="p-1 text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Week, Day, List, Month (Month last as requested) */}
          <div className="flex items-center bg-[#FFFFFF] dark:bg-[#21201D] p-0.5 rounded-[4px] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs">
            {(['week', 'day', 'list', 'month'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
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

      {/* Google Calendar Time Grid for Week and Day Views */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="flex-1 min-h-0 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[6px] bg-[#FFFFFF] dark:bg-[#21201D] overflow-hidden shadow-subtle flex flex-col">
          {/* Day Names & Dates Header */}
          <div className="flex-shrink-0 flex border-b border-[#E5E1D8] dark:border-[#2E2C28] bg-[#FDFBF7] dark:bg-[#1E1D1A]">
            <div className="w-12 sm:w-14 flex-shrink-0 border-r border-[#E5E1D8] dark:border-[#2E2C28] p-1.5 flex items-end justify-center">
              <span className="text-[9.5px] font-mono text-[#858176]">GMT+7</span>
            </div>
            <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
              {daysToDisplay.map((day) => {
                const isCurrentDay = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className="p-1.5 text-center border-r border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 last:border-r-0"
                  >
                    <div className="text-[10px] font-mono uppercase text-[#858176]">
                      {format(day, 'EEE')}
                    </div>
                    <div className="mt-0.5 flex justify-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 text-xs font-mono rounded-full ${
                          isCurrentDay
                            ? 'bg-[#9B8963] text-white font-bold shadow-xs'
                            : 'text-[#242424] dark:text-[#EAE7DF] font-medium'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-day / Tasks Top Strip */}
          <div className="flex-shrink-0 flex border-b border-[#E5E1D8] dark:border-[#2E2C28] bg-[#FAF8F3] dark:bg-[#1C1B18] min-h-[30px] max-h-[52px] overflow-y-auto">
            <div className="w-12 sm:w-14 flex-shrink-0 border-r border-[#E5E1D8] dark:border-[#2E2C28] p-1 flex items-center justify-center">
              <span className="text-[9.5px] font-mono text-[#858176]">All-day</span>
            </div>
            <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
              {daysToDisplay.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const allDayOrTaskItems = unifiedItems.filter(
                  (i) => i.date === dayStr && (i.type !== 'event' || i.allDay || !i.time)
                );
                return (
                  <div
                    key={day.toISOString()}
                    className="p-1 border-r border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 last:border-r-0 space-y-0.5 min-h-[28px]"
                  >
                    {allDayOrTaskItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full text-left text-[9.5px] px-1 py-0.5 rounded leading-tight truncate cursor-pointer transition-all hover:opacity-85 active:scale-[0.98] ${
                          item.type === 'event'
                            ? 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3]'
                            : item.type === 'task_deadline'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7]'
                        }`}
                        title={`${item.title} (Click to view/edit)`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 24-Hour Scrollable Grid */}
          <div
            ref={scrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative"
          >
            <div className={`flex ${viewMode === 'week' ? 'min-w-[640px]' : 'min-w-full'}`}>
              {/* Hour Labels Left Gutter */}
              <div className="w-12 sm:w-14 flex-shrink-0 select-none border-r border-[#E5E1D8] dark:border-[#2E2C28]">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 relative border-b border-[#E5E1D8]/40 dark:border-[#2E2C28]/40"
                  >
                    <span className="absolute -top-2 right-1.5 text-[9.5px] font-mono text-[#858176]">
                      {formatHourLabel(hour)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns in Grid */}
              <div className={`flex-1 grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'} relative`}>
                {daysToDisplay.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurrentDay = isSameDay(day, new Date());
                  const timedEvents = unifiedItems.filter(
                    (i) => i.date === dayStr && i.type === 'event' && !i.allDay && i.time
                  );

                  return (
                    <div
                      key={day.toISOString()}
                      className="relative border-r border-[#E5E1D8]/60 dark:border-[#2E2C28]/60 last:border-r-0"
                    >
                      {/* 24 background hour rows with click-to-create */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          onClick={() => handleTimeSlotClick(day, hour)}
                          className="h-12 border-b border-[#E5E1D8]/40 dark:border-[#2E2C28]/40 hover:bg-[#9B8963]/10 dark:hover:bg-[#9B8963]/15 transition-colors cursor-pointer group relative"
                          title={`Nhấn để tạo sự kiện lúc ${formatHourLabel(hour)}`}
                        >
                          <span className="opacity-0 group-hover:opacity-70 text-[9px] font-mono text-[#9B8963] dark:text-[#D1C2A3] absolute top-1 left-1.5 select-none pointer-events-none transition-opacity">
                            + Thêm sự kiện
                          </span>
                        </div>
                      ))}

                      {/* Red Indicator Line for Current Time */}
                      {isCurrentDay && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{
                            top: `${((currentTime.getHours() * 60 + currentTime.getMinutes()) / 60) * 48}px`,
                          }}
                        >
                          <span className="w-2 h-2 -ml-1 rounded-full bg-[#EA4335] shadow-xs flex-shrink-0" />
                          <span className="h-[2px] w-full bg-[#EA4335]" />
                        </div>
                      )}

                      {/* Timed Event Blocks */}
                      {timedEvents.map((item) => {
                        let startMinutes = 9 * 60;
                        let endMinutes = 10 * 60;

                        if (item.rawEvent?.start_time && item.rawEvent.start_time.includes('T')) {
                          const parts = item.rawEvent.start_time.split('T')[1].substring(0, 5).split(':');
                          const sh = parseInt(parts[0], 10);
                          const sm = parseInt(parts[1], 10);
                          if (!isNaN(sh) && !isNaN(sm)) startMinutes = sh * 60 + sm;
                        } else if (item.time) {
                          const parts = item.time.split(':');
                          const sh = parseInt(parts[0], 10);
                          const sm = parseInt(parts[1], 10);
                          if (!isNaN(sh) && !isNaN(sm)) startMinutes = sh * 60 + sm;
                        }

                        if (item.rawEvent?.end_time && item.rawEvent.end_time.includes('T')) {
                          const parts = item.rawEvent.end_time.split('T')[1].substring(0, 5).split(':');
                          const eh = parseInt(parts[0], 10);
                          const em = parseInt(parts[1], 10);
                          if (!isNaN(eh) && !isNaN(em)) endMinutes = eh * 60 + em;
                        } else {
                          endMinutes = startMinutes + 60;
                        }

                        const durationMinutes = Math.max(endMinutes - startMinutes, 30);
                        const topPx = (startMinutes / 60) * 48;
                        const heightPx = Math.max((durationMinutes / 60) * 48 - 2, 24);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            className="absolute left-1 right-1 z-10 p-1 rounded-[3px] bg-[#9B8963]/20 dark:bg-[#9B8963]/30 border-l-[3px] border-[#9B8963] text-left overflow-hidden transition-all hover:ring-1 hover:ring-[#9B8963] hover:shadow-sm active:scale-[0.99] flex flex-col justify-start group"
                            title={`${item.title} (${item.time || ''})`}
                          >
                            <div className="font-medium text-[11px] text-[#242424] dark:text-[#EAE7DF] truncate leading-tight group-hover:text-[#9B8963] transition-colors">
                              {item.title}
                            </div>
                            {item.time && heightPx >= 34 && (
                              <div className="text-[9px] font-mono text-[#857451] dark:text-[#D1C2A3] opacity-90 truncate leading-tight mt-0.5">
                                {item.time}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Month View (Dynamic Minimalist Row Heights: Empty rows collapse down, active rows expand to fit items) */}
      {viewMode === 'month' && (() => {
        const monthWeeks: Date[][] = [];
        for (let i = 0; i < monthDays.length; i += 7) {
          monthWeeks.push(monthDays.slice(i, i + 7));
        }

        return (
          <div className="flex-1 min-h-0 border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[6px] bg-[#FFFFFF] dark:bg-[#21201D] overflow-hidden shadow-subtle flex flex-col">
            {/* Day Names Header (Mon - Sun) */}
            <div className="flex-shrink-0 grid grid-cols-7 border-b border-[#E5E1D8] dark:border-[#2E2C28] text-center text-[11px] font-mono text-[#858176] py-1.5 bg-[#FDFBF7] dark:bg-[#1E1D1A]">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Dynamic Week Rows */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#E5E1D8]/60 dark:divide-[#2E2C28]/60">
              {monthWeeks.map((week, wIdx) => {
                const maxItems = Math.max(
                  ...week.map((d) => unifiedItems.filter((i) => i.date === format(d, 'yyyy-MM-dd')).length),
                  0
                );
                // Dynamic row height: 0 items -> 46px (compact, minimal space), 1 item -> 52px, 2 items -> 74px, etc.
                const rowMinHeight = maxItems === 0 ? '46px' : `${Math.max(52, 28 + maxItems * 23)}px`;

                return (
                  <div
                    key={`week-${wIdx}`}
                    className="grid grid-cols-7 divide-x divide-[#E5E1D8]/60 dark:border-[#2E2C28]/60"
                    style={{ minHeight: rowMinHeight }}
                  >
                    {week.map((day) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const isCurrMonth = isSameMonth(day, currentDate);
                      const isCurrentDay = isSameDay(day, new Date());
                      const itemsForDay = unifiedItems.filter((i) => i.date === dayStr);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`min-h-0 p-1 sm:p-1.5 flex flex-col ${
                            !isCurrMonth ? 'bg-[#F5F3ED]/40 dark:bg-[#171614]/40 text-[#858176]/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5 flex-shrink-0">
                            <span
                              className={`text-[10px] font-mono px-1 rounded ${
                                isCurrentDay ? 'bg-[#9B8963] text-white font-bold' : 'text-[#858176]'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>
                          </div>

                          <div className="space-y-0.5 flex-1 min-h-0">
                            {itemsForDay.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`w-full text-left text-[9.5px] p-0.5 px-1 rounded leading-tight flex items-center justify-between gap-1 cursor-pointer transition-all hover:opacity-85 active:scale-[0.98] ${
                                  item.type === 'event'
                                    ? 'bg-[#9B8963]/15 text-[#857451] dark:bg-[#9B8963]/25 dark:text-[#D1C2A3] hover:ring-1 hover:ring-[#9B8963]/50'
                                    : item.type === 'task_deadline'
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 hover:ring-1 hover:ring-red-400/50'
                                    : 'bg-[#7B8D7A]/15 text-[#5F705E] dark:bg-[#7B8D7A]/20 dark:text-[#A8BCA7] hover:ring-1 hover:ring-[#7B8D7A]/50'
                                }`}
                                title={`${item.title} (Click to view/edit)`}
                              >
                                <span className="truncate">{item.title}</span>
                                {item.type === 'event' && item.time && !item.allDay && (
                                  <span className="font-mono text-[8.5px] opacity-80 flex-shrink-0 font-medium ml-1">
                                    {item.time}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
                      {item.date} {item.type === 'event' && item.time && !item.allDay && `• ${item.time}`}
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
        onClose={() => {
          setIsEventModalOpen(false);
          setEventError(null);
        }}
        title="New Calendar Event"
        subtitle="Independent event (will not duplicate task data)."
        maxWidth="md"
      >
        <form onSubmit={handleSaveNewEvent} className="space-y-4">
          {!user && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để lưu trữ sự kiện.</span>
              <Link to="/auth" className="underline font-semibold ml-2">Đăng nhập</Link>
            </div>
          )}
          {eventError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              {eventError}
            </div>
          )}
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

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Repeat (Lặp lại)</label>
            <select
              value={eventRecurrence}
              onChange={(e) => setEventRecurrence(e.target.value as EventRecurrence | '')}
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            >
              <option value="" className="bg-[#FFFFFF] dark:bg-[#21201D]">Does not repeat (Không lặp lại)</option>
              <option value="daily" className="bg-[#FFFFFF] dark:bg-[#21201D]">Daily (Hàng ngày)</option>
              <option value="weekly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Weekly (Hàng tuần)</option>
              <option value="monthly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Monthly (Hàng tháng)</option>
              <option value="yearly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Yearly (Hàng năm - Sinh nhật, ngày kỷ niệm)</option>
            </select>
          </div>

          {eventRecurrence && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[4px] bg-[#FAF8F3] dark:bg-[#1E1D1A] border border-[#E5E1D8]/80 dark:border-[#2E2C28]/80">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Lặp lại bắt đầu từ</label>
                <input
                  type="date"
                  value={eventRecurrenceStartDate}
                  onChange={(e) => setEventRecurrenceStartDate(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Đến ngày (tuỳ chọn)</label>
                <input
                  type="date"
                  value={eventRecurrenceEndDate}
                  onChange={(e) => setEventRecurrenceEndDate(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

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
            <Button type="submit" variant="primary" size="sm" disabled={isEventSaving}>
              {isEventSaving ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* Edit / View Event Modal */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          setEventError(null);
        }}
        title="Event Details & Edit"
        subtitle="Update event timeline, location, or notes."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          {!user && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để chỉnh sửa sự kiện.</span>
              <Link to="/auth" className="underline font-semibold ml-2">Đăng nhập</Link>
            </div>
          )}
          {eventError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
              {eventError}
            </div>
          )}
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

          <div>
            <label className="block text-xs font-medium text-[#858176] mb-1">Repeat (Lặp lại)</label>
            <select
              value={editEventRecurrence}
              onChange={(e) => setEditEventRecurrence(e.target.value as EventRecurrence | '')}
              className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
            >
              <option value="" className="bg-[#FFFFFF] dark:bg-[#21201D]">Does not repeat (Không lặp lại)</option>
              <option value="daily" className="bg-[#FFFFFF] dark:bg-[#21201D]">Daily (Hàng ngày)</option>
              <option value="weekly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Weekly (Hàng tuần)</option>
              <option value="monthly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Monthly (Hàng tháng)</option>
              <option value="yearly" className="bg-[#FFFFFF] dark:bg-[#21201D]">Yearly (Hàng năm - Sinh nhật, ngày kỷ niệm)</option>
            </select>
          </div>

          {editEventRecurrence && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[4px] bg-[#FAF8F3] dark:bg-[#1E1D1A] border border-[#E5E1D8]/80 dark:border-[#2E2C28]/80">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Lặp lại bắt đầu từ</label>
                <input
                  type="date"
                  value={editEventRecurrenceStartDate}
                  onChange={(e) => setEditEventRecurrenceStartDate(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Đến ngày (tuỳ chọn)</label>
                <input
                  type="date"
                  value={editEventRecurrenceEndDate}
                  onChange={(e) => setEditEventRecurrenceEndDate(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

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
          {/* Quick Complete / Status Action Banner */}
          {selectedTask && (
            <div className="p-2.5 rounded-[4px] bg-[#FAF8F3] dark:bg-[#1E1D1A] border border-[#E5E1D8] dark:border-[#2E2C28] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedTask.status === 'completed' ? 'bg-[#2E7D32]' : 'bg-[#9B8963]'}`} />
                <span className="text-xs font-mono text-[#858176]">
                  Trạng thái: <strong className="text-[#242424] dark:text-[#EAE7DF] uppercase">{selectedTask.status}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  toggleTaskStatus.mutate({ id: selectedTask.id, currentStatus: selectedTask.status });
                  setSelectedTask(null);
                }}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[4px] border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedTask.status === 'completed'
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-300'
                    : 'bg-[#2E7D32]/10 hover:bg-[#2E7D32]/20 text-[#2E7D32] dark:bg-[#4CAF50]/15 dark:hover:bg-[#4CAF50]/25 dark:text-[#81C784] border-[#2E7D32]/30'
                }`}
              >
                <Check size={14} />
                <span>{selectedTask.status === 'completed' ? 'Mở lại task (Undo)' : 'Đánh dấu hoàn thành'}</span>
              </button>
            </div>
          )}

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
                <option value="todo" className="bg-[#FFFFFF] dark:bg-[#21201D]">Todo</option>
                <option value="completed" className="bg-[#FFFFFF] dark:bg-[#21201D]">Completed</option>
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

          {editTaskRecurrence && (
            <div className="grid grid-cols-2 gap-3 p-2.5 rounded-[4px] bg-[#FAF8F3] dark:bg-[#1E1D1A] border border-[#E5E1D8]/80 dark:border-[#2E2C28]/80">
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Lặp lại bắt đầu từ</label>
                <input
                  type="date"
                  value={editTaskRecurrenceStartDate}
                  onChange={(e) => setEditTaskRecurrenceStartDate(e.target.value)}
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#858176] mb-1">Đến ngày (tuỳ chọn)</label>
                <input
                  type="date"
                  value={editTaskRecurrenceEndDate}
                  onChange={(e) => setEditTaskRecurrenceEndDate(e.target.value)}
                  placeholder="Không giới hạn"
                  className="w-full p-2 text-xs bg-transparent border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF]"
                />
              </div>
            </div>
          )}

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
              {selectedTask && selectedTask.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    toggleTaskStatus.mutate({ id: selectedTask.id, currentStatus: selectedTask.status });
                    setSelectedTask(null);
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-medium rounded-[4px] bg-[#2E7D32]/10 hover:bg-[#2E7D32]/20 text-[#2E7D32] dark:bg-[#4CAF50]/15 dark:hover:bg-[#4CAF50]/25 dark:text-[#81C784] border border-[#2E7D32]/30 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Check size={13} />
                  <span>Hoàn thành</span>
                </button>
              )}
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
