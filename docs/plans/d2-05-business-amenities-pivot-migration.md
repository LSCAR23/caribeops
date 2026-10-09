# Plan — D2-05: Create Business-Amenities Pivot Migration

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-05 — Create Business-Amenities Pivot Migration

## Desired outcome

Create and apply one Laravel migration for the `business_amenities` join table. It will contain `business_id` and `amenity_id` foreign keys referencing their parent tables and a database-enforced unique constraint across the pair, so the same amenity cannot be attached to the same business more than once.

## Scope

### In scope

- Generate one timestamped `create_business_amenities_table` migration using Artisan from `backend/laravel`.
- Create the two required foreign-key columns:
  - `business_id` references `businesses.id`.
  - `amenity_id` references `amenities.id`.
- Cascade deletion of a parent business or amenity to its join rows only.
- Enforce uniqueness across `(business_id, amenity_id)`.
- Implement `down()` to drop only `business_amenities`.
- Apply only this migration to the configured PostgreSQL database and verify the schema and duplicate-pair rejection using temporary transactional data.

### Non-goals

- Changes to the `businesses` or `amenities` migrations or their parent rows.
- Models, Eloquent relationships, seeders, API endpoints, frontend changes, or unrelated migrations.
- An `id` surrogate key, pivot timestamps, or additional pivot attributes; D2-05 specifies only the two relationship columns.
- `migrate:fresh`, unrestricted migration commands, or applying pending Laravel starter migrations.

## Analysis carried forward

