# D6-07 — Protect Business Deletion

**Task:** D6-07 — Protect Business Deletion
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-07-protect-business-deletion.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-06 precedent in `MEMORY.md`.

**Desired outcome:** Anonymous `DELETE /api/businesses/{business}` is 401 with the row preserved; authenticated DELETE still 204s and removes the row.
**Scope:** `auth:sanctum` on the DELETE route + new `BusinessDeletionTest.php` (anonymous-401 + authed-204).
**Non-goals:** No roles/ownership (D6-08+), no `authorize()` change, no frontend wiring (D6-13), no changes to existing test files, no commit.

## Analysis carried forward

DELETE open, last ungated write route; zero existing tests touch DELETE so no updates entailed; factory needs seeded categories; `git` clean at `6e10b03`.

## Current-state evidence

- `backend/laravel/routes/api.php:94-98` — open `DELETE /businesses/{business}` closure (`delete()` → 204, `whereUuid`)
- `backend/laravel/tests/Feature/` — zero deletion coverage (grep-verified `deleteJson`/204)
- `BusinessFactory` + `CategorySeeder` seeding pattern (creation/validation tests)
- `docs/day-6-security-testing.md:117-125` — spec

## Learning objectives and just-in-time concepts

Destructive-first gating: the most dangerous operation gets its explicit auth requirement now; roles/ownership (D6-08+) refine it later. Anonymous callers get 401; the authed path (binding → delete → 204) is byte-identical.

## Ordered implementation steps

1. `routes/api.php`: append `->middleware('auth:sanctum')` to the DELETE closure (keep `whereUuid`). Rationale: identical one-line pattern; completes POST/PUT/DELETE.
2. `php artisan make:test BusinessDeletionTest --no-interaction`, then 2 tests with `RefreshDatabase`: seed categories → `Business::factory()->create()`; anonymous `deleteJson` → 401 + row preserved; login-flow (`User` factory → `/api/login` → `web`-logout + `forgetGuards`) → Bearer `deleteJson` → 204 + row gone. Rationale: per-concern file; single auth idiom.
3. `php -l` + `vendor/bin/pint --dirty --format agent`.
4. `php artisan route:list --path=businesses -v` shows sanctum on POST + PUT + DELETE.
5. Narrow (new file) then full `php artisan test --compact`.
6. `git diff --check` clean; status → route edit + new test file (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- Anonymous DELETE → 401, row preserved (spec); authed DELETE → 204, row gone.
- Full suite stays green (baseline 30/30, 346 assertions).

## Risks, dependencies, and unresolved questions

- None blocking. D6-21 may subsume this file into broader CRUD tests later.

## Plan check

- Confirmed open route, zero-coverage grep, factory/seeder pattern, spec, and file paths against source; slug free; `git` clean.
- Revision vs draft: confirmed new-file placement (rationale recorded), added D6-21 handoff note.
- Scope preserved (DELETE only); no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/routes/api.php` (DELETE `+middleware('auth:sanctum')`, `whereUuid` kept, one line) + new `backend/laravel/tests/Feature/BusinessDeletionTest.php` via `make:test` (anonymous DELETE → 401 + row preserved; authed Bearer DELETE → 204 + zero rows); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on both touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=businesses -v` → sanctum on POST + PUT + DELETE (trilogy complete).
- Narrow: `BusinessDeletionTest` **2/2 green, 5 assertions**.
- Full: `php artisan test --compact` → **32/32 green, 351 assertions** (30 pre-existing untouched — zero entailed updates).
- `git diff --check` clean; `git status --short` → 1 route line + new test file (+ new plan file).
