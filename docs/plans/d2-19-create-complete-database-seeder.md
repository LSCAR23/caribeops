# Plan — D2-19: Create Complete Database Seeder

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-19 — Create Complete Database Seeder

## Desired outcome

Make one explicit local development command rebuild the Laravel database and populate it with useful tourism-domain sample data: 3 categories, 20 amenities, 40 businesses, and 320 reviews. Associate businesses with amenities and reviews so the seeded records exercise the existing domain relationships and constraints.

## Scope

### In scope

- Extend `AmenitySeeder` from its existing 6 fixed amenities to a deterministic set of 20, using stable unique slugs and its existing `firstOrCreate` pattern.
- Add a focused business-data seeder that creates 40 businesses using `BusinessFactory`, ensures each canonical category is represented, links each business to one or more seeded amenities, and creates 8 `ReviewFactory` reviews per business (320 reviews total).
- Register the business-data seeder in `DatabaseSeeder` after categories and amenities are available, retaining the existing sample-user creation.
- Make `php artisan migrate:fresh --seed --database=pgsql --no-interaction` the single documented reset-and-seed command for a disposable local database.
- Verify the resulting counts, relationship coverage, and database constraints after the fresh rebuild.

### Non-goals

- No schema, migration, model, or dependency changes.
- No changes to the existing sample-user fields or `DatabaseSeeder`'s separate re-run behavior; the documented workflow resets first.
- No guarantee of geocoding accuracy or fixed Faker text; only the overall record counts and relational/data constraints are deterministic.
- Do not run a destructive reset against production, a shared database, or any database whose contents have not been confirmed disposable.
- No changes to frontend or API behavior.

## Analysis carried forward

- The D2-19 roadmap section in `docs/day-2-laravel-postgresql.md` lists approximately 3 categories, 15–30 amenities, 30–50 businesses, and 300+ reviews; its acceptance test is one command rebuilding useful development data.
- The user chose the destructive local reset interpretation: `migrate:fresh --seed`. This command drops all tables and data in the configured database before running migrations and seeders.
- `backend/laravel/database/seeders/DatabaseSeeder.php` currently creates a fixed-email sample user, then calls `CategorySeeder` and `AmenitySeeder`. The latter two are existing reference-data seeders.
- `CategorySeeder` already seeds the three canonical categories (Hotels, Restaurants, Tours) idempotently by slug.
- `AmenitySeeder` currently seeds six amenities idempotently by unique slug; the amenities schema requires `name` and unique `slug`.
- `BusinessFactory` generates required business fields and selects one of the canonical seeded categories. `ReviewFactory` generates the required review fields and a business relation with a rating from 1–5.
- `Business` exposes `amenities()` and `reviews()` relationships, and `business_amenities` has a unique business/amenity pair with cascading foreign keys. The reviews table requires a business foreign key; PostgreSQL constrains ratings to 1–5 and coordinates to valid latitude/longitude ranges.
- The Laravel tests use an in-memory SQLite database, but domain migration DDL includes PostgreSQL-specific constraints. A PostgreSQL fresh-rebuild smoke check is the appropriate verification path without changing test configuration.
- `docs/plans/d2-08-test-the-complete-migration-chain.md` remains `Checked — awaiting user approval`; the complete fresh migration chain has not been verified according to `MEMORY.md`. D2-19's requested `migrate:fresh --seed` command will run all migrations as part of the rebuild. If it fails before seeding, capture the exact failure and do not expand the task into unapproved migration changes.
- The user confirmed the destructive reset mode for this task. Verification must still target a database explicitly confirmed disposable, not assume that the current connection is safe to erase.
- Git status was clean during analysis. No `docs/plans/d2-19-create-complete-database-seeder.md` plan existed.
- The applicable Laravel best-practices and testing-best-practices guidance, `backend/laravel/AGENTS.md`, and existing seeder/factory/model/migration patterns were inspected. No applicable `.ai/rules` directory exists.
- No further material decisions remain unresolved.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-19 target counts and learning goal.
- `backend/laravel/database/seeders/DatabaseSeeder.php` — current root entry point and existing sample-user behavior.
- `backend/laravel/database/seeders/CategorySeeder.php` — 3 canonical reference categories.
- `backend/laravel/database/seeders/AmenitySeeder.php` — current six-item amenity seed list.
- `backend/laravel/database/factories/BusinessFactory.php` — required business fields and canonical category dependency.
- `backend/laravel/database/factories/ReviewFactory.php` — generated review fields and valid rating range.
- `backend/laravel/app/Models/Business.php` and `Amenity.php` — business/amenity relation.
- `backend/laravel/app/Models/Business.php` and `Review.php` — business/review relationships.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` — unique pivot pair and cascading foreign keys.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` — required review fields and business foreign key.
- `backend/laravel/database/migrations/2026_10_09_224223_add_rating_range_check_to_reviews_table.php` — PostgreSQL rating range constraint.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — PostgreSQL coordinate bounds.
- `backend/laravel/phpunit.xml` — SQLite test configuration.
- `backend/laravel/AGENTS.md` and `backend/laravel/.agents/skills/{laravel-best-practices,testing-best-practices}/` — applicable implementation and verification guidance.
- `docs/plans/d2-08-test-the-complete-migration-chain.md` and `MEMORY.md` — migration reset verification checkpoint.

