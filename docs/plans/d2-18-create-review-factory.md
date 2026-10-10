# Plan — D2-18: Create Review Factory

- **Date:** 2026-10-09
- **Status:** Implemented — verified
- **Task:** D2-18 — Create Review Factory

## Desired outcome

Create a Laravel factory that generates realistic reviews with required fields and ratings in the inclusive range 1–5. Expose it through `Review::factory()` and verify persisted factory output is accepted by the existing database constraints.

## Scope

### In scope

- Add `database/factories/ReviewFactory.php` following the existing Laravel factory convention.
- Generate a valid `business_id` through the existing `BusinessFactory`, along with a random rating from 1 to 5 and realistic title, content, and review date.
- Add `HasFactory` to `Review`, using the matching factory generic PHPDoc pattern already used by `Business`.
- Verify generated rows against the existing PostgreSQL schema and rating constraint, with temporary writes rolled back.

### Non-goals

- No schema or migration changes; the reviews table and 1–5 rating constraint already exist.
- No changes to the review/business model relationships, seeders, database configuration, or dependencies.
- No permanent review or business fixture data and no unrelated test-suite changes.

## Analysis carried forward

- The D2-18 roadmap entry in `docs/day-2-laravel-postgresql.md` asks for realistic ratings from 1 to 5, database-constraint-valid factory records, and synthetic data that varies rather than repeating identical rows.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` requires `business_id`, `rating`, `title`, `content`, and `review_date`; Laravel supplies the timestamps.
- `backend/laravel/database/migrations/2026_10_09_224223_add_rating_range_check_to_reviews_table.php` adds PostgreSQL constraint `reviews_rating_range_check`, requiring `rating BETWEEN 1 AND 5`.
- `backend/laravel/app/Models/Review.php` has the fillable attributes and `business()` relationship but does not yet use `HasFactory`.
- The existing `BusinessFactory` generates required business attributes and chooses only seeded `hotels`, `restaurants`, or `tours` categories. Its category dependency means those reference rows must be present when a default review factory creates its related business.
- The existing `UserFactory` and `BusinessFactory` demonstrate the project's `Factory<Model>` PHPDoc, `definition(): array`, and `fake()` conventions. `Business` demonstrates the project's typed `HasFactory` usage.
- `backend/laravel/phpunit.xml` configures in-memory SQLite, while the rating-constraint migration uses PostgreSQL-specific `ALTER TABLE ... ADD CONSTRAINT` SQL. A transaction-safe PostgreSQL smoke check follows the previous factory task's established verification approach; do not change test database configuration.
- Git status was clean during analysis. No existing `docs/plans/d2-18-create-review-factory.md` was found.
- The relevant Laravel best-practices and testing-best-practices skill guidance was read. No applicable `.ai/rules` directory exists; the Laravel-specific `AGENTS.md` and applicable skills were inspected.
- No material decisions remain unresolved.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-18 acceptance goals and learning objective.
- `docs/business-entity-design.md` — project context for review/business data relationships.
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` — required review columns and business foreign key.
- `backend/laravel/database/migrations/2026_10_09_224223_add_rating_range_check_to_reviews_table.php` — rating bounds enforced by PostgreSQL.
- `backend/laravel/app/Models/Review.php` — current model and factory integration point.
- `backend/laravel/app/Models/Business.php` — `HasFactory` pattern.
- `backend/laravel/database/factories/BusinessFactory.php` and `UserFactory.php` — factory and Faker patterns.
- `backend/laravel/database/seeders/CategorySeeder.php` — canonical category prerequisites used by `BusinessFactory`.
- `backend/laravel/phpunit.xml` — SQLite test configuration.
- `backend/laravel/AGENTS.md` and `backend/laravel/.agents/skills/{laravel-best-practices,testing-best-practices}/` — applicable project, Laravel, and test-data guidance.
- `MEMORY.md` — D2-17 factory checkpoint and prior PostgreSQL verification context.

## Learning objectives

- A factory definition is a recipe for creating consistent synthetic records; it does not persist data until `create()` is called.
- Factory relationships use a related model factory to provide valid foreign keys. Here, a default review needs a business, and the existing business factory in turn relies on seeded categories.
- Faker's bounded integer generation can express the domain's inclusive 1–5 rating range, while generated titles, content, and dates keep sample records varied.
- Database constraints remain the final validation for persisted records, even when factory values are designed to satisfy them.

## Ordered implementation steps

