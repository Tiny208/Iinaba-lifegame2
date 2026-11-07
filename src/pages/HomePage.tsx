import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Inbox,
  Folder,
  BookOpen,
  Plus,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useNotes } from '@/hooks/useNotes';
import { useInbox } from '@/hooks/useInbox';
import { useCalendar } from '@/hooks/useCalendar';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { Task } from '@/types/database';

export const HomePage: React.FC = () => {
  const { profile } = useAuth();
  const { tasks, isLoading: tasksLoading, toggleTaskStatus, createTask } = useTasks();
  const { projects, isLoading: projectsLoading } = useProjects('active');
  const { notes, isLoading: notesLoading } = useNotes();
  const { unprocessedCount } = useInbox();
  const { unifiedItems } = useCalendar();

  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [isAddingPriority, setIsAddingPriority] = useState(false);

  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  const greeting = getGreeting(profile?.full_name);

  // A. Today Priorities: max 3 tasks with is_today_priority = true
  const todayPriorities = tasks
    .filter((t) => t.is_today_priority && !t.is_archived)
    .slice(0, 3);

  // B. Overdue incomplete tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed' || !t.due_date || t.is_archived) return false;
    const dueDate = parseISO(t.due_date);
    return isPast(dueDate) && !isToday(dueDate);
  });

  // C. Upcoming items (next scheduled tasks or events)
  const upcomingItems = unifiedItems
    .filter((item) => {
      if (!item.date) return false;
      return item.date >= format(new Date(), 'yyyy-MM-dd');
    })
    .slice(0, 4);

  // D. Recent notes (top 4)
  const recentNotes = notes.slice(0, 4);

  const handleQuickAddPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityTitle.trim()) return;

    await createTask.mutateAsync({
      title: newPriorityTitle.trim(),
      is_today_priority: true,
      status: 'todo',
      priority: 'high',
      scheduled_date: format(new Date(), 'yyyy-MM-dd'),
    });

    setNewPriorityTitle('');
    setIsAddingPriority(false);
  };

  return (
    <div className="space-y-10">
      {/* Editorial Header */}
      <section className="space-y-1.5 pb-2 border-b border-[#E5E1D8] dark:border-[#2E2C28]">
        <div className="text-xs uppercase tracking-widest text-[#858176] dark:text-[#8C877D] font-mono">
          {todayStr}
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#242424] dark:text-[#EAE7DF]">
          {greeting}
        </h2>
        <p className="text-sm text-[#858176] dark:text-[#8C877D] font-serif italic">
          Focus on what is within your control. Release the rest.
        </p>
      </section>

      {/* Inbox Preview Pill (If items pending) */}
      {unprocessedCount > 0 && (
        <div className="p-3.5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#9B8963]/10 text-[#9B8963]">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-[#242424] dark:text-[#EAE7DF]">
                {unprocessedCount} unprocessed {unprocessedCount === 1 ? 'item' : 'items'} in your Inbox
              </div>
              <div className="text-xs text-[#858176] dark:text-[#8C877D]">
                Capture fast, organize deliberately.
              </div>
            </div>
          </div>
          <Link to="/inbox">
            <Button variant="outline" size="sm">
              Review Inbox
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Grid: Today Priorities & Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Priorities & Overdue */}
        <div className="md:col-span-2 space-y-8">
          {/* Today Priorities Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
                  Today&rsquo;s Priorities
                </h3>
                <p className="text-xs text-[#858176] dark:text-[#8C877D]">
                  Maximum three essential commitments.
                </p>
              </div>
              {todayPriorities.length < 3 && !isAddingPriority && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingPriority(true)}
                  className="text-xs text-[#9B8963]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Priority
                </Button>
              )}
            </div>

            {/* Priority Add Form */}
            {isAddingPriority && (
              <form onSubmit={handleQuickAddPriority} className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="What is your key priority for today?"
                  value={newPriorityTitle}
                  onChange={(e) => setNewPriorityTitle(e.target.value)}
                  className="flex-1 text-sm p-2 bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] rounded-[4px] text-[#242424] dark:text-[#EAE7DF] focus:outline-none focus:border-[#9B8963]"
                />
                <Button type="submit" size="sm" variant="primary">
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingPriority(false)}
                >
                  Cancel
                </Button>
              </form>
            )}

            {tasksLoading ? (
              <CardSkeleton rows={3} />
            ) : todayPriorities.length === 0 ? (
              <EmptyState
                title="No priorities set for today"
                description="Choose up to 3 high-impact tasks to direct your energy."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingPriority(true)}
                  >
                    Select Today Priorities
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {todayPriorities.map((task) => (
                  <TaskItemRow
                    key={task.id}
                    task={task}
                    onToggle={() =>
                      toggleTaskStatus.mutate({
                        id: task.id,
                        currentStatus: task.status,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Overdue Alert Section */}
          {overdueTasks.length > 0 && (
            <section className="space-y-2 p-4 rounded-[4px] bg-red-50/50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-xs font-medium">
                <AlertTriangle className="w-4 h-4" />
                <span>Overdue Incomplete Tasks ({overdueTasks.length})</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between text-xs text-[#242424] dark:text-[#EAE7DF]"
                  >
                    <span className="truncate max-w-[280px]">{task.title}</span>
                    <span className="text-red-600 dark:text-red-400 font-mono">
                      Due {formatRelativeDate(task.due_date)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Projects Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
                Active Projects
              </h3>
              <Link
                to="/focus?tab=projects"
                className="text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF] transition-colors"
              >
                View all projects →
              </Link>
            </div>

            {projectsLoading ? (
              <CardSkeleton rows={2} />
            ) : projects.length === 0 ? (
              <EmptyState
                title="No active projects"
                description="Anchor your tasks within structured goals."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/focus?tab=projects&projectId=${p.id}`}
                    className="p-3.5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] hover:border-[#9B8963] transition-colors shadow-subtle block"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-sm text-[#242424] dark:text-[#EAE7DF] truncate">
                        {p.name}
                      </div>
                      <Folder className="w-4 h-4 text-[#9B8963] flex-shrink-0 ml-2" />
                    </div>
                    {p.goal && (
                      <p className="text-xs text-[#858176] dark:text-[#8C877D] line-clamp-1 mt-1">
                        {p.goal}
                      </p>
                    )}
                    {p.area && (
                      <div className="mt-2 text-[10px] text-[#858176] tracking-wide uppercase font-mono">
                        {p.area.name}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (1 col): Upcoming & Recent Notes */}
        <div className="space-y-8">
          {/* Upcoming Events & Tasks */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
                Upcoming
              </h3>
              <Link
                to="/focus?tab=calendar"
                className="text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]"
              >
                Calendar →
              </Link>
            </div>

            {upcomingItems.length === 0 ? (
              <div className="p-4 rounded-[4px] bg-[#FFFFFF]/60 dark:bg-[#21201D]/60 border border-[#E5E1D8] dark:border-[#2E2C28] text-center text-xs text-[#858176]">
                Nothing scheduled for the coming days.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] text-xs shadow-subtle"
                  >
                    <div className="flex items-center justify-between text-[#858176] mb-1 font-mono text-[10px]">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3 text-[#9B8963]" />
                        {formatRelativeDate(item.date)}
                      </span>
                      {item.time && <span>{item.time}</span>}
                    </div>
                    <div className="font-medium text-[#242424] dark:text-[#EAE7DF] truncate">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Notes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-medium text-[#242424] dark:text-[#EAE7DF]">
                Recent Notes
              </h3>
              <Link
                to="/library"
                className="text-xs text-[#858176] hover:text-[#242424] dark:hover:text-[#EAE7DF]"
              >
                Library →
              </Link>
            </div>

            {notesLoading ? (
              <CardSkeleton rows={2} />
            ) : recentNotes.length === 0 ? (
              <div className="p-4 rounded-[4px] bg-[#FFFFFF]/60 dark:bg-[#21201D]/60 border border-[#E5E1D8] dark:border-[#2E2C28] text-center text-xs text-[#858176]">
                No notes created yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/library?noteId=${note.id}`}
                    className="p-3 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] hover:border-[#9B8963] transition-colors block shadow-subtle"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-xs text-[#242424] dark:text-[#EAE7DF] truncate">
                        {note.title}
                      </span>
                      <BookOpen className="w-3.5 h-3.5 text-[#858176] flex-shrink-0 ml-2" />
                    </div>
                    <div className="text-[10px] text-[#858176] mt-1 font-mono uppercase">
                      {note.note_type} • {formatDate(note.updated_at, 'MMM d')}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

const TaskItemRow: React.FC<{ task: Task; onToggle: () => void }> = ({ task, onToggle }) => {
  const isCompleted = task.status === 'completed';

  return (
    <div className="flex items-center justify-between p-3 rounded-[4px] bg-[#FFFFFF] dark:bg-[#21201D] border border-[#E5E1D8] dark:border-[#2E2C28] shadow-subtle">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggle}
          className="text-[#858176] hover:text-[#9B8963] transition-colors flex-shrink-0"
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-[#7B8D7A]" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
        <span
          className={`text-sm truncate ${
            isCompleted
              ? 'line-through text-[#858176] dark:text-[#8C877D]'
              : 'text-[#242424] dark:text-[#EAE7DF] font-medium'
          }`}
        >
          {task.title}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {task.project && (
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider text-[#858176] bg-[#F5F3ED] dark:bg-[#2A2824] px-1.5 py-0.5 rounded">
            {task.project.name}
          </span>
        )}
        {task.due_date && (
          <span className="text-[10px] text-[#858176] font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
};

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const userName = name ? `, ${name}` : '';
  if (hour < 12) return `Good morning${userName}.`;
  if (hour < 18) return `Good afternoon${userName}.`;
  return `Good evening${userName}.`;
}
