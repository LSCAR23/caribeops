# Plan — D2-06: Create Reviews Migration

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-06 — Create Reviews Migration

## Desired outcome

Create and apply one Laravel migration for a `reviews` table linked to `businesses`. Include the roadmap's review fields, use required review content fields, and ensure the database rejects a review referencing a nonexistent business. Deleting a business will cascade to its reviews.

## Scope

### In scope

- Generate one timestamped `create_reviews_table` migration using Artisan from `backend/laravel`.
- Create the following fields:
  - Generated primary key `id`.
  - Required `business_id` foreign key to `businesses.id` with cascade-on-delete.
  - Required `rating` using a PostgreSQL-compatible integer type.
  - Required `title` string.
  - Required `content` text.
  - Required `review_date` date.
  - Laravel-managed `created_at` and `updated_at` timestamps via the existing `timestamps()` convention; these timestamp columns are nullable.
- Keep the rating range constraint (1–5) out of D2-06; it is assigned to D2-07.
- Implement `down()` to drop only the `reviews` table.
- Apply only this migration to the configured PostgreSQL database and verify schema, invalid-business rejection, and cascade behavior using temporary transactional data.

### Non-goals

- Rating range CHECK constraints, validation rules, or broader D2-07 constraints.
- User/author ownership columns, models, Eloquent relationships, factories, seeders, endpoints, frontend changes, or unrelated migrations.
- Changes to the businesses or business-amenities migrations.
- `migrate:fresh`, unrestricted migration commands, or applying pending Laravel starter migrations.

## Analysis carried forward

