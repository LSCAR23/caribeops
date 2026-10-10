# Plan — D2-29: Business List Feature Test

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-29 — Business List Feature Test
- **Plan path:** `docs/plans/d2-29-business-list-feature-test.md`

## Desired outcome

`tests/Feature/BusinessListTest.php` proves `GET /api/businesses` from the HTTP boundary against PostgreSQL: `200`, Resource envelope (`data` items with the 12 D2-28 keys, `links`, `meta`), real pagination (`total:20`, `per_page:15`, `last_page:2`, page 2 holds 5), and a known seeded record in the payload. `phpunit.xml` points testing at a disposable `caribeops_testing` PG database; full suite green; dev `caribeops` untouched.

## Scope

### In scope

- `phpunit.xml`: `DB_CONNECTION` sqlite→`pgsql`, `DB_DATABASE` `:memory:`→`caribeops_testing` (`DB_URL` stays `""`; host/creds fall through from `.env`).
- One-time setup (documented, user-confirmed): `CREATE DATABASE caribeops_testing` on the local PG server.
- New test via `php artisan make:test --phpunit BusinessListTest --no-interaction` (Feature default), using `RefreshDatabase`:
  - Arrange: `$this->seed(CategorySeeder::class)`; `Business::factory()->count(19)->create()` + `Business::factory()->create(['name' => 'D2-29 Visible Seeded Business'])` (20 total).
  - Assert page 1: `assertOk`, `assertJsonStructure(['data' => ['*' => [12 keys]], 'links' => ['first','last','prev','next'], 'meta' => ['current_page','per_page','total','last_page']])`, `assertJsonPath('meta.total', 20)`, `per_page 15`, `last_page 2`, `assertJsonFragment(['name' => 'D2-29 Visible Seeded Business'])`.
  - Assert page 2: `assertOk`, `current_page 2`, `count(data) == 5`.
- Verify: full `php artisan test --compact` green under PG; dev-DB count still 40; `php -l`, Pint, `git diff --check`.

### Non-goals

- No route/model/Resource/migration/seeder/factory changes (guard-statement alternative explicitly rejected by user decision).
- No `.env.testing` (phpunit env override suffices; fewer files).
- No create/validation/404 tests (D2-30–D2-32 own them); no `phpunit.xml` changes beyond the two DB values.
- No `migrate:fresh` against dev; no seeded-row mutation; no PG server administration beyond the one documented `CREATE DATABASE`.

## Analysis carried forward

- Roadmap D2-29 needs 200 + structure + pagination + seeded records from the HTTP boundary.
- Current: Resource list envelope verified live in D2-28; no DB test exists; `phpunit.xml:26-28` sqlite-memory cannot migrate the 3 raw PG `ADD CONSTRAINT` statements (`businesses:30-35`, `reviews-rating:13-15`).
- User decision: test on PostgreSQL via `phpunit.xml` (not statement guards, not PG-gated skips).
- `BusinessFactory:27-30` needs canonical categories → `CategorySeeder:22-25` (`firstOrCreate`, driver-safe). `config/database.php:87-95` pgsql falls back to `.env` host/creds. Tree clean; no `.ai/rules`.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:550-564` — D2-29 target; D2-30–32 own adjacent tests.
- `backend/laravel/routes/api.php:14-16` — list under test; no edit.
- `backend/laravel/app/Http/Resources/BusinessResource.php` — 12-key contract the test asserts; no edit.
- `backend/laravel/phpunit.xml:20-35` — only file besides the test to edit (2 values).
- `backend/laravel/tests/Feature/HealthEndpointTest.php:9-16` — suite pattern (`getJson` + assertions); must stay green under PG.
- `backend/laravel/database/seeders/CategorySeeder.php:22-25` + `BusinessFactory.php:27-42` — arrange strategy; no edit.

## Learning objectives

- Boundary testing: status + envelope + persistence-adjacent counts in one HTTP call.
- `RefreshDatabase` on PG: real migrations incl. CHECKs, per-test rollback, destructive-by-design target DB.
- Deterministic seeds: fixed-name record beats random-data assertions.

## Just-in-time concept explanation

`RefreshDatabase` migrates the configured connection fresh once per suite run and wraps each test in a transaction it rolls back, so the 20 factory rows exist only inside the test. `getJson` issues a real HTTP-kernel request through routing → paginator → `BusinessResource::collection`, and `assertJsonStructure` checks shape while `assertJsonPath('meta.total', 20)` pins exact values. Because the connection is now `pgsql`, the PG CHECK migrations run for real — the test exercises the production DDL, not a SQLite approximation.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `phpunit.xml`, `routes/api.php:14-16`, `BusinessResource`, `HealthEndpointTest` (read-only). Confirm no `d2-29` plan file exists.
   - Rationale: prove baseline and free test-class name before generating.
2. One-time setup with explicit user confirmation: create empty `caribeops_testing` on local PG (e.g. `psql -h 127.0.0.1 -U <dev-user> -c "CREATE DATABASE caribeops_testing;"`). If the user declines, stop — do not repurpose `caribeops`.
   - Rationale: `RefreshDatabase` wipes its target; only a disposable DB is acceptable.
3. Edit `phpunit.xml`: `DB_CONNECTION`→`pgsql`, `DB_DATABASE`→`caribeops_testing`. Nothing else.
   - Rationale: minimal switch honoring the user's decision; `DB_URL=""` keeps URL override neutralized.
4. Run `php artisan make:test --phpunit BusinessListTest --no-interaction`; confirm it lands in `tests/Feature/`.
   - Rationale: Laravel-way generation per `phpunit/core` rule (no suite dir in name).
5. Implement the test class per Scope (trait, seed, 20 rows, page-1 + page-2 assertions, 12-key structure list). Keep Faker use as in factories; no extra helpers.
   - Rationale: roadmap items map 1:1 to assertions; structure assertion tolerates extra envelope keys.
6. `php -l` + Pint `--dirty`; run full `php artisan test --compact` (no `--no-interaction` — unsupported by `test`).
   - Rationale: whole suite must pass under the new driver, not just the new file.
7. Post-suite safety: Tinker count on the **default** (dev) connection still `40`; confirm `caribeops_testing` holds no stray rows outside test transactions (tests roll back; count `0` businesses).
   - Rationale: prove the suite never touched dev data.
8. `git diff --check` + `git status --short` — diff limited to `phpunit.xml` + new test (+ plan file).

## Tests and verification

From `backend/laravel`:

```powershell
php -l tests/Feature/BusinessListTest.php
vendor/bin/pint --dirty --format agent
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors. Pint: passed.
- `test --compact`: all green (currently 3 tests/4 assertions → adds list tests; exact new count reported, not pre-asserted).
- New test: page-1 `200` + structure + `total/per_page/last_page` + fragment; page-2 `200` + 5 items.
- Dev `caribeops`: still 40 businesses (untouched); test DB rolls back to empty.
- `git diff --check`: clean.

