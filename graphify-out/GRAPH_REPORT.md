# Graph Report - LifeGame2  (2026-11-07)

## Corpus Check
- Corpus is ~27,521 words - fits in a single context window. You may not need a graph.

## Summary
- 341 nodes · 941 edges · 23 communities (15 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 1,200 input · 800 output

## Community Hubs (Navigation)
- Database Schema & RLS
- State Management & UI Components
- Editorial Minimalist Reusable UI
- Navigation & Page Routing
- Node Platform & Build Tools
- Build DevDependencies
- TypeScript Configuration
- Core Frontend Dependencies
- Background Tasks & Scripts
- Date & Reflection Tools
- React DOM Root Mounting
- NPM Build Scripts
- Vite Node TypeScript Config
- Core Architecture & System Spec
- Vite Bundler & React Plugin
- Vite Environment Types
- Focus Module
- Inbox & Quick Capture
- Library & Knowledge Graphs
- Reflect & Stoic Practice
- Global Search Omnibar

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 30 edges
2. `react` - 27 edges
3. `Button` - 26 edges
4. `lucide-react` - 17 edges
5. `cn()` - 17 edges
6. `compilerOptions` - 17 edges
7. `EmptyState()` - 16 edges
8. `CardSkeleton()` - 16 edges
9. `HomePage()` - 16 edges
10. `Modal()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Core Module: Home & Today Priorities` --embodies--> `Philosophy: Stoicism & Anti-Overhead Minimalism`  [INFERRED]
  src/pages/HomePage.tsx → INABA_RULES.md
- `INABA System Rules & Specifications` --architects--> `Supabase PostgreSQL Database Architecture & RLS`  [EXTRACTED]
  INABA_RULES.md → supabase/migrations/20261107000000_inaba_init.sql
- `App()` --calls--> `FocusPage()`  [EXTRACTED]
  src/App.tsx → src/pages/FocusPage.tsx
- `App()` --calls--> `HomePage()`  [EXTRACTED]
  src/App.tsx → src/pages/HomePage.tsx
- `App()` --calls--> `InboxPage()`  [EXTRACTED]
  src/App.tsx → src/pages/InboxPage.tsx

## Import Cycles
- None detected.

## Communities (23 total, 8 thin omitted)

### Community 0 - "Database Schema & RLS"
Cohesion: 0.08
Nodes (48): idx_areas_sort, idx_areas_user, idx_attachments_parent, idx_attachments_user, idx_calendar_range, idx_calendar_user, idx_inbox_processed, idx_inbox_user (+40 more)

### Community 1 - "State Management & UI Components"
Cohesion: 0.11
Nodes (39): @tanstack/react-query, StatusPillProps, AuthContext, AuthContextType, AuthProvider(), useAuth(), useTheme(), CalendarItem (+31 more)

### Community 2 - "Editorial Minimalist Reusable UI"
Cohesion: 0.20
Nodes (31): Button, ConfirmDialog(), ConfirmDialogProps, EmptyState(), EmptyStateProps, CardSkeleton(), Skeleton(), SkeletonProps (+23 more)

### Community 3 - "Navigation & Page Routing"
Cohesion: 0.16
Nodes (23): lucide-react, react, react-router-dom, App(), ButtonProps, GlobalSearchModal(), GlobalSearchModalProps, ModalProps (+15 more)

### Community 4 - "Node Platform & Build Tools"
Cohesion: 0.10
Nodes (18): configFile, __dirname, ensureWatcherRunning(), __filename, log(), nosleepScript, projectRoot, watcherScript (+10 more)

### Community 5 - "Build DevDependencies"
Cohesion: 0.14
Nodes (19): devDependencies, autoprefixer@^10.4.20, postcss@^8.4.49, tailwindcss@^3.4.16, @types/node@^22.10.1, @types/react@^18.3.12, @types/react-dom@^18.3.1, typescript@^5.6.3 (+11 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+11 more)

### Community 7 - "Core Frontend Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, clsx@^2.1.1, lucide-react@^0.468.0, react@^18.3.1, react-router-dom@^6.28.0, @supabase/supabase-js@^2.47.10, tailwind-merge@^2.5.5, @tanstack/react-query@^5.62.7 (+11 more)

### Community 8 - "Background Tasks & Scripts"
Cohesion: 0.31
Nodes (17): disable_auto_sleep(), enable_auto_sleep(), finish_task(), get_config_value(), is_caffeinate_running(), notify(), play_alert_sound(), put_mac_to_sleep() (+9 more)

### Community 9 - "Date & Reflection Tools"
Cohesion: 0.33
Nodes (9): date-fns@^4.1.0, date-fns, useReflections(), CircleOfControlView(), DailyJournalView(), ReflectPage(), ReflectTab, WeeklyReviewView() (+1 more)

### Community 10 - "React DOM Root Mounting"
Cohesion: 0.22
Nodes (7): react-dom@^18.3.1, react-dom, Theme, ThemeContext, ThemeContextType, ThemeProvider(), queryClient

### Community 11 - "NPM Build Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, nosleep:agents, nosleep:off, nosleep:on, nosleep:status, preview

### Community 12 - "Vite Node TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 13 - "Core Architecture & System Spec"
Cohesion: 0.40
Nodes (5): Core Module: Home & Today Priorities, Supabase PostgreSQL Database Architecture & RLS, Editorial Minimalism Design System, INABA System Rules & Specifications, Philosophy: Stoicism & Anti-Overhead Minimalism

### Community 14 - "Vite Bundler & React Plugin"
Cohesion: 0.40
Nodes (4): vite@^6.0.3, @vitejs/plugin-react@^4.3.4, vite, @vitejs/plugin-react

## Knowledge Gaps
- **8 isolated node(s):** `Editorial Minimalism Design System`, `Supabase PostgreSQL Database Architecture & RLS`, `Core Module: Home & Today Priorities`, `Core Module: Inbox & Universal Quick Capture`, `Core Module: Focus (Tasks, Projects, Areas, Calendar)` (+3 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 87 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Navigation & Page Routing` to `State Management & UI Components`, `Editorial Minimalist Reusable UI`, `Build DevDependencies`, `Core Frontend Dependencies`, `Date & Reflection Tools`, `React DOM Root Mounting`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `Editorial Minimalism Design System`, `Supabase PostgreSQL Database Architecture & RLS`, `Core Module: Home & Today Priorities` to the rest of the system?**
  _8 weakly-connected nodes found - possible missing edges._
- **Should `Database Schema & RLS` be split into smaller, more focused modules?**
  _Cohesion score 0.08200290275761973 - nodes in this community are weakly interconnected._
- **Why does `@vitejs/plugin-react` connect `Vite Bundler & React Plugin` to `Build DevDependencies`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `State Management & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.10740203193033382 - nodes in this community are weakly interconnected._
- **Why does `vite` connect `Vite Bundler & React Plugin` to `Build DevDependencies`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `Node Platform & Build Tools` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._