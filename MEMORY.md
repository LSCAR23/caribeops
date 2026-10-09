# Project Memory

## Last files modified

- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` — D2-02 categories table migration; required name and slug, unique slug, Laravel timestamps.

## Last task implemented

Completed D2-02 by adding and applying the categories migration to the configured local PostgreSQL database. Only the categories migration ran; the three Laravel starter migrations remain pending. No model, seeder, endpoint, or test was added.

## What the system does now

CaribeOps is a learning and portfolio monorepo for a tourism operations and analytics platform. Its planned stack is Next.js for the dashboard, Laravel for the core API, Go for read-heavy analytics, PostgreSQL for persistence, and Docker Compose for local development.

The repository contains the Day 1 service foundation: Compose definitions for PostgreSQL, Laravel, Next.js, and Go; Laravel and Go health endpoints; the initial Next.js app page; environment examples; and developer commands. The Go health endpoint has a unit test. The roadmap is in `docs/README.md` and `docs/day-1-foundation.md` through `docs/day-7-portfolio-interview.md`. D2-01 documents the proposed business schema; D2-02 now creates the categories table with required name and slug and a unique slug. The local PostgreSQL database has the categories migration recorded, but its three Laravel starter migrations are still pending. The business table and its category foreign key have not been implemented.

Verification for D2-02: `vendor/bin/pint --dirty --format agent` passed; PHP lint passed for the migration; the path-scoped `php artisan migrate --database=pgsql --path=database/migrations/2026_10_09_212027_create_categories_table.php --no-interaction` succeeded. `db:table` confirmed the bigint primary key, `varchar(255)` name and slug, unique slug index, nullable Laravel timestamps, and no foreign keys. `migrate:status` showed only the categories migration ran, with the three starter migrations pending. `git diff --check` passed for tracked edits; as the migration was untracked, it was reviewed directly and linted. Next, D2-03 should create businesses and reference `categories.id`, selecting the deletion policy deliberately and considering the documented business schema constraints.

Use the slash skills in order: `/analize "task name"` → `/plan "task name"` → `/check "docs/plans/plan-file.md"` → `/implement "docs/plans/plan-file.md"`. Plans live in `docs/plans/`. Review the checked plan before invoking `/implement`; that invocation is the approval to proceed. Every completed implementation must update this file's three sections with the actual changed files, task outcome, current project behavior/status, and exact verification results.
