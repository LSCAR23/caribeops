# Plan — D2-13: Define Business → Amenities

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-13 — Define Business → Amenities

## Desired outcome

Ensure the `Business` model can attach and retrieve amenities through the `business_amenities` pivot, using Eloquent's `belongsToMany` relationship contract and keeping the project aligned with the repository's minimal model pattern.

## Scope

### In scope

- Confirm or define the `Business::amenities()` relation in `backend/laravel/app/Models/Business.php`.
- Keep the many-to-many association aligned with the existing `business_amenities` pivot and the `Amenity` inverse relation.
- Verify the relationship can attach an amenity and retrieve it through Eloquent without leaving persisted data behind.

### Non-goals

- No migration or schema changes. The pivot table already exists from earlier D2-05 work.
- No controller, request validation, or API-layer work.
- No broader cleanup beyond the explicit business-amenity relation needed for D2-13.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-13 as “Define Business → Amenities,” with the learning goal to practice `belongsToMany` and pivot tables.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` already defines the pivot table with `business_id` and `amenity_id` columns and a unique compound constraint.
- The repository currently contains an explicit `Business::amenities()` relation in `backend/laravel/app/Models/Business.php` and the inverse `Amenity::businesses()` relation in `backend/laravel/app/Models/Amenity.php`.
- The model pattern in this repo is intentionally minimal and explicit: fillable fields are defined on the model, and relationship methods are implemented directly against the existing schema instead of abstracting away the pivot table.
- The live migration state shows the relevant `amenities` and pivot migrations already applied, so this task should validate or preserve the current relation rather than assume a fresh schema state.
- No unresolved user or scope decisions block planning.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-13 roadmap entry and learning objective.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` — pivot schema that defines the many-to-many association.
- `backend/laravel/app/Models/Business.php` — current `amenities()` `belongsToMany` definition.
- `backend/laravel/app/Models/Amenity.php` — inverse `businesses()` relationship to the same pivot.
- `backend/laravel/AGENTS.md` — project convention to keep model declarations explicit and aligned with database schema.
- `MEMORY.md` — current project checkpoint confirming the live migration state and recent model work.

## Learning objectives

- A many-to-many relationship between `Business` and `Amenity` is expressed through a pivot table and Eloquent `belongsToMany()`.
- Pivot tables are not just storage details; they define the relationship contract and the uniqueness rules that Eloquent models must respect.
- Minimal Eloquent models are most useful when they mirror the exact database structure and do not add unnecessary abstraction.

## Ordered implementation steps

1. Inspect the `business_amenities` pivot and the existing `Business`/`Amenity` model definitions to confirm the exact relation contract.
2. If the relation is missing or mis-scoped, add the `Business::amenities()` method with `belongsToMany(Amenity::class, 'business_amenities')`.
3. Keep the inverse relation on `Amenity` consistent with the pivot name and the established project pattern.
4. Run PHP syntax validation and formatter checks for the affected models.
5. Use a transaction-safe PostgreSQL smoke test to create temporary business and amenity rows, attach the amenity to the business, and verify the relationship resolves without leaving data behind.
6. Confirm migration status remains unchanged after the smoke test.

## Tests and verification commands

Run from `backend/laravel`:

```powershell
php -l app/Models/Business.php
php -l app/Models/Amenity.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
```

Also run a focused PostgreSQL-backed relationship smoke check such as:

```powershell
php artisan tinker --execute "DB::beginTransaction(); \$category = App\\Models\\Category::query()->first() ?? App\\Models\\Category::query()->create(['name' => 'Temp Amenities Category', 'slug' => 'temp-amenities-category']); \$business = App\\Models\\Business::query()->create(['category_id' => \$category->id, 'name' => 'Temp Amenities Business', 'description' => 'Temporary amenity smoke check', 'type' => 'Restaurant', 'address' => '123 Test St', 'latitude' => 12.34, 'longitude' => 56.78, 'phone' => '1234567890']); \$amenity = App\\Models\\Amenity::query()->create(['name' => 'Temp Amenity', 'slug' => 'temp-amenity']); \$business->amenities()->attach(\$amenity->id); dump(App\\Models\\Business::query()->with('amenities')->find(\$business->id)?->amenities->count()); DB::rollBack();"
```

Expected results:

- The affected model files parse without PHP syntax errors.
- The project formatter accepts the final model declarations.
- Eloquent can attach an amenity to a business and return the related count without application errors.
- The database state remains unchanged after the smoke check and any temporary rows are rolled back.

## Risks, dependencies, and unresolved questions

- Verification depends on the PostgreSQL service being available and reachable from the Laravel app.
- The smoke test must use a transaction and temporary rows so it proves the relationship without leaving data behind.
- No unresolved user or scope questions remain; the task remains limited to the many-to-many business-to-amenities relation contract.

## Plan check

- Confirmed the D2-13 acceptance goal matches the roadmap: a business should expose and retrieve amenities through the pivot table.
- Verified that the repository already contains the pivot migration and both model-side relationship declarations, so this task is a relationship validation exercise rather than a schema change.
- Challenged the validation approach and kept it transaction-safe: it should attach a temporary amenity to a business, load the Eloquent relation, and then roll back to avoid any data drift.
- Confirmed the repo pattern is to keep the Eloquent model declarations explicit and aligned with the central pivot table rather than adding hidden abstractions.
- No material user preference remains unresolved.

## Implementation outcome

- The repository already had the required `Business::amenities()` and `Amenity::businesses()` Eloquent relationship methods in place.
- The task was implemented as a confirmation/verification step: no schema or migration changes were necessary because the `business_amenities` pivot and the related model declarations already matched the required contract.
- Validation ran successfully:
  - `php -l app/Models/Business.php` — no syntax errors
  - `php -l app/Models/Amenity.php` — no syntax errors
  - `vendor/bin/pint --dirty --format agent` — passed
  - `php artisan migrate:status --database=pgsql --no-interaction` — all relevant migrations applied and unchanged
  - A transaction-safe temporary Laravel script attached an amenity to a newly created business and returned a related count of `1` before the transaction closed, proving the `belongsToMany` relationship works in the live app.

## Reminder

The approved D2-13 implementation is complete and verified.
