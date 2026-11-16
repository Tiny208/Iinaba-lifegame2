# Graph Report - LifeGame2  (2026-11-16)

## Corpus Check
- 57 files · ~32,527 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 9, .example 1, .toml 1)

## Summary
- 398 nodes · 1023 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1766772`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Database Schema & RLS
- State Management & UI Components
- Editorial Minimalist Reusable UI
- Navigation & Page Routing
- Node Platform & Build Tools
- package.json
- TypeScript Configuration
- steps
- Background Tasks & Scripts
- ReflectPage
- manifest.json
- Antigravity Rules for INABA // SECOND BRAIN
- Vite Node TypeScript Config
- Core Architecture & System Spec
- Vite Environment Types
- Focus Module
- Inbox & Quick Capture
- Library & Knowledge Graphs
- Reflect & Stoic Practice
- Global Search Omnibar

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 44 edges
2. `react` - 27 edges
3. `Button` - 26 edges
4. `cn()` - 17 edges
5. `lucide-react` - 17 edges
6. `compilerOptions` - 17 edges
7. `EmptyState()` - 16 edges
8. `CardSkeleton()` - 16 edges
9. `Modal()` - 15 edges
10. `HomePage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Core Module: Home & Today Priorities` --embodies--> `Philosophy: Stoicism & Anti-Overhead Minimalism`  [INFERRED]
  src/pages/HomePage.tsx → INABA_RULES.md
- `INABA System Rules & Specifications` --architects--> `Supabase PostgreSQL Database Architecture & RLS`  [EXTRACTED]
  INABA_RULES.md → supabase/migrations/20261107000000_inaba_init.sql
- `StatusPill()` --calls--> `cn()`  [EXTRACTED]
  src/components/common/StatusPill.tsx → src/lib/utils.ts
- `App()` --calls--> `FocusPage()`  [EXTRACTED]
  src/App.tsx → src/pages/FocusPage.tsx
- `AppLayout()` --calls--> `isSupabaseConfigured()`  [EXTRACTED]
  src/components/layout/AppLayout.tsx → src/lib/supabase.ts

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "Database Schema & RLS"
Cohesion: 0.07
Nodes (50): idx_areas_sort, idx_areas_user, idx_attachments_parent, idx_attachments_user, idx_calendar_range, idx_calendar_user, idx_inbox_processed, idx_inbox_user (+42 more)

### Community 1 - "State Management & UI Components"
Cohesion: 0.11
Nodes (32): @supabase/supabase-js, @tanstack/react-query, StatusPillProps, AuthContext, AuthContextType, AuthProvider(), CalendarItem, clearCustomSupabaseConfig() (+24 more)

### Community 2 - "Editorial Minimalist Reusable UI"
Cohesion: 0.13
Nodes (52): date-fns, lucide-react, Button, ButtonProps, ConfirmDialog(), ConfirmDialogProps, EmptyState(), EmptyStateProps (+44 more)

### Community 3 - "Navigation & Page Routing"
Cohesion: 0.13
Nodes (24): react, react-router-dom, App(), GlobalSearchModal(), GlobalSearchModalProps, AppLayout(), Header(), HeaderProps (+16 more)

### Community 4 - "Node Platform & Build Tools"
Cohesion: 0.09
Nodes (20): vite@^6.0.3, vite, configFile, __dirname, ensureWatcherRunning(), __filename, log(), nosleepScript (+12 more)

### Community 5 - "package.json"
Cohesion: 0.05
Nodes (50): dependencies, clsx@^2.1.1, date-fns@^4.1.0, lucide-react@^0.468.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.28.0, @supabase/supabase-js@^2.47.10 (+42 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+11 more)

### Community 7 - "steps"
Cohesion: 0.06
Nodes (31): concurrency, cancel-in-progress, group, environment, runs-on, steps, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL (+23 more)

### Community 8 - "Background Tasks & Scripts"
Cohesion: 0.31
Nodes (17): disable_auto_sleep(), enable_auto_sleep(), finish_task(), get_config_value(), is_caffeinate_running(), notify(), play_alert_sound(), put_mac_to_sleep() (+9 more)

### Community 9 - "ReflectPage"
Cohesion: 0.60
Nodes (5): useReflections(), CircleOfControlView(), DailyJournalView(), ReflectPage(), WeeklyReviewView()

### Community 10 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 11 - "Antigravity Rules for INABA // SECOND BRAIN"
Cohesion: 0.40
Nodes (4): 1. Graphify-First Codebase Exploration & Token Conservation (MANDATORY), 2. Core Philosophy & Architectural Boundary, 3. Working Protocol & Local Verification (MANDATORY), Antigravity Rules for INABA // SECOND BRAIN

### Community 12 - "Vite Node TypeScript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 13 - "Core Architecture & System Spec"
Cohesion: 0.40
Nodes (5): Core Module: Home & Today Priorities, Supabase PostgreSQL Database Architecture & RLS, Editorial Minimalism Design System, INABA System Rules & Specifications, Philosophy: Stoicism & Anti-Overhead Minimalism

## Knowledge Gaps
- **8 isolated node(s):** `Core Module: Home & Today Priorities`, `Supabase PostgreSQL Database Architecture & RLS`, `Editorial Minimalism Design System`, `Core Module: Focus (Tasks, Projects, Areas, Calendar)`, `Core Module: Inbox & Universal Quick Capture` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Navigation & Page Routing` to `State Management & UI Components`, `Editorial Minimalist Reusable UI`, `package.json`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `Core Module: Home & Today Priorities`, `Supabase PostgreSQL Database Architecture & RLS`, `Editorial Minimalism Design System` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database Schema & RLS` be split into smaller, more focused modules?**
  _Cohesion score 0.07330827067669173 - nodes in this community are weakly interconnected._
- **Why does `vite` connect `Node Platform & Build Tools` to `package.json`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `State Management & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.10993657505285412 - nodes in this community are weakly interconnected._
- **Why does `@vitejs/plugin-react` connect `package.json` to `Node Platform & Build Tools`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `Editorial Minimalist Reusable UI` be split into smaller, more focused modules?**
  _Cohesion score 0.12596153846153846 - nodes in this community are weakly interconnected._