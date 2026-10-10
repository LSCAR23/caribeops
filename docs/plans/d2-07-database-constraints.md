# Plan — D2-07: Add Database Constraints

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-07 — Add Database Constraints

## Desired outcome

Enforce review ratings within the inclusive range 1 through 5 in PostgreSQL using a focused Laravel migration. Confirm that the other constraints named as examples in D2-07 are already enforced by the existing schema rather than redundantly adding them again.

## Scope

### In scope

- Generate one timestamped migration from `backend/laravel` to add a named CHECK constraint to `reviews.rating`:
  - Constraint: `reviews_rating_range_check`
  - Rule: `rating BETWEEN 1 AND 5`
- Use a PostgreSQL `ALTER TABLE ... ADD CONSTRAINT ... CHECK` statement, matching the existing businesses migration's database-specific CHECK-constraint approach.
- Implement `down()` to drop only `reviews_rating_range_check` from `reviews`.
- Apply only this migration to the configured PostgreSQL database.
- Verify that ratings 1 and 5 are accepted and ratings 0 and 6 are rejected with SQLSTATE `23514`, using only temporary rows in isolated transactions that are rolled back.
- Inspect and report the already-existing constraints listed below without recreating them.

### Non-goals

- Changing the reviews, businesses, categories, amenities, or business-amenities table definitions beyond the new review rating CHECK constraint.
- Re-adding requiredness or foreign-key constraints for business name/category or adding speculative uniqueness rules.
- Application-layer validation, models, endpoints, frontend changes, or unrelated migrations.
- `migrate:fresh`, unrestricted migration commands, or applying pending Laravel starter migrations.

## Analysis carried forward

- D2-07 in `docs/day-2-laravel-postgresql.md` asks for meaningful database constraints and names “rating between 1 and 5,” required business name, required category, and appropriate uniqueness as examples. Its test calls for invalid inserts directly in PostgreSQL.
- The current `reviews` creation migration defines `rating` as a required integer but has no range CHECK constraint. D2-06 deliberately left the rating constraint for D2-07.
- The actual PostgreSQL schema confirms the other listed examples already exist:
  - `businesses.name` is NOT NULL.
  - `businesses.category_id` is NOT NULL and references `categories.id`.
  - `categories.slug` and `amenities.slug` have unique indexes.
  - `business_amenities` has a unique composite index on `(business_id, amenity_id)`.
