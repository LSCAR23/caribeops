# D6-08 — Add User Roles

**Task:** D6-08 — Add User Roles
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-08-add-user-roles.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D4-03…D6-07 precedent in `MEMORY.md`.

**Desired outcome:** Users carry one of `admin` / `owner` / `viewer` (default `viewer`), persisted and readable; one user per role persists correctly.
**Scope:** migration + `User` fillable + factory default + new `UserRolesTest` (3 roles + default).
**Non-goals:** No enforcement/policies/middleware (D6-09), no ownership (D6-10), no value constraint/enum, no `/me` change, no seeder changes, no commit.

## Analysis carried forward

No role column/attribute/coverage; `users` table without role; factory without role; `GET /me` exposes `role` automatically once added (secrecy pin unaffected); `git` clean at `8830187`.

## Current-state evidence

- `database/migrations/0001_01_01_000000_create_users_table.php:14-22` — no role column
- `app/Models/User.php:14` — fillable name/email/password; `Hidden` password/remember_token
- `database/factories/UserFactory.php:27-33` — no role attribute
- `docs/day-6-security-testing.md:131-147` — spec (`admin`/`owner`/`viewer`)

## Learning objectives and just-in-time concepts

Roles as data first: a plain `string` column with a least-privilege `viewer` default is the smallest durable foundation; D6-09 enforcement reads this column. Migrations evolve schema reversibly (`up`/`down`); existing rows backfill to the default.

## Ordered implementation steps

1. `php artisan make:migration add_role_to_users_table --no-interaction`: `Schema::table('users')` → `$table->string('role')->default('viewer')`; `down()` drops the column. Rationale: additive standard-Schema migration; existing rows become `viewer`.
2. `User.php`: add `'role'` to `#[Fillable]`. Rationale: factory/test mass-assignment; no registration surface exists.
3. `UserFactory.php`: add `'role' => 'viewer'` to `definition()`. Rationale: least-privilege default for all test users.
4. `php artisan make:test UserRolesTest --no-interaction`: `RefreshDatabase`; loop `['admin','owner','viewer']` → create → `assertDatabaseHas` + attribute equals; factory default is `viewer`. Rationale: the spec’s test, verbatim.
5. `php artisan migrate` on dev DB; `php -l` + `vendor/bin/pint --dirty --format agent`.
6. Narrow (new file) then full `php artisan test --compact`.
7. `git diff --check` clean; status → migration + model + factory + new test (+ new plan file at materialization).

## Tests and verification commands, plus expected results

- 2 new tests green (3 roles persist; default `viewer`); full suite stays green (baseline 32/32, 351 assertions).
- `migrate:status` shows the new batch; `/api/me` includes `"role":"viewer"` for factory users.
- Pint/`php -l` clean; `diff --check` clean.

## Risks, dependencies, and unresolved questions

- Dev-DB rows backfill to `viewer` (intended). Value constraint deferred — D6-09 may add enum/check if enforcement needs it.

## Plan check

- Confirmed schema, model, factory, spec, and file paths against source; `/me` non-breakage verified against the D6-04 assertions; slug free; `git` clean.
- Revision vs draft: added `/me` safety note and dev-migrate (D6-01) precedent.
- Scope preserved (data only); no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `database/migrations/2026_10_14_173601_add_role_to_users_table.php` (`string('role')->default('viewer')`, reversible `down`) + `app/Models/User.php` (+`'role'` fillable) + `database/factories/UserFactory.php` (+`'role' => 'viewer'`) + new `tests/Feature/UserRolesTest.php` via `make:test` (3 roles persist + factory default); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Environment note:** host Postgres was down at stage start (dev + test DBs refused); started via `docker compose up -d postgres` (D4-11 precedent) to `healthy` before verifying.

**Verification (exact commands/results — the spec's test):**
- `php artisan migrate` → new migration DONE as batch 4 on dev DB; `migrate:status` confirms all 12 ran.
- Narrow: `UserRolesTest` **2/2 green, 8 assertions**.
- Full: `php artisan test --compact` → **34/34 green, 359 assertions** (32 pre-existing untouched, incl. `/me` secrecy pin).
- Serialization probe (tinker, row deleted after, count back to 0): `toArray()` keys `id/name/email/verified_at/created_at/updated_at/role` — `role` visible, `password`/`remember_token` still hidden, so `/api/me` now carries the role with no test change.
- `php -l` clean on all touched PHP; `vendor/bin/pint --dirty --format agent` → passed.
- `git diff --check` clean; `git status --short` → 2 edited app paths + new migration + new test (+ new plan file).
