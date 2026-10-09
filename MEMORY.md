# Project Memory

## Last files modified

- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — D2-04 amenities table migration; required name, unique slug, and Laravel timestamps.
- `docs/plans/d2-04-amenities-migration.md` — checked D2-04 plan updated with implementation outcome and verification.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — D2-03 businesses table migration; documented fields, required timestamps, cascading category foreign key, and PostgreSQL coordinate checks.
- `docs/plans/d2-03-businesses-migration.md` — checked D2-03 plan updated with implementation outcome and verification.

## Last task implemented

Completed D2-04 by adding and applying the amenities migration to the configured PostgreSQL database. The `amenities` table has a generated primary key, required `name`, required unique `slug`, and nullable Laravel-managed timestamps. Only this migration was applied; no model, seeder, endpoint, or permanent test was added.

## What the system does now

CaribeOps is a learning and portfolio monorepo for a tourism operations and analytics platform. Its planned stack is Next.js for the dashboard, Laravel for the core API, Go for read-heavy analytics, PostgreSQL for persistence, and Docker Compose for local development.

The repository contains the Day 1 service foundation: Compose definitions for PostgreSQL, Laravel, Next.js, and Go; Laravel and Go health endpoints; the initial Next.js app page; environment examples; and developer commands. The Go health endpoint has a unit test. The roadmap is in `docs/README.md` and `docs/day-1-foundation.md` through `docs/day-7-portfolio-interview.md`. D2-01 documents the proposed business schema. The categories migration creates required name and unique slug; the businesses migration creates the designed business schema, requires a valid category, cascades business deletion when a category is deleted, and enforces inclusive coordinate bounds; the amenities migration creates a reusable amenity reference table with unique slug. The local PostgreSQL database has categories, businesses, and amenities migrations recorded; its three Laravel starter migrations remain pending.

Verification for D2-03: `vendor/bin/pint --dirty --format agent` passed; `php -l database/migrations/2026_10_09_213759_create_businesses_table.php` reported no syntax errors; the path-scoped `php artisan migrate --database=pgsql --path=database/migrations/2026_10_09_213759_create_businesses_table.php --no-interaction` succeeded. `php artisan db:table businesses --database=pgsql --json` confirmed 12 columns with the documented types, only website nullable, and the category foreign key's cascade action. A temporary verification against PostgreSQL confirmed both coordinate constraints in the catalog, accepted the inclusive boundary pairs, rejected a missing category with SQLSTATE 23503, rejected all four just-outside coordinate values with SQLSTATE 23514, and confirmed cascade deletion. The test transaction was rolled back and the temporary verification script removed. Migration status afterward confirmed the categories and businesses migrations ran while the three Laravel starter migrations remain pending at that time. D2-04 has since added the amenities migration; D2-08 remains responsible for checking the complete clean migration chain.

Verification for D2-04: `php -l database\migrations\2026_10_09_220642_create_amenities_table.php` reported no syntax errors; `vendor\bin\pint --dirty --format agent` passed; path-scoped `php artisan migrate --database=pgsql --path=database\migrations\2026_10_09_220642_create_amenities_table.php --no-interaction` succeeded. `php artisan db:table amenities --database=pgsql --json` confirmed five columns, `amenities_pkey`, and unique `amenities_slug_unique`. Post-migration status showed categories, businesses, and amenities applied (amenities batch 3) while the three Laravel starter migrations remain pending. PHPUnit was not run because its configured database is SQLite in memory. D2-05 is the next business-amenities pivot task; D2-08 remains responsible for checking the complete clean migration chain.

Use the slash skills in order: `/analize "task name"` → `/plan "task name"` → `/check "docs/plans/plan-file.md"` → `/implement "docs/plans/plan-file.md"`. Plans live in `docs/plans/`. Review the checked plan before invoking `/implement`; that invocation is the approval to proceed. Every completed implementation must update this file's three sections with the actual changed files, task outcome, current project behavior/status, and exact verification results.
