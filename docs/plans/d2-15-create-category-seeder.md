# Plan — D2-15: Create Category Seeder

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-15 — Create Category Seeder

## Desired outcome

Create a Laravel category seeder for `Hotels`, `Restaurants`, and `Tours`, make rerunning that seeder safe, and register it with the application's `DatabaseSeeder`.

## Scope

### In scope

- Add `CategorySeeder` with the three categories and conventional lowercase slugs.
- Match existing records by their unique slug using `firstOrCreate`, so a second run does not create duplicates and does not overwrite existing row values.
- Call `CategorySeeder` from `DatabaseSeeder` so the categories are included in the standard seed command.
- Verify the dedicated `CategorySeeder` directly twice against PostgreSQL, then inspect the three target rows.

### Non-goals

- Changing `DatabaseSeeder`'s existing fixed-email sample-user seeding or making the full root seeder idempotent. The repeatability check is explicitly scoped to `CategorySeeder`.
- Adding or changing schema, models, factories, business data, or dependencies.
- Removing or rewriting existing category rows that do not match the three seeded slugs.
- Adding a PHPUnit database test: the configured test database is in-memory SQLite, while existing domain migrations issue PostgreSQL-specific `ALTER TABLE ... ADD CONSTRAINT` statements. The roadmap's required check is to run the seeder twice.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-15 data as `Hotels`, `Restaurants`, and `Tours`, and specifically requires running the seeder twice with a deliberate duplicate strategy.
- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` defines a required `name`, a unique `slug`, and timestamps. The unique slug is the correct lookup key for repeatable seed data.
- `backend/laravel/app/Models/Category.php` already exposes `name` and `slug` as fillable attributes; no model change is needed.
- `backend/laravel/database/seeders/DatabaseSeeder.php` currently creates a fixed-email sample user and does not call any domain seeders. As confirmed with the user, only the category seeder must be idempotent; leave that sample-user behavior unchanged and run `CategorySeeder` directly for repeatability verification.
- The live PostgreSQL migration status reports all nine migrations applied. A read-only category query found one unrelated `Temp Amenities Category` row and none of the three target slugs; the seeder and verification must leave unrelated rows intact.
- The user's scope clarification: make `CategorySeeder` idempotent and test it directly; do not expand the work to make the full `DatabaseSeeder` idempotent.
- The working tree was clean before plan creation; it now contains only this new plan. No applicable root `.ai/rules/index.md` or repository `*.instructions.md` files were present; `backend/laravel/AGENTS.md` and its Laravel/testing skill guidance apply.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — task data and acceptance check.
- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` — category schema and unique slug.
- `backend/laravel/app/Models/Category.php` — existing Eloquent model and fillable fields.
- `backend/laravel/database/seeders/DatabaseSeeder.php` — existing root seeder and sample-user behavior.
- `backend/laravel/phpunit.xml` and domain migrations — test database is SQLite, but migrations include PostgreSQL-specific constraint DDL.
- `backend/laravel/AGENTS.md` and `.agents/skills/laravel-best-practices/SKILL.md` — Laravel generation, Eloquent and project conventions.
- `.agents/skills/testing-best-practices/SKILL.md` — guidance for test selection and database isolation.
- `MEMORY.md` and live `php artisan migrate:status --database=pgsql --no-interaction` — project checkpoint and current migration state.

## Learning objectives

- A seeder supplies repeatable reference data for local development.
- Idempotence means running the same seed operation repeatedly yields the same seeded records rather than duplicates.
- A unique database key such as `categories.slug` gives the seeder a stable match key. `firstOrCreate` reuses a matching row and leaves any existing row values untouched.
- `DatabaseSeeder` can delegate to focused seeders, while the focused seeder can also be run directly for isolated verification.

## Ordered implementation steps

1. From `backend/laravel`, generate `CategorySeeder` with Artisan using `php artisan make:seeder CategorySeeder --no-interaction`.
2. Populate `Hotels`/`hotels`, `Restaurants`/`restaurants`, and `Tours`/`tours` with `Category::firstOrCreate` keyed by slug. This implements the agreed duplicate behavior without changing existing matching rows.
3. Register `CategorySeeder` in `DatabaseSeeder` while preserving its current sample-user seeding.
4. Run PHP syntax validation and Laravel Pint on changed PHP files.
5. Run `CategorySeeder` twice against PostgreSQL, inspect the target slugs and names, and confirm migration status remains unchanged. Do not delete or modify unrelated existing rows.

## Tests and verification

Run from `backend/laravel`:

