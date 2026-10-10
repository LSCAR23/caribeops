# Plan — D2-31: Validation Feature Test

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-31 — Validation Feature Test
- **Plan path:** `docs/plans/d2-31-validation-feature-test.md`

## Desired outcome

`tests/Feature/BusinessValidationTest.php` locks the shared `StoreBusinessRequest` rules from both entries on PG: invalid `POST` → `422` with field errors and zero rows persisted; invalid `PUT` → `422` with errors and the target row byte-identical. Full suite green; dev untouched; test DB rolls back clean.

## Scope

### In scope

- New test via `php artisan make:test --phpunit BusinessValidationTest --no-interaction` (Feature default), using `RefreshDatabase`:
  - Test 1 (POST): seed categories; payload with `category_id: 999999`, missing `name`, valid `description`/`type 'Boutique hotel'`/`address`, `latitude: 91`, `longitude: -181`, `website: 'not-a-url'`, missing `phone` → `postJson` → `assertUnprocessable` + `assertJsonValidationErrors(['category_id','name','latitude','longitude','website','phone'])` + `assertDatabaseCount('businesses', 0)`.
  - Test 2 (PUT): seed categories; factory row with fixed name `'D2-31 Original Name'`; PUT payload reusing Test-1-style invalids (missing `name`, bad `website`, valid rest incl. real `category_id`) → `putJson('/api/businesses/{id}')` → `assertUnprocessable` + `assertJsonValidationErrors(['name','website'])` + `assertDatabaseHas` original name/type/phone (unchanged).
- Verify: new file green + full `php artisan test --compact` green, `php -l`, Pint, dev count 40, test DB 0, `git diff --check`.

### Non-goals

- No valid-payload cases (D2-30), no 404 cases (D2-32), no list cases (D2-29).
- No message-text assertions (version-brittle); no route/model/Resource/validation/config/factory/seeder changes.
- No `migrate:fresh` on dev; no seeded-row mutation.

## Analysis carried forward

- Roadmap D2-31 needs missing/invalid → 422 automation; manual evidence exists (D2-25/26 probes) but nothing repeatable.
- Current: shared Request (`:25-35`) on POST (`api.php:22-26`) + PUT (`:28-32`); `BusinessCreationTest:1-65` is the mirror pattern (seed, fixed data, `*Json`, DB assertions); PG suite verified (`phpunit.xml:26-27`).
- Tree clean (`9495168`); no `.ai/rules`.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:582-590` — D2-31 target; D2-32 owns 404.
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:25-35` — rule bar under test; no edit.
- `backend/laravel/routes/api.php:22-32` — entries under test; no edit.
- `backend/laravel/tests/Feature/BusinessCreationTest.php:1-65` — pattern; no edit.

## Learning objectives

- Negative testing: 422 + error keys + no-write proofs.
- `assertJsonValidationErrors` key-only assertions vs brittle message text.
- One rule set, two entries: POST + PUT cases guard shared validation.

## Just-in-time concept explanation

Failed `FormRequest` validation throws `ValidationException` before the closure runs, rendered as `422` JSON (`message` + per-field `errors`) for `api/*` requests — so `assertDatabaseCount(..., 0)` after a POST proves no SQL executed, and `assertDatabaseHas` of pre-PUT values proves an invalid update is fully rejected, not partially applied. `assertJsonValidationErrors([...])` checks the failing field set without coupling to message wording.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `BusinessCreationTest`, Request `:25-35`, `routes/api.php:22-32` (read-only). Confirm `BusinessValidationTest` / `d2-31` names free.
   - Rationale: prove baseline before generating.
2. Run `php artisan make:test --phpunit BusinessValidationTest --no-interaction`; confirm `tests/Feature/`.
   - Rationale: Laravel-way generation per `phpunit/core` rule.
3. Implement the two tests per Scope (trait, seed, invalid payloads, `*Json`, 422 + error-key + no-write assertions).
   - Rationale: roadmap maps 1:1; exact error set via otherwise-valid fields; PUT row pre-created valid.
4. `php -l` + Pint `--dirty`; new file run, then full `php artisan test --compact`.
   - Rationale: new coverage first, regression second.
5. Post-suite safety: dev `40`; test DB `0`.
6. `git diff --check` + `git status --short` — app diff limited to the new test (+ plan file).

## Tests and verification

From `backend/laravel`:

```powershell
php -l tests/Feature/BusinessValidationTest.php
vendor/bin/pint --dirty --format agent
php artisan test --compact --filter=BusinessValidationTest
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors. Pint: passed.
- `--filter`: 2 tests green. Full suite: all green (currently 6 tests; adds 2).
- POST: `422` + 6 error keys + count 0. PUT: `422` + 2 error keys + row unchanged.
- Dev `40`, test DB `0`. `git diff --check`: clean.

## Risks, dependencies, and unresolved questions

- Suite needs PG + `caribeops_testing` (D2-29 setup) — pre-existing, unchanged.
- Message-text assertions forbidden by this plan (brittle); keys + statuses only.
- PUT arrange needs a valid factory row first (seeded categories) — invalid PUT itself writes nothing.
- No unresolved material decisions.

## Plan check

- Verified paths (Request `25-35`, routes `22-32`, `BusinessCreationTest:1-65`, `phpunit.xml:26-27`), confirmed `d2-31` slug + `BusinessValidationTest` name free, suite shape (6 tests), 6-route baseline.
- Challenged POST-only vs POST+PUT: both upheld — same shared rules, two entries, one extra test; locks the D2-26 reuse decision.
- Challenged exact error-set vs subset: exact upheld — otherwise-valid fields make it deterministic, no brittleness added.
- Challenged valid-case additions: rejected — D2-30 owns them.
- Challenged verification strength: filter + full suite + both-DB counts required; dev writes forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list` + globs.

## Implementation outcome

- New `backend/laravel/tests/Feature/BusinessValidationTest.php` (via `make:test --phpunit`, `RefreshDatabase`): POST invalid payload (bad `category_id`, missing `name`/`phone`, out-of-range coords, bad `website`) → `422` + 6 error keys + count 0; PUT invalid on a valid factory row (missing `name`, bad `website`) → `422` + 2 error keys + original values intact. No app/config changes.
- `php -l` clean. Pint `--dirty` passed. `--filter=BusinessValidationTest`: passed first run (2 tests, 14 assertions). Full `php artisan test --compact`: passed (8 tests, 237 assertions).
- Safety: dev `caribeops` still 40; `caribeops_testing` 0. No dev writes.
- `git diff --check`: clean. App diff: 1 new file (test) + plan file; no tracked-file modifications.
- Note: the D2-31 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-31-validation-feature-test.md"`.
