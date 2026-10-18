# D7-10 — Document PostgreSQL Design

- Task: D7-10 — Document PostgreSQL Design
- Date: 2026-10-18
- Status: Checked — awaiting user approval

## Desired outcome

Create `docs/database.md` documenting the relational design so the documented diagram matches the actual migrations. Include:

- ER diagram
- relationships
- constraints
- indexes

Test: the documented diagram matches the actual migrations.

## Scope

- New file `docs/database.md` only. No application code changes.
- ER diagram (ASCII or Mermaid) of: `users`, `categories`, `businesses`, `amenities`, `business_amenities`, `reviews`, plus `personal_access_tokens`/`sessions`/`password_reset_tokens` noted as Laravel auth scaffolding.
- Relationships: Category 1:N Business; Business 1:N Review; Business N:N Amenity (via `business_amenities`); User 1:N Business (`user_id`, D6-10).
- Constraints: UUID PKs; `categories.slug` unique; `amenities.slug` unique; `users.email` unique; `reviews.rating` BETWEEN 1 AND 5 (check); `businesses.latitude` BETWEEN -90 AND 90; `businesses.longitude` BETWEEN -180 AND 180 (check); FKs with `onDelete cascade`; `businesses.user_id` nullable FK `nullOnDelete`; `business_amenities` unique composite `(business_id, amenity_id)`.
- Indexes: `reviews(business_id)` — `reviews_business_id_index` (D5-19, performance rationale in `docs/performance.md`); implicit PK/FK indexes; note the `analytics` role is read-only (SELECT on the 3 Go-read tables, `docker/postgres-init/02-analytics-grants.sql`).

Non-goals:
- No seed data procedure (that's D7-14).
- No reset procedure (D7-14).
- No application code.

## Analysis carried forward

From `/analize` of the D7-06→D7-12 block and migration inspection:

Migrations (source of truth), in order:

- `0001_01_01_000000_create_users_table.php`: `users` (id bigserial PK, name, email unique, password, timestamps) + `password_reset_tokens` + `sessions`.
- `2026_10_09_212027_create_categories_table.php`: `categories` (uuid PK, name, slug unique, timestamps).
- `2026_10_09_213759_create_businesses_table.php`: `businesses` (uuid PK, `category_id` FK→categories cascade, name, description, type, address, latitude/decimal + CHECK -90..90, longitude/decimal + CHECK -180..180, website nullable, phone, timestamps).
- `2026_10_09_220642_create_amenities_table.php`: `amenities` (uuid PK, name, slug unique, timestamps).
- `2026_10_09_222207_create_business_amenities_table.php`: `business_amenities` (`business_id` FK→businesses cascade, `amenity_id` FK→amenities cascade, unique composite).
- `2026_10_09_223250_create_reviews_table.php`: `reviews` (uuid PK, `business_id` FK→businesses cascade, rating integer, title, content, `review_date` date, timestamps).
- `2026_10_09_224223_add_rating_range_check_to_reviews_table.php`: `reviews.rating` CHECK BETWEEN 1 AND 5.
- `2026_10_13_181728_create_personal_access_tokens_table.php`: Sanctum tokens (id, tokenable morphs, token unique 64, abilities, expires_at indexed).
- `2026_10_14_173601_add_role_to_users_table.php`: `users.role` string default 'viewer' (D6-08).
- `2026_10_14_190449_add_user_id_to_businesses_table.php`: `businesses.user_id` nullable FK→users nullOnDelete (D6-10).
- `2026_10_13_042916_add_reviews_business_id_index.php`: `reviews_business_id_index` on `reviews(business_id)` — idempotent IF NOT EXISTS (D5-21), same name as the live D5-19 index.

Go reads only 3 tables via `analytics` role: `businesses`, `categories`, `reviews` (SELECT-only grants).

## Current-state evidence and relevant files

- `backend/laravel/database/migrations/*.php` — 10 migrations, the schema source of truth.
- `docker/postgres-init/02-analytics-grants.sql` — read-only grants (D5-09).
- `docs/performance.md` — index rationale for `reviews(business_id)` (D5-17→D5-20).
- `docs/day-7-portfolio-interview.md` D7-10 spec — ER diagram, relationships, constraints, indexes; test: diagram matches migrations.

## Learning objectives

- Documentation is useful only when it reflects the implementation (D7-10 learning): the ER diagram must be generated from the migrations, not invented.
- Constraints and indexes live in migrations; the document is a map, not the territory.

## Ordered implementation steps

1. Write `docs/database.md`: ER diagram (ASCII/Mermaid) matching the 7 domain tables + auth scaffolding note; relationships list; constraints list (PK/unique/CHECK/FK cascade/nullOnDelete/composite unique); indexes list (`reviews(business_id)` with D5-19/D5-20 rationale + note it's the only manually added index).
2. Cross-reference each migration file so a reader can verify; state that the diagram was derived from migrations (D7-10 test).
3. Verify markdown well-formed; no app code touched.

## Tests and verification commands, plus expected results

- `docs/database.md` exists; ER diagram tables/columns match migrations (manually verified against the 10 migration files listed above).
- `git diff --check` clean; documentation-only.

## Risks, dependencies, and unresolved questions

- Risk: diagram drifts from migrations if migrations change later; mitigate by cross-referencing migration filenames in the doc.
- Dependency: none.
- Unresolved: none.

## Plan check

- Confirmed schema source of truth across 10 migrations: `users` (+role, +personal_access_tokens/sessions/password_reset_tokens), `categories`, `businesses` (category_id FK cascade, lat/long CHECKs, user_id nullable FK nullOnDelete D6-10), `amenities`, `business_amenities` (composite unique), `reviews` (rating CHECK 1-5, review_date), `reviews_business_id_index` (idempotent D5-21 / D5-19).
- ER diagram + relationships + constraints + indexes will be derived from these migrations (document reflects implementation, per D7-10 test).
- `docs/database.md` is a new file; no application code changes.
- No material decisions pending. Status → `Checked — awaiting user approval`; date `2026-10-18`.

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-10-document-postgresql-design.md"` with this plan path.

## Implementation outcome

- Implemented D7-10 — Document PostgreSQL Design: created `docs/database.md` with the ER diagram (7 domain tables: users, categories, businesses, amenities, business_amenities, reviews, plus Sanctum/auth scaffolding noted separately), the four relationships (Category 1:N Business, Business 1:N Review, Business N:N Amenity via pivot with composite unique, User 1:N Business via nullable user_id nullOnDelete), all constraints (UUID PKs, unique slugs/emails, CHECK rating 1-5, CHECK latitude -90..90 and longitude -180..180, FKs cascade on delete, nullOnDelete on user_id), and all indexes (PK/FK implicit indexes plus the manually added `reviews_business_id_index` on `reviews(business_id)` with its D5-19/D5-21 rationale). Every element is cross-referenced to the 10 migration files listed as source of truth, so the documented diagram matches the actual migrations. Read-only `analytics` role access is noted with a pointer to `docker/postgres-init/` and `docs/performance.md`.
- Verification: `git diff --check` clean; `git status --short` shows only `docs/database.md` as the new file from this task; each table, column, constraint, and index was checked against the real migration files. No application code changed; no tests affected.
- No commit made.
