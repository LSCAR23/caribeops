# D6-21 — Laravel CRUD Tests

**Task:** D6-21 — Laravel CRUD Tests
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-21-laravel-crud-tests.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-20 precedent in `MEMORY.md`.

**Desired outcome:** A full CRUD lifecycle test (POST → GET → PUT → GET → DELETE → GET-404 on one row, with DB assertions per step) plus green CRUD subset and full suite.
**Scope:** New `BusinessCrudLifecycleTest` (admin actor, 9-field payload, HTTP + DB asserts per step incl. creator ownership) + narrow/subset/full runs.
**Non-goals:** No app changes, no validation/authorization re-proving (D6-05…11), no frontend changes, no commit.

## Analysis carried forward

CRUD is proven per-operation (list pagination, 201 + DB-has + count, 422s with row intact, 204 + zero rows, plus auth/owner/anonymous variants — 62/62 at D6-18) but no test walks the lifecycle on one row. Login-flow + `logout`/`forgetGuards` isolation + `CategorySeeder` + 9-field payload patterns are established (D6-11 cross-owner test).

## Current-state evidence

- `backend/laravel/tests/Feature/BusinessListTest.php`, `BusinessCreationTest.php`, `BusinessValidationTest.php`, `BusinessDeletionTest.php` — per-operation coverage (verified this conversation)
- `backend/laravel/tests/Feature/BusinessCrossOwnerTest.php` — payload + isolation idiom to reuse

## Learning objectives and just-in-time concepts

Lifecycle test as interaction guard: each step presupposes the previous, so CRUD stays stable while surrounding code evolves; DB assertions per step ("where appropriate").

## Ordered implementation steps

1. `php artisan make:test BusinessCrudLifecycleTest --no-interaction`: one test, admin actor, POST 201 (+ `user_id` == creator) → GET 200 → PUT 200 → GET reflects update → DELETE 204 → GET 404 + `assertDatabaseMissing`, counts along the way. Rationale: the uncovered interaction shape, no duplication of single-op asserts.
2. `php -l` + `vendor/bin/pint --dirty --format agent`; narrow new file, then CRUD subset (`BusinessList/Creation/Validation/DeletionTest`), then full `php artisan test --compact`.
3. `git diff --check` clean; outcome with the operation→test matrix.

## Tests and verification commands, plus expected results

- Lifecycle 1/1; subset + full green (baseline 62/62); 2 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- Admin actor keeps ownership rules out of the lifecycle (D6-11 covers those separately).

## Plan check

- Lifecycle shape is new coverage, not duplication; admin sidesteps policy interplay; DB-per-step matches the spec; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `backend/laravel/tests/Feature/BusinessCrudLifecycleTest.php` via `make:test` (one test: POST 201 + creator ownership → GET 200 → PUT 200 → GET reflects → DELETE 204 → GET 404, DB asserts per step, final count 0); plan file materialized at this path verbatim from the checked inline deliverable — no scope change. Zero application-code changes.

**Operation→test matrix:** GET list/detail — `BusinessListTest` + lifecycle; POST — `BusinessCreationTest` + lifecycle; PUT — `BusinessValidationTest` + lifecycle; DELETE — `BusinessDeletionTest` + lifecycle; authZ/ownership/anon variants — D6-05…11 files (untouched).

**Verification (exact commands/results — the spec's test):**
- `php -l` clean; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: lifecycle **1/1 green, 14 assertions**.
- Subset (List + Creation + Validation + Deletion + Lifecycle): **10/10 green, 256 assertions**.
- Full: `php artisan test --compact` → **63/63 green, 506 assertions** (62 pre-existing untouched).
- `git diff --check` clean; `git status --short` → new test file (+ new plan file).