- No database uniqueness requirement is specified for review records themselves; inventing one would change product behavior without evidence.
- The existing businesses migration adds PostgreSQL CHECK constraints with explicit `ALTER TABLE ... ADD CONSTRAINT` statements because Laravel's installed schema builder does not provide the needed constraint API. D2-03 records this implementation precedent.
- The current PostgreSQL database has the domain migrations through D2-06 applied; the three Laravel starter migrations remain pending. Confirm migration status again before applying D2-07.
- PHPUnit is configured to use SQLite in memory. Direct PostgreSQL checks are needed for the requested SQLSTATE and CHECK-constraint behavior.
- No unresolved user decisions block this focused constraint task.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-07 examples and direct-PostgreSQL verification requirement.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` — required integer rating, currently without a range constraint.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php` — named PostgreSQL CHECK-constraint precedent and table-scoped rollback.
- `backend/laravel/database/migrations/2026_10_09_212027_create_categories_table.php` — unique category slug precedent.
- `backend/laravel/database/migrations/2026_10_09_220642_create_amenities_table.php` — unique amenity slug.
- `backend/laravel/database/migrations/2026_10_09_222207_create_business_amenities_table.php` — unique relationship pair.
- `backend/laravel/AGENTS.md` — Laravel project rules, Artisan generation, and Pint requirement.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/migrations.md` — migration, constraint, index, and rollback guidance.
- `backend/laravel/phpunit.xml` — SQLite in-memory PHPUnit configuration.
- `MEMORY.md` — D2-06 completion checkpoint and pending starter migration state; re-check live PostgreSQL status before applying.

## Learning objectives

- A SQL CHECK constraint enforces a domain rule at the database layer even when inserts bypass Laravel validation.
- An inclusive range check `BETWEEN 1 AND 5` accepts both endpoints and rejects values below or above the allowed set.
- Named constraints make schema inspection and precise rollback possible.
- Database constraints should not be duplicated: requiredness, referential integrity, and uniqueness are independent protections already demonstrated by the domain migrations.
- PostgreSQL marks a transaction failed after a constraint error, so negative probes must be isolated and rolled back.

## Ordered implementation steps

1. Generate a timestamped migration with `php artisan make:migration add_rating_range_check_to_reviews_table --no-interaction`.
2. In `up()`, add the named `reviews_rating_range_check` CHECK constraint enforcing `rating BETWEEN 1 AND 5`, following the raw PostgreSQL constraint pattern in the businesses migration.
3. In `down()`, drop only `reviews_rating_range_check` from `reviews`.
4. Review the new migration alongside the reviews and businesses migrations; run PHP lint and Pint.
5. Before applying, run PostgreSQL migration status and confirm the migration chain through D2-06 is applied while the three starter migrations remain pending.
6. Check for pre-existing out-of-range ratings with a read-only query:

   ```sql
   SELECT COUNT(*) AS invalid_rating_count
   FROM reviews
   WHERE rating NOT BETWEEN 1 AND 5;
   ```

   Proceed only if the count is zero. If rows are returned, stop; do not modify review data under this schema-only plan.
7. Apply only the generated migration with `--database=pgsql` and its exact path.
8. Inspect the reviews table to confirm the named check exists and that existing business requiredness/FK and uniqueness constraints remain present.
9. In separate rollback-only transactions, create a temporary valid business and review at ratings 1 and 5 and confirm both are accepted; verify ratings 0 and 6 each fail with SQLSTATE `23514`. Use unique temporary fixture values and roll back each transaction, including any expected-failure transaction.
10. Re-check migration status and confirm only this migration was newly applied; do not apply unrelated pending migrations.

## Tests and verification

Run from `backend/laravel`:

```powershell
php -l database/migrations/<generated_rating_constraint_migration>.php
vendor/bin/pint --dirty --format agent
php artisan migrate:status --database=pgsql
php artisan migrate --database=pgsql --path=database/migrations/<generated_rating_constraint_migration>.php --no-interaction
php artisan db:table reviews --database=pgsql --json
php artisan migrate:status --database=pgsql
```

Expected outcomes:

- PHP lint reports no syntax errors and Pint completes successfully.
- Preflight confirms categories, businesses, amenities, business-amenities, and reviews are applied; the three Laravel starter migrations remain pending.
- The pre-apply read-only rating query returns `invalid_rating_count = 0`; otherwise implementation stops for a revised data-remediation plan.
- The path-scoped migration succeeds and adds only `reviews_rating_range_check`.
- PostgreSQL accepts ratings 1 and 5 and rejects ratings 0 and 6 with CHECK-violation SQLSTATE `23514`; all fixture data is rolled back.
- Schema inspection confirms the named check and the pre-existing NOT NULL, foreign-key, and unique constraints remain present.
- Postflight confirms the new migration ran and unrelated migration states are unchanged.
- No PHPUnit run is planned: its configured SQLite in-memory database is not the PostgreSQL target required by D2-07.

## Risks, dependencies, and unresolved questions

- The reviews table must exist before the CHECK constraint can be added. Reconfirm the live migration status before applying.
- If reviews already contain ratings outside 1–5, PostgreSQL will reject the constraint migration. Inspect existing data before apply; do not silently rewrite or delete rows. If invalid data is found, stop and return to `/check` for a revised data-remediation plan.
- Expected constraint violations abort a PostgreSQL transaction; isolate each negative probe in its own transaction and always roll it back.
- The other D2-07 example constraints are already present according to current PostgreSQL inspection; avoid duplicate indexes or constraints. No review uniqueness rule is specified.

## Implementation outcome

- Implemented and applied `backend/laravel/database/migrations/2026_10_09_224223_add_rating_range_check_to_reviews_table.php`. It adds only the named `reviews_rating_range_check` constraint and drops only that constraint in `down()`.
- Before applying, `php artisan migrate:status --database=pgsql` confirmed the domain migrations through D2-06 were applied and the three Laravel starter migrations remained pending. The read-only invalid-rating preflight returned `invalid_rating_count=0`.
- `php -l database\migrations\2026_10_09_224223_add_rating_range_check_to_reviews_table.php` reported no syntax errors. `vendor\bin\pint --dirty --format agent` completed successfully.
- Applied only the generated migration with `php artisan migrate --database=pgsql --path=database\migrations\2026_10_09_224223_add_rating_range_check_to_reviews_table.php --no-interaction`; it completed successfully in batch 6.
- PostgreSQL catalog inspection confirmed the named, validated constraint with normalized definition `CHECK (((rating >= 1) AND (rating <= 5)))`. Existing category and amenity slug unique indexes, the business-amenity composite unique index, and the reviews business foreign key remained present.
- Rollback-only PostgreSQL probes accepted ratings 1 and 5 and rejected ratings 0 and 6 with SQLSTATE `23514`. Temporary category, business, and review fixtures were rolled back.
- Final `php artisan migrate:status --database=pgsql` confirmed D2-07 ran in batch 6 and the three starter migrations remain pending. `php artisan db:table reviews --database=pgsql --json` confirmed the existing reviews columns and cascading business foreign key. `git diff --check` reported no whitespace errors in tracked changes.
- PHPUnit was not run because its configured SQLite in-memory database is not the PostgreSQL target required for this constraint verification.

## Plan check

- Confirmed the D2-07 constraint examples and direct-PostgreSQL test requirement against `docs/day-2-laravel-postgresql.md`.
- Re-inspected the live PostgreSQL schema: `businesses.name` and `businesses.category_id` are required, `category_id` references categories, category and amenity slugs are unique, and the business-amenity pair has a composite unique index. Thus the only D2-07 example missing is the review rating range constraint.
- Added a read-only preflight for existing out-of-range ratings and an explicit stop condition, avoiding an unsafe constraint application if data violates the new rule.
- Kept the migration limited to the named reviews CHECK constraint and a matching rollback. No review-specific uniqueness rule is stated in the roadmap, so none is invented.
- Confirmed live migration status: domain migrations through D2-06 ran; the three Laravel starter migrations remain pending.
- Confirmed PHPUnit's SQLite in-memory configuration and retained direct PostgreSQL constraint verification in the plan.
- `git status --short` showed only this new plan; `git diff --check` reported no whitespace errors in tracked changes, and the new plan was reviewed directly.
- No unresolved questions remain. No application or database changes were made during orchestration.
