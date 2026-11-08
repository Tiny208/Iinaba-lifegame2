# INABA // SECOND BRAIN — PROJECT RULES & SYSTEM SPECIFICATION

> **"Less to manage. More to live."**
> A personal operating system for managing work, knowledge, responsibilities, and everyday life.
> Grounded in Stoicism (focus on what is within your control), Minimalism (remove unnecessary complexity), and the Second Brain methodology (capture, organize, connect, retrieve).

---

## 1. CORE PHILOSOPHY & NON-NEGOTIABLE PRINCIPLES

1. **Anti-Overhead**: The user must never feel that managing the application has become another job.
2. **Strictly Out of Scope**:
   - NO Habit tracking.
   - NO Mood, food, or workout tracking.
   - NO XP, leveling, streaks, badges, or gamification.
   - NO Productivity scores or vanity analytics dashboards.
   - NO AI chatbots or unnecessary generative bloat.
   - NO Social features, public profiles, or multi-tenant team collaboration.
   - NO Bloated automation matrices (keep recurring tasks minimal: clean daily/weekly/monthly auto-rollover on completion).
3. **Calm Editorial Aesthetic**:
   - Editorial minimalism inspired by quiet Japanese workspaces and high-end print typography.
   - Avoid generic SaaS cards, neon accents, excessive icons, gradients, and decorative animations.
   - Light mode by default; dark and system theme support.

---

## 2. DESIGN SYSTEM TOKENS

### Color Palette
- **Background**: `#F5F3ED` (Warm parchment canvas)
- **Surface**: `#FFFFFF` (Crisp paper cards/panels)
- **Primary Text**: `#242424` (Sumi ink)
- **Secondary Text**: `#858176` (Muted warm graphite)
- **Accent**: `#9B8963` (Refined antique brass / flax)
- **Border**: `#E5E1D8` (Subtle divider rules)
- **Dark Mode equivalents**:
  - Background: `#171614`
  - Surface: `#21201D`
  - Primary Text: `#EAE7DF`
  - Secondary Text: `#8C877D`
  - Accent: `#B3A27D`
  - Border: `#2E2C28`

### Typography
- **Headings**: Serif font (`Newsreader`, `Playfair Display`, `Cormorant Garamond`, or editorial serif system fallbacks `Georgia, Cambria, Times New Roman, serif`).
- **Body & Controls**: Sans-serif (`Inter`, `DM Sans`, system `-apple-system, BlinkMacSystemFont, sans-serif`).
- High typographic contrast, generous whitespace, restrained line heights, optical margin alignment.

---

## 3. APPLICATION STRUCTURE & FIVE NAVIGATION DESTINATIONS

Navigation is strictly limited to 5 primary modules:
1. **Home** (`/`):
   - Current date & personalized minimal greeting.
   - Top 3 manual priorities for today.
   - Upcoming tasks, events, and overdue alerts.
   - Active projects quick view.
   - Recent notes.
   - Unprocessed inbox items preview badge & shortcut.
2. **Inbox** (`/inbox`):
   - Quick capture modal/drawer accessible everywhere via keyboard shortcut (`Cmd/Ctrl+Shift+C` or `Q`).
   - Supports plain text, URLs, images, and multi-file attachments (Supabase Storage).
   - Fast immediate capture without requiring initial categorization.
   - Inbox item conversion: Convert into Task or Convert into Note while preserving original Inbox item.
   - Mark as processed, archive, or soft delete with recovery.
3. **Focus** (`/focus`):
   - **Today**: Top 3 priorities and tasks scheduled for today.
   - **Calendar**: Month, Week, and List views. Interactive view & edit modal for independent events and scheduled tasks. Integrates task dates without data duplication.
   - **Tasks**: Title, description, status (Todo/In Progress/Completed), priority (Low/Medium/High), recurrence (None/Daily/Weekly/Monthly with auto-rollover), due date, scheduled date, linked project, linked area, today priority flag.
   - **Projects**: Name, description, goal, linked area, status (Active/Paused/Completed), start date, target date; view associated tasks and notes.
   - **Areas**: Ongoing life domains (e.g., Work, Personal, Health, Learning, Finance, Relationships). Editable, reorderable.