- D2-05 in `docs/day-2-laravel-postgresql.md` specifies a many-to-many `business_amenities` pivot with `business_id`, `amenity_id`, foreign keys, and a uniqueness constraint across both IDs. Its acceptance check explicitly requires duplicate business/amenity insertion to be rejected.
- `docs/README.md` models Business N-to-N Amenity. The parent tables now exist: the businesses and amenities migrations have been applied to the configured PostgreSQL database, according to the most recent project checkpoint.
- No pivot migration, model, or application reference to `business_amenities` currently exists.
- The sibling migrations use Laravel's anonymous migration structure and `Schema::dropIfExists()` in `down()`. The Laravel project rules require Artisan migration generation with `--no-interaction`; the migration guidance calls for deliberate foreign keys, indexes, and honest rollback behavior.
- PHPUnit is configured for in-memory SQLite. PostgreSQL is the actual configured target, and D2-05's database uniqueness behavior should be verified directly there.
- A join row represents only the association, not either parent entity. The plan selects cascading deletion for both foreign keys so removing either parent cleans up its join rows without deleting the other parent. No surrogate `id` or timestamps are added because the roadmap specifies only the two IDs.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-05 fields, foreign-key and uniqueness requirements, and duplicate-rejection acceptance check.
- `docs/README.md` — Business N-to-N Amenity relationship.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — business parent key and Laravel migration conventions.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — amenity parent key and migration conventions.
- `backend/laravel/database/migrations/` — no `business_amenities` migration currently exists.
- `backend/laravel/AGENTS.md` — Laravel project rules, Artisan generation, and Pint requirement.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/migrations.md` — foreign-key, index, and rollback guidance.
- `backend/laravel/phpunit.xml` — SQLite in-memory PHPUnit configuration.
- `MEMORY.md` — D2-04 completion checkpoint; confirm live migration status again before applying D2-05.

## Learning objectives

- A many-to-many relationship uses a join/pivot table to represent each association between two entity tables.
- Foreign keys ensure every association points to an existing parent; cascade-on-delete removes associations when a parent is removed without deleting the other parent.
- A unique composite constraint on `(business_id, amenity_id)` prevents duplicate links while allowing one business to have many amenities and one amenity to belong to many businesses.
- Path-scoped migrations allow one schema change to be applied without running unrelated pending migrations.

## Ordered implementation steps

1. From `backend/laravel`, generate a timestamped `create_business_amenities_table` migration with `php artisan make:migration ... --no-interaction`. Use the generated filename and do not edit the parent-table migrations.
2. Define `business_id` and `amenity_id` as required foreign keys to `businesses.id` and `amenities.id`, respectively, using cascade-on-delete for join rows.
3. Add one composite unique constraint for `business_id` and `amenity_id`. Keep the pivot to the two specified columns; do not add a surrogate ID or timestamps.
4. Implement `down()` to drop only `business_amenities`, then review the migration against D2-05 and both parent migrations.
5. Run PHP lint and Pint. Before applying, inspect PostgreSQL migration status and confirm both parent migrations are applied and starter migrations remain pending.
6. Apply only the generated migration using the `pgsql` connection and its exact path.
7. Inspect the PostgreSQL schema to confirm both foreign keys, cascade actions, and the composite unique index.
8. Use isolated transactions with temporary parent records to verify the behavior: insert a valid pair, confirm the duplicate pair is rejected by PostgreSQL, and roll back the failed transaction and all fixtures. In separate rollback-only transactions, delete a temporary business and a temporary amenity in turn and confirm each deletion removes its pivot row but not the other parent.
9. Re-check migration status to confirm only the pivot migration was newly applied and unrelated migrations remain unchanged.

## Tests and verification

Run from `backend/laravel`:

```powershell
php -l database/migrations/<generated_business_amenities_migration>.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql
php artisan migrate --database=pgsql --path=database/migrations/<generated_business_amenities_migration>.php --no-interaction
php artisan db:table business_amenities --database=pgsql --json
php artisan migrate:status --database=pgsql
```

Expected outcomes:

- PHP lint reports no syntax errors and Pint completes successfully.
- Preflight confirms categories, businesses, and amenities have run; the three Laravel starter migrations remain pending.
- The path-scoped migration succeeds and creates only `business_amenities`.
- Schema inspection confirms required `business_id` and `amenity_id` columns, foreign keys to the intended tables with cascade actions, and a unique index over the pair.
- PostgreSQL accepts one valid temporary pair and rejects its duplicate with a unique-constraint violation. Verification records are rolled back and no existing parent or association is modified.
- Deleting either temporary parent removes its pivot row through the respective cascade; each verification transaction rolls back, leaving no test data behind.
- Postflight confirms the pivot migration ran and unrelated migration states did not change.
- No PHPUnit test is required to establish PostgreSQL-specific schema/constraint behavior; the configured PHPUnit connection is SQLite in memory.

## Risks, dependencies, and unresolved questions

- Both `businesses` and `amenities` must exist before the pivot foreign keys can be created. Confirm their live migration state before applying.
- Cascades are limited to deleting association rows when either referenced parent is deleted; tests must use only temporary rows in a transaction that is rolled back.
- PostgreSQL aborts a transaction after a constraint violation. Ensure the duplicate-rejection check rolls back the failed transaction and all fixture rows; do not continue using the aborted transaction.
- No unresolved questions based on D2-05 and the existing schema. The cascade behavior and lack of surrogate ID/timestamps are stated decisions based on the relationship's lifecycle and the roadmap's explicit two-column shape.

## Authorization checkpoint

The user explicitly authorized implementation by invoking `/implement "docs/plans/d2-05-business-amenities-pivot-migration.md"` after the plan was checked.

## Plan check

- Confirmed D2-05's table name, two columns, foreign-key requirement, composite uniqueness requirement, and duplicate-rejection acceptance check against the roadmap.
- Confirmed both parent migrations exist and use integer identity primary keys; D2-04 is recorded as completed in `MEMORY.md`. The plan requires a fresh live PostgreSQL migration-status preflight before applying.
- Checked the broader domain relationship in `docs/README.md` and found no existing pivot migration, Eloquent relationship, or application usage.
- Kept the pivot to the two roadmap columns, with no surrogate ID or timestamps. Made the cascading foreign-key action explicit in scope and justified it as cleanup of association rows only.
- Tightened the verification procedure to make cascade behavior mandatory because it is part of the proposed schema, to use temporary fixtures only, and to isolate/roll back expected PostgreSQL constraint failures.
- Confirmed PHPUnit's configured in-memory SQLite database is not suitable as verification of PostgreSQL behavior; the plan uses path-scoped migration commands and direct PostgreSQL schema/behavior inspection instead.
- Confirmed the plan destination did not previously exist. `git status --short` showed only this new plan; `git diff --check` found no whitespace errors in tracked changes, and the untracked plan was reviewed directly.
- No implementation changes were made. No unresolved preference blocks the plan; the unique pair and cascade lifecycle follow D2-05 and standard join-row semantics.

## Implementation outcome

- Added and applied `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php`.
- The migration creates only required `business_id` and `amenity_id` foreign keys to `businesses.id` and `amenities.id`, both cascading on delete, and a unique composite constraint on `(business_id, amenity_id)`. It does not add a surrogate ID or timestamps. `down()` drops only `business_amenities`.
- Only this migration was applied to PostgreSQL. The three Laravel starter migrations remain pending; categories, businesses, and amenities remain applied. No existing parent data was changed.

### Verification results

- `php -l database\migrations\2026_10_09_222207_create_business_amenities_table.php` — passed with no syntax errors.
- `vendor\bin\pint --dirty --format agent` — passed.
- Pre-migration `php artisan migrate:status --database=pgsql` — confirmed categories, businesses, and amenities ran; the three Laravel starter migrations were pending.
- `php artisan migrate --database=pgsql --path=database\migrations\2026_10_09_222207_create_business_amenities_table.php --no-interaction` — succeeded.
- `php artisan db:table business_amenities --database=pgsql --json` — confirmed exactly two bigint columns, the `business_amenities_business_id_amenity_id_unique` composite unique index, and foreign keys to both intended parent tables with `ON DELETE CASCADE`.
- A temporary PHP verification bootstrapped Laravel and used unique fixture rows inside three independent PostgreSQL transactions. Duplicate pair insertion was rejected with SQLSTATE `23505`; deleting the temporary business cascaded only its pivot row; deleting the temporary amenity cascaded only its pivot row. Each transaction rolled back, and the temporary verification file was removed.
- Post-migration `php artisan migrate:status --database=pgsql` — confirmed the pivot migration ran in batch 4 and the three Laravel starter migrations remain pending.
- No PHPUnit suite was run; its configured SQLite in-memory database does not verify PostgreSQL constraint behavior.
