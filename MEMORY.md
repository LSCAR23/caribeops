# Project Memory

## Last files modified

- `docs/business-entity-design.md` — proposed PostgreSQL business columns, types, requiredness, relationships, and constraints.
- `docs/day-2-laravel-postgresql.md` — D2-01 now links to the business design and summarizes category/type/optional website semantics.
- `docs/plans/d2-01-business-entity.md` — marked implemented and records the actual outcome and verification.

## Last task implemented

Completed D2-01 as a documentation-only task. Added the business entity design and linked it from the Day 2 roadmap. No application runtime code, migrations, or tests were changed.

## What the system does now

CaribeOps is a learning and portfolio monorepo for a tourism operations and analytics platform. Its planned stack is Next.js for the dashboard, Laravel for the core API, Go for read-heavy analytics, PostgreSQL for persistence, and Docker Compose for local development.

The repository currently contains the Day 1 service foundation: Compose definitions for PostgreSQL, Laravel, Next.js, and Go; Laravel and Go health endpoints; the initial Next.js app page; environment examples; and developer commands. The Go health endpoint has a unit test. The roadmap is in `docs/README.md` and `docs/day-1-foundation.md` through `docs/day-7-portfolio-interview.md`. D2-01 now documents a proposed business schema: category is the broad required grouping, type is the specific required kind, website is the only optional user-provided business attribute, and persisted rows have system-managed IDs and timestamps.

Verification for D2-01: `git diff --check` passed for tracked edits; the new design document was separately checked for its required columns, website-only nullable user field, and latitude/longitude bounds. Laravel tests and migrations were not run because this task changed documentation only. Next, D2-02/D2-03 must design and create the category and business migrations consistently with the documented foreign key, deletion policy, coordinate constraints, and timestamp nullability.

Use the slash skills in order: `/analize "task name"` → `/plan "task name"` → `/check "docs/plans/plan-file.md"` → `/implement "docs/plans/plan-file.md"`. Plans live in `docs/plans/`. Review the checked plan before invoking `/implement`; that invocation is the approval to proceed. Every completed implementation must update this file's three sections with the actual changed files, task outcome, current project behavior/status, and exact verification results.