4. **Library** (`/library`):
   - Personal knowledge repository with 4 note types: `Knowledge`, `Idea`, `Reference`, `Principle`.
   - Rich Markdown / TipTap editor with auto-save and status indicator (Saving / Saved / Error).
   - Bi-directional note links (`note_links` join table) with backlinks view.
   - Tags, related Area, related Project, file attachments.
5. **Reflect** (`/reflect`):
   - **Daily Journal**: Free-form writing, auto-saved, no forced daily pressure or streaks.
   - **Weekly Review**: 3 Stoic reflection prompts:
     1. *What did I spend my time on this week?*
     2. *What consumed my energy without providing meaningful value?*
     3. *What do I want to focus on next week?*
   - **Principles**: Personal guiding compass (linked to Note type: Principle).
   - **Circle of Control**: Interactive Stoic matrix (Control, Influence, Accept).

### Global Services
- **Global Search**: `Cmd/Ctrl + K` palette across Tasks, Projects, Areas, Notes, Inbox, Reflections, Events.
- **Account & Settings**: Profile configuration, Supabase connection status, theme toggling, data export/backup.

---

## 4. DATABASE SCHEMA SPECIFICATION (PostgreSQL / Supabase)

All user-owned tables MUST have `user_id uuid references auth.users(id)` and Row Level Security (RLS) enabled.

1. `profiles`: `id (uuid pk -> auth.users)`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
2. `areas`: `id (uuid pk)`, `user_id`, `name`, `description`, `color`, `sort_order`, `is_archived`, timestamps.
3. `projects`: `id (uuid pk)`, `user_id`, `area_id (fk)`, `name`, `description`, `goal`, `status ('active'|'paused'|'completed')`, `start_date`, `target_date`, `is_archived`, timestamps.
4. `tasks`: `id (uuid pk)`, `user_id`, `project_id (fk)`, `area_id (fk)`, `title`, `description`, `status ('todo'|'in_progress'|'completed')`, `priority ('low'|'medium'|'high')`, `recurrence ('daily'|'weekly'|'monthly'|null)`, `due_date`, `scheduled_date`, `is_today_priority (bool)`, `completed_at`, `archived_at`, `is_archived (bool)`, timestamps.
5. `notes`: `id (uuid pk)`, `user_id`, `project_id (fk)`, `area_id (fk)`, `title`, `content (text/markdown)`, `note_type ('knowledge'|'idea'|'reference'|'principle')`, `tags (text[])`, `is_archived`, timestamps.
6. `inbox_items`: `id (uuid pk)`, `user_id`, `content`, `source_url`, `is_processed`, `converted_to_type ('task'|'note'|null)`, `converted_to_id (uuid|null)`, `is_archived`, timestamps.
7. `reflections`: `id (uuid pk)`, `user_id`, `reflection_type ('journal'|'weekly_review'|'circle_of_control')`, `title`, `content (jsonb/text)`, `entry_date`, timestamps.
8. `calendar_events`: `id (uuid pk)`, `user_id`, `title`, `description`, `start_time (timestamptz)`, `end_time (timestamptz)`, `is_all_day (bool)`, `location`, timestamps.
9. `note_links`: `id (uuid pk)`, `user_id`, `source_note_id (fk)`, `target_note_id (fk)`, `created_at`, with unique constraint on `(source_note_id, target_note_id)` and check `source_note_id != target_note_id`.
10. `attachments`: `id (uuid pk)`, `user_id`, `parent_type ('inbox'|'note'|'task')`, `parent_id (uuid)`, `file_name`, `file_size`, `mime_type`, `storage_path`, timestamps.

---

## 5. SECURITY & STORAGE RULES

1. RLS enabled on all tables: users can only SELECT, INSERT, UPDATE, DELETE their own rows (`auth.uid() = user_id`).
2. Private Supabase Storage bucket `inaba-attachments`.
3. Storage policies: user can only access and upload files into their own folder `${auth.uid()}/*`.
4. Signed URLs for downloads/previews; no public file leaking.
5. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.

---

## 6. UX & RELIABILITY RULES

- Fast capture: Never block quick notes on category selection.
- Resilient uploads: If an attachment upload fails, preserve the text content.
- Optimistic UI with rollback on error.
- Safe deletions: Confirm destructive actions; archive over hard delete where appropriate.
- Auto-save for notes and journal entries with visual feedback (`Saved` / `Saving...` / `Error`).
- Full keyboard accessibility: `Cmd+K` for global search, `Q` for quick capture, `Esc` to dismiss modals.
