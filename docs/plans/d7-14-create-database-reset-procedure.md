# D7-14 — Create Database Reset Procedure

- Task: D7-14 — Create Database Reset Procedure
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Create `docs/database-reset.md` documenting how to destroy and rebuild the CaribeOps development database and seed data without manual undocumented steps, per the Day-7 D7-14 spec (`docs/day-7-portfolio-interview.md` lines 319-329). Test: "You can destroy and rebuild the database without manual undocumented steps."

The doc gives a contributor one documented command path: stop the stack, drop the PostgreSQL volume, rebuild migrations from scratch (`migrate:fresh`), then re-seed (`--seed`), with the destructive warning and idempotence caveats carried from the day-2 doc.

## Scope

**In scope:**
- One new documentation file: `docs/database-reset.md`.
- Documented reset flow from `backend/laravel`: `php artisan migrate:fresh --seed --database=pgsql --no-interaction` (drop all tables → run all 13 migrations → run `DatabaseSeeder`).
- Destructive warning (never production/shared/database with data to keep).
- Idempotence caveat: category/amenity seeders use `firstOrCreate` by unique slug (repeat-safe); `BusinessDataSeeder` creates new rows each run, so a fresh drop before re-seed is required for a clean dataset.
- Docker Compose angle: `docker compose down -v` destroys `postgres_data` volume; paired with the Laravel migrate/seed flow for a full environment reset.
- Verification of expected counts: 3 categories, 20 amenities, 40 businesses, 320 reviews (ratings 1–5).
- Link to sibling docs (`docs/database.md` ER diagram/constraints/indexes; `docs/setup.md` stack startup).

**Non-goals:**
- No application code changes (documentation-only task).
- No new seeder or factory (that is D7-15 deterministic demo seed).
- No schema or migration changes.
- No test additions (the reset is manual/procedural; existing suite unchanged).
- No production guidance beyond the warning.

## Analysis carried forward

From `/analize` of "D7-14 — Create Database Reset Procedure" and direct repo inspection:

**Task & intended outcome:** Document how to recreate the development database and seed data (D7-14 spec). Test: destroy and rebuild the database without manual undocumented steps. Documentation-only, like D7-13.

**Current behavior / repository evidence:**
- Work tree clean on `master`; no user changes to preserve.
- 13 migrations present in `backend/laravel/database/migrations/`: 3 Laravel starter (users, cache, jobs) + 10 domain (categories, businesses, amenities, business_amenities, reviews, rating_range_check CHECK constraint, reviews_business_id_index, personal_access_tokens, role_to_users, user_id_to_businesses). Migration history shows all 13 applied (batch 1 per MEMORY.md day-2 checkpoint).
- Seeders present: `CategorySeeder` (Hotels/Restaurants/Tours via `firstOrCreate` by unique slug — idempotent), `AmenitySeeder` (20 amenities via `firstOrCreate` by unique slug — idempotent), `BusinessDataSeeder` (40 businesses × 8 reviews = 320 reviews, attaches random amenities; `factory()->create()` so **not** idempotent on re-seed without a drop first). `DatabaseSeeder` creates one sample user then calls all three; uses `WithoutModelEvents`.
- Known commands from `docs/day-2-laravel-postgresql.md`: `php artisan migrate:fresh` (line 207) and `php artisan migrate:fresh --seed --database=pgsql --no-interaction` from `backend/laravel` (line 391), with explicit destructive warning (line 394: drops configured DB tables; never production/shared).
- Compose (`docker-compose.yml`): postgres:16-alpine, host port 5433, DB `caribeops`/user `caribeops`, named volume `postgres_data`; `docker compose down -v` destroys the volume (documented in `docs/setup.md` D7-13).
- Test-DB caveat: `phpunit.xml` uses SQLite `:memory:`, but domain migrations use PostgreSQL-specific `ALTER TABLE ... ADD CONSTRAINT`, so reset verification targets `pgsql`.
- MEMORY.md: "D2-08's full clean migration-chain reset validation remains outstanding; no reset was run during D2-09" and "`migrate:fresh --seed` was intentionally not re-run without a fresh disposable-DB confirmation." No prior reset has been executed in this session; the full `migrate:fresh --seed` flow will not be executed here either (no docker/dev DB run confirmed in this environment), only statically confirmed against repo files.