## Risks, dependencies, and unresolved questions

- Suite now requires local PG up + `caribeops_testing` existing; without them every DB test errors — documented in outcome for D2-30–32 continuity.
- Wrong-database wipe is the top risk: mitigation is the literal `caribeops_testing` value + user-confirmed creation + post-run dev-count check. Any deviation stops the task and returns the plan to `/check`.
- PG CHECKs now enforced in tests — factory data must satisfy them (it does today); future factory changes must keep that invariant.
- No unresolved material decisions (driver question answered by user).

## Plan check

- Verified paths (`api.php:14-16`, Resource 12 keys, `phpunit.xml:26-28`, `TestCase:1-10`, factory `27-42`, seeder `22-25`, pgsql config `87-95`), confirmed `d2-29` slug + `BusinessListTest` name free, suite shape (3 tests), 6-route baseline.
- Challenged migration-guard alternative: rejected per explicit user decision (PG for testing).
- Challenged `.env.testing` vs `phpunit.xml`: `phpunit.xml` upheld — two values, no new files, host/creds already fall through from `.env`.
- Challenged asserting exact full envelope: subset upheld — pins roadmap items without brittleness to Laravel's extra meta/links keys.
- Challenged row count 20: upheld — smallest count proving 3-page? No: 2 pages (15+5) is the minimal multi-page proof; 20 is the smallest round count exceeding one page.
- Challenged verification strength: full-suite-under-PG + dev-untouched counts required; `migrate:fresh`-on-dev forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list` + glob/grep.

## Implementation outcome

- One-time setup (approved, non-destructive): created empty `caribeops_testing` on local PG via Tinker `CREATE DATABASE`; verified both databases listed afterwards. No writes to dev `caribeops`.
- `backend/laravel/phpunit.xml`: `DB_CONNECTION` sqlite→`pgsql`, `DB_DATABASE` `:memory:`→`caribeops_testing` (2 lines; `DB_URL=""` untouched).
- New `backend/laravel/tests/Feature/BusinessListTest.php` (via `make:test --phpunit`, `RefreshDatabase`): seeds `CategorySeeder`, creates 20 factory rows with the fixed-name record first (id 1, page 1 deterministic); page-1 test asserts `200` + 12-key structure + `links`/`meta` + `total 20`/`per_page 15`/`last_page 2` + fragment; page-2 test asserts `200` + `current_page 2` + 5 items.
- First full-suite run caught one real assertion bug: fixed-name record created last landed on page 2, so the page-1 fragment failed (structure/meta all passed) — fixed by creating it first; rerun green.
- `php -l` clean. Pint `--dirty` passed. `php artisan test --compact`: passed (5 tests, 204 assertions: 3 pre-existing + 2 new).
- Safety: Tinker confirms dev `caribeops` still 40 businesses and `caribeops_testing` has 0 (transactions rolled back). No seeded-row mutation, no `migrate:fresh` on dev.
- `git diff --check`: clean. Diff: `phpunit.xml` 2+/2- + 2 new files (test + plan).
- Note: the D2-29 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change. Follow-up for D2-30–32: suite now requires local PG up with `caribeops_testing` present.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-29-business-list-feature-test.md"`.
