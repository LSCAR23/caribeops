# Plan — D2-14: Define Business → Reviews

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-14 — Define Business → Reviews

## Desired outcome

Add the parent-side `hasMany` relationship on `Business` so a business can load multiple reviews through Eloquent, while keeping the existing `Review::business()` `belongsTo` relation intact and following the repo’s minimal model pattern.

## Scope

### In scope

- Define the `Business::reviews()` relationship in `backend/laravel/app/Models/Business.php`.
- Keep the `Review` model's `business()` relation aligned with the `reviews.business_id` foreign key.
- Verify the relationship can load multiple review rows from a business without leaving test data behind.

### Non-goals

- No migration or schema changes. The `reviews` table and parent foreign key already exist.
- No controller, request validation, or API-layer work.
- No broader cleanup beyond the explicit `Business -> Review` relationship needed for D2-14.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-14 as “Define Business → Reviews,” with the learning goal to practice the `hasMany` relationship.
- The repository already includes `backend/laravel/app/Models/Review.php`, which defines the child-side `business(): BelongsTo` relation back to `Business::class`.
- The `reviews` migration (`backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php`) confirms the actual schema: `reviews.business_id` is a foreign key to `businesses.id` with cascade-on-delete.
- The repository pattern for these model tasks is minimal and explicit: models declare only the fillable fields and relationship methods needed for the existing database structure.
- The immediate missing piece for D2-14 is the parent-side `Business::reviews()` method, which should use `hasMany(Review::class)` and match the child-side `belongsTo` relationship already in place.
- No unresolved user or scope decisions block planning.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-14 roadmap entry and learning objective.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` — review table schema with `business_id` foreign key.
- `backend/laravel/app/Models/Review.php` — existing child-side `business()` `belongsTo` relation.
- `backend/laravel/app/Models/Business.php` — current parent model, which already has `category()` and `amenities()` but not yet `reviews()`.
- `backend/laravel/AGENTS.md` — project convention to keep model declarations explicit and aligned with the database schema.
- `MEMORY.md` — current project checkpoint capturing the verified work for Categories, Amenities, and Reviews.

## Learning objectives

- A one-to-many relationship is expressed in Laravel by a parent model exposing `hasMany()` and a child model exposing `belongsTo()`.
- The `hasMany` relationship uses the child table’s foreign key to traverse from parent to children without needing a pivot table.
- Eloquent can efficiently load all related reviews for a business while preserving the same data model used in PostgreSQL.

## Ordered implementation steps

1. Inspect the existing `reviews` schema and the `Review` model to confirm the child-side relation contract.
2. Add `Business::reviews()` as a `hasMany(Review::class)` relation in `backend/laravel/app/Models/Business.php`.
3. Keep the `Review::business()` relationship unchanged and consistent with the `Business` model naming.
4. Run PHP syntax validation and formatter checks for the touched models.
5. Execute a transaction-safe smoke test that creates a temporary business and multiple review rows, loads the business's `reviews`, and verifies the related count before rolling back.
6. Confirm the migration status remains unchanged after the test.

## Tests and verification commands

Run from `backend/laravel`:

```powershell
php -l app/Models/Business.php
php -l app/Models/Review.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
```

Also run a focused PostgreSQL-backed smoke test:

```powershell
php artisan tinker --execute "DB::transaction(function () { $business = App\\Models\\Business::query()->first() ?? App\\Models\\Business::query()->create(['category_id' => App\\Models\\Category::query()->first()->id, 'name' => 'Temp Reviews Business', 'description' => 'Temporary review smoke check', 'type' => 'Hotel', 'address' => '123 Test St', 'latitude' => 12.34, 'longitude' => 56.78, 'phone' => '1234567890']); $business->reviews()->create(['rating' => 5, 'title' => 'Great stay', 'content' => 'Very clean and comfortable.', 'review_date' => '2026-10-09']); $business->reviews()->create(['rating' => 4, 'title' => 'Solid service', 'content' => 'Friendly staff and good value.', 'review_date' => '2026-10-09']); dump(App\\Models\\Business::query()->with('reviews')->find($business->id)?->reviews->count()); });"
```

Expected results:

- The affected model files parse without syntax errors.
- The project formatter accepts the final model declarations.
- Eloquent can create multiple reviews for one business and return the correct count via `business->reviews`.
- The database state remains unchanged after the smoke test because the transaction is rolled back.

## Risks, dependencies, and unresolved questions

- Verification depends on the PostgreSQL service being available and reachable from the Laravel app.
- The smoke test must use a transaction and temporary review rows so it proves the relationship without leaving data behind.
- No unresolved material questions remain; the task is limited to the `Business` parent-side `hasMany` definition and validation.

## Plan check

- Confirmed the D2-14 acceptance goal matches the roadmap: a business should expose multiple child reviews through the `reviews` table.
- Verified the schema and child relationship already exist in the repo, so the missing work is the parent-side `hasMany` relation rather than a migration change.
- Compared the existing `Review` model and the `reviews` schema to confirm the correct naming and relationship direction.
- Kept validation transaction-safe and limited to the approved scope so the learning objective stays focused on `hasMany` behavior.
- No material user preference remains unresolved.

## Implementation outcome

- Added the missing `Business::reviews()` `hasMany` relation in `backend/laravel/app/Models/Business.php`.
- Kept the existing `Review::business()` `belongsTo` relation intact and aligned with the `reviews.business_id` foreign key.
- Ran the required validation:
  - `php -l app/Models/Business.php` — no syntax errors
  - `php -l app/Models/Review.php` — no syntax errors
  - `vendor/bin/pint --dirty --format agent` — passed
  - `php artisan migrate:status --database=pgsql --no-interaction` — unchanged and valid
  - Transaction-safe smoke test created two reviews for a temporary business and returned a related count of `2`, confirming `hasMany` works in the live app.

## Reminder

The approved D2-14 implementation is complete and verified.
