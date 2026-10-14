# D6-10 — Add Business Ownership

**Task:** D6-10 — Add Business Ownership
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-10-add-business-ownership.md`

> Note: no `docs/plans/d6-10*` file existed at `/implement` time. The Plan-mode inline draft predated D6-01…D6-09 (assumed no auth/roles, SQLite testing) and was stale: `phpunit.xml` now runs `pgsql`/`caribeops_testing`, `routes/api.php` carries `auth:sanctum` + `can` gates, `BusinessPolicy` denies viewers, and `users.role` exists. This file is the corrected checked plan actually implemented (data-model-only ownership; policy tightening deferred to D6-11).

**Desired outcome:** Every business can identify its owner; `Business->user` and `User->businesses` work; deleting an owner orphans (nulls) rather than destroying businesses.
**Scope:** nullable `businesses.user_id` FK → `users.id` with `nullOnDelete` + `Business` fillable/`user()` + `User::businesses()` + `BusinessFactory` default owner + new `BusinessOwnershipTest` (belongs-to / has-many / delete-nulls).
**Non-goals:** No `POST` auto-assign, no `StoreBusinessRequest` rule, no `BusinessResource` shape change, no `BusinessPolicy`/route change (D6-11), no seeder edits (factory default covers seeds), no frontend work, no commit.

## Analysis carried forward

Ownership was absent: `businesses` migration had `category_id` UUID FK only, no `user_id`; `Business` had `category()/amenities()/reviews()` only; `User` had no `businesses()`; factories/tests created ownerless rows. D6-09 explicitly left owner-write scope unpinned until D6-10/11; D6-11 owns cross-owner denial; D6-22 expects owner-allowed-for-owned. Nullable FK is the non-breaking choice: 40 seeded rows + all write tests posting without `user_id` stay green, while new rows can carry owners.

## Current-state evidence

- `backend/laravel/routes/api.php:82-98` — POST/PUT/DELETE under `auth:sanctum` + `can:{create,update,delete}`; closures use `validated()`/`refresh()`/`delete()`
- `backend/laravel/app/Models/Business.php:23-33` — fillable 9 attrs, no `user_id`; relations `category/amenities/reviews`; `HasUuids`
- `backend/laravel/app/Models/User.php:14-16` — `#[Fillable(name,email,password,role)]`, `HasApiTokens`, no `businesses()`
- `backend/laravel/database/factories/BusinessFactory.php:32-42` — `category_id` + 8 attrs, no `user_id`
- `backend/laravel/database/factories/ReviewFactory.php:22` — precedent `business_id => Business::factory()`
- `backend/laravel/phpunit.xml:26-27` — `DB_CONNECTION=pgsql`, `DB_DATABASE=caribeops_testing` (SQLite issue resolved)
- `docs/day-6-security-testing.md:163-174` — D6-10 test is record-level ownership; D6-11 is cross-owner denial

## Learning objectives and just-in-time concepts

`foreignId()->nullable()->constrained()->nullOnDelete()` (bigint matches `users.id`; null preserves history), `BelongsTo`/`HasMany` inverse pair, factory-owned-by-default (`User::factory()` mirrors `ReviewFactory`), and keeping data (D6-10) separate from permission (D6-11).

## Ordered implementation steps

1. `php artisan make:migration add_user_id_to_businesses_table --no-interaction`, then `up()` adds `$table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()`; `down()` drops foreign + column. Rationale: reversible, PG + testing compatible, no raw SQL.
2. `Business`: fillable += `user_id`; add `user(): BelongsTo`. Rationale: mass-assignable owner, conventional relation name.
3. `User`: add `businesses(): HasMany` (+ import). Rationale: inverse side for D6-11/D6-22 checks; `#[Fillable]` untouched.
4. `BusinessFactory`: `user_id => User::factory()` (+ import). Rationale: seeds + existing `Business::factory()` calls gain owners with zero test churn.
5. `php artisan make:test BusinessOwnershipTest --no-interaction`: belongs-to (`for($owner,'user')` + `is()` + `assertDatabaseHas user_id`), has-many (2 owned, count 2), delete-nulls (owner delete → `user_id null`). Rationale: the spec's test at record level.
6. `php -l` + `vendor/bin/pint --dirty --format agent`.
7. Narrow new test file, then full `php artisan test --compact`.
8. `php artisan migrate --no-interaction` on dev (batch 5, chain intact); `route:list --path=businesses` unchanged (6 routes).
9. `git diff --check` clean.

## Tests and verification commands, plus expected results

- New file 3/3 green; full suite 40/40 green (37 pre-existing untouched); dev migrate batch 5; routes unchanged; resource/request/policy untouched.

## Risks, dependencies, and unresolved questions

- Nullable means legacy rows stay ownerless until recreated — accepted (D6-11 works with null owner as non-owned).
- No API exposure of `user_id` yet — deliberate; add to `BusinessResource` only if D6-11/D6-22 needs it.
- `users.id` bigint vs `businesses.id` uuid — no conflict (`user_id` is bigint FK, not PK).

## Plan check

- Confirmed PK/FK types, testing DB driver, policy/route inventory, factory precedent, and spec + D6-22 split against source; slug free; `git` clean.
- Revisions vs stale inline draft: dropped SQLite guards (testing is PG now), dropped nullable-vs-required question (nullable chosen for non-breaking), dropped Resource/Request changes (deferred), pinned `nullOnDelete` over cascade.
- Scope preserved (data-model-only); no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `database/migrations/2026_10_14_190449_add_user_id_to_businesses_table.php` (nullable FK `nullOnDelete`, reversible) + `app/Models/Business.php` (`user_id` fillable, `user()` BelongsTo) + `app/Models/User.php` (`businesses()` HasMany) + `database/factories/BusinessFactory.php` (`user_id => User::factory()`) + new `tests/Feature/BusinessOwnershipTest.php` (3 record-level cases); plan file materialized at this path as the corrected checked plan — stale inline draft superseded for D6-08/09 + PG-testing reality, no silent scope exceed.

**Verification (exact commands/results — the spec's test):**
- `php -l` clean on all 5 touched PHP files; `vendor/bin/pint --dirty --format agent` → passed.
- Narrow: `php artisan test tests/Feature/BusinessOwnershipTest.php --compact` → **3/3 green, 5 assertions**.
- Full: `php artisan test --compact` → **40/40 green, 370 assertions** (37 pre-existing incl. viewer-403/admin-write cases untouched).
- Dev: `php artisan migrate --no-interaction` → new migration DONE batch 5, chain 12/12 Ran; `route:list --path=businesses` → 6 routes unchanged.
- `git diff --check` clean.