- D2-06 in `docs/day-2-laravel-postgresql.md` proposes `id`, `business_id`, `rating`, `title`, `content`, `review_date`, `created_at`, and `updated_at`. Its explicit test requires a foreign-key failure when creating a review for a nonexistent business.
- D2-07 separately calls out a database constraint for ratings between 1 and 5, so that constraint is intentionally deferred rather than bundled into this migration.
- `docs/README.md` describes Business 1-to-many Review. The businesses migration exists, and D2-05 has completed the amenities pivot; verify current PostgreSQL migration status again before applying this migration.
- No reviews migration, model, or application reference currently exists in `backend/laravel`.
- Existing Laravel migrations use anonymous migration classes and table-scoped `down()` methods. Business foreign keys use `foreignId()->constrained(...)->cascadeOnDelete()`. Reference table migrations use Laravel's `timestamps()` helper.
- `backend/laravel/phpunit.xml` configures tests for SQLite in memory; it cannot prove the configured PostgreSQL foreign-key behavior.
- User decisions carried forward: reviews cascade-delete when their business is deleted; `title` is required like the other review fields. The roadmap does not define exact SQL types or nullability; this plan uses integer rating, string title, text content, and date review_date, all required, as explicit schema recommendations. Timestamps follow the existing nullable `timestamps()` helper convention.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-06 fields and invalid-business test; D2-07 rating range constraint.
- `docs/README.md` — Business 1-to-many Review domain relationship.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — referenced business table and cascading foreign-key precedent.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — `timestamps()` convention.
- `backend/laravel/database/migrations/` — no reviews migration currently exists.
- `backend/laravel/AGENTS.md` — Laravel project rules, Artisan generation, and Pint requirement.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/migrations.md` — foreign-key, indexing, and rollback guidance.
- `backend/laravel/phpunit.xml` — SQLite in-memory PHPUnit configuration.
- `MEMORY.md` — D2-05 completion checkpoint; confirm live parent migration status before applying D2-06.

## Learning objectives

- A review is a child record of a business; a foreign key ensures the parent exists and `ON DELETE CASCADE` defines the child lifecycle.
- SQL column types represent distinct concepts: an integer rating, short title, longer review content, and calendar date.
- Database range constraints are separate from column type and requiredness; the rating range belongs to the next D2-07 task.
- Path-scoped migrations apply one schema change without running unrelated pending migrations.

## Ordered implementation steps

1. From `backend/laravel`, generate a timestamped `create_reviews_table` migration using `php artisan make:migration ... --no-interaction`. Use the generated filename; do not modify the businesses migration.
2. Define `business_id` as a required foreign key to `businesses.id` with cascade-on-delete.
3. Add required `rating` (integer), `title` (string), `content` (text), and `review_date` (date), plus nullable Laravel-managed timestamps using `$table->timestamps()`. Do not add the 1–5 rating constraint in this task.
4. Keep `down()` limited to `Schema::dropIfExists('reviews')`. Review the migration against D2-06 and the businesses migration.
5. Run PHP lint and Pint. Inspect PostgreSQL migration status and confirm the business parent is applied and starter migrations remain pending.
6. Apply only the generated migration using the `pgsql` connection and its exact path.
7. Inspect the PostgreSQL table to confirm column types, requiredness, business foreign key, and its cascade action.
8. Use temporary rows within isolated PostgreSQL transactions to verify that inserting a review with a nonexistent business is rejected with SQLSTATE `23503`, and deleting a temporary business removes its temporary review. Ensure expected-failure transactions and all fixtures are rolled back; do not touch existing rows.
9. Re-check migration status to confirm only the reviews migration was newly applied and unrelated migration states did not change.

## Tests and verification

Run from `backend/laravel`:

```powershell
php -l database/migrations/<generated_reviews_migration>.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql
php artisan migrate --database=pgsql --path=database/migrations/<generated_reviews_migration>.php --no-interaction
php artisan db:table reviews --database=pgsql --json
php artisan migrate:status --database=pgsql
```

Expected outcomes:

- PHP lint reports no syntax errors and Pint completes successfully.
- Preflight confirms categories, businesses, amenities, and business-amenities have run; the three Laravel starter migrations remain pending.
- The path-scoped migration succeeds and creates only `reviews`.
- Schema inspection confirms the planned columns and requiredness, nullable timestamps, a foreign key to `businesses.id`, and `ON DELETE CASCADE`.
- PostgreSQL rejects a review with an invalid business ID using SQLSTATE `23503` and removes a temporary review when its temporary business is deleted. All test fixtures are rolled back.
- Postflight confirms the reviews migration ran and unrelated migration states did not change.
- No PHPUnit test is needed to establish PostgreSQL migration behavior; its configured connection is SQLite in memory.

## Risks, dependencies, and unresolved questions

- The businesses table must exist before the reviews foreign key can be created. Reconfirm live migration status before applying.
- Cascade deletion is intentional and user-confirmed. Verification must use a temporary business and review inside rollback-only transactions.
- PostgreSQL aborts a transaction after an expected constraint failure; isolate the invalid-FK probe in a savepoint or separate transaction, then roll it back before continuing.
- The roadmap does not specify the exact SQL type or nullability for review attributes. This plan records explicit recommendations (integer, string, text, and date; required review data) and user-confirmed title requiredness. Timestamps follow the nullable Laravel convention used by the existing reference migration. The 1–5 CHECK constraint remains explicitly out of scope for D2-06.

## Authorization checkpoint

The user explicitly authorized implementation by invoking `/implement "docs/plans/d2-06-reviews-migration.md"` after the plan was checked.

## Plan check

- Confirmed D2-06's proposed `reviews` table fields and invalid-business foreign-key acceptance test against `docs/day-2-laravel-postgresql.md`.
- Kept the rating 1–5 CHECK constraint out of D2-06 because the roadmap assigns that constraint to D2-07.
- Confirmed the Business 1-to-many Review relationship in `docs/README.md` and the required parent table and migration patterns. The plan will re-check current PostgreSQL migration status before any apply.
- Incorporated the user's decisions that title is required and business deletion cascades to reviews.
- Made non-roadmap schema recommendations explicit: required rating (integer), title (string), content (text), and review_date (date); nullable timestamps via `$table->timestamps()` follow existing reference migrations.
- Confirmed PHPUnit uses SQLite in memory; PostgreSQL-specific invalid-FK and cascade behavior is planned for isolated, rollback-only verification transactions.
- Confirmed `docs/plans/d2-06-reviews-migration.md` did not already exist. `git status --short` showed only this new plan; `git diff --check` reported no whitespace errors in tracked changes, and the untracked plan was reviewed directly.
- No unresolved decisions block the plan. No application code or database changes were made.

## Implementation outcome

- Added and applied `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php`.
- The migration creates a generated `id`, required cascading `business_id` foreign key, required integer `rating`, required string `title`, required text `content`, required date `review_date`, and nullable Laravel-managed timestamps. Its `down()` drops only `reviews`.
- Only this migration was applied to PostgreSQL. The three Laravel starter migrations remain pending; categories, businesses, amenities, and business-amenities remain applied. No persistent verification data was left behind.
- The 1–5 rating CHECK constraint was not added; it remains part of D2-07.

### Verification results

- `php -l database\migrations\2026_10_09_223250_create_reviews_table.php` — passed with no syntax errors.
- `vendor\bin\pint --dirty --format agent` — passed.
- Pre-migration `php artisan migrate:status --database=pgsql` — confirmed the four existing domain migrations ran and the three Laravel starter migrations were pending.
- `php artisan migrate --database=pgsql --path=database\migrations\2026_10_09_223250_create_reviews_table.php --no-interaction` — succeeded.
- `php artisan db:table reviews --database=pgsql --json` — confirmed eight columns, expected PostgreSQL types and requiredness, nullable timestamp columns, and `reviews_business_id_foreign` referencing `businesses.id` with `ON DELETE CASCADE`. No rating CHECK constraint was introduced.
- A temporary PHP verification bootstrapped Laravel and checked PostgreSQL behavior in separate transactions: an invalid business ID was rejected with SQLSTATE `23503`; deleting a temporary business cascaded to its temporary review without deleting its category. Both transactions rolled back and the temporary script was removed.
- Post-migration `php artisan migrate:status --database=pgsql` — confirmed the reviews migration ran in batch 5 and the three Laravel starter migrations remain pending.
- No PHPUnit suite was run; its configured SQLite in-memory database does not verify PostgreSQL foreign-key behavior.
