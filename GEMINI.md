# Antigravity Rules for INABA // SECOND BRAIN

## 1. Graphify-First Codebase Exploration & Token Conservation (MANDATORY)
- **Always consult `graphify-out/` before researching, modifying, or refactoring the codebase.**
- **Zero-token-waste principle:** Do NOT perform expansive file reads, broad folder scans, or load unnecessary source lines into the context window.
- **Workflow:**
  1. Check `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`, or run `/Users/admin/.graphify_venv/bin/python3.12 -m graphify.cli query "<question>"` to locate the exact node, dependency chain, and file path.
  2. Target the exact line ranges using `read_file` with explicit `StartLine` and `EndLine` constraints.
  3. Perform edits with `edit_file`.
  4. After significant architectural changes, run incremental Graphify to keep the knowledge graph synchronized.

## 2. Core Philosophy & Architectural Boundary
- **Philosophy:** *"Less to manage. More to live."* (Stoicism, Minimalism, Second Brain).
- **Strictly Out of Scope:** NO habit tracking, NO gamification (XP, streaks, badges), NO vanity productivity scores, NO AI chatbot bloat, NO social features.
- **Calm Editorial Aesthetic:** High-end typography, generous whitespace, warm parchment (`#F5F3ED`), crisp surface (`#FFFFFF`), sumi ink (`#242424`), and antique brass (`#9B8963`).
- **Data Integrity & Security:** PostgreSQL with Row Level Security (RLS) on all tables (`auth.uid() = user_id`). Private storage in `inaba-attachments`.
