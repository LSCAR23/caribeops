# D6-05 — Protect Business Creation

**Task:** D6-05 — Protect Business Creation
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-05-protect-business-creation.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-04 precedent in `MEMORY.md`.

**Desired outcome:** Anonymous `POST /api/businesses` is 401; authenticated requests behave exactly as before (201 valid, 422 invalid).
**Scope:** `auth:sanctum` on the POST route + authenticate the two affected pre-existing tests + one new anonymous-401 test.
**Non-goals:** No PUT/DELETE protection (D6-06/07), no roles/ownership (D6-08+), no `authorize()` change, no frontend token wiring (D6-13), no commit.

## Analysis carried forward

POST creation open with `authorize()` true; `BusinessCreationTest` (anonymous 201) and creation half of `BusinessValidationTest` (anonymous 422) must authenticate; PUT case and PUT/DELETE routes out of scope; frontend anonymous form breakage accepted per roadmap order (protection D6-05/06/07 precedes frontend auth D6-12/13); `git` clean at `bb459d1`.

## Current-state evidence

- `backend/laravel/routes/api.php:82-86` — open `POST /businesses` closure (`StoreBusinessRequest` → `create` → 201)
- `backend/laravel/tests/Feature/BusinessCreationTest.php:34-64` — anonymous happy path
- `backend/laravel/tests/Feature/BusinessValidationTest.php:15-41` — anonymous 422 creation case; PUT case untouched
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:13-16` — `authorize()` true (unchanged)
- `frontend/next/src/components/NewBusinessForm.tsx:36`, `src/lib/api-client.ts:53-61` — anonymous form (accepted breakage)
- `docs/day-6-security-testing.md:93-101` — spec

## Learning objectives and just-in-time concepts

Middleware-before-validation: `auth:sanctum` rejects anonymous requests (401) before `StoreBusinessRequest` validation runs — so a bad payload without a token yields 401, not 422. Authentication gates *access*; validation gates *shape*. First write endpoint behind auth.

## Ordered implementation steps

1. `routes/api.php`: append `->middleware('auth:sanctum')` to the `POST /businesses` closure only. Rationale: smallest explicit enforcement; PUT/DELETE are D6-06/07.
2. `BusinessCreationTest.php`: authenticate the happy path via login-flow (`User` factory → `POST /api/login` → `auth('web')->logout()` + `auth()->forgetGuards()` → Bearer POST), keeping all assertions; add anonymous valid-payload POST → 401 + `assertDatabaseCount('businesses', 0)`. Rationale: repo’s single auth idiom; spec test lives with the creation contract.
3. `BusinessValidationTest.php`: authenticate the creation case the same way (still 422 + zero rows); leave the PUT case exactly as-is. Rationale: proves validation still runs for authed callers.
4. `php -l` on touched files + `vendor/bin/pint --dirty --format agent`.
5. Narrow: both touched files + `AuthenticationTest.php`, then full `php artisan test --compact`.
6. `git diff --check` clean; status → route + 2 test edits (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- Anonymous valid POST → 401 + zero rows (spec); authed valid → 201 + persisted; authed invalid → 422 + zero rows.
- Full suite stays green (baseline 28/28, 342 assertions).
- `php artisan route:list --path=businesses` shows POST with sanctum middleware; Pint/`php -l` clean; `diff --check` clean.

## Risks, dependencies, and unresolved questions

- Pre-existing tests must change (entailed by the task). Frontend `NewBusinessForm` 401s until D6-13 (roadmap order, accepted — no action).
- No new packages; no `authorize()` change.

## Plan check

- Confirmed open route, both affected tests, `authorize()`-true, frontend evidence, and file paths against source; slug free; `git` clean.
- Revision vs draft: pinned login-flow over `Sanctum::actingAs` (single-idiom rationale), added `AuthenticationTest.php` to the narrow run, recorded frontend-accepted-breakage explicitly.
- Scope preserved (POST only); no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/routes/api.php` (`POST /businesses` + `auth:sanctum`, one line) + `backend/laravel/tests/Feature/BusinessCreationTest.php` (happy path authenticated via login-flow; new anonymous → 401 + zero rows) + `backend/laravel/tests/Feature/BusinessValidationTest.php` (creation case authenticated, still 422; PUT case untouched); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all 3 touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=businesses -v` → POST carries `Authenticate:sanctum`; GET/PUT/DELETE unchanged (no middleware).
- Narrow: creation + validation + authentication files **14/14 green, 68 assertions**.
- Full: `php artisan test --compact` → **29/29 green, 344 assertions** (28 pre-existing incl. 2 updated in place).
- `git diff --check` clean; `git status --short` → exactly the 3 intended app paths (+ new plan file).