1. From `backend/laravel`, generate `ReviewFactory` for `Review` with Artisan's non-interactive factory generator.
2. Add `HasFactory` and `@use HasFactory<ReviewFactory>` to `Review`, following the existing `Business` model pattern.
3. Define every required review attribute in `ReviewFactory`: use `Business::factory()` for the required relationship, a Faker integer in the inclusive 1–5 range for `rating`, and realistic Faker values for `title`, `content`, and `review_date`.
4. Run PHP syntax checks and Laravel Pint for the changed PHP files.
5. Confirm the canonical category prerequisites exist, then use PostgreSQL to create multiple reviews through the default factory inside a transaction. Confirm default ratings are within 1–5, use a deterministic factory sequence to exercise every allowed rating value against the database constraint, and verify rollback restores the original review/business counts.

## Tests and verification

Run from `backend/laravel`:

```powershell
php artisan make:factory ReviewFactory --model=Review --no-interaction
php -l database\factories\ReviewFactory.php
php -l app\Models\Review.php
vendor\bin\pint --dirty --format agent
```

Run a focused PostgreSQL-backed smoke check from Tinker. It should first verify that `hotels`, `restaurants`, and `tours` categories are present; then, in a transaction:

1. Create several reviews using the default `ReviewFactory` so the default `business_id` relationship exercises `BusinessFactory`. Assert every default rating is between 1 and 5 inclusive.
2. Create five more reviews with a factory `sequence()` that assigns ratings 1, 2, 3, 4, and 5. Assert those known values were persisted, exercising the database constraint's full allowed range without relying on random output to happen to cover every rating.
3. Compare review and business counts after rollback to their pre-check values.

The factory definition itself should use Faker for review titles, content, and dates; the controlled sequence gives the persisted smoke check deterministic rating variety without making a probabilistic uniqueness assertion about Faker output.

Expected results:

- Both changed PHP files parse successfully and Pint passes.
- Several default factory-generated reviews are persisted successfully under PostgreSQL, and every rating is between 1 and 5 inclusive.
- Default rows satisfy the rating range, all five allowed rating values are accepted by the database constraint in deterministic cases, and the temporary review/business inserts are rolled back without changing their starting counts.
- PHPUnit is not used for this database-constraint check because its configured in-memory SQLite database cannot run the PostgreSQL-specific rating-constraint migration. Do not reconfigure PHPUnit as part of this task.

## Risks, dependencies, and unresolved questions

- `ReviewFactory`'s default relationship will create a `Business`; `BusinessFactory` requires the three canonical seeded categories. If the categories are missing, report the prerequisite rather than silently fabricating unrelated categories or changing schema/configuration.
- PostgreSQL must be reachable for database-constraint verification. If it is not available, report the blocker; do not leave temporary records behind.
- Faker values are synthetic and need not describe a real review or match a real location.
- No unresolved questions remain.

## Plan check

- Confirmed the migration requires `business_id`, `rating`, `title`, `content`, and `review_date`, and that the separately applied PostgreSQL constraint accepts ratings 1 through 5 inclusive.
- Confirmed `Review` lacks `HasFactory`; its existing `business()` relation and the `Business` model's typed `HasFactory` usage support the proposed `ReviewFactory` integration.
- Verified the default review relationship will rely on `BusinessFactory`, which queries only canonical category slugs and fails if those seeded categories are absent. Kept this explicit as a read-only preflight dependency rather than expanding D2-18 to alter seed data.
- Confirmed the PHPUnit SQLite configuration cannot execute the existing PostgreSQL-specific rating-constraint migration; retained a rollback-safe PostgreSQL smoke check and explicitly excluded database reconfiguration.
- Replaced a nondeterministic requirement that randomly generated records happen to differ with deterministic `sequence()` cases covering each valid rating, while retaining a separate check of unmodified default factory ratings.
- Rechecked current Git status: the only worktree change is this new plan. No application code was changed, and no tests or builds were run during planning.
- No material decisions remain unresolved.

## Implementation outcome

- Added `backend/laravel/database/factories/ReviewFactory.php` with a related `BusinessFactory`, Faker-generated ratings from 1–5, and Faker-generated title, content, and date.
- Updated `backend/laravel/app/Models/Review.php` with `HasFactory<ReviewFactory>` so callers can use `Review::factory()`.
- `php artisan make:factory ReviewFactory --model=Review --no-interaction` generated the factory successfully under Laravel Framework 13.35.0 / PHP 8.4.26.
- `php -l database\factories\ReviewFactory.php` and `php -l app\Models\Review.php` both reported no syntax errors; `vendor\bin\pint --dirty --format agent` passed.
- A PostgreSQL Tinker transaction created four default reviews and five sequence-controlled reviews. All four default ratings were in range; required fields and the related businesses were present; PostgreSQL accepted the complete sequence 1, 2, 3, 4, 5. The transaction rolled back and the pre-check review and business counts were restored.
- PHPUnit was not run because its in-memory SQLite configuration cannot apply the PostgreSQL-specific rating-constraint migration. No schema changes or permanent smoke-test records were made.
