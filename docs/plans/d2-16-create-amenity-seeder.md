# Plan — D2-16: Create Amenity Seeder

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-16 — Create Amenity Seeder

## Desired outcome

Create an idempotent Laravel seeder for the six tourism amenities listed as examples in the roadmap and register it in the standard `DatabaseSeeder`.

## Scope

### In scope

- Add `AmenitySeeder` for Wi-Fi (`wi-fi`), Parking (`parking`), Pool (`pool`), Breakfast (`breakfast`), Air Conditioning (`air-conditioning`), and Pet Friendly (`pet-friendly`).
- Match existing amenity rows by their unique slug with `firstOrCreate`; use deterministic slugs so rerunning the dedicated seeder creates no duplicates and does not overwrite existing names.
- Call `AmenitySeeder` from `DatabaseSeeder`, alongside the already registered `CategorySeeder`.
- Verify the dedicated `AmenitySeeder` directly twice against PostgreSQL and inspect the six expected target rows after each run.

### Non-goals

- Changing `DatabaseSeeder`'s existing fixed-email sample-user behavior or making the root seeder itself safe to run twice. Verify `AmenitySeeder` directly.
- Adding amenities beyond the six examples listed for D2-16 in the roadmap.
- Changing schema, models, factories, businesses, dependencies, or existing unrelated amenity rows.
- Adding a PHPUnit database test. PHPUnit is configured for in-memory SQLite, while the domain migration chain uses PostgreSQL-specific constraint DDL; the roadmap acceptance criterion is to ensure no unexpected duplicates.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-16 as creating an amenity seeder, lists six examples (Wi-Fi, Parking, Pool, Breakfast, Air Conditioning, Pet Friendly), and requires checking for unexpected duplicates.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` defines required `name`, unique `slug`, and timestamps. The unique slug is the stable lookup key for repeatable reference data.
- `backend/laravel/app/Models/Amenity.php` already has `name` and `slug` in `$fillable`; no model or schema changes are needed.
- `backend/laravel/database/seeders/CategorySeeder.php` is the direct existing pattern: a small fixed list and `firstOrCreate` keyed by unique slug.
- `backend/laravel/database/seeders/DatabaseSeeder.php` already calls `CategorySeeder`, after creating a fixed-email sample user. Register the new seeder there but test `AmenitySeeder` directly so the root user's existing non-idempotent behavior does not affect this task.
- The live PostgreSQL migration status showed all nine migrations applied. A read-only amenities query found one unrelated `Temp Amenity` row and none of the six target slugs; verification must preserve that existing row.
- `backend/laravel/phpunit.xml` configures SQLite `:memory:` tests. Existing domain migrations use PostgreSQL-only `ALTER TABLE ... ADD CONSTRAINT` statements, so verify the seeder's repeatability against the configured PostgreSQL database instead.
- Git status was clean at analysis apart from the branch being one commit ahead of origin; no pre-existing uncommitted changes were present. No `docs/plans/d2-16-*` plan exists.
- `backend/laravel/AGENTS.md` and its Laravel/testing skills apply. No root `.ai/rules/index.md` or repository `*.instructions.md` files were found.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-16 example data and no-unexpected-duplicates acceptance check.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — required name, unique slug, timestamps.
- `backend/laravel/app/Models/Amenity.php` — existing Eloquent model and mass-assignable fields.
- `backend/laravel/database/seeders/CategorySeeder.php` — existing idempotent reference seeder pattern.
- `backend/laravel/database/seeders/DatabaseSeeder.php` — standard seeder registration and existing sample-user behavior.
- `backend/laravel/phpunit.xml` and domain migrations — SQLite test configuration and PostgreSQL-specific domain DDL.
- `backend/laravel/AGENTS.md`, `.agents/skills/laravel-best-practices/SKILL.md`, and `.agents/skills/testing-best-practices/SKILL.md` — applicable Laravel, style, and verification guidance.
- `MEMORY.md` and live PostgreSQL queries — current project checkpoint, migration state, and existing amenity rows.

## Learning objectives

- A seeder makes reference data reproducible across local or development database setups.
- Idempotence means repeated runs converge on the same data rather than adding duplicates.
- A unique slug in the schema provides a stable natural key; `firstOrCreate` checks for that key and only creates a missing amenity, preserving a matching row.
- A focused seeder can be called by `DatabaseSeeder` for normal setup and invoked directly for isolated verification.

Concept note: `firstOrCreate` takes lookup attributes separately from the values used on creation. Looking up by the unique slug makes a rerun reuse a matching amenity; the name is only supplied if that row must be created.

## Ordered implementation steps

1. From `backend/laravel`, generate `AmenitySeeder` with `php artisan make:seeder AmenitySeeder --no-interaction`.
2. Add the six approved name/slug pairs and use `Amenity::firstOrCreate` keyed by slug, matching `CategorySeeder`'s existing duplicate strategy.
3. Register `AmenitySeeder` in `DatabaseSeeder` without changing the user or category seeding steps.
4. Run PHP syntax validation and Laravel Pint on the changed PHP files.
5. Run `AmenitySeeder` twice against PostgreSQL. After each run, query the six target slugs and confirm the expected names and exactly one row per slug; also confirm the unrelated existing amenity and migration state remain unchanged.

## Tests and verification

Run from `backend/laravel`:

```powershell
php artisan make:seeder AmenitySeeder --no-interaction
php -l database\seeders\AmenitySeeder.php
php -l database\seeders\DatabaseSeeder.php
vendor\bin\pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
php artisan db:seed --class=AmenitySeeder --database=pgsql --no-interaction
php artisan tinker --execute "dump(App\Models\Amenity::query()->whereIn('slug', ['air-conditioning', 'breakfast', 'parking', 'pet-friendly', 'pool', 'wi-fi'])->orderBy('slug')->get(['name', 'slug'])->toArray());"
php artisan db:seed --class=AmenitySeeder --database=pgsql --no-interaction
php artisan tinker --execute "dump(App\Models\Amenity::query()->whereIn('slug', ['air-conditioning', 'breakfast', 'parking', 'pet-friendly', 'pool', 'wi-fi'])->orderBy('slug')->get(['name', 'slug'])->toArray());"
php artisan migrate:status --database=pgsql --no-interaction
```

Expected results:

- Both syntax checks and Pint complete successfully.
- Both direct seeder runs succeed.
- Both queries return the same six expected name/slug pairs and one row per target slug, with no duplicates introduced by the second run.
- The pre-existing unrelated amenity remains present, and all nine migrations remain recorded as ran.
- No PHPUnit test is planned; the acceptance check is exercised against PostgreSQL, and the configured SQLite test database cannot run the PostgreSQL-specific domain migration DDL.

## Risks, dependencies, and unresolved questions

- PostgreSQL must remain reachable for the direct repeat-run check. It was reachable during analysis; if unavailable during implementation, report the blocker rather than changing the database configuration or switching to another database.
- The six reference amenities will persist in PostgreSQL after verification; that is the intended result.
- `firstOrCreate` leaves an existing amenity name unchanged when its slug matches. This deliberately prevents overwriting user data while avoiding duplicate seed records.
- The unrelated temporary amenity is pre-existing state and must not be deleted or rewritten.
- No unresolved questions remain.

## Implementation authorization

The user authorized implementation by invoking `/implement "docs/plans/d2-16-create-amenity-seeder.md"` after the plan was checked.

## Plan check

- Confirmed the six amenity examples in the roadmap, the current `amenities` table's required name and unique slug, and `Amenity`'s fillable fields. The selected deterministic slugs align with the existing lowercase slug convention used by `CategorySeeder`.
- Verified `CategorySeeder` uses `firstOrCreate` keyed by slug and is already registered in `DatabaseSeeder`; the plan reuses this established pattern and adds the amenity seeder without disturbing existing calls.
- Confirmed with a live read-only query that only the unrelated `Temp Amenity` currently exists; the plan scopes queries to the six expected slugs and explicitly preserves the existing row.
- Rechecked the live PostgreSQL migration status: all nine migrations are applied. PHPUnit remains configured for SQLite `:memory:`, whereas the domain migrations contain PostgreSQL-specific constraint DDL, so the documented duplicate check runs the dedicated seeder directly against PostgreSQL.
- Confirmed the root `DatabaseSeeder` creates a fixed-email sample user. To avoid conflating that existing behavior with this task, verification invokes `AmenitySeeder` twice directly rather than running the full root seeder twice.
- No material decision or unresolved question remains.

- The plan check confirmed the approved six amenity examples, unique-slug matching, preservation of the unrelated live amenity, and direct dedicated-seeder verification to avoid the unrelated fixed-user behavior in `DatabaseSeeder`.
- **Status:** Checked — awaiting user approval

## Implementation outcome

- Generated `backend/laravel/database/seeders/AmenitySeeder.php` with Artisan. It seeds Wi-Fi (`wi-fi`), Parking (`parking`), Pool (`pool`), Breakfast (`breakfast`), Air Conditioning (`air-conditioning`), and Pet Friendly (`pet-friendly`) using `Amenity::firstOrCreate` keyed by unique slug.
- Registered `AmenitySeeder` in `DatabaseSeeder` after the existing `CategorySeeder`; left the fixed-email sample-user operation unchanged.
- `vendor\bin\pint --dirty --format agent` completed successfully and removed an unused generated import. `php -l database\seeders\AmenitySeeder.php` and `php -l database\seeders\DatabaseSeeder.php` both reported no syntax errors.
- Ran `php artisan db:seed --class=AmenitySeeder --database=pgsql --no-interaction` twice. A read-only Eloquent query after each run returned the same six target name/slug pairs, one per slug. A query of all amenities confirmed the pre-existing `Temp Amenity` remained.
- `php artisan migrate:status --database=pgsql --no-interaction` before and after showed all nine migrations still ran. `php artisan db:table amenities --database=pgsql --json` confirmed the unique slug index. `git diff --check` reported no whitespace errors.
- No PHPUnit test was added or run; the configured in-memory SQLite suite is incompatible with existing PostgreSQL-specific domain migration DDL. The full `DatabaseSeeder` was not run because the existing sample-user behavior is outside scope.
- The six reference amenities now persist in PostgreSQL. No schema, dependencies, or unrelated amenity rows were changed.

- **Final status:** Implemented — verified
