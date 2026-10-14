# D6-17 — Configure CORS

**Task:** D6-17 — Configure CORS
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-17-configure-cors.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-16 precedent in `MEMORY.md`.

**Desired outcome:** Only the required frontend origins per environment reach the API: preflight from an allowed origin returns allow headers; other origins get none; the browser login flow keeps working.
**Scope:** Published `config/cors.php` with deliberate env-driven origins + `.env.example` documentation + new `CorsTest` (allowed/denied preflight, GET with Origin) + browser login regression.
**Non-goals:** No `supports_credentials` (Bearer needs no cookies), no Sanctum/cookie changes, no wildcard, no frontend changes, no commit.

## Analysis carried forward

No `config/cors.php` was published and no `HandleCors` reference exists in app code (`fruitcake/php-cors` only transitive in `composer.lock`), yet cross-origin browser flows worked (`:3101` → `:8000` login 201/logout in D6-12/13/15) — framework permissive defaults, nothing deliberate. Auth is header Bearer, so `supports_credentials=false` is correct; real paths are `api/*`.

## Current-state evidence

- `backend/laravel/config/` — 11 files, none cors (verified in Plan stage)
- `backend/laravel/composer.lock` — `fruitcake/php-cors` transitive only
- `backend/laravel/bootstrap/app.php` — empty `withMiddleware`, no CORS wiring
- D6-12/13/15 browser transcripts — cross-origin flows green under defaults

## Learning objectives and just-in-time concepts

Preflight (`OPTIONS` + `Origin`/`Access-Control-Request-Method` → `Access-Control-Allow-Origin`); explicit per-environment allowlist via env; credentials only with cookies.

## Ordered implementation steps

1. Publish `config/cors.php` (`config:publish` or framework stub): `paths api/*`, `allowed_origins` from `CORS_ALLOWED_ORIGINS` (comma-separated) plus dev defaults (`localhost`/`127.0.0.1` × `:3000`/`:3101`), methods GET/POST/PUT/DELETE, headers `Accept, Authorization, Content-Type, X-Requested-With`, `max_age` 86400, `supports_credentials` false. Rationale: deliberate exposure, env differs without code changes.
2. `.env.example`: document `CORS_ALLOWED_ORIGINS` (empty = dev defaults).
3. `php artisan make:test CorsTest --no-interaction`: runtime `config()->set('cors.allowed_origins', [...])` (no testing-env coupling); `OPTIONS` allowed origin → 204 + echoed `Allow-Origin`; `https://evil.example` → no `Allow-Origin`; `GET /api/health` with allowed Origin → header present.
4. `php -l` + `vendor/bin/pint --dirty --format agent`; narrow new file then full `php artisan test --compact`.
5. `git diff --check` clean.
6. Browser regression (`serve :8000` + `dev :3101`): valid login → `/` (real preflight against the new config).

## Tests and verification commands, plus expected results

- Preflight matrix green; suite 100% green (baseline 56/56); browser login green; 3–4 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- If `config:publish` is unavailable, hand-write the file mirroring the framework stub.
- Testing `OPTIONS` goes through the global CORS middleware in the test stack — verified green at implement, else noted.

## Plan check

- No published config confirmed in source; runtime `config()->set` avoids testing-env coupling; Bearer justifies `supports_credentials=false`; browser step validates real preflight, not just test headers; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `backend/laravel/config/cors.php` via `config:publish` then deliberately narrowed (`paths api/*`, methods GET/POST/PUT/DELETE, fixed headers, `max_age` 86400, `supports_credentials` false, origins from `CORS_ALLOWED_ORIGINS` + dev defaults, never `*`) + `backend/laravel/.env.example` (`CORS_ALLOWED_ORIGINS` documented) + new `backend/laravel/tests/Feature/CorsTest.php` (allowed/denied preflight + GET with Origin); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on both PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: `php artisan test tests/Feature/CorsTest.php --compact` → **3/3 green, 8 assertions** (first run 2/3: denied preflight carries an *empty* `Allow-Origin`, never echoed — browsers match on value so nothing is permitted; corrected the pin to `assertNotEquals` with a comment instead of `assertFalse(has)`).
- Full: `php artisan test --compact` → **59/59 green, 415 assertions** (56 pre-existing untouched).
- Browser regression (`serve :8000` + `dev :3101`, temp viewer removed after with count back to 0): valid login → `/` with 50-char token through real preflight against the new config (Go `ECONNREFUSED` fallbacks in the log are the down analytics container, unrelated).
- `git diff --check` clean; `git status --short` → env example edit + cors config + new test file (+ new plan file).
