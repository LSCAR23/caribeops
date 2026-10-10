# Plan — D2-12: Create Review Model

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-12 — Create Review Model

## Desired outcome

Add the Eloquent `Review` model so the existing `reviews` table can be queried and related back to the parent `Business` record.

## Scope

### In scope

- Create `backend/laravel/app/Models/Review.php` in the `App\Models` namespace.
- Define the model so it matches the existing `reviews` table schema and the repository's Eloquent conventions.
- Add the `business()` relationship to represent the many-to-one association from a review to its parent business.
- Verify the model can load a review and access its parent business without leaving persisted data behind.

### Non-goals

- No migration or schema changes. The `reviews` table already exists from earlier D2-06 work.
- No request validation, controller, factory, or API-layer changes.
- No broader cleanup beyond the minimal model and relationship contract required for D2-12.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-12 as “Create Review Model,” with the learning goal that Laravel relationship methods should mirror the database model.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` defines the `reviews` table with `business_id`, `rating`, `title`, `content`, `review_date`, and timestamps. The table uses a foreign key to `businesses` with cascade delete behavior.
- The repository already contains the D2-10 `App\Models\Business` model and the D2-11 `App\Models\Amenity` model. There is no `Review` model yet, and no review-to-business relationship logic exists in the app layer.
- The repository pattern for minimal domain models is to keep each class narrow, explicit, and aligned with the actual table schema. The new `Review` model should therefore define only the relevant fillable fields and the `business()` `belongsTo` relationship.
- The live migration state reflects the relevant PostgreSQL migrations as already applied. This task must not assume a fresh database state or change live schema or data.
- No unresolved user decision blocks planning.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-12 roadmap entry and learning objective.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` — existing `reviews` schema and foreign key relationship.
- `backend/laravel/app/Models/Business.php` — repository pattern for a minimal model with explicit relations.
- `backend/laravel/app/Models/Amenity.php` — repository pattern for a simple model with a `belongsToMany` relation.
- `backend/laravel/app/Models/Category.php` — current simple Eloquent model convention.
- `MEMORY.md` — current checkpoint for already-applied migration state and earlier model work.
- `backend/laravel/AGENTS.md` — Laravel project conventions requiring model scope to stay narrow and align with existing patterns.

## Learning objectives

- A child record such as a review belongs to a single parent business, represented by a `belongsTo()` relationship in Eloquent.
- Relationship methods should reflect the actual database foreign key contract rather than a guessed or abstracted structure.
- Minimal Eloquent models are more maintainable when they define only the fields and relations needed for the task.

## Ordered implementation steps

1. Inspect the existing `reviews` migration and compare it to the `Business` model pattern already used by the repository.
2. Create `backend/laravel/app/Models/Review.php` and keep the class minimal and consistent with `Business` and `Amenity`.
3. Add the model’s fillable field list and the `business()` relationship using `belongsTo(Business::class)`.
4. Run PHP syntax validation and Laravel Pint formatting checks for the model.
5. Use a transaction-safe PostgreSQL smoke check to create a temporary business and review, load the review with `with('business')`, and confirm the parent business is accessible before rolling back.
6. Confirm the migration status remains unchanged after the smoke check.

## Tests and verification commands

Run from `backend/laravel`:

```powershell
php artisan make:model Review --no-interaction
php -l app/Models/Review.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
```

Also run a focused PostgreSQL-backed relationship smoke check such as:

```powershell
php artisan tinker --execute "DB::beginTransaction(); \$category = App\\Models\\Category::query()->first() ?? App\\Models\\Category::query()->create(['name' => 'Temp Review Category', 'slug' => 'temp-review-category']); \$business = App\\Models\\Business::query()->create(['category_id' => \$category->id, 'name' => 'Temp Review Business', 'description' => 'Temporary review smoke check', 'type' => 'Restaurant', 'address' => '123 Test St', 'latitude' => 12.34, 'longitude' => 56.78, 'phone' => '1234567890']); \$review = App\\Models\\Review::query()->create(['business_id' => \$business->id, 'rating' => 5, 'title' => 'Great stay', 'content' => 'The place was excellent.', 'review_date' => '2026-10-09']); dump(App\\Models\\Review::query()->with('business')->find(\$review->id)?->business->name); DB::rollBack();"
```

Expected results:

- The model file parses without PHP syntax errors.
- The project formatter accepts the model and relationship declaration.
- Eloquent can load a review and access its parent business without error.
- The database remains unchanged after the smoke check and any temporary rows are rolled back.

## Risks, dependencies, and unresolved questions

- Verification depends on the configured PostgreSQL service being available and reachable from the Laravel app.
- The relationship check may require temporary rows in a transaction so the relation is exercised meaningfully without leaving data behind.
- No unresolved user or scope questions remain; the task remains limited to the `Review` Eloquent model and its `business()` relationship contract.

## Plan check

- Confirmed the D2-12 acceptance goal matches the project roadmap: a review model should expose the parent business relationship the same way the database schema does.
- Verified that the repository already contains the `reviews` migration and the parent-business foreign key, so this task is a model-only relationship exercise and not a schema change.
- Challenged the smoke-check method and kept it transaction-safe: it should create temporary business and review rows, load the relationship through Eloquent, and then roll back to avoid leaving data behind.
- Confirmed that the app already contains minimal model patterns for `Business` and `Amenity`, so the new `Review` model should stay similarly explicit and narrowly scoped.
- No material user preference remains unresolved.

## Implementation outcome

- Created `backend/laravel/app/Models/Review.php` with the `fillable` list and `business()` `belongsTo` relationship.
- Verified `php -l app/Models/Review.php` reported no syntax errors.
- Verified `vendor/bin/pint --dirty --format agent` completed successfully and formatted the model file.
- Verified a transaction-safe PostgreSQL smoke test returned `PASS: Temp Review Business` and then rolled the transaction back.
- Verified `php artisan migrate:status --database=pgsql --no-interaction` remained unchanged after the smoke test, confirming no migration or data drift.

## Reminder

This model work is complete for the approved D2-12 scope. No migration changes were made.