## Learning objectives

- A seeder coordinates reference rows and related records in dependency order: categories and amenities first, then businesses, pivot associations, and reviews.
- Factories generate realistic row attributes; `for()` or a model relationship assigns the foreign key to an existing parent so related rows do not accidentally generate unrelated businesses.
- A many-to-many pivot stores each business/amenity association separately, and unique constraints prevent duplicate pairs.
- `migrate:fresh --seed` is a destructive local-development workflow: it removes existing tables/data, reapplies all migrations, then runs the root seeder. It is not a safe substitute for production migrations or non-destructive data updates.
- Fixed target counts make the sample dataset reproducible in size while Faker keeps individual attributes varied.

## Ordered implementation steps

1. Extend `AmenitySeeder` to contain 20 fixed name/slug pairs, preserving its six existing amenities and `firstOrCreate` behavior. Twenty is within the roadmap's 15–30 range and makes total counts directly verifiable.
2. Generate a focused `BusinessDataSeeder` with Artisan and create 40 businesses after canonical categories and amenities are seeded. Create one initial business in each of Hotels, Restaurants, and Tours with a category-appropriate type; generate the remaining 37 through the default `BusinessFactory`. Reuse the factory for business attributes and existing Eloquent relationships for amenity associations.
3. Generate exactly 8 reviews for each created business using `ReviewFactory` with an explicit business relationship, resulting in 320 related reviews. This reuses both factories while ensuring review creation does not generate extra, uncounted businesses.
4. Register the business-data seeder in `DatabaseSeeder` after `CategorySeeder` and `AmenitySeeder`; retain the existing test user, which is valid on a fresh database.
5. Run PHP syntax checks and Pint on changed PHP files.
6. Against a disposable local PostgreSQL database, run `php artisan migrate:fresh --seed --database=pgsql --no-interaction`. Do not run it against an unconfirmed/shared/production database.
7. Use read-only Laravel queries to confirm exactly 3 categories, 20 amenities, 40 businesses, and 320 reviews; confirm every business has at least one amenity, every business has 8 reviews, all review ratings and business coordinates meet their database ranges, and every foreign key points to an existing parent.

## Tests and verification

Run from `backend/laravel`:

```powershell
php artisan make:seeder BusinessDataSeeder --no-interaction
php -l database\seeders\AmenitySeeder.php
php -l database\seeders\BusinessDataSeeder.php
php -l database\seeders\DatabaseSeeder.php
vendor\bin\pint --dirty --format agent
```

After confirming the PostgreSQL database is disposable, rebuild it:

```powershell
php artisan migrate:fresh --seed --database=pgsql --no-interaction
```

Then inspect the database with read-only queries (for example, a bounded Tinker assertion/query) and verify:

- The full migration command completes without manual database fixes.
- There are exactly 3 categories, 20 amenities, 40 businesses, and 320 reviews; each canonical category is represented by at least one business.
- All 40 businesses have at least one associated amenity and exactly 8 reviews.
- Business coordinates satisfy inclusive bounds; review ratings are within 1–5; all relationship foreign keys resolve.
- The migration history contains the complete applied migration chain.

Expected result is a cleanly rebuilt development database with consistent, useful relational sample data. PHPUnit is not expected to exercise the PostgreSQL-only migration constraints because the configured suite database is SQLite; do not change the test database configuration for this task.

## Risks, dependencies, and unresolved questions

