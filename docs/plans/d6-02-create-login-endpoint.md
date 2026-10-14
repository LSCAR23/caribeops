# D6-02 — Create Login Endpoint

**Task:** D6-02 — Create Login Endpoint
**Date:** 2026-10-14
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D6-01
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `POST /api/login` returns a Bearer token for valid
credentials and rejects invalid ones uniformly.

**Scope:** `HasApiTokens` trait + `LoginRequest` + closure route +
`AuthenticationTest` (valid/invalid/unknown-email cases).

**Non-goals:** No logout/me (D6-03/04), no route protection (later D6), no rate
limiting (later D6), no frontend login UI, no commit.

## Analysis carried forward

No login path; users bigint-PK table with unique email; factory password
`'password'`; RefreshDatabase conventions; Sanctum ready, trait pending; `git`
clean at `73e4a62`.

## Current-state evidence

- `routes/api.php` (closures, no auth), `User.php:10-18`, `UserFactory.php:27-33`
- `BusinessCategoryFilterTest.php:1-52` (test idiom), `StoreBusinessRequest`
  (FormRequest precedent, D2-24)
- `docs/day-6-security-testing.md:45-58`

## Learning objectives and just-in-time concepts

`attempt`-as-verification (not existence); token issuance with single plaintext
reveal; 422 uniform rejection (anti-enumeration); FormRequest consistency.

## Ordered implementation steps

1. `User.php`: add `HasApiTokens` (`Laravel\Sanctum` import + trait) — the
   D6-01-deferred line; zero behavior alone. Rationale: issuance prerequisite.
2. `php artisan make:request LoginRequest --no-interaction`: `authorize()` true,
   rules `email: required|string|email`, `password: required|string`. Rationale:
   D2-24 FormRequest convention for request validation.
3. `routes/api.php`: `POST /login` closure taking `LoginRequest` →
   `$request->validated()` → `Auth::attempt($credentials)` → on false, `throw
   ValidationException::withMessages(['email' => 'These credentials do not match
   our records.'])` (422, Sanctum-docs idiom; identical message for unknown
   email vs wrong password — no enumeration oracle) → on true,
   `$request->user()->createToken('api')->plainTextToken` → 200 `{token}`.
   Rationale: framework-idiomatic verification + uniform rejection.
4. `php artisan make:test AuthenticationTest --no-interaction` (Boost: no dir in
   name): `RefreshDatabase` + factory user; valid → 200 + `token` present +
   `assertDatabaseHas('personal_access_tokens', …)`; wrong password → 422 +
   `assertJsonValidationErrors('email')` + tokens table empty; unknown email →
   identical 422 shape. Rationale: the spec's test, including the
   enumeration-parity case.
5. `php -l` + `vendor/bin/pint --dirty --format agent` (Boost rules); `php
   artisan route:list --path=login` shows the route.
6. Narrow test run (new file) then full `php artisan test --compact` (suite must
   stay 18+ green).
7. `git diff --check` clean; `git status --short` → trait edit + request + route
   + test (+ new plan file).

## Tests and verification commands, plus expected results

- New 3-case test green; full suite green (no regressions).
- `route:list` shows `POST api/login`; Pint/`php -l` clean; `diff --check`
  clean.

## Risks, dependencies, and unresolved questions

- Token-name `'api'` cosmetic; plaintext shows once (client must store —
  frontend task later).
- Daemon/artisan down → report blocked.

## Plan check

- **Revision:** rejection status corrected 401 → **422 via
  `ValidationException`** — the Sanctum-docs idiom, consistent with this repo's
  422-on-invalid convention (D2-25), and uniform across unknown-email/wrong-
  password (anti-enumeration). Tests assert `assertJsonValidationErrors('email')`
  accordingly.
- Challenged `Auth::attempt` vs manual `Hash::check`: `attempt` wins — single
  idiomatic call embodying the task's own lesson; stateless-safe under the `api`
  group.
- Challenged FormRequest vs inline rules: FormRequest wins — D2-24 convention
  for request validation; one small file.
- Challenged token-name configurability: rejected — cosmetic, static `'api'`
  suffices until a multi-device need appears.
- Verified: table columns, factory password, test idiom, file paths (no
  clashes: no `LoginRequest`/`AuthenticationTest` exist), slug free, `git`
  clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `app/Models/User.php` (+`HasApiTokens` import + trait) + new
`app/Http/Requests/LoginRequest.php` (FormRequest, `authorize()` true,
email/password rules) + `routes/api.php` (`POST /login` closure:
`validated()` → `Auth::attempt` → 422 `ValidationException` on failure →
200 `{token}` on success) + new `tests/Feature/AuthenticationTest.php`
(3 cases); plan file materialized at this path verbatim from the checked inline
deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all touched PHP; `vendor/bin/pint --dirty --format agent`
  → passed.
- `php artisan route:list --path=login` → `POST api/login` registered.
- Narrow: `AuthenticationTest` **3/3 green, 11 assertions** (valid → 200 +
  token + DB row; wrong password → 422 + email errors + zero tokens; unknown
  email → identical 422 shape + zero tokens).
- Full: `php artisan test --compact` → **21/21 green, 320 assertions** (18
  pre-existing untouched).
- `git diff --check` clean; `git status --short` → exactly the 4 intended paths
  (+ new plan file).
