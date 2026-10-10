# Plan — D2-30: Business Creation Feature Test

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-30 — Business Creation Feature Test
- **Plan path:** `docs/plans/d2-30-business-creation-feature-test.md`

## Desired outcome

`tests/Feature/BusinessCreationTest.php` proves creation from the HTTP boundary on PG: valid `POST` → `201` with the `data`-wrapped 12-key Resource reflecting the sent values, plus `assertDatabaseHas` and count 1 in `businesses`. Full suite green; dev `caribeops` untouched; test DB rolls back clean.

## Scope

### In scope

- New test via `php artisan make:test --phpunit BusinessCreationTest --no-interaction` (Feature default), using `RefreshDatabase`:
  - Arrange: `$this->seed(CategorySeeder::class)`; deterministic payload (`category_id` = hotels id via `Category where slug hotels firstOrFail`, `name` = `'D2-30 Created Business'`, `description`/`type 'Boutique hotel'`/`address`, `latitude 18.4861`, `longitude -69.9312`, `website 'https://example.com/d2-30'`, `phone '+1-809-555-0130'`).
  - Act: `$this->postJson('/api/businesses', $payload)`.
  - Assert response: `assertCreated`, `assertJsonStructure(['data' => [12 keys]])`, `assertJsonPath('data.name', ...)`, `data.category_id`, `data.phone` round-trip paths.
  - Assert persistence: `assertDatabaseHas('businesses', ['name' => 'D2-30 Created Business', ...])`, `assertDatabaseCount('businesses', 1)`.
- Verify: new file green + full `php artisan test --compact` green, `php -l`, Pint, dev-DB count still 40, test DB 0, `git diff --check`.

### Non-goals

- No invalid-payload cases (D2-31 owns 422 coverage); no update/delete/404/list cases (D2-26/27/29/32).
- No route/model/Resource/validation/config changes; no factory/seeder edits; no `.env`/server administration.
- No exact-timestamp assertions (brittle); no `migrate:fresh` on dev.

## Analysis carried forward

- Roadmap D2-30 needs HTTP success + record-exists proof together.
- Current: POST contract verified live (201, `data` 12 keys); `BusinessListTest:1-64` is the exact pattern to mirror (seed → arrange → `*Json` → structure/path/fragment); suite runs PG `caribeops_testing` (`phpunit.xml:26-27` verified); `StoreBusinessRequest:25-35` defines the valid-payload bar.
- Tree clean (D2-29 committed `30709c4`); no `.ai/rules`.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:567-579` — D2-30 target; D2-31/32 own adjacent tests.
- `backend/laravel/routes/api.php:22-26` — endpoint under test; no edit.
- `backend/laravel/tests/Feature/BusinessListTest.php:1-64` — pattern (trait, seed, structure/meta/fragment); no edit.
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:25-35` — validity bar; no edit.
- `backend/laravel/phpunit.xml:26-27` — PG test DB; no edit.

## Learning objectives

- Dual assertion: response contract + persisted state in one test.
- Deterministic fixtures: fixed payload enables exact round-trip checks.
- `assertCreated`/`assertDatabaseHas`/`assertDatabaseCount` vocabulary.

## Just-in-time concept explanation

`postJson` sends JSON through the HTTP kernel: routing → `StoreBusinessRequest` (422 on failure, before the closure) → `Business::create(validated())` → `BusinessResource` with explicit `201`. `assertCreated` pins the status; `assertJsonPath('data.name', ...)` proves the response echoes the input; `assertDatabaseHas` re-queries PG independently of the response, proving persistence rather than serialization. `RefreshDatabase` rolls everything back, so the count-1 assertion is self-contained.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `BusinessListTest`, `routes/api.php:22-26`, `StoreBusinessRequest:25-35` (read-only). Confirm no `d2-30` plan / `BusinessCreationTest` name clash.
   - Rationale: prove baseline and free test-class name before generating.
2. Run `php artisan make:test --phpunit BusinessCreationTest --no-interaction`; confirm `tests/Feature/`.
   - Rationale: Laravel-way generation per `phpunit/core` rule.
3. Implement the test per Scope (trait, seed, fixed payload, postJson, response + DB assertions). Reuse the 12-key list shape from `BusinessListTest`.
   - Rationale: roadmap items map 1:1; fixed values keep assertions exact, not probabilistic.
4. `php -l` + Pint `--dirty`; run the new file, then full `php artisan test --compact`.
   - Rationale: new coverage first, whole-suite regression second (PG driver for all).
5. Post-suite safety: dev `caribeops` count still `40`; `caribeops_testing` businesses `0`.
   - Rationale: prove isolation held.
6. `git diff --check` + `git status --short` — app diff limited to the new test (+ plan file).

## Tests and verification

From `backend/laravel`:

```powershell
php -l tests/Feature/BusinessCreationTest.php
vendor/bin/pint --dirty --format agent
php artisan test --compact --filter=BusinessCreationTest
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors. Pint: passed.
- `--filter`: new test green. Full suite: all green (currently 5 tests; adds 1; exact assertion count reported).
- POST asserts: `201`, structure, round-trip paths, `assertDatabaseHas`, count 1.
- Dev `40`, test DB `0`. `git diff --check`: clean.

## Risks, dependencies, and unresolved questions

- Suite needs PG + `caribeops_testing` (D2-29 setup); without them the test errors — pre-existing condition, unchanged.
- Factory-random payload would make round-trip assertions flaky — fixed payload mandated.
- Scope bleed into 422/404 cases would duplicate D2-31/32 — single valid-payload test only.
- No unresolved material decisions.

## Plan check

- Verified paths (`api.php:22-26`, Request `25-35`, `BusinessListTest:1-64`, `phpunit.xml:26-27`), confirmed `d2-30` slug + `BusinessCreationTest` name free, suite shape (5 tests), 6-route baseline.
- Challenged factory vs fixed payload: fixed upheld — exact round-trip needs deterministic input.
- Challenged extra invalid-case coverage: rejected — D2-31 owns it.
- Challenged timestamp exactness: structure-only upheld — datetimes are generated values.
- Challenged verification strength: filter-run + full-suite + both-DB counts required; dev writes forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list` + glob.

## Implementation outcome

- New `backend/laravel/tests/Feature/BusinessCreationTest.php` (via `make:test --phpunit`, `RefreshDatabase`): seeds `CategorySeeder`, posts a fixed 9-field payload (`D2-30 Created Business`, hotels category, valid coords/URL/phone), asserts `201` + `data` 12-key structure + `name`/`category_id`/`phone` round-trip paths + `assertDatabaseHas` + `assertDatabaseCount(..., 1)`. No route/app/config changes.
- `php -l` clean. Pint `--dirty` passed. `--filter=BusinessCreationTest`: passed (1 test, 19 assertions) on first run. Full `php artisan test --compact`: passed (6 tests, 223 assertions).
- Safety: dev `caribeops` still 40 businesses; `caribeops_testing` 0 (rolled back). No dev writes.
- `git diff --check`: clean. App diff: 1 new file (test) + plan file; no tracked-file modifications.
- Note: the D2-30 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-30-business-creation-feature-test.md"`.