- `migrate:fresh` irreversibly drops existing tables and data in the selected database. Use only a disposable local PostgreSQL database, and verify connection/environment before execution. Do not add `--force` or target a production environment.
- A complete reset also executes all nine migrations; D2-08's prior migration-chain check remains unimplemented. If the migration chain fails, record the failing migration/output and stop for plan review rather than making out-of-scope migration fixes.
- The business factory requires the three canonical categories, so `DatabaseSeeder` ordering is material.
- Reviews should explicitly associate to the created businesses to prevent the default `ReviewFactory` from creating additional businesses and making target counts misleading.
- No material implementation choice remains unresolved.

## Plan check

- Confirmed the roadmap's approximate ranges and translated them into measurable targets: 3 categories, 20 amenities, 40 businesses, and 320 reviews.
- Confirmed the current root seeder's dependency order, existing `firstOrCreate` reference-data patterns, canonical category requirement in `BusinessFactory`, related model factories, and the business/amenity/review schema constraints.
- Added deterministic category representation: seed one category-appropriate business per canonical category before creating the other 37 with the default factory. This avoids relying on random category selection to cover every category.
- Confirmed `migrate:fresh --seed` drops data before running all migrations and seeders. The chosen verification is limited to a disposable local PostgreSQL database; the current connection must not be presumed safe to reset.
- Kept verification PostgreSQL-backed because the configured in-memory SQLite test database cannot run the PostgreSQL-specific domain constraints. The full reset will also exercise the previously unverified migration chain; a migration failure remains outside D2-19 and needs separate review.
- Confirmed no existing D2-19 plan was overwritten. The working tree was clean before this plan was created; no application code, tests, builds, or database commands were run during orchestration.
- No unresolved decisions remain.

## Reminder

The user authorized implementation by invoking `/implement "docs/plans/d2-19-create-complete-database-seeder.md"`.

## Implementation outcome

- Extended `AmenitySeeder` to 20 unique fixed name/slug pairs, retaining `firstOrCreate`.
- Added `BusinessDataSeeder` to create 40 businesses with at least one per canonical category, attach 1–4 amenities to each, and create 8 reviews for each explicitly associated business.
- Registered `BusinessDataSeeder` after the reference seeders in `DatabaseSeeder`, retaining the existing sample user.
- Documented `php artisan migrate:fresh --seed --database=pgsql --no-interaction` in the D2-19 roadmap entry with an explicit destructive-use warning.
- PHP syntax checks for `AmenitySeeder.php`, `BusinessDataSeeder.php`, and `DatabaseSeeder.php` passed. `vendor\bin\pint --dirty --format agent` passed.
- Laravel reported environment `local`, default connection `pgsql`, and configured database name `caribeops`. The user explicitly confirmed that database is disposable before the approved reset was run.
- `php artisan migrate:fresh --seed --database=pgsql --no-interaction` completed successfully; all nine migrations ran and all three root seeders completed.
- A read-only PostgreSQL Tinker assertion confirmed exactly 3 categories, 20 amenities, 40 businesses, and 320 reviews; all three categories are represented; each business has at least one amenity and exactly 8 reviews; ratings span 1–5; and all business coordinates are within the database's allowed ranges.
- PHP syntax checks passed for the three changed seeders; `vendor\bin\pint --dirty --format agent` passed; `git diff --check` passed.
- PHPUnit was not run; PostgreSQL migration and seed assertions directly verified the database constraints, while the in-memory SQLite PHPUnit configuration cannot apply the PostgreSQL-specific domain constraints.

## Re-verification — 2026-10-10 (no code changes)

- No seeder, model, migration, or dependency changes were needed; current `AmenitySeeder.php`, `BusinessDataSeeder.php`, and `DatabaseSeeder.php` already match the approved plan.
- `php -l database\seeders\AmenitySeeder.php`, `php -l database\seeders\BusinessDataSeeder.php`, `php -l database\seeders\DatabaseSeeder.php` each reported no syntax errors.
- `vendor\bin\pint --dirty --format agent` passed (`{"tool":"pint","result":"passed"}`); `git diff --check` passed with no whitespace errors; `git status` remained clean.
- Read-only PostgreSQL Tinker counts confirmed 3 categories, 20 amenities, 40 businesses, and 320 reviews; distinct business categories = 3; businesses with != 8 reviews = 0; businesses with 0 amenities = 0; review rating min/max = 1/5; out-of-range coordinates = 0.
- `php artisan migrate:fresh --seed` was not re-run: no fresh disposable-DB confirmation exists in this session, and the plan forbids destructive resets against unconfirmed databases. PHPUnit was not run (SQLite in-memory config cannot apply PostgreSQL-specific domain constraints).
