# Plan — D2-32: 404 Feature Test

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-32 — 404 Feature Test
- **Plan path:** `docs/plans/d2-32-404-feature-test.md`

## Desired outcome

`tests/Feature/BusinessNotFoundTest.php` proves error semantics on PG: `GET /api/businesses/999999` → `404` (binding) and `GET /api/businesses/abc` → `404` (constraint, never PG `22P02`). Full suite green; dev untouched; test DB rolls back clean.

## Scope

### In scope

- New test via `php artisan make:test --phpunit BusinessNotFoundTest --no-interaction` (Feature default), using `RefreshDatabase` with no seeds:
  - Test 1: `getJson('/api/businesses/999999')` → `assertNotFound`.
  - Test 2: `getJson('/api/businesses/abc')` → `assertNotFound`.
- Verify: new file green + full `php artisan test --compact` green, `php -l`, Pint, dev count 40, test DB 0, `git diff --check`. Must preserve the uncommitted D2-31 work untouched.

### Non-goals

- No PUT/DELETE 404 cases (identical binding+constraint mechanism, manually verified D2-26/27; GET detail is the canonical boundary).
- No 404 body assertions (framework text, version-brittle); no valid/422/list cases (D2-29–31).
- No route/model/config/factory/seeder changes; no `migrate:fresh` on dev.

## Analysis carried forward

- Roadmap D2-32 needs nonexistent → 404 automation; manual evidence exists but nothing repeatable; the `abc` case guards the D2-23 `whereNumber` fix specifically.
- Current: binding + `whereNumber` on all three `/{business}` routes (`api.php:18-38`); D2-29–31 establish the test pattern (trait, `*Json`, status-first); PG suite verified.
- Tree holds uncommitted D2-31 files; D2-32 adds only new files.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:594-602` — D2-32 target; last Day-2 test task before commit.
- `backend/laravel/routes/api.php:18-38` — 404 mechanism under test; no edit.
- `backend/laravel/tests/Feature/BusinessValidationTest.php:1-30` — nearest pattern; no edit.
- `backend/laravel/phpunit.xml:26-27` — PG test DB; no edit.

## Learning objectives

- Error-path testing with status-only assertions.
- `RefreshDatabase` as table-existence guarantee (404 from binding, not missing-table 500).
- Regression lock for the D2-23 constraint fix.

## Just-in-time concept explanation

Implicit binding resolves `{business}` before the closure: no row → `ModelNotFoundException` → framework `404` JSON for `api/*`. `whereNumber('business')` constrains the route to digits, so `/abc` never matches and falls through to a `404` instead of sending `abc` as a bigint to PG (which raised `22P02`/`500` pre-D2-23). `assertNotFound` pins the status while ignoring the volatile message body.

## Ordered implementation steps

1. Re-confirm status (D2-31 files still present/unmodified); re-read `routes/api.php:18-20`, one pattern test (read-only). Confirm `BusinessNotFoundTest` / `d2-32` names free.
   - Rationale: preserve prior work; prove baseline before generating.
2. Run `php artisan make:test --phpunit BusinessNotFoundTest --no-interaction`; confirm `tests/Feature/`.
   - Rationale: Laravel-way generation per `phpunit/core` rule.
3. Implement the two tests per Scope (trait, no seeds, `getJson`, `assertNotFound`).
   - Rationale: roadmap maps 1:1 plus the `abc` regression lock; no arrange needed.
4. `php -l` + Pint `--dirty`; new file run, then full `php artisan test --compact`.
5. Post-suite safety: dev `40`; test DB `0`; D2-31 files still present and unmodified in `git status`.
6. `git diff --check` + `git status --short` — app diff limited to the new test (+ plan file).

## Tests and verification

From `backend/laravel`:

```powershell
php -l tests/Feature/BusinessNotFoundTest.php
vendor/bin/pint --dirty --format agent
php artisan test --compact --filter=BusinessNotFoundTest
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors. Pint: passed.
- `--filter`: 2 tests green. Full suite: all green (currently 8 tests; adds 2).
- Both 404s; dev `40`, test DB `0`; D2-31 work preserved. `git diff --check`: clean.

## Risks, dependencies, and unresolved questions

- Suite needs PG + `caribeops_testing` — pre-existing, unchanged.
- Without `RefreshDatabase`, missing tables would 500 instead of 404 — trait mandated even seedless.
- Body assertions forbidden (brittle); PUT/DELETE 404 additions would expand scope without new mechanism.
- No unresolved material decisions.

## Plan check

- Verified paths (routes `18-38`, pattern test, `phpunit.xml:26-27`), confirmed `d2-32` slug + `BusinessNotFoundTest` name free, suite shape (8 tests), 6-route baseline, D2-31 files present.
- Challenged PUT/DELETE 404 additions: rejected — same mechanism, manually verified; GET detail is the canonical boundary per minimal-increment precedent.
- Challenged body assertions: rejected — framework text is version-volatile.
- Challenged seedless `RefreshDatabase`: mandated — tables must exist for binding to be the 404 source.
- Challenged verification strength: filter + full suite + both-DB counts + D2-31 preservation required; dev writes forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + globs.

## Implementation outcome

- New `backend/laravel/tests/Feature/BusinessNotFoundTest.php` (via `make:test --phpunit`, seedless `RefreshDatabase`): `GET /999999` → `assertNotFound` (binding); `GET /abc` → `assertNotFound` (constraint, no PG `22P02`). No app/config changes.
- `php -l` clean. Pint `--dirty` passed. `--filter=BusinessNotFoundTest`: passed first run (2 tests, 2 assertions). Full `php artisan test --compact`: passed (10 tests, 239 assertions).
- Safety: dev `caribeops` still 40; `caribeops_testing` 0. No dev writes.
- `git diff --check`: clean. App diff: 1 new file (test) + plan file; no tracked-file modifications.
- Note: the D2-32 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change. Day-2 test tasks D2-29–32 now complete (list/create/validation/404).

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-32-404-feature-test.md"`.
