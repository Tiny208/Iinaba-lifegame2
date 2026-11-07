-- ==============================================================================
-- INABA // SECOND BRAIN — MASTER DATABASE SCHEMA & RLS MIGRATION
-- Version: 1.0.0
-- "Less to manage. More to live."
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- 2. HELPER FUNCTIONS: Updated At
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto create profile on auth.users sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. AREAS TABLE (Ongoing Life Responsibilities)
create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text default '#9B8963',
  sort_order integer default 0 not null,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_areas_user on public.areas(user_id);
create index if not exists idx_areas_sort on public.areas(user_id, sort_order);

alter table public.areas enable row level security;

create policy "Users can manage own areas"
  on public.areas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_areas_updated_at
  before update on public.areas
  for each row execute function public.set_updated_at();

-- 5. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  area_id uuid references public.areas(id) on delete set null,
  name text not null,
  description text,
  goal text,
  status text not null check (status in ('active', 'paused', 'completed')) default 'active',
  start_date date,
  target_date date,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_projects_user on public.projects(user_id);
create index if not exists idx_projects_area on public.projects(area_id);
create index if not exists idx_projects_status on public.projects(user_id, status);

alter table public.projects enable row level security;

create policy "Users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 6. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in_progress', 'completed')) default 'todo',
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date timestamptz,
  scheduled_date date,
  is_today_priority boolean default false not null,
  completed_at timestamptz,
  archived_at timestamptz,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(user_id, status);
create index if not exists idx_tasks_today on public.tasks(user_id, is_today_priority) where is_today_priority = true;
create index if not exists idx_tasks_scheduled on public.tasks(user_id, scheduled_date);
create index if not exists idx_tasks_due on public.tasks(user_id, due_date);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_area on public.tasks(area_id);

alter table public.tasks enable row level security;

create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- 7. NOTES TABLE
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  area_id uuid references public.areas(id) on delete set null,
  title text not null,
  content text default '' not null,
  note_type text not null check (note_type in ('knowledge', 'idea', 'reference', 'principle')) default 'knowledge',
  tags text[] default '{}'::text[] not null,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_notes_type on public.notes(user_id, note_type);
create index if not exists idx_notes_project on public.notes(project_id);
create index if not exists idx_notes_area on public.notes(area_id);
create index if not exists idx_notes_tags on public.notes using gin (tags);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- 8. NOTE LINKS TABLE (Many-to-Many Bi-directional Links)
create table if not exists public.note_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source_note_id uuid references public.notes(id) on delete cascade not null,
  target_note_id uuid references public.notes(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  constraint uq_note_link unique (source_note_id, target_note_id),
  constraint chk_no_self_link check (source_note_id <> target_note_id)
);

create index if not exists idx_note_links_user on public.note_links(user_id);
create index if not exists idx_note_links_source on public.note_links(source_note_id);
create index if not exists idx_note_links_target on public.note_links(target_note_id);

alter table public.note_links enable row level security;

create policy "Users can manage own note links"
  on public.note_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. INBOX ITEMS TABLE
create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  source_url text,
  is_processed boolean default false not null,
  converted_to_type text check (converted_to_type in ('task', 'note') or converted_to_type is null),
  converted_to_id uuid,
  is_archived boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_inbox_user on public.inbox_items(user_id);
create index if not exists idx_inbox_processed on public.inbox_items(user_id, is_processed);

alter table public.inbox_items enable row level security;

create policy "Users can manage own inbox items"
  on public.inbox_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_inbox_updated_at
  before update on public.inbox_items
  for each row execute function public.set_updated_at();

-- 10. REFLECTIONS TABLE (Journal, Weekly Review, Circle of Control)
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  reflection_type text not null check (reflection_type in ('journal', 'weekly_review', 'circle_of_control')) default 'journal',
  title text,
  content jsonb default '{}'::jsonb not null,
  entry_date date default current_date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_reflections_user on public.reflections(user_id);
create index if not exists idx_reflections_type_date on public.reflections(user_id, reflection_type, entry_date);

alter table public.reflections enable row level security;

create policy "Users can manage own reflections"
  on public.reflections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_reflections_updated_at
  before update on public.reflections
  for each row execute function public.set_updated_at();

-- 11. CALENDAR EVENTS TABLE (Independent Events)
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_all_day boolean default false not null,
  location text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_calendar_user on public.calendar_events(user_id);
create index if not exists idx_calendar_range on public.calendar_events(user_id, start_time, end_time);

alter table public.calendar_events enable row level security;

create policy "Users can manage own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger update_calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- 12. ATTACHMENTS TABLE
create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  parent_type text not null check (parent_type in ('inbox', 'note', 'task')),
  parent_id uuid not null,
  file_name text not null,
  file_size bigint default 0 not null,
  mime_type text default 'application/octet-stream' not null,
  storage_path text not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_attachments_user on public.attachments(user_id);
create index if not exists idx_attachments_parent on public.attachments(parent_type, parent_id);

alter table public.attachments enable row level security;

create policy "Users can manage own attachments"
  on public.attachments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 13. STORAGE BUCKET CONFIGURATION (Private bucket: inaba-attachments)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inaba-attachments', 'inaba-attachments', false, 52428800, null)
on conflict (id) do update set public = false;

-- Storage RLS Policies: scoped to auth.uid() folder
create policy "Users can view own attachments"
  on storage.objects for select
  using (bucket_id = 'inaba-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload own attachments"
  on storage.objects for insert
  with check (bucket_id = 'inaba-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own attachments"
  on storage.objects for update
  using (bucket_id = 'inaba-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own attachments"
  on storage.objects for delete
  using (bucket_id = 'inaba-attachments' and (storage.foldername(name))[1] = auth.uid()::text);

-- 14. INITIAL SEED AREAS (Helper function for new users)
create or replace function public.seed_initial_areas(p_user_id uuid)
returns void as $$
begin
  insert into public.areas (user_id, name, description, color, sort_order)
  values
    (p_user_id, 'Work', 'Professional projects & career focus', '#7B8D7A', 1),
    (p_user_id, 'Personal', 'Everyday life & personal responsibilities', '#9B8963', 2),
    (p_user_id, 'Health', 'Physical wellness & recovery', '#8F9B63', 3),
    (p_user_id, 'Learning', 'Knowledge, reading & study', '#63809B', 4),
    (p_user_id, 'Finance', 'Budgeting & financial investments', '#9B6382', 5)
  on conflict do nothing;
end;
$$ language plpgsql security definer;
