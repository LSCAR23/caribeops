# D6-22 — Authorization Tests

**Task:** D6-22 — Authorization Tests
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-22-authorization-tests.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-21 precedent in `MEMORY.md`.

**Desired outcome:** All four spec cells green with a cited proving test each: admin allowed, owner allowed for owned, owner denied for another's, viewer denied for writes.
**Scope:** Narrow auth run (`BusinessAuthorizationTest` + `BusinessCrossOwnerTest` + admin write files) + full suite; matrix in the outcome; new pin only on a missing cell.
**Non-goals:** No policy/route changes, no new roles, no frontend changes, no commit.

## Analysis carried forward

All four cells have tests from D6-05…11 work: admin writes (201/422/204 across creation/validation/deletion + cross-owner admin PUT 200), owner-own (cross-owner PUT 200 + DELETE 204), owner-other (cross-owner PUT/DELETE 403 + unchanged), viewer writes (`BusinessAuthorizationTest` 403 ×3). Suite 63/63 at D6-21 with policy/routes untouched since D6-11.

## Current-state evidence

- `backend/laravel/tests/Feature/BusinessAuthorizationTest.php` — viewer 403 ×3 (verified D6-09)
- `backend/laravel/tests/Feature/BusinessCrossOwnerTest.php` — 7 cases own/cross/admin/POST-owner (verified D6-11)
- `backend/laravel/tests/Feature/BusinessCreationTest.php`, `BusinessValidationTest.php`, `BusinessDeletionTest.php` — admin-path writes (verified D6-05…07)

## Learning objectives and just-in-time concepts

Permission matrix as executable spec: one cited test per cell; authorization failures are the costliest bugs, so each rule stays pinned.

## Ordered implementation steps

1. Narrow: authorization + cross-owner + creation + validation + deletion files green.
2. Full `php artisan test --compact` green (baseline 63/63).
3. New pin only on a genuinely missing cell (not expected).
4. `git diff --check` clean; outcome carries the cell→test matrix.

## Tests and verification commands, plus expected results

- 4/4 cells green; probable zero-app-change landing.

## Risks, dependencies, and unresolved questions

- A red cell would be investigated as a real bug, never rewritten to fit.

## Plan check

- Cells mapped to source-read tests; matrix requires a citation per cell; failure means bug, not rewrite; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** plan file materialized at this path verbatim from the checked inline deliverable — no scope change. Zero application/test changes (verify-only landing): all four cells already pinned.

**Permission matrix (cell → proving test, all green):**
- admin allowed (POST 201, PUT 200 incl. another owner's row, DELETE 204) — `BusinessCreationTest::test_business_creation_returns_resource_and_persists_record`, `BusinessDeletionTest`, `BusinessCrossOwnerTest::test_admin_can_update_another_owners_business`
- owner allowed for owned (PUT 200, DELETE 204) — `BusinessCrossOwnerTest::test_owner_can_update_own_business`, `::test_owner_can_delete_own_business`
- owner denied for another owner's (PUT/DELETE 403 + unchanged) — `BusinessCrossOwnerTest::test_owner_cannot_update_another_owners_business`, `::test_owner_cannot_delete_another_owners_business`
- viewer denied for writes (POST/PUT/DELETE 403 + unchanged) — `BusinessAuthorizationTest` (3 cases)

**Verification (exact commands/results — the spec's test):**
- Narrow (authorization + cross-owner + creation + validation + deletion): **17/17 green, 66 assertions**.
- Full: `php artisan test --compact` → **63/63 green, 506 assertions** (unchanged baseline).
- `git diff --check` clean; `git status --short` → only the new plan file.
