# D6-09 — Add Authorization Policies/Middleware

**Task:** D6-09 — Add Authorization Policies/Middleware
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-09-add-authorization-policies.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-08 precedent in `MEMORY.md`.

**Desired outcome:** Viewers get 403 on all business writes with state unchanged; admins pass as before; anonymous still 401.
**Scope:** `BusinessPolicy` (create/update/delete: non-viewer) + `can` middleware on POST/PUT/DELETE + existing write tests to admin users + new `BusinessAuthorizationTest` (viewer 403 ×3).
**Non-goals:** No ownership rules (D6-10/11), no viewer read restrictions, no `authorize()` change, no frontend work, no commit.

## Analysis carried forward

Zero authorization logic; all authed users (viewer by default) can write; spec’s “admin-only” resolved via D6-22 end-state to viewer-denied with admin + owner passing until D6-11 tightens owners; existing write tests must switch to admin; `git` clean at `e79d293`.

## Current-state evidence

- `backend/laravel/routes/api.php:82-98` — `auth:sanctum`-only gates on POST/PUT/DELETE
- No `app/Policies/` directory; `User.role` fillable (D6-08)
- Write tests authed as factory-default viewers (creation, validation ×2, deletion)
- `docs/day-6-security-testing.md:151-160` + D6-22 (`day-6:345-358`)

## Learning objectives and just-in-time concepts

401 vs 403: authentication (identity) vs authorization (permission) — separate layers evaluated in order. Policies centralize per-model rules in one auto-discovered, unit-testable class; `can` middleware enforces them declaratively so closures stay clean.

## Ordered implementation steps

1. `php artisan make:policy BusinessPolicy --no-interaction` (no `--model`: avoids dead stubs), then hand-write `create(User $user): bool`, `update(User $user, Business $business): bool`, `delete(User $user, Business $business): bool`, each `return $user->role !== 'viewer';`. Rationale: task’s namesake mechanism; auto-discovered; single home D6-10/11 extends.
2. `routes/api.php`: POST += `can:create,App\Models\Business`; PUT/DELETE += `can:update,business` / `can:delete,business`, each listed **after** `auth:sanctum` (keep `whereUuid`). Rationale: 401-before-403 ordering; closures untouched.
3. Existing write tests → `User::factory()->create(['role' => 'admin'])` (creation happy path, validation creation + update cases, deletion authed case). Rationale: admin universally allowed per D6-22; owner semantics belong to D6-10/11.
4. `php artisan make:test BusinessAuthorizationTest --no-interaction`: viewer POST (valid payload) / PUT / DELETE → 403 + state unchanged (3 tests, login-flow + isolation idiom). Rationale: the spec’s test, per operation.
5. `php -l` + `vendor/bin/pint --dirty --format agent`.
6. `php artisan route:list --path=businesses -v` shows auth + can on all three writes.
7. Narrow (new + 3 touched files + `AuthenticationTest.php`) then full `php artisan test --compact`.
8. `git diff --check` clean; status → policy + route + 3 test edits + 2 new files (+ plan file).

## Tests and verification commands, plus expected results

- Viewer writes → 403 + unchanged (spec); admin writes unchanged (201/200/422/204); anonymous still 401.
- Full suite stays green (baseline 34/34, 359 assertions).

## Risks, dependencies, and unresolved questions

- 4-spot entailed churn is mechanical (`['role' => 'admin']`). Owner-write scope unpinned until D6-10/11. No new packages.

## Plan check

- Confirmed gates, paths, auto-discovery naming, spec + D6-22 evidence, and test inventory against source; slug free; `git` clean.
- Revision vs draft: pinned auth-before-can ordering, rejected `--model` scaffolding (dead stubs), added anonymous-still-401 expectation.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `app/Policies/BusinessPolicy.php` via `make:policy` (no `--model`; `create`/`update`/`delete` each `role !== 'viewer'`, auto-discovered) + `routes/api.php` (`can:create,App\Models\Business` / `can:update,business` / `can:delete,business` listed after `auth:sanctum`) + 4-spot admin switch in `BusinessCreationTest` / `BusinessValidationTest` ×2 / `BusinessDeletionTest` + new `tests/Feature/BusinessAuthorizationTest.php` (viewer 403 ×3 with state unchanged); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all 6 touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- `php artisan route:list --path=businesses -v` → auth + Authorize on POST/PUT/DELETE, in that order (401-before-403).
- Narrow: authorization + creation + validation + deletion + authentication files **20/20 green, 81 assertions**.
- Full: `php artisan test --compact` → **37/37 green, 365 assertions** (34 pre-existing incl. 4 updated spots; anonymous-401 cases still green).
- `git diff --check` clean; `git status --short` → route + 3 test edits + new policy dir + new test file (+ new plan file).
