# Plan — D2-17: Create Business Factory

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-17 — Create Business Factory

## Desired outcome

Create a Laravel factory that generates valid, realistic business records across the seeded Hotels, Restaurants, and Tours categories, with varied locations. Make `Business::factory()` available through Eloquent's `HasFactory` trait.

## Scope

### In scope

- Add `database/factories/BusinessFactory.php` with Faker values for all required business fields and valid coordinates.
- Choose category IDs from the three canonical categories created by `CategorySeeder`; require those seeded rows as a prerequisite and do not use unrelated categories.
- Generate category-appropriate business types using the examples in the business entity design.
- Add Laravel's `HasFactory` trait to `Business` so the model exposes the factory API.
- Verify repeated business creation across the three categories and distinct locations against PostgreSQL inside a transaction that is rolled back.

### Non-goals

- Creating a `CategoryFactory` or changing `CategorySeeder`; D2-17 will depend on the already implemented category reference data.
- Changing database schema, migrations, business model fields or relationships (other than enabling its factory), application endpoints, or dependencies.
- Creating a large volume of permanent sample businesses or changing existing business rows.
- Adding a test-only dependency or changing the SQLite PHPUnit database configuration.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-17 as creating realistic businesses with different categories and locations, and checking that the factory creates valid records repeatedly.
- `docs/business-entity-design.md` identifies Hotels, Restaurants, and Tours as broad categories, and Boutique hotel, Hostel, Café, and Snorkeling tour as representative specific business types.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` requires `category_id`, `name`, `description`, `type`, `address`, `latitude`, `longitude`, and `phone`; website may be null. PostgreSQL constraints limit latitude to -90..90 and longitude to -180..180.
- `backend/laravel/app/Models/Business.php` already declares the matching fillable attributes and the `category()`, `amenities()`, and `reviews()` relationships, but does not use `HasFactory`. The existing `User` model demonstrates Laravel's `HasFactory` pattern.
- No `BusinessFactory` or `CategoryFactory` exists. The existing `CategorySeeder` supplies Hotels, Restaurants, and Tours and uses deterministic slugs; `DatabaseSeeder` calls it.
- The user's decision: BusinessFactory should choose among existing seeded categories; seeded category data is a prerequisite. Do not add a CategoryFactory.
- The live PostgreSQL database contains the three canonical categories, an unrelated temporary category, and existing business rows. The factory should limit its category query to the three canonical category slugs and test inserts must not persist.
- PHPUnit uses in-memory SQLite (`backend/laravel/phpunit.xml`), while the business migration uses PostgreSQL-specific `ALTER TABLE ... ADD CONSTRAINT` statements. A PostgreSQL transaction-safe factory smoke test is the planned verification path.
- `backend/laravel/AGENTS.md`, `backend/laravel/.agents/skills/laravel-best-practices/SKILL.md`, and `backend/laravel/.agents/skills/testing-best-practices/SKILL.md` apply. The user had a clean working tree before the plan was created; the branch is one commit ahead of origin. No D2-17 plan file existed.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-17 task and acceptance check.
- `docs/business-entity-design.md` — domain examples and requiredness guidance.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — required columns and coordinate constraints.
- `backend/laravel/app/Models/Business.php` — existing model fields and relationships; `HasFactory` is absent.
- `backend/laravel/app/Models/User.php` — project example for `HasFactory`.
- `backend/laravel/database/factories/UserFactory.php` — existing factory structure and Faker conventions.
- `backend/laravel/database/seeders/CategorySeeder.php` and `DatabaseSeeder.php` — canonical category reference data and registration.
- `backend/laravel/phpunit.xml` and business migration — SQLite test configuration and PostgreSQL-only constraint DDL.
- `backend/laravel/AGENTS.md`, `backend/laravel/.agents/skills/laravel-best-practices/SKILL.md`, and `backend/laravel/.agents/skills/testing-best-practices/SKILL.md` — applicable implementation and verification guidance.
- `MEMORY.md` and live database inspection — current checkpoint, categories, and existing records.

## Learning objectives

- Laravel factories use Faker to produce repeatable shapes of synthetic data without hard-coding each record.
- `HasFactory` exposes `Business::factory()` and ties an Eloquent model to its conventional factory.
- A required foreign key means test data must use a real parent record; in this project, `CategorySeeder` provides the predefined reference categories.
- Database constraints are the final validity check for generated records, including coordinate bounds.

Concept note: a factory definition is a recipe, not an insert by itself. `make()` builds models in memory; `create()` persists them and exercises foreign keys, timestamps, and database constraints. This plan uses `create()` only within a transaction and rolls it back after checking the results.

## Ordered implementation steps

1. From `backend/laravel`, generate `BusinessFactory` with `php artisan make:factory BusinessFactory --model=Business --no-interaction`.
2. Add the `HasFactory` trait and factory generic PHPDoc to `Business`, following the existing `User` model pattern.
3. Define realistic Faker values for the required fields, an optional website, and valid Faker-generated latitude/longitude. Use a canonical seeded category chosen by its `hotels`, `restaurants`, or `tours` slug, and keep the generated `type` consistent with that category.
4. Run PHP syntax validation and Laravel Pint on the factory and changed model.
5. Ensure the three canonical categories exist with the idempotent `CategorySeeder`, then create multiple businesses for each category inside a PostgreSQL transaction. Confirm category and location variety and valid persisted rows, then roll back the transaction and confirm no business rows were left by the smoke test.

## Tests and verification

Run from `backend/laravel`:

```powershell
php artisan make:factory BusinessFactory --model=Business --no-interaction
php -l database\factories\BusinessFactory.php
php -l app\Models\Business.php
vendor\bin\pint --dirty --format agent
php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction
```

Use this transaction-safe PostgreSQL smoke test. PowerShell here-strings preserve the PHP string literals passed to Tinker:

```powershell
$code = @'
config()->set('database.default', 'pgsql'); $before = App\Models\Business::query()->count(); DB::beginTransaction(); try { $categories = App\Models\Category::query()->whereIn('slug', ['hotels', 'restaurants', 'tours'])->get(); $types = ['hotels' => ['Boutique hotel', 'Hostel'], 'restaurants' => ['Café', 'Seafood restaurant'], 'tours' => ['Snorkeling tour', 'Guided tour']]; if ($categories->count() !== 3) { throw new \RuntimeException('Expected all three seeded categories.'); } $businesses = $categories->flatMap(fn ($category) => App\Models\Business::factory()->count(2)->for($category)->state(['type' => fake()->randomElement($types[$category->slug])])->create()); $categoryCount = $businesses->pluck('category_id')->unique()->count(); $locationCount = $businesses->unique(fn ($business) => $business->latitude . ',' . $business->longitude)->count(); $invalidType = $businesses->contains(fn ($business) => ! in_array($business->type, $types[$categories->firstWhere('id', $business->category_id)->slug], true)); if ($businesses->count() !== 6 || $categoryCount !== 3 || $locationCount !== 6 || $invalidType) { throw new \RuntimeException('Factory output did not meet the category, type, and location checks.'); } dump(['created' => $businesses->count(), 'categories' => $categoryCount, 'distinct_locations' => $locationCount, 'category_types_valid' => ! $invalidType]); } finally { DB::rollBack(); } if (App\Models\Business::query()->count() !== $before) { throw new \RuntimeException('Business count was not restored after rollback.'); } dump('Transaction rolled back; business count restored.');
'@
php artisan tinker --execute $code
```

Also validate default category/type selection without inserting rows:

```powershell
$code = @'
config()->set('database.default', 'pgsql'); $categories = App\Models\Category::query()->whereIn('slug', ['hotels', 'restaurants', 'tours'])->get()->keyBy('id'); $types = ['hotels' => ['Boutique hotel', 'Hostel'], 'restaurants' => ['Café', 'Seafood restaurant'], 'tours' => ['Snorkeling tour', 'Guided tour']]; $businesses = App\Models\Business::factory()->count(30)->make(); $invalid = $businesses->contains(fn ($business) => ! $categories->has($business->category_id) || ! in_array($business->type, $types[$categories->get($business->category_id)->slug], true)); if ($businesses->count() !== 30 || $invalid) { throw new \RuntimeException('Default factory output contained an invalid category or category/type pair.'); } dump(['default_models' => $businesses->count(), 'all_categories_are_canonical' => ! $businesses->contains(fn ($business) => ! $categories->has($business->category_id)), 'category_types_valid' => ! $invalid]);
'@
php artisan tinker --execute $code
```

The successful inserts exercise the database's required-column, foreign-key, and coordinate constraints. The transaction smoke test requires six persisted records across the three categories with distinct generated coordinate pairs and category-appropriate types, then verifies that rollback restores the original business count. The in-memory check validates 30 default factory models against the canonical category/type mapping.

Expected results:

- Both PHP syntax checks and Pint pass.
- The factory creates six valid persisted records with all three canonical categories, distinct locations, and category-appropriate types during the smoke test; an additional 30 in-memory defaults use only canonical category/type pairs.
- The smoke-test transaction is rolled back; no test-created business rows remain.
- PHPUnit is not run because its configured SQLite database cannot apply the existing PostgreSQL-specific domain migration DDL.

## Risks, dependencies, and unresolved questions

- CategorySeeder must have created the three canonical category rows before BusinessFactory can be used. If they are missing, seed them explicitly; do not fabricate a new category or silently substitute the unrelated temporary category.
- Faker-generated data is synthetic. Coordinates will be constrained to valid latitude/longitude ranges, but the plan does not claim that a generated coordinate is geocoded to its generated address.
- Factory verification requires PostgreSQL. If that service is unavailable, report the blocker rather than changing database configuration or leaving persistent test records.
- No unresolved questions remain.

## Plan check

- Confirmed the factory/model paths, required business attributes, coordinate constraints, category slugs, existing `HasFactory` convention, Artisan factory-generation options, and SQLite/PostgreSQL test-configuration mismatch against current source and project instructions.
- Corrected the Laravel/testing skill paths to their actual `backend/laravel/.agents/skills/` locations.
- Replaced the high-level smoke-test description with a PostgreSQL Tinker command that checks six records, all three category relationships, distinct coordinates, database acceptance, and restoration of the business count after rollback. This avoids permanent test data or changes to stored database configuration.
- Removed the unrelated migration-status check; this task does not modify migrations or schema.
- Confirmed there are no root `.ai/rules` files to apply, no existing D2-17 plan to overwrite, and no application code has been changed during orchestration.
- No material decisions remain unresolved.

## Implementation outcome

- `backend/laravel/app/Models/Business.php` now uses `HasFactory<BusinessFactory>`.
- `backend/laravel/database/factories/BusinessFactory.php` now generates valid business attributes and selects a canonical seeded category with a matching specific type.
- `php artisan make:factory BusinessFactory --model=Business --no-interaction` generated the factory; Laravel reported framework version 13.35.0.
- `php -l database\factories\BusinessFactory.php` and `php -l app\Models\Business.php` both reported no syntax errors; `vendor\bin\pint --dirty --format agent` completed successfully.
- `php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction` completed successfully.
- PostgreSQL transaction smoke test created six valid records across Hotels, Restaurants, and Tours, with six distinct coordinate pairs and valid category/type pairs; rollback restored the pre-test business count.
- A separate PostgreSQL `make()` check generated 30 default models and confirmed every category and specific type was canonical and correctly paired.
- PHPUnit was not run; it is configured for in-memory SQLite, while the business migration uses PostgreSQL-specific constraint DDL. No migration, schema, or permanent business-row changes were made.