**Gaps:** No consolidated doc for destroy → migrate → seed rebuild. D7-14 fills it.

**Risks/unknowns:** Destructive command without a clear warning; `BusinessDataSeeder` non-idempotence leading to duplicate businesses/reviews on naive re-seed. Both mitigated in the doc.

## Current-state evidence and relevant files

- `docs/day-7-portfolio-interview.md` — D7-14 spec (lines 319-329) and sibling D7-15 deterministic demo seed.
- `docs/day-2-laravel-postgresql.md` — D2-08 `migrate:fresh` (line 207), `migrate:fresh --seed --database=pgsql --no-interaction` + destructive warning (lines 388-394).
- `backend/laravel/database/migrations/` — 13 migrations (10 domain + 3 starter).
- `backend/laravel/database/seeders/DatabaseSeeder.php`, `CategorySeeder.php`, `AmenitySeeder.php`, `BusinessDataSeeder.php` — seeder logic, order, idempotence behavior.
- `docker-compose.yml` — `postgres_data` volume, service env (DB name/user/password, port 5433).
- `docs/setup.md` — D7-13 stack startup + `docker compose down -v` teardown (sibling doc to link).
- `docs/database.md` — ER diagram, constraints, indexes (sibling doc to link).
- `.gitignore` — env handling (`.env` ignored).
- `MEMORY.md` — migration/seed counts, outstanding D2-08 reset validation note.

## Learning objectives

- `migrate:fresh` drops all tables then re-runs every migration — the schema is rebuilt purely from migration files, no manual SQL.
- `--seed` runs `DatabaseSeeder` after migrations; ordering matters (categories → amenities → business data) because `BusinessDataSeeder` depends on categories and amenities existing.
- Idempotence: `firstOrCreate` keyed on unique slugs makes category/amenity seeders repeat-safe; `BusinessDataSeeder` creates new rows each run, so `migrate:fresh` (drop) before re-seed is required for a clean dataset.
- Reproducibility: destroy and rebuild via documented commands only — no undocumented manual database steps (makes debugging and demos safer).

## Ordered implementation steps

1. Create `docs/database-reset.md` with sections: Purpose & warning (destructive, dev-only), Prerequisites, Full reset flow (stop stack → drop volume → migrate:fresh --seed → verify counts), Docker Compose angle (`down -v` + Laravel seed), Idempotence & re-seed caveats, Expected dataset counts, Related docs.
2. Use real repo values: command run from `backend/laravel`, `--database=pgsql --no-interaction`, expected 3/20/40/320 counts, compose `postgres_data` volume, ports 5433/8000/3000/8080.
3. Ground every command in an existing file (migrations, seeders, day-2 doc, compose, setup.md).
4. Verify markdown well-formed; `git diff --check` clean; documentation-only change.

## Tests and verification commands, plus expected results

- `docs/database-reset.md` exists and contains: destructive warning, `migrate:fresh --seed --database=pgsql --no-interaction` from `backend/laravel`, expected counts (3 categories, 20 amenities, 40 businesses, 320 reviews), `docker compose down -v` volume teardown, idempotence caveat, related-doc links.
- `git diff --check` clean; documentation-only, no application files touched.
- All referenced commands/paths statically confirmed against repo files (migrations, seeders, day-2 doc, compose, setup.md).

## Risks, dependencies, and unresolved questions

- Risk: documenting a destructive command without a prominent warning — mitigated by a bold "dev only, never production" callout carried from day-2.
- Risk: naive re-seed creating duplicate businesses/reviews — mitigated by documenting the `migrate:fresh` (drop) requirement before re-seed and noting `BusinessDataSeeder` non-idempotence vs. `firstOrCreate` idempotent seeders.
- Dependency: none — reset doc describes existing migration/seeder/compose behavior.
- Unresolved: none after the `docs/database-reset.md` location decision (made: new single-topic doc, Option A).

## Plan check

Findings (all verified against the current repository):

