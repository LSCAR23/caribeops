# Plan — D2-11: Create Amenity Model

- **Date:** 2026-10-09
- **Status:** Checked — awaiting user approval
- **Task:** D2-11 — Create Amenity Model

## Desired outcome

Add the Eloquent `Amenity` model so the existing `amenities` table can be queried and related to the businesses that reference it through the many-to-many `business_amenities` pivot.

## Scope

### In scope

- Create `backend/laravel/app/Models/Amenity.php` in the `App\Models` namespace.
- Define the model so it matches the `amenities` table schema and the project's Eloquent conventions.
- Add the `businesses()` relationship to represent the many-to-many association with `Business` through `business_amenities`.
- Verify the model can load an amenity and access its related businesses without leaving persisted data behind.

### Non-goals

- No migration or schema changes. The `amenities` table and the `business_amenities` pivot already exist from earlier D2-04 and D2-05 work.
- No factory, seeder, request validation, controller, or API resource changes.
- No broader cleanup beyond the minimal model and its relationship contract needed for D2-11.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-11 as “Create Amenity Model,” and its learning objective is that reference entities can be shared by multiple businesses.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` defines `amenities` with `name`, `slug` (unique), and Laravel timestamps. The table follows Laravel’s conventional naming pattern and does not require custom table or timestamp configuration.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` defines the `business_amenities` pivot with `business_id` and `amenity_id` foreign keys and a unique pair constraint, which is the basis for the `belongsToMany()` relation.
- The repository currently has `App\Models\User`, `App\Models\Category`, and the earlier D2-10 `App\Models\Business` model. There is no `Amenity` model yet, and no amenity-model relationship logic exists in the current code.
- `App\Models\Business` already includes the `category()` `belongsTo` relationship, so the new `Amenity` model should follow the same project conventions and keep scope narrow: model fields plus a `businesses()` relationship.
- The live PostgreSQL migration status is already recorded as run for the categories, businesses, amenities, and pivot migrations. The D2-11 model work should not assume a fresh migration state or change database data.
- No unresolved user decisions block planning.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-11 scope and learning goal.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — existing `amenities` schema.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` — pivot table and unique key that define the many-to-many relationship.
- `backend/laravel/app/Models/Business.php` — the repository pattern for a minimal domain model with a specific relation.
- `backend/laravel/app/Models/Category.php` — simple Eloquent model pattern used in this project.
- `backend/laravel/app/Models/User.php` — current project model conventions and namespace usage.
- `backend/laravel/AGENTS.md` and the Laravel best-practice skill files — repository guidance to keep models narrow and relation declarations explicit.
- `MEMORY.md` — current repository checkpoint confirming the live migration state and earlier D2-10 model implementation.

## Learning objectives

- A many-to-many relationship is represented by a pivot table and translated into Eloquent via `belongsToMany()`.
- A reference entity such as `Amenity` can be shared by multiple businesses without duplicating business-specific data in each row.
- Model-level relationship declarations should reflect the actual database schema precisely and remain minimal for the requested task.

## Ordered implementation steps

1. Inspect the existing `amenities` and `business_amenities` schema and compare it to the existing `Business` and `Category` model patterns.
2. Generate `backend/laravel/app/Models/Amenity.php` with Artisan, then review the generated class to keep it consistent with repository conventions.
3. Add the model’s fillable field list and the `businesses()` relationship using `belongsToMany(Business::class, 'business_amenities')` with the explicit pivot table name.
4. Run PHP syntax validation and Laravel Pint formatting checks for the model.
5. Use a short PostgreSQL smoke test in a transaction to create temporary business/amenity rows, associate them via the pivot, and verify that `Amenity::with('businesses')->first()` resolves the related businesses before rolling back.
6. Confirm the migration status remains unchanged after the smoke check.

## Tests and verification commands

Run from `backend/laravel`:

```powershell
php artisan make:model Amenity --no-interaction
php -l app/Models/Amenity.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
```

Also run a focused PostgreSQL-backed relationship smoke check such as:

```powershell
php artisan tinker --execute "DB::beginTransaction(); \$category = App\\Models\\Category::query()->first() ?? App\\Models\\Category::query()->create(['name' => 'Temp Amenity Category', 'slug' => 'temp-amenity-category']); \$business = App\\Models\\Business::query()->create(['category_id' => \$category->id, 'name' => 'Temp Amenity Business', 'description' => 'Temporary smoke check', 'type' => 'Restaurant', 'address' => '123 Test St', 'latitude' => 12.34, 'longitude' => 56.78, 'phone' => '1234567890']); \$amenity = App\\Models\\Amenity::query()->create(['name' => 'Temp Amenity', 'slug' => 'temp-amenity']); \$business->amenities()->attach(\$amenity->id); dump(App\\Models\\Amenity::query()->with('businesses')->find(\$amenity->id)?->businesses->count()); DB::rollBack();"
```

Expected results:

- The model file parses without PHP syntax errors.
- The project formatter accepts the model and relationship declaration.
- Eloquent can load an amenity and access its related businesses without application errors.
- The database remains unchanged after the smoke check and any temporary rows are rolled back.

## Risks, dependencies, and unresolved questions

- Verification depends on the configured PostgreSQL service being available and reachable from the Laravel app.
- The many-to-many check may need temporary rows in a transaction so the relation is exercised meaningfully without leaving data behind.
- No unresolved user or scope questions remain; the task remains limited to the `Amenity` Eloquent model and its `businesses()` relationship contract.

## Plan check

- Confirmed the D2-11 acceptance goal matches the project roadmap: an amenity model should demonstrate a shared resource used by multiple businesses.
- Verified that the repository already contains the `amenities` migration and the `business_amenities` pivot, so this task is a model-only relationship exercise and not a schema change.
- Challenged the verification approach and kept the smoke check transaction-safe: it should create temporary business and amenity rows, load the relationship via Eloquent, and then roll back to avoid leaving data behind.
- Confirmed that the current app already includes `Business` and `Category` models with narrow project conventions, so the new `Amenity` model should stay similarly focused and explicit.
- No material user preference remains unresolved.

## Reminder

Implementation is not authorized until the user checks the plan and invokes `/implement "docs/plans/d2-11-create-amenity-model.md"`.
