export type NoteType = 'knowledge' | 'idea' | 'reference' | 'principle';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRecurrence = 'daily' | 'weekly' | 'monthly';
export type ProjectStatus = 'active' | 'paused' | 'completed';
export type ReflectionType = 'journal' | 'weekly_review' | 'circle_of_control';
export type AttachmentParentType = 'inbox' | 'note' | 'task';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  area_id: string | null;
  name: string;
  description: string | null;
  goal: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  area?: Area | null;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  area_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  recurrence?: TaskRecurrence | null;
  due_date: string | null;
  scheduled_date: string | null;
  is_today_priority: boolean;
  completed_at: string | null;
  archived_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  project?: Project | null;
  area?: Area | null;
}

export interface Note {
  id: string;
  user_id: string;
  project_id: string | null;
  area_id: string | null;
  title: string;
  content: string;
  note_type: NoteType;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  project?: Project | null;
  area?: Area | null;
}

export interface NoteLink {
  id: string;
  user_id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
  source_note?: Note;
  target_note?: Note;
}

export interface InboxItem {
  id: string;
  user_id: string;
  content: string;
  source_url: string | null;
  is_processed: boolean;
  converted_to_type: 'task' | 'note' | null;
  converted_to_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface ReflectionCircleOfControl {
  problem: string;
  control: string[];
  influence: string[];
  accept: string[];
}

export interface ReflectionWeeklyReview {
  spentTime: string;
  drainedEnergy: string;
  nextWeekFocus: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  reflection_type: ReflectionType;
  title: string | null;
  content: {
    text?: string;
    weeklyReview?: ReflectionWeeklyReview;
    circleOfControl?: ReflectionCircleOfControl;
  };
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export type EventRecurrence = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  recurrence?: EventRecurrence | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  user_id: string;
  parent_type: AttachmentParentType;
  parent_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  download_url?: string;
}
