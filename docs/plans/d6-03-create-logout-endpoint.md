# D6-03 — Create Logout Endpoint

**Task:** D6-03 — Create Logout Endpoint
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-03-create-logout-endpoint.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-02 precedent in `MEMORY.md`.

**Desired outcome:** `POST /api/logout` with a valid Bearer revokes that token; reuse of the same Bearer is then 401.
**Scope:** one `auth:sanctum` closure route in `routes/api.php` + extended `AuthenticationTest` (logout happy path + reuse-401 + unauthenticated-401 + other-token-untouched).
**Non-goals:** No `/me` (D6-04), no business-route protection (later D6), no rate limiting, no frontend logout UI, no token-name change, no commit.

## Analysis carried forward

No logout path; login issues `api`-named tokens via `Auth::attempt` + `createToken`; `HasApiTokens` ready; login tests only; `git` clean at `4b78d6e`; spec pins only “previous authenticated context is invalid.” Default: revoke current token, 204.

## Current-state evidence

- `backend/laravel/routes/api.php:1-28` — closures; `Request` imported; login open; no `/logout`
- `backend/laravel/app/Models/User.php:12,19` — `HasApiTokens`
- `backend/laravel/tests/Feature/AuthenticationTest.php:1-62` — RefreshDatabase + factory idiom to extend
- `docs/day-6-security-testing.md:61-74` — spec; `docs/plans/d6-02-create-login-endpoint.md` — prior closure/test pattern

## Learning objectives and just-in-time concepts

Token revocation as lifecycle close-out: `auth:sanctum` resolves the Bearer to a `PersonalAccessToken` exposed as `currentAccessToken()`; `delete()` removes that row so the string no longer authenticates. Current-only preserves other devices. 204 signals empty success.

## Ordered implementation steps

1. `routes/api.php`, after login closure: `Route::post('/logout', function (Request $request) { $request->user()->currentAccessToken()->delete(); return response()->noContent(); })->middleware('auth:sanctum');` Rationale: first authed route; least-surprise scope; 204 matches DELETE precedent.
2. Extend `AuthenticationTest.php` (no new file): login → Bearer `POST /logout` → 204 + token row gone; same Bearer again → 401; no-header `POST /logout` → 401; two logins, logout A, B still works. Rationale: spec test + scope pin + 401 guard.
3. `php -l` + `vendor/bin/pint --dirty --format agent`.
4. `php artisan route:list --path=logout` → `POST api/logout` with sanctum middleware.
5. Narrow test file then full `php artisan test --compact`.
6. `git diff --check` clean; status → route + test edits (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- New logout cases green; full suite stays green (baseline 21/21, 320 assertions).
- `route:list` shows logout; Pint/`php -l` clean; `diff --check` clean.
- Bearer → 204 → same Bearer → 401.

## Risks, dependencies, and unresolved questions

- Null-token edge unreachable under guard — accepted, noted.
- Prefer-all-devices variant is a one-line `tokens()->delete()` swap — documented, not chosen.
- Daemon down → report blocked; no new packages.

## Plan check

- Confirmed paths/imports/middleware/response-shape against source; slug free; `git` clean.
- Revision vs draft: added explicit route placement, 401 `Unauthenticated` expectation, `$response->json('token')` + `withHeaders` test detail, null-edge note.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/routes/api.php` (+`POST /logout` closure with `auth:sanctum`: `currentAccessToken()->delete()` → 204) + `backend/laravel/tests/Feature/AuthenticationTest.php` (+4 logout cases); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Test-harness fix (no route scope change):** `Auth::attempt` during login leaves the `web` guard authenticated in the same test process, so Sanctum's `Guard` returns a `TransientToken` (session path) instead of the Bearer PAT; `auth('web')->logout()` + `auth()->forgetGuards()` isolate each Bearer request so `currentAccessToken()` is the real PAT. One self-caught duplicate assertion removed before green.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on both touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=logout` → `POST api/logout` registered.
- Narrow: `AuthenticationTest` **7/7 green, 24 assertions** (3 login unchanged + logout 204 + zero tokens; revoked reuse → 401; no-token → 401; second device untouched then revoked).
- Full: `php artisan test --compact` → **25/25 green, 333 assertions** (21 pre-existing untouched).
- `git diff --check` clean; `git status --short` → exactly the 2 intended app paths (+ new plan file).
