# D6-16 — Review All Write Endpoint Validation

**Task:** D6-16 — Review All Write Endpoint Validation
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-16-review-write-endpoint-validation.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-15 precedent in `MEMORY.md`.

**Desired outcome:** Every write endpoint has defined validation or authorization behavior, proven by a test per matrix cell. Unproven cells get pin tests; a real bug gets reported, not silently fixed.
**Scope:** `route:list` inventory + behavior probes on the testing DB + new `WriteEndpointAuditTest` covering only unproven cells (login missing-fields 422s, PUT/DELETE unknown-UUID per role, non-UUID segments, PATCH absence) + full matrix in the outcome.
**Non-goals:** No route/policy/request changes (a real bug stops the stage and is reported), no GET coverage, no frontend changes, no commit.

## Analysis carried forward

Write surface is 5 endpoints (`routes/api.php`): public `POST /login` (`LoginRequest`), `auth:sanctum` `POST /logout`, and `sanctum` + `can` `POST`/`PUT`/`DELETE /businesses` (`StoreBusinessRequest` + `prohibited`, `whereUuid`, PUT-only by D2-26 design). Proven at D6-11 (47/47): login 200/422-uniform, logout 204/401/revoked, POST 201/401/403/422, PUT 200/401/403/422 + cross-owner, DELETE 204/401/403 + cross-owner, client `user_id` 422. Unproven: login missing-fields, PUT/DELETE unknown-UUID per role (auth-vs-binding order), non-UUID segments on PUT/DELETE, PATCH absence. `BusinessNotFoundTest` pins only GET with legacy ids.

## Current-state evidence

- `backend/laravel/routes/api.php:16-98` — the 5 writes with their gates (verified this conversation)
- `backend/laravel/app/Http/Requests/LoginRequest.php:23-30` — `email/password` required rules
- `backend/laravel/tests/Feature/BusinessNotFoundTest.php:12-22` — GET-only 404 pins
- `backend/laravel/phpunit.xml:26-27` — `pgsql`/`caribeops_testing`

## Learning objectives and just-in-time concepts

Audit matrix (endpoint × authN/authZ/validation/not-found) built from `route:list` + tests, never memory; pin observed sane behavior, change nothing in an audit.

## Ordered implementation steps

1. `php artisan route:list --path=api -v` inventory of the 5 writes and their gates.
2. Probe unproven cells against the testing DB; record observed vs expected.
3. `php artisan make:test WriteEndpointAuditTest --no-interaction`: pin only unproven cells (login missing-email/password 422s, admin PUT/DELETE unknown-UUID 404s, anonymous/viewer unknown-UUID observed statuses, non-UUID PUT/DELETE 404s, PATCH 405), login-flow idiom, state-unchanged assertions.
4. `php -l` + `vendor/bin/pint --dirty --format agent`; narrow new file then full `php artisan test --compact`.
5. `git diff --check` clean; outcome carries the full matrix (cell → proving test).

## Tests and verification commands, plus expected results

- New pins green first try or corrected to sane observed statuses (401/403/404/405); anything else stops the stage as a reported bug.
- Full suite stays 100% green (baseline 47/47); zero app-code changes expected.

## Risks, dependencies, and unresolved questions

- Anonymous-unknown-UUID outcome (401 vs 404) depends on binding-vs-auth order — pinned as observed, not prescribed.
- PATCH has no route by D2-26 design — 405 pin documents the PUT-only contract.

## Plan check

- Cells derived from read routes/rules/tests; cross-owner/`prohibited`/viewer-403 already pinned (no duplication); fix-nothing rule preserves scope; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `backend/laravel/tests/Feature/WriteEndpointAuditTest.php` via `make:test` (9 audit pins); plan file materialized at this path verbatim from the checked inline deliverable — no scope change. Zero application-code changes (audit landing, D5-06/D5-19 precedent).

**Audit matrix (cell → proving test):**
- `POST /api/login` missing email → 422 `email`, zero tokens — `WriteEndpointAuditTest::test_login_without_email_returns_422` (new)
- `POST /api/login` missing password → 422 `password`, zero tokens — `::test_login_without_password_returns_422` (new)
- `POST /api/login` valid/invalid/unknown-email — `AuthenticationTest` (D6-02, pre-existing)
- `POST /api/logout` authed → 204, revoked reuse → 401, no-token → 401 — `AuthenticationTest` (D6-03, pre-existing)
- `POST /api/businesses` valid authed admin/owner → 201 + owner pinned — `BusinessCreationTest` + `BusinessCrossOwnerTest` (pre-existing)
- `POST /api/businesses` anonymous → 401 + 0 rows — `BusinessCreationTest` (pre-existing)
- `POST /api/businesses` viewer → 403 + 0 rows — `BusinessAuthorizationTest` (pre-existing)
- `POST /api/businesses` invalid → 422 + field errors + 0 rows — `BusinessValidationTest` (pre-existing)
- `POST /api/businesses` with `user_id` → 422 `user_id` — `BusinessCrossOwnerTest` (pre-existing)
- `PUT /api/businesses/{id}` valid/invalid/cross-owner/admin/viewer/anonymous — `BusinessValidationTest` + `BusinessAuthorizationTest` + `BusinessCrossOwnerTest` (pre-existing)
- `PUT` admin unknown-UUID → 404 + 0 rows — `::test_admin_put_unknown_uuid_returns_404` (new)
- `PUT` anonymous unknown-UUID → **401** + 0 rows — `::test_anonymous_put_unknown_uuid_returns_401` (new; audit finding, see below)
- `PUT` admin non-UUID segment → 404 + 0 rows — `::test_admin_put_non_uuid_segment_returns_404` (new)
- `DELETE` authed/cross-owner/viewer/anonymous on real ids — `BusinessDeletionTest` + `BusinessAuthorizationTest` + `BusinessCrossOwnerTest` (pre-existing)
- `DELETE` admin unknown-UUID → 404 — `::test_admin_delete_unknown_uuid_returns_404` (new)
- `DELETE` anonymous unknown-UUID → **401** — `::test_anonymous_delete_unknown_uuid_returns_401` (new; audit finding)
- `DELETE` admin non-UUID segment → 404 — `::test_admin_delete_non_uuid_segment_returns_404` (new)
- `PATCH /api/businesses/{id}` → 405 + 0 rows — `::test_patch_without_route_returns_405` (new; documents PUT-only D2-26 design)

**Audit finding (pinned, not a bug):** auth middleware runs before model binding, so anonymous PUT/DELETE on unknown UUIDs return 401 rather than 404 — callers learn nothing about id existence. Initial draft pinned 404 and failed 2/9; corrected to observed-sane 401 with explanatory comments. No fix needed, nothing reported beyond this record.

**Verification (exact commands/results):**
- `php -l` clean; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: `php artisan test tests/Feature/WriteEndpointAuditTest.php --compact` → **9/9 green, 19 assertions**.
- Full: `php artisan test --compact` → **56/56 green, 407 assertions** (47 pre-existing untouched).
- `php artisan route:list --path=api -v` → 12 routes, 5 writes with gates as inventoried.
- `git diff --check` clean; `git status --short` → new test file (+ new plan file).
