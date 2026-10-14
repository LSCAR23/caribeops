# D6-06 — Protect Business Modification

**Task:** D6-06 — Protect Business Modification
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-06-protect-business-modification.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-05 precedent in `MEMORY.md`.

**Desired outcome:** Anonymous `PUT /api/businesses/{business}` is 401; authenticated update behavior unchanged (200 valid, 422 invalid, values kept).
**Scope:** `auth:sanctum` on the PUT route + authenticate the existing PUT validation case + one new anonymous-401 test.
**Non-goals:** No DELETE protection (D6-07), no roles/ownership (D6-08+), no `authorize()` change, no frontend wiring (D6-13), no commit.

## Analysis carried forward

PUT update open; sole PUT test (`BusinessValidationTest` invalid case, anonymous 422) must authenticate; no happy-path PUT test exists; DELETE out of scope; `git` clean at `6281c13`.

## Current-state evidence

- `backend/laravel/routes/api.php:88-92` — open `PUT /businesses/{business}` closure (`StoreBusinessRequest` → `update` → refreshed 200, `whereUuid`)
- `backend/laravel/tests/Feature/BusinessValidationTest.php:55-82` — anonymous PUT 422 case (`User` import already present)
- `docs/day-6-security-testing.md:105-113` — spec

## Learning objectives and just-in-time concepts

Per-operation gates: updates get their own explicit `auth:sanctum` requirement, independent of POST’s. Middleware-before-validation repeats — anonymous invalid PUT is 401, not 422.

## Ordered implementation steps

1. `routes/api.php`: append `->middleware('auth:sanctum')` to the PUT closure (keep `whereUuid`). Rationale: D6-05 mirror; one line; DELETE stays for D6-07.
2. `BusinessValidationTest.php`: authenticate the update case via login-flow (`User` factory → `POST /api/login` → `auth('web')->logout()` + `auth()->forgetGuards()` → Bearer PUT), keeping 422 + unchanged-values assertions; add anonymous **valid** PUT → 401 + row unchanged. Rationale: repo’s single auth idiom; valid payload proves auth-based rejection.
3. `php -l` + `vendor/bin/pint --dirty --format agent`.
4. `php artisan route:list --path=businesses -v` shows sanctum on POST + PUT, not DELETE.
5. Narrow (`BusinessValidationTest.php` + `BusinessCreationTest.php` + `AuthenticationTest.php`) then full `php artisan test --compact`.
6. `git diff --check` clean; status → route + 1 test edit (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- Anonymous valid PUT → 401 + row unchanged (spec); authed invalid → 422 + original values kept.
- Full suite stays green (baseline 29/29, 344 assertions).
- `route:list -v` confirms POST + PUT gated, DELETE open.

## Risks, dependencies, and unresolved questions

- Single entailed test update. No new packages; no `authorize()` change.

## Plan check

- Confirmed open route, sole affected test, pre-existing `User` import, spec, and file paths against source; slug free; `git` clean.
- Revision vs draft: specified **valid** payload for the anonymous case (auth-based proof), added `route:list -v` DELETE-still-open expectation.
- Scope preserved (PUT only); no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/routes/api.php` (PUT `+middleware('auth:sanctum')`, `whereUuid` kept, one line) + `backend/laravel/tests/Feature/BusinessValidationTest.php` (PUT case authenticated via login-flow, still 422 + values kept; new anonymous **valid** PUT → 401 + row unchanged); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on both touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=businesses -v` → sanctum on POST + PUT; DELETE still open (D6-07).
- Narrow: validation + creation + authentication files **15/15 green, 70 assertions**.
- Full: `php artisan test --compact` → **30/30 green, 346 assertions** (29 pre-existing incl. 1 updated in place).
- `git diff --check` clean; `git status --short` → exactly the 2 intended app paths (+ new plan file).
