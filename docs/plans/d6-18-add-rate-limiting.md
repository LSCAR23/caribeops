# D6-18 — Add Rate Limiting

**Task:** D6-18 — Add Rate Limiting
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-18-add-rate-limiting.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-17 precedent in `MEMORY.md`.

**Desired outcome:** `POST /api/login` allows 10 attempts/minute per email+IP; the 11th returns 429 with `Retry-After`. Public GETs keep their group throttle, pinned by headers.
**Scope:** Named `login` limiter in `AppServiceProvider` + `throttle:login` on the login route + new `RateLimitTest` (11 attempts → 429; first 10 not prematurely throttled; GET health carries limit headers) + same-email login-count audit of the suite beforehand.
**Non-goals:** No logout/write limiters (group default covers them), no `api`-group changes, no frontend changes, no commit.

## Analysis carried forward

No nominal throttling existed: `route:list -v` showed only `api` on `POST /api/login`. `AppServiceProvider` exists as the limiter home. `AuthenticationTest` fires 9 login POSTs across tests with distinct users per test (max ~2 same-email in one test), so 10/min per email+IP cannot collide. Testing cache is `array`, so the counter works with no sleeps.

## Current-state evidence

- `backend/laravel/routes/api.php:16` — bare `POST /api/login` (verified this conversation)
- `backend/laravel/app/Providers/AppServiceProvider.php` — exists (verified in Plan stage)
- `backend/laravel/tests/Feature/AuthenticationTest.php` — 9 login POSTs, distinct users (verified in Plan stage)

## Learning objectives and just-in-time concepts

`Limit::perMinute(n)->by(key)` (Breeze-style email+IP key) + declarative `throttle:name` middleware; 429 + `Retry-After` as the observable contract; audit-then-limit so the suite never trips its own guard.

## Ordered implementation steps

1. Audit same-email login counts per test in `AuthenticationTest` (highest real burst sets the floor).
2. `AppServiceProvider::boot`: `RateLimiter::for('login', fn (Request $r) => Limit::perMinute(10)->by($r->input('email').'|'.$r->ip()))`. Rationale: brute-force brake that the suite cannot hit.
3. Login route `+= throttle:login`. Rationale: declarative, public-route safe.
4. `php artisan make:test RateLimitTest --no-interaction`: 11 invalid POSTs same email → first 10 are 422 (proves no premature throttle), 11th is 429 with `Retry-After`; `GET /api/health` asserts `X-RateLimit-Limit`. Rationale: the spec's executable behavior plus group-default pin.
5. `php -l` + `vendor/bin/pint --dirty --format agent`; narrow new file then full `php artisan test --compact` (any collateral 429 fails here by design).
6. `route:list --path=login -v` shows `throttle:login`; `git diff --check` clean.

## Tests and verification commands, plus expected results

- 11th attempt 429; suite 100% green (baseline 59/59); 3–4 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- If any existing test logs in >10× same email, the number is renegotiated at step 1 — recorded in the outcome, never silently exceeded.
- Throttle counts all attempts (valid or not) by design.

## Plan check

- Email+IP key avoids punishing shared IPs and distinct users; no-sleep counting; GETs pinned-not-duplicated; pre-count prevents suite breakage; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `app/Providers/AppServiceProvider.php` (`login` 10/min email+IP + `reads` 60/min IP limiters) + `routes/api.php` (`throttle:login` on POST login, `throttle:reads` on the 6 public GETs) + new `tests/Feature/RateLimitTest.php` (11th login → 429, 61st read → 429, health limit headers); plan file materialized at this path verbatim from the checked inline deliverable — scope extended by one audit-driven item below, recorded here.

**Audit findings (both folded into the work, no silent scope):**
1. Same-email login ceiling is 2/test (`test_logout_leaves_other_tokens_valid`) → 10/min holds 5× headroom, number kept.
2. The `api` group carries **no** throttle (health answered without `X-RateLimit-Limit`), so "appropriate public endpoints" had zero protection. Added the `reads` limiter (60/min/IP) on all 6 public GETs instead of merely pinning absent headers; writes stay on auth-gating per plan (credential-stuffing covered by the login brake).

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all 3 PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: `php artisan test tests/Feature/RateLimitTest.php --compact` → **3/3 green, 77 assertions** (first run 2/3: the headers pin exposed finding #2; reads limiter + hammer added, then green).
- Full: `php artisan test --compact` → **62/62 green, 492 assertions** (59 pre-existing untouched — per-test app isolation confirmed, no collateral 429).
- `php artisan route:list --path=login -v` → `throttle:login` present.
- `git diff --check` clean; `git status --short` → provider + routes + new test file (+ new plan file).
