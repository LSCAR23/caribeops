# Plan — D2-04: Create Amenities Migration

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-04 — Create Amenities Migration

## Desired outcome

Create and apply one Laravel migration for the `amenities` reference table. The table will contain a generated `id`, required `name`, required unique `slug`, and Laravel-managed timestamps. Applying only this migration to the configured PostgreSQL database must succeed and leave the table present.

## Scope

### In scope

- Generate one timestamped `create_amenities_table` migration with Artisan from `backend/laravel`.
- Create `amenities` with:
  - Generated primary key `id`.
  - Required `name` string.
  - Required `slug` string with a unique constraint.
  - `created_at` and `updated_at` timestamps, following the existing categories migration convention.
- Implement `down()` to drop only the `amenities` table.
- Apply only this migration to the configured PostgreSQL database and inspect the resulting table.

### Non-goals

- Models, factories, seeders, API endpoints, business-amenity pivot table, frontend changes, or unrelated migrations.
- Changes to the existing `categories` or `businesses` migrations.
- `migrate:fresh`, unrestricted migration commands, or applying the pending Laravel starter migrations.
- Additional amenity columns or constraints not specified by D2-04 or established by the categories reference-table pattern.

## Analysis carried forward

- D2-04 in `docs/day-2-laravel-postgresql.md` asks for an `amenities` table with `id`, `name`, `slug`, `created_at`, and `updated_at`; its stated check is that the migration executes and the table exists.
- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` already implements a related reference table with generated `id`, required `name`, unique required `slug`, timestamps, and a table-scoped `down()`. Reusing this pattern avoids introducing a second convention for amenities.
- The businesses migration is already present and applied according to `MEMORY.md`. The current migration directory contains no amenities migration; verify the live migration state before applying a new one.
- `backend/laravel/phpunit.xml` configures tests for in-memory SQLite, so PHPUnit is not evidence that this migration was applied to PostgreSQL.
- `backend/laravel/AGENTS.md` requires Artisan generation with `--no-interaction`, following sibling conventions, and running Pint after PHP changes. The Laravel migration skill also recommends explicit foreign-key/index design and honest rollback behavior; this table needs no foreign key.
- Existing migrations and the D2-04 roadmap entry are the authoritative scope. The required slug uniqueness is inferred from the directly related categories table pattern; no unique constraint on `name` is specified or planned.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-04 table fields, task scope, and acceptance check.
- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` — sibling reference-table conventions.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — recent migration structure and table-scoped rollback precedent.
- `backend/laravel/database/migrations/` — no amenities migration currently exists.
- `backend/laravel/AGENTS.md` — Laravel project rules, Artisan generation, and Pint requirement.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/migrations.md` — migration and constraint guidance.
- `backend/laravel/phpunit.xml` — SQLite in-memory test database configuration.
- `MEMORY.md` — current project checkpoint and expected existing PostgreSQL migration state; re-check the database before applying.

## Learning objectives

- A lookup/reference table stores reusable domain values once so that business records can refer to them rather than repeat free-form text.
- A unique slug is a database-enforced identifier suitable for URLs and consistent lookups; uniqueness is distinct from merely requiring a value.
- Laravel migrations make schema changes repeatable, while `down()` should reverse only the schema introduced by that migration.
- A path-scoped migration command can apply one table change without running unrelated pending migrations.

## Ordered implementation steps

1. From `backend/laravel`, generate a timestamped `create_amenities_table` migration with `php artisan make:migration ... --no-interaction`. Use its generated filename and do not edit existing migrations.
2. Implement the fields and constraints to match the D2-04 list and categories precedent: `$table->id()`, required `$table->string('name')`, `$table->string('slug')->unique()`, and `$table->timestamps()`.
3. Keep `down()` limited to `Schema::dropIfExists('amenities')`.
4. Review the migration against D2-04 and the categories migration; run PHP lint and Pint.
5. Before applying, inspect `php artisan migrate:status --database=pgsql` and verify that the existing domain migrations are in the expected state and no unrelated migration will be run.
6. Apply only the generated migration using the `pgsql` connection and exact migration path. Do not run `migrate:fresh` or an unrestricted migration command.
7. Inspect the PostgreSQL `amenities` table and its indexes, confirming its columns, requiredness, primary key, and unique slug constraint. Confirm the new migration is recorded as applied and unrelated migration states did not change.

## Tests and verification

Run from `backend/laravel`:

```powershell
php -l database/migrations/<generated_amenities_migration>.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql
php artisan migrate --database=pgsql --path=database/migrations/<generated_amenities_migration>.php --no-interaction
php artisan db:table amenities --database=pgsql --json
php artisan migrate:status --database=pgsql
```

Expected outcomes:

- PHP lint reports no syntax errors and Pint completes successfully.
- The preflight confirms the expected applied domain migrations and identifies any pending starter migrations before changes are made.
- The path-scoped migrate command succeeds and creates only `amenities`.
- Table inspection confirms `id`, `name`, `slug`, `created_at`, and `updated_at`, with the slug unique index.
- The postflight confirms only the new amenities migration was added to the applied state.
- No PHPUnit test is needed to prove migration execution/table existence; the project's PHPUnit database is SQLite in memory, whereas the target in this task is PostgreSQL.

## Risks, dependencies, and unresolved questions

- The migration is independent of categories and businesses because it has no foreign key. The business-amenity relationship is a separate D2-05 pivot task.
- The configured PostgreSQL connection may be unavailable or may not match the state described in `MEMORY.md`; inspect status first and stop rather than using a destructive reset or applying unrelated migrations.
- The roadmap calls the fields “suggested”; this plan follows the established categories table convention for required name, unique required slug, and timestamps. There are no unresolved questions based on the available repository evidence.

## Authorization checkpoint

The user explicitly authorized implementation by invoking `/implement "docs/plans/d2-04-amenities-migration.md"` after the plan was checked.

## Plan check

- Confirmed the D2-04 field list and acceptance check against `docs/day-2-laravel-postgresql.md`; the proposed table remains limited to the named fields.
- Confirmed the categories migration is direct local precedent for required `name`, unique `slug`, timestamps, and table-scoped rollback. The inferred unique slug is called out explicitly; uniqueness is not added to `name`.
- Confirmed the proposed Laravel migration file path and existing migration references. No amenities migration or plan existed before this plan was created.
- Confirmed from `phpunit.xml` that the default PHPUnit database is SQLite in memory. The verification therefore checks the configured PostgreSQL target and uses an exact migration path rather than relying on a unit/feature test or applying unrelated pending migrations.
- Reused the status, path-scoped migration, Pint, lint, and `db:table --json` checks recorded as successful in the completed D2-03 plan. The live database migration state remains a required implementation preflight, not a claim made by this plan check.
- `git status --short` showed only this new plan; `git diff --check` reported no whitespace errors in tracked changes. The new untracked plan was reviewed directly.
- No implementation changes were made and no user decision is needed to finish checking this plan.

## Implementation outcome

- Added and applied `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php`.
- The migration creates the generated `id`, required `name`, required unique `slug`, and Laravel timestamps, and its `down()` drops only `amenities`.
- Only the amenities migration was applied to PostgreSQL. The three Laravel starter migrations remain pending; categories and businesses remain applied. No unrelated migrations were run.

### Verification results

- `php -l database\migrations\2026_10_09_220642_create_amenities_table.php` — passed with no syntax errors.
- `vendor\bin\pint --dirty --format agent` — passed.
- Pre-migration `php artisan migrate:status --database=pgsql` — confirmed categories and businesses ran; the three Laravel starter migrations were pending.
- `php artisan migrate --database=pgsql --path=database\migrations\2026_10_09_220642_create_amenities_table.php --no-interaction` — succeeded.
- `php artisan db:table amenities --database=pgsql --json` — confirmed five columns (`id`, `name`, `slug`, `created_at`, `updated_at`), the `amenities_pkey` primary key, and the unique `amenities_slug_unique` index. The timestamp columns are nullable, consistent with Laravel's `timestamps()` helper and the categories migration convention.
- Post-migration `php artisan migrate:status --database=pgsql` — confirmed amenities ran in batch 3 and the three Laravel starter migrations remain pending.
- No PHPUnit suite was run; its configured SQLite in-memory database does not verify the PostgreSQL migration target.
