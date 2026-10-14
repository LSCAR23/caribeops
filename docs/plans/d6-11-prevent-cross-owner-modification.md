# D6-11 — Prevent Cross-Owner Modification

**Task:** D6-11 — Prevent Cross-Owner Modification
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-11-prevent-cross-owner-modification.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-10 precedent in `MEMORY.md`.

**Desired outcome:** Owner A cannot update or delete Owner B's business (403 + row unchanged). Owner edits/deletes only owned rows (200/204). Admin keeps full write access. Viewer stays 403. Every POST-created business is owned by its creator.
**Scope:** `BusinessPolicy::update/delete` (admin bypass + owner-match; null-owner → admin-only) + POST assigns owner server-side via creator relation + `StoreBusinessRequest` forbids `user_id` + new `BusinessCrossOwnerTest` (own/forbidden/admin/POST-owner).
**Non-goals:** No migration, no `BusinessResource` change, no GET/ownership filtering, no new roles, no `authorize()` change, no frontend work, no commit.

## Analysis carried forward

D6-10 left the data ready but unenforced: `businesses.user_id` nullable FK `nullOnDelete` (migration `2026_10_14_190449`, dev batch 5), `Business::user()` + `User::businesses()`, factory default owner, suite 40/40. `BusinessPolicy::update/delete` still return `role !== 'viewer'`, ignoring `$business->user_id`. POST runs `Business::create($request->validated())` with no `user_id` rule, so API-created rows are born ownerless — D6-11 must close that hole or stay hollow. Decided defaults (user-confirmed at review): POST auto-assigns creator + `user_id => prohibited`; null-owner rows are admin-only.

## Current-state evidence

- `backend/laravel/app/Policies/BusinessPolicy.php:13-32` — `create/update/delete` each `role !== 'viewer'`; `update/delete` ignore the business instance
- `backend/laravel/routes/api.php:82-98` — POST `can:create,App\Models\Business`; PUT/DELETE `can:update,business` / `can:delete,business` after `auth:sanctum`; POST body `Business::create($request->validated())`
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:25-35` — 9 attribute rules, no `user_id`
- `backend/laravel/database/factories/BusinessFactory.php` — default `user_id => User::factory()`
- `backend/laravel/phpunit.xml:26-27` — `pgsql`/`caribeops_testing`
- `docs/day-6-security-testing.md:177-186` + D6-22 — owner-denied-for-other is the spec's test; role+ownership combined

## Learning objectives and just-in-time concepts

Policy instance methods (`update(User, Business)`) let one rule see both identity and resource; admin bypass + strict owner-match (`!== null && ===`) keeps legacy null-owner rows admin-only. Server-side ownership (`creator->businesses()->create()`) plus `prohibited` keeps mass assignment safe: the client can never claim or transfer ownership through the business endpoints.

## Ordered implementation steps

1. `BusinessPolicy::update/delete`: `if ($user->role === 'admin') return true; return $business->user_id !== null && $business->user_id === $user->id;` (`create` untouched: non-viewer). Rationale: the spec's rule in its named home; auto-discovered; null-owner stays admin-only.
2. `routes/api.php` POST: `$request->user()->businesses()->create($request->validated())` (keep 201 + Resource). Rationale: ownership assigned where identity is known; client input never trusted.
3. `StoreBusinessRequest`: `+'user_id' => 'prohibited'`. Rationale: explicit 422 on ownership claims/transfers instead of silent ignore; existing payloads (no `user_id`) unaffected.
4. `php artisan make:test BusinessCrossOwnerTest --no-interaction`: owner PUT own → 200; owner PUT other's → 403 + unchanged; owner DELETE other's → 403 + row kept; owner DELETE own → 204; admin PUT other's → 200; POST by owner → 201 + `user_id == creator` (login-flow + `auth('web')->logout()` + `forgetGuards` isolation). Rationale: the spec's test per operation and role.
5. `php -l` + `vendor/bin/pint --dirty --format agent`.
6. `php artisan route:list --path=businesses -v` shows gates unchanged (auth + can).
7. Narrow (new + authorization + creation + validation + deletion files) then full `php artisan test --compact`.
8. `git diff --check` clean.

## Tests and verification commands, plus expected results

- Cross-owner writes → 403 + unchanged (spec); own writes 200/204; admin cross-owner 200; POST pins creator ownership; viewer 403 and anonymous 401 unchanged.
- Full suite stays green (baseline 40/40, 370 assertions).

## Risks, dependencies, and unresolved questions

- Legacy null-owner rows editable by admin only — accepted and documented.
- `prohibited` rejects client `user_id` on PUT too (ownership immutable via API) — accepted.
- No new packages; factory random owners don't affect admin/viewer asserts.

## Plan check

- Confirmed policy/route/request paths, PK/FK types (`users.id` bigint vs `businesses.id` uuid — `user_id` bigint, no conflict), testing DB driver, login-flow isolation idiom, and spec + D6-22 split against source; slug free; `git` clean.
- Revision vs draft: pinned admin-bypass + strict null-guard, `prohibited` over silent-ignore, relation-create over manual merge, 6-case test matrix over 3.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `app/Policies/BusinessPolicy.php` (`update`/`delete`: admin bypass, else strict owner-match with null-guard; `create` untouched) + `routes/api.php` (POST via `$request->user()->businesses()->create()`; gates/closures otherwise untouched) + `app/Http/Requests/StoreBusinessRequest.php` (`user_id => prohibited`) + new `tests/Feature/BusinessCrossOwnerTest.php` (7 cases: own-PUT 200, cross-PUT 403 unchanged, cross-DELETE 403 kept, own-DELETE 204, admin-PUT-other 200, POST pins creator, client `user_id` 422); plan file materialized at this path verbatim from the checked inline deliverable — no scope change (7th test splits the planned POST case in two for explicit `prohibited` proof).

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all 4 touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: `php artisan test tests/Feature/BusinessCrossOwnerTest.php --compact` → **7/7 green, 18 assertions**.
- Full: `php artisan test --compact` → **47/47 green, 388 assertions** (40 pre-existing incl. viewer-403/admin-write/ownership cases untouched).
- `php artisan route:list --path=businesses -v` → auth + Authorize on POST/PUT/DELETE, in that order (401-before-403), routes unchanged.
- `git diff --check` clean; `git status --short` → policy + route + request edits + new test file (+ new plan file).