```powershell
php artisan make:seeder CategorySeeder --no-interaction
php -l database\seeders\CategorySeeder.php
php -l database\seeders\DatabaseSeeder.php
vendor\bin\pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction
php artisan tinker --execute "dump(App\Models\Category::query()->whereIn('slug', ['hotels', 'restaurants', 'tours'])->orderBy('slug')->get(['name', 'slug'])->toArray());"
php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction
php artisan tinker --execute "dump(App\Models\Category::query()->whereIn('slug', ['hotels', 'restaurants', 'tours'])->orderBy('slug')->get(['name', 'slug'])->toArray());"
php artisan migrate:status --database=pgsql --no-interaction
```

Expected results:

- Both syntax checks and Pint complete successfully.
- Both dedicated seeder runs succeed.
- The read-only query after each seeder run returns the same three rows: exactly one each for `hotels`, `restaurants`, and `tours`, with the expected names. This verifies the second run does not increase the target-row count.
- Existing unrelated category rows remain untouched, and all nine migrations remain recorded as ran.
- No PHPUnit test is planned because the configured SQLite test database cannot run the existing PostgreSQL-specific domain migration DDL; the task's repeatability criterion is exercised directly on the configured PostgreSQL database.

## Risks, dependencies, and unresolved questions

- PostgreSQL must remain reachable for the repeatability check. It was reachable during analysis; if unavailable during implementation, report the blocker rather than switching databases or editing local service configuration.
- The three reference rows will persist in PostgreSQL after the verification commands, which is the intended seeder behavior.
- `firstOrCreate` intentionally does not rewrite a matching row's name. The unique slug prevents duplicate seeded keys on repeated runs, and unrelated records are preserved.
- The full `DatabaseSeeder` remains non-idempotent because of its fixed-email sample user; that is an explicit non-goal confirmed by the user.
- No unresolved questions remain.

## Implementation authorization

The user authorized implementation by invoking `/implement "docs/plans/d2-15-create-category-seeder.md"` after the plan was checked.

## Plan check

- Confirmed the roadmap's three category names, the categories table's unique slug, and the existing model's fillable attributes. Confirmed Artisan supports both `make:seeder --no-interaction` and `db:seed --class=... --database=pgsql`.
- Re-read the root seeder: its existing fixed-email user insert prevents using the whole `DatabaseSeeder` for repeatability checks. Kept the test scoped to the dedicated category seeder, as explicitly requested, without changing the sample-user behavior.
- Confirmed the PHPUnit environment uses in-memory SQLite while existing domain migrations contain PostgreSQL-only `ALTER TABLE ... ADD CONSTRAINT` statements. The plan uses the documented repeat-run acceptance check against PostgreSQL rather than adding a test that cannot run under the configured test database.
- The live database already has an unrelated temporary category. Preserved it as existing state and limited the verification query to the three expected slugs.
- Tightened verification to query the target rows after both the first and second runs, making the no-additional-rows result explicit rather than inferring it from a single final query.
- Confirmed all nine PostgreSQL migrations are already applied and the baseline has none of the target slugs.
- No scope change or unresolved decision remains.

- Plan check completed before implementation; see final status above.

## Implementation outcome

- Generated `backend/laravel/database/seeders/CategorySeeder.php` with Artisan. It seeds Hotels (`hotels`), Restaurants (`restaurants`), and Tours (`tours`) using `Category::firstOrCreate` keyed by the unique slug.
- Registered `CategorySeeder` in `DatabaseSeeder` without changing the existing fixed-email sample-user factory call.
- `vendor\bin\pint --dirty --format agent` completed successfully and removed an unused generated import. `php -l database\seeders\CategorySeeder.php` and `php -l database\seeders\DatabaseSeeder.php` both reported no syntax errors.
- Ran `php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction` twice; both completed successfully. After each run, a read-only Eloquent query returned exactly the same three target rows with the expected names and slugs. A query of all categories confirmed the pre-existing `Temp Amenities Category` row remained present.
- `php artisan migrate:status --database=pgsql --no-interaction` before and after showed the same nine migrations as ran. `php artisan db:table categories --database=pgsql --json` confirmed the unique slug index. `git diff --check` reported no whitespace errors.
- No PHPUnit test was added or run; the configured in-memory SQLite suite is incompatible with the existing PostgreSQL-specific domain migration DDL, and the planned acceptance check was run directly against PostgreSQL. The full `DatabaseSeeder` was not run because its existing fixed-email sample user is explicitly outside the idempotence scope.
- The three category rows now persist in the configured PostgreSQL database. No migrations, dependencies, or unrelated category rows were changed.

- **Final status:** Implemented — verified