- Plan location: `docs/plans/d7-14-create-database-reset-procedure.md` created; no existing `d7-14` plan to conflict with.
- `Analysis carried forward` section present and grounded in direct repo inspection.
- `docs/database-reset.md` does NOT exist — new single-topic doc (Option A, confirmed by user), consistent with `architecture.md`/`database.md`/`performance.md`/`setup.md` convention.
- All referenced files confirmed present: `backend/laravel/database/migrations/` (13 migrations: 3 starter + 10 domain), `DatabaseSeeder.php`, `CategorySeeder.php`, `AmenitySeeder.php`, `BusinessDataSeeder.php`, `docker-compose.yml`, `docs/day-2-laravel-postgresql.md` (D2-08 `migrate:fresh` line 207; `migrate:fresh --seed --database=pgsql --no-interaction` line 391; destructive warning line 394), `docs/day-7-portfolio-interview.md` (D7-14 spec lines 319-329), `docs/setup.md`, `docs/database.md`.
- `docker compose config` parses cleanly (exit 0) — `postgres_data` volume, service env, ports (5433/8000/3000/8080) valid.
- Seeder behavior confirmed by direct reads: category/amenity seeders idempotent (`firstOrCreate` by unique slug); `BusinessDataSeeder` non-idempotent (`factory()->create()` → new rows each run, requires `migrate:fresh` drop before re-seed for clean dataset); `DatabaseSeeder` order = user → categories → amenities → business data; `WithoutModelEvents` used.
- Destructive-warning content grounded in day-2 doc line 394.
- Expected dataset counts (3 categories, 20 amenities, 40 businesses, 320 reviews) grounded in seeder code and MEMORY.md.

Changes made during check: none to scope or file list; status advanced to `Checked — awaiting user approval`.

Verification limits: the full `migrate:fresh --seed` flow was NOT executed here (no live dev PostgreSQL run confirmed in this environment, consistent with MEMORY.md's "intentionally not re-run without a fresh disposable-DB confirmation"); every command/path was statically confirmed against repo files instead. Documentation-only change — no application code, schema, migrations, seeders, or tests touched.

## Implementation outcome

- Implemented D7-14 — Create Database Reset Procedure: created `docs/database-reset.md` documenting how to destroy and rebuild the development database and seed data without manual undocumented steps. Sections: destructive dev-only warning (carried from day-2 line 394); prerequisites; full reset flow (`docker compose down` → `docker compose down -v` → `docker compose up -d postgres` → `php artisan migrate:fresh --seed --database=pgsql --no-interaction` from `backend/laravel` → `docker compose up -d --build`); seeder ordering rationale (categories → amenities → business data); idempotence table (CategorySeeder/AmenitySeeder yes via `firstOrCreate` by unique slug; BusinessDataSeeder **no** — `factory()->create()` inserts new rows each run, requires `migrate:fresh` drop first); expected dataset counts (3 categories, 20 amenities, 40 businesses, 320 reviews ratings 1–5); read-only row-count verification command against the running container; verification checklist; test-database caveat (phpunit.xml SQLite vs PG-specific migrations → always target `pgsql`); related docs links to `docs/database.md`, `docs/setup.md`, `docs/day-2-laravel-postgresql.md`, `docs/day-7-portfolio-interview.md`.
- Verification: `git diff --check` clean (exit 0); `git status --short` shows only `docs/database-reset.md` (new) plus the pre-existing untracked plan file; all referenced commands/paths statically confirmed against `backend/laravel/database/migrations/` (13 migrations), `backend/laravel/database/seeders/{DatabaseSeeder,CategorySeeder,AmenitySeeder,BusinessDataSeeder}.php`, `docker-compose.yml` (`postgres_data` volume, port 5433), `docs/day-2-laravel-postgresql.md` (D2-08 line 207, `migrate:fresh --seed` line 391, destructive warning line 394), `docs/day-7-portfolio-interview.md` (D7-14 spec lines 319-329), `docs/setup.md`, `docs/database.md`; `docker compose config` parses cleanly (exit 0). Full `migrate:fresh --seed` flow NOT executed here (no live dev PostgreSQL run confirmed in this environment, consistent with MEMORY.md's "intentionally not re-run without a fresh disposable-DB confirmation"); every command/path statically confirmed instead. Documentation-only change — no application code, schema, migrations, seeders, or tests touched.
- No commit made.

## Reminder

This plan has been implemented. No further `/implement` invocation is needed for this task.
