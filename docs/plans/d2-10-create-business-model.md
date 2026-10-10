# Plan — D2-10: Create Business Model

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-10 — Create Business Model

## Desired outcome

Add the Eloquent `Business` model so the existing `businesses` table can be queried and related to its owning `Category` through Laravel's ORM.

## Scope

### In scope

- Create `backend/laravel/app/Models/Business.php` in the existing `App\Models` namespace.
- Define the model's fillable/guarded behavior to match the `businesses` table schema.
- Add the `category()` relationship so a business can load its parent category.
- Verify the model can load a business and access its category without changing persisted data.

### Non-goals

- No factory, seeder, controller, API resource, or request validation changes.
- No migration or schema changes. The `businesses` table already exists from D2-03.
- No broader cleanup beyond the minimal model and relationship needed for D2-10.

## Analysis carried forward

- `docs/day-2-laravel-postgresql.md` defines D2-10 as “Create Business Model,” and its learning objective is that Eloquent turns rows and relationships into application-level objects.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` defines a `businesses` table with `category_id`, `name`, `description`, `type`, `address`, `latitude`, `longitude`, `website`, `phone`, and Laravel timestamps. The table has a cascade-on-delete foreign key to `categories`, which is the basis for the `category()` relationship.
- The repository currently has only `App\Models\User` and the newly generated `App\Models\Category` model. There is no `Business` model yet, and no business-model test or factory exists.
- `App\Models\User` uses Laravel's `#[Fillable([...])]` pattern, while `App\Models\Category` intentionally stays minimal and relies on conventional Eloquent mapping. The Business model should follow the same project pattern and only add the fields and relationship needed for this task.
- The latest project memory confirms the PostgreSQL migration chain is live and the domain migrations through D2-07 are recorded as applied; the model work should not assume a fresh migration state or change database data.
- No unresolved user decisions block planning.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-10 scope and learning goal.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — existing `businesses` schema and foreign key.
- `backend/laravel/app/Models/User.php` — established model conventions in the project.
- `backend/laravel/app/Models/Category.php` — the current model-only pattern used for a table already in PostgreSQL.
- `backend/laravel/AGENTS.md` — Laravel project guidance requiring existing conventions and verification via the project's PHP tools.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/eloquent.md` — relationship guidance for Eloquent models.
- `MEMORY.md` — latest verified project checkpoint and migration status.

## Learning objectives

- A model is the application-facing representation of a database table.
- `belongsTo()` expresses a one-to-many relationship where a business belongs to one category.
- Explicit mass-assignment policy is needed when a model is used to write business data; it must match the actual table fields and project conventions.

## Ordered implementation steps

1. Inspect the existing `businesses` schema and compare it to the current model conventions in `User` and `Category`.
2. Generate `backend/laravel/app/Models/Business.php` with Artisan, then review the file to keep the model narrow and consistent with the repo's naming conventions.
3. Add the business's fillable field list and the `category()` relation, keeping only the fields required by the `businesses` table.
4. Run PHP syntax validation and Laravel formatting checks on the model.
5. Use a short PostgreSQL smoke check to load a business and access its category relation in a read-only transaction or temporary test insert/rollback sequence, then confirm no persisted data changes remain.
6. Confirm the migration status remains unchanged after the smoke check.

## Tests and verification commands

Run from `backend/laravel`:

```powershell
php artisan make:model Business --no-interaction
php -l app/Models/Business.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql --no-interaction
```

Also run a focused PostgreSQL-backed Eloquent relationship check such as:

```powershell
php artisan tinker --execute "\$category = App\\Models\\Category::query()->first(); \$business = App\\Models\\Business::query()->with('category')->first(); dump(\$business?->category);"
```

Expected results:

- The model file parses without PHP syntax errors.
- The project formatter accepts the model and relation code.
- Eloquent can load a business and access its category relationship without application errors.
- The database remains unchanged after the verification step.

## Risks, dependencies, and unresolved questions

- Verification depends on the configured PostgreSQL service being available and reachable from the Laravel app.
- The relation check may need a temporary category and business row in a transaction so the `category` accessor is exercised meaningfully.
- No unresolved user or scope questions remain; the task remains limited to the model and relationship contract.

## Plan check

- Confirmed the D2-10 task aligns with `docs/day-2-laravel-postgresql.md` and the project memory: the `businesses` table already exists with a `category_id` foreign key, and the stated learning objective is Eloquent relationship modeling.
- Verified the repo currently has the pattern `App\Models\Category` and `App\Models\User`, with no existing `Business` model. The plan therefore keeps scope to the model and minimal `category()` relationship only.
- Challenged the verification approach: instead of assuming a business record exists, the plan keeps the smoke check read-only and, if necessary, exercises the relation in a temporary transaction to avoid leaving data behind.
- Confirmed the current memory and migration status show the relevant domain migrations are live; this plan intentionally does not modify the database or rely on a fresh migration reset.
- No material user preference remains unresolved.

## Implementation outcome

- Implemented `backend/laravel/app/Models/Business.php` with the project’s minimal Eloquent pattern: a `$fillable` list matching the `businesses` table and a `category()` `belongsTo` relationship.
- Validation passed: `php -l app/Models/Business.php` reported no syntax errors, and `vendor/bin/pint --dirty --format agent` passed.
- A transaction-safe PostgreSQL smoke check inserted a temporary category and business, loaded the business with `with('category')`, and dumped the parent category name before rolling the transaction back. The command reached the relationship lookup successfully, confirming the model and relationship work as expected without leaving persisted data behind.
- `php artisan migrate:status --database=pgsql --no-interaction` remained unchanged, confirming no migration or schema drift occurred during the task.

## Final status

D2-10 has been implemented and verified within the approved scope. No database changes were made beyond the existing live migration state, and the `Business` model is ready to be used by the Laravel app.
