# D6-04 — Create Current User Endpoint

**Task:** D6-04 — Create Current User Endpoint
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-04-create-current-user-endpoint.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-03 precedent in `MEMORY.md`.

**Desired outcome:** `GET /api/me` with a valid Bearer returns the current user (200); missing/invalid/revoked Bearer is 401.
**Scope:** one `auth:sanctum` closure route in `routes/api.php` + extended `AuthenticationTest` (happy path + unauthenticated-401 + revoked-401).
**Non-goals:** No roles in payload (D6-08), no UserResource, no business-route protection (D6-05+), no frontend wiring (D6-13), no commit.

## Analysis carried forward

No `/me` route; login issues `api`-named tokens, logout revokes current token; `User` hides password/remember_token, no role column yet; login/logout tests only; `git` clean at `0b104da`; spec pins only “authenticated request returns the current user.” Default: bare `$request->user()`, 200.

## Current-state evidence

- `backend/laravel/routes/api.php:16-34` — closures; `Request` imported; logout `auth:sanctum` precedent; no `/me`
- `backend/laravel/app/Models/User.php:12-19` — `HasApiTokens`; `Hidden` password/remember_token
- `database/factories/UserFactory.php:27-34` — name/unique email, password `'password'`
- `backend/laravel/tests/Feature/AuthenticationTest.php` — 7 cases with Bearer isolation idiom
- `docs/day-6-security-testing.md:77-90` — spec

## Learning objectives and just-in-time concepts

Identity endpoint as frontend contract: valid Bearer → `$request->user()`; model serialization honors `Hidden`, so no manual filtering. 401 happens in middleware, before the closure.

## Ordered implementation steps

1. `routes/api.php`, after logout closure: `Route::get('/me', function (Request $request) { return $request->user(); })->middleware('auth:sanctum');` Rationale: Sanctum idiom; reuses logout’s authenticated-route pattern.
2. Extend `AuthenticationTest.php` (no new file): login → `web`-logout + `forgetGuards` → Bearer `GET /api/me` → 200, `id`/`email` match factory user, `assertJsonMissing(['password','remember_token'])`; no-header → 401; login → Bearer logout → `forgetGuards` → same Bearer `GET /api/me` → 401. Rationale: spec + secrecy pin + lifecycle proof.
3. `php -l` + `vendor/bin/pint --dirty --format agent`.
4. `php artisan route:list --path=me` → `GET api/me` with sanctum middleware.
5. Narrow test file then full `php artisan test --compact`.
6. `git diff --check` clean; status → route + test edits (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- 3 new cases green; full suite stays green (baseline 25/25, 333 assertions).
- `route:list` shows me-route; Pint/`php -l` clean; `diff --check` clean.
- Bearer → 200 with own identity; revoked Bearer → 401.

## Risks, dependencies, and unresolved questions

- `{data}` envelope / UserResource rejected as speculative; revisit if D6-08 roles need shaping.
- Bearer isolation required (D6-03 lesson). No new packages.

## Plan check

- Confirmed paths/imports/middleware/response-shape against source; slug free; `git` clean.
- Revision vs draft: added secrecy assertion (`assertJsonMissing`), revoked-token case rationale, `{data}`/UserResource rejection note.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/routes/api.php` (+`GET /me` closure with `auth:sanctum` returning `$request->user()`) + `backend/laravel/tests/Feature/AuthenticationTest.php` (+3 cases); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on both touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=me` → `GET|HEAD api/me` registered.
- Narrow: `AuthenticationTest` **10/10 green, 33 assertions** (7 pre-existing + me 200 with id/email + secrecy pin; me no-token → 401; me revoked-token → 401).
- Full: `php artisan test --compact` → **28/28 green, 342 assertions** (25 pre-existing untouched).
- `git diff --check` clean; `git status --short` → exactly the 2 intended app paths (+ new plan file).
