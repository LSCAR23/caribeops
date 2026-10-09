# Plan — D2-03: Create Businesses Migration

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-03 — Create Businesses Migration

## Desired outcome

Create and apply one Laravel migration for the `businesses` table. It must match the documented business entity design, require a category, cascade business deletion when its category is deleted, constrain geographic coordinates to valid inclusive ranges, and preserve the ability to roll back this migration without resetting unrelated tables.

## Scope

### In scope

- Generate one timestamped migration using Artisan from `backend/laravel`.
- Add the documented business fields and database types:
  - Generated `id`.
  - Required `category_id` foreign key to `categories.id`.
  - Required `name` (`varchar(255)`), `description` (`text`), `type` (`varchar(120)`), `address` (`text`), `latitude` and `longitude` (`numeric(10,7)`), and `phone` (`varchar(32)`).
  - Optional `website` (`text`).
  - Required persisted `created_at` and `updated_at`.
- Use cascade-on-delete for the category foreign key, as confirmed by the user.
- Add inclusive database checks for latitude `-90..90` and longitude `-180..180`, as confirmed by the user.
- Apply only this migration to the configured PostgreSQL database and verify schema and constraint behavior without leaving verification data behind.

### Non-goals

- Models, factories, seeders, API endpoints, frontend changes, or other migrations.
- Constraints not documented for this entity or assigned to D2-07.
- Running `migrate:fresh`, applying the pending Laravel starter migrations, or deleting existing categories/business data.
- Adding a PHPUnit test that relies on the existing test database configuration as proof of PostgreSQL-specific behavior.

## Analysis carried forward

- The categories migration creates `id`, required `name`, unique `slug`, and conventional timestamps. No businesses migration or database-constraint tests currently exist.
- D2-03 in `docs/day-2-laravel-postgresql.md` requires a businesses table with a category foreign key and expects PostgreSQL to reject references to missing categories.
- `docs/business-entity-design.md` specifies the business fields, PostgreSQL types, nullability, timestamp requirement, and coordinate bounds. It warns that conventional Laravel timestamps may be nullable.
- The user confirmed category deletion should cascade to its businesses and coordinate range checks belong in this migration.
- `backend/laravel/phpunit.xml` configures tests to use in-memory SQLite, not PostgreSQL. Therefore, that suite alone cannot verify the actual configured PostgreSQL schema and behavior.
- `MEMORY.md` reports that the categories migration was applied locally and Laravel starter migrations remain pending; this state must be confirmed before running the new migration.

## Current-state evidence and relevant files

- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` — parent-table migration.
- `backend/laravel/database/migrations/` — current migrations; no businesses migration exists.
- `docs/business-entity-design.md` — business fields, types, requiredness, and coordinate bounds.
- `docs/day-2-laravel-postgresql.md` — D2-03 intent and expected foreign-key test.
- `backend/laravel/AGENTS.md` — Laravel migration generation, foreign-key, rollback, and verification rules.
- `backend/laravel/composer.json` — Laravel `^13.17`, PHP `^8.3`.
- `backend/laravel/phpunit.xml` — in-memory SQLite test connection; not a PostgreSQL verification environment.
- `backend/laravel/tests/Feature/HealthEndpointTest.php` — existing PHPUnit style; no migration coverage.

## Learning objectives

- A Laravel migration records schema changes reproducibly and uses `down()` to reverse its own schema change.
- A foreign key enforces referential integrity in PostgreSQL; `ON DELETE CASCADE` specifies the lifecycle of dependent rows.
- A database `CHECK` constraint protects domain bounds even when writes bypass Laravel request validation.
- Persisted timestamp non-nullability is distinct from whether the user supplies timestamp values; Laravel manages timestamps when saving Eloquent models.

## Ordered implementation steps

1. From `backend/laravel`, generate a timestamped `create_businesses_table` migration with `php artisan make:migration ... --no-interaction`. Use the generated filename and do not edit the existing categories migration.
2. Implement every documented field with the specified PostgreSQL-compatible type and nullability. Explicitly define non-null timestamps rather than relying on the nullable conventional timestamp helper.
3. Add the required `category_id` foreign key with cascade-on-delete and inclusive latitude/longitude checks. Confirm the Laravel 13.17 migration API for check constraints before relying on its syntax.
4. Keep `down()` limited to dropping the businesses table, then review the migration against the schema design and sibling migration.
5. From `backend/laravel`, lint and format the migration, then confirm the target PostgreSQL database has the categories migration applied and the Laravel starter migrations have not been unintentionally applied.
6. Apply only the generated migration using the `pgsql` connection and its exact path. Do not run `migrate:fresh` or an unrestricted migration command.
7. Inspect the resulting table and constraints. Verify valid boundary coordinates and a valid category/business relation; verify a nonexistent category and coordinates outside each boundary are rejected; verify deleting a temporary category cascades only to its temporary business.
8. Perform data-behavior checks in an explicit transaction using unique sentinel test values and always roll the transaction back. Run each expected-failure statement in an isolated transaction/savepoint so PostgreSQL's aborted-transaction behavior does not skip later assertions. Never use or delete an existing category for the cascade check.

## Tests and verification

Run from `backend/laravel`:

```powershell
php -l database/migrations/<generated_businesses_migration>.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql
php artisan migrate --database=pgsql --path=database/migrations/<generated_businesses_migration>.php --no-interaction
php artisan db:table businesses --database=pgsql
```

Expected outcomes:

- PHP lint and Pint complete successfully.
- Before applying the migration, `migrate:status` confirms categories is applied and confirms the pending starter migrations are still pending.
- The path-scoped migration creates only `businesses`.
- Schema inspection confirms the documented columns/types/nullability, category foreign key and cascade action, plus both coordinate check constraints.
- PostgreSQL accepts in-range coordinates including `-90`, `90`, `-180`, and `180` when paired with a valid temporary category; it rejects a missing category and values outside each range.
- Deleting the temporary category removes its temporary business through the foreign-key action. The enclosing transaction rollback leaves no verification rows.
- Do not treat the default PHPUnit suite (SQLite `:memory:`) as proof of PostgreSQL migration behavior. Do not run tests or migration commands against an unconfirmed/shared database.

## Risks and dependencies

- `categories` must exist before the businesses foreign key is created. Confirm the configured PostgreSQL migration state before applying the new migration.
- Cascade behavior is destructive by design. Its verification must delete only an explicitly created temporary category inside a transaction that is rolled back.
- PostgreSQL marks a transaction failed after a constraint error; isolate expected failure probes using savepoints or separate transactions and roll each back.
- The project's PHPUnit connection is SQLite. PostgreSQL check-constraint syntax and resulting actions must be confirmed against Laravel 13.17 and the actual configured PostgreSQL connection.
- Laravel's conventional timestamp helper may generate nullable columns; verify the final schema enforces the documented non-null behavior.
- This task adds a migration and applies it, but does not establish a full clean migration chain; D2-08 handles that separately.

## Unresolved questions

None. The user confirmed cascade deletion and inclusion of coordinate checks.

## Plan check

- Confirmed the reviewed plan corresponds to the existing categories migration and the D2-03 design/roadmap.
- Found that PHPUnit uses in-memory SQLite, so it cannot serve as evidence for PostgreSQL-specific migration constraints; the verification now targets PostgreSQL directly.
- Tightened cascade verification to use a temporary category and business inside a transaction with rollback, avoiding any deletion of existing data.
- Added an explicit preflight for migration status and exact path-scoped apply command; excluded `migrate:fresh` and unrelated pending migrations.
- Kept scope to one migration; no model, endpoint, or unrelated D2-07 work was added.

## Implementation outcome

- Added and applied `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php`.
- The migration creates all documented columns and requiredness, including non-null persisted timestamps; adds the required `categories.id` foreign key with `ON DELETE CASCADE`; and adds named latitude and longitude range checks.
- Laravel 13.35's installed schema builder has no check-constraint API. The migration therefore uses explicit PostgreSQL `ALTER TABLE ... ADD CONSTRAINT ... CHECK` statements for the two bounds; the migration is intentionally aligned with the project's PostgreSQL target.
- Only the businesses migration was applied. The three Laravel starter migrations remain pending; no schema reset or persistent verification data was used.

### Verification results

- `vendor/bin/pint --dirty --format agent` — passed.
- `php -l database/migrations/2026_10_09_213759_create_businesses_table.php` — no syntax errors.
- `php artisan migrate:status --database=pgsql` — before apply: categories ran, businesses pending, three starter migrations pending; after apply: categories and businesses ran, three starter migrations still pending.
- `php artisan migrate --database=pgsql --path=database/migrations/2026_10_09_213759_create_businesses_table.php --no-interaction` — succeeded.
- `php artisan db:table businesses --database=pgsql --json` — confirmed 12 expected columns, documented PostgreSQL types, only `website` nullable, and category foreign key `ON DELETE CASCADE`.
- A temporary local PHP verification bootstrapped the Laravel app and checked PostgreSQL catalogs plus isolated transactional writes: boundary pairs `(-90, -180)` and `(90, 180)` succeeded; nonexistent category failed with SQLSTATE `23503`; each of four out-of-range latitude/longitude values failed with SQLSTATE `23514`; category deletion cascaded to its temporary business; the outer transaction rolled back and left no verification rows. The temporary script was removed.

## Authorization checkpoint

The checked plan was approved when the user invoked `/implement "docs/plans/d2-03-businesses-migration.md"`.
