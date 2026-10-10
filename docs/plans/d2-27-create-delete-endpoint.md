# Plan — D2-27: Create Delete Endpoint

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-27 — Create Delete Endpoint
- **Plan path:** `docs/plans/d2-27-create-delete-endpoint.md`

## Desired outcome

`DELETE /api/businesses/{business}` resolves the target via implicit binding, hard-deletes it with `$business->delete()` (PG cascades remove its reviews + pivot rows), returns `204` with no body. Unknown numeric ids → `404` JSON; non-numeric → `404` JSON via constraint. Existing GETs, POST, PUT, pagination unchanged.

## Scope

### In scope

- One `DELETE /api/businesses/{business}` closure in `backend/laravel/routes/api.php`:
  ```php
  Route::delete('/businesses/{business}', function (Business $business) {
      $business->delete();

      return response()->noContent();
  })->whereNumber('business');
  ```
- Document the hard-delete + cascade policy in the plan outcome (no code beyond the route).
- Verify: `php -l`, Pint `--dirty`, `route:list --path=api` (6 routes), suite green, functional create→delete→`204` + `GET` `404` + count restored, unknown/non-numeric `404`, others unchanged, `git diff --check`.

### Non-goals

- No soft deletes: no `softDeletes` migration, no `SoftDeletes` trait, no query scoping (design + schema already fix hard delete).
- No controller, no API Resource (D2-28), no versioning.
- No amenity/review explicit detach code (FK `cascadeOnDelete` owns it).
- No new feature-test file (delete test belongs beyond D2-27; D2-29–D2-32 own list/create/validation/404 tests).
- No custom `404`/message body, no auth (Day 6), no model/migration/seeder/factory/config changes.
- No `migrate:fresh`; no seeded-row deletion.

## Analysis carried forward

- Roadmap D2-27 requires delete per design; design + migrations resolve to hard delete (no `deleted_at`, cascades on reviews/pivot).
- Current: `routes/api.php:1-31` has GETs + POST + PUT only; `Business:1-57` has no `SoftDeletes`; `bootstrap/app.php:18-22` already JSON-renders `api/*`.
- D2-23 lesson: `whereNumber` required or `/abc` hits PG `22P02` 500 — DELETE must carry it like GET-detail/PUT.
- Tree clean at analysis; no `.ai/rules`; closure/no-Resource convention from D2-20–D2-26 upheld per `laravel/core` rule.
- PHPUnit SQLite-memory is regression-only; PG delete + cascade needs serve probes with a disposable row.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:516-529` — D2-27 target; D2-28/29–32 own adjacent scope.
- `backend/laravel/routes/api.php:1-31` — only file to edit; append DELETE closure with `whereNumber`.
- `backend/laravel/app/Models/Business.php:1-57` — no `SoftDeletes`; no edit (grep-verified).
- `database/migrations/2026_10_09_223250_create_reviews_table.php:16` — reviews `cascadeOnDelete`; no edit.
- `database/migrations/2026_10_09_222207_create_business_amenities_table.php:15-16` — pivot `cascadeOnDelete`; no edit.
- `docs/business-entity-design.md:1-37` — no soft-delete mandate; no edit.
- `bootstrap/app.php:18-22` — JSON-error proof; no edit.
- `tests/Feature/HealthEndpointTest.php:9-16` — regression pattern only.

## Learning objectives

- DELETE lifecycle: binding → `delete()` → `204`, no body.
- Hard-delete domain policy and where cascades live (FK, not application loops).
- Why disposable-probe verification matters: deletes are irreversible.

## Just-in-time concept explanation

With `(Business $business)` the framework resolves `{business}` first (unknown numeric → `404`, never reaching the closure). `$business->delete()` issues one `DELETE`; PG `ON DELETE CASCADE` removes child `reviews` and `business_amenities` rows in the same statement scope. `response()->noContent()` returns `204` with an empty body and `application/json`-neutral framing. `whereNumber('business')` keeps `/abc` on the JSON-404 path instead of sending `abc` as a bigint to PG.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `routes/api.php`, `Business.php`, the two cascade migrations (read-only).
   - Rationale: prove hard-delete policy from schema before writing the route.
2. Edit only `routes/api.php`: append DELETE closure above; no other lines touched.
   - Rationale: minimal wiring; `204` states deletion without inventing a body; binding + constraint reuse GET/PUT guards.
3. `php -l` + Pint `--dirty` from `backend/laravel`.
4. `php artisan route:list --path=api --no-interaction` — expect 6 routes (5 existing + `DELETE api/businesses/{business}`).
5. `php artisan test --compact` — suite stays green.
6. Functional proof against local serve + dev PG (disposable row only): `POST` a uniquely-named valid business → `201` + `id`; `GET /{id}` → `200`; `DELETE /{id}` → `204` empty body; `GET /{id}` → `404`; business count back to baseline and seeded `GET /1` unchanged; `DELETE /999999` → `404`; `DELETE /abc` → `404`; list/health/POST/PUT unchanged. If any step leaves the probe row behind, delete it via Tinker by its unique name and re-verify the count. Never delete a seeded id; never `migrate:fresh`.
7. `git diff --check` + `git status --short` — diff limited to `routes/api.php`.

## Tests and verification

From `backend/laravel`:

```powershell
php -l routes/api.php
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors. Pint: passed.
- `route:list`: 6 routes; `DELETE api/businesses/{business}` present with `whereNumber`.
- `test --compact`: passed (currently 3 tests, 4 assertions; no new file).
- HTTP: probe `POST` `201` → `DELETE` `204` (empty) → `GET` `404`; count restored; seeded row intact; unknown/non-numeric `404`; existing routes unchanged.
- `git diff --check`: clean; one-file diff.

## Risks, dependencies, and unresolved questions

- Seeded-row deletion is irreversible (reviews + links cascade) — disposable-probe pattern is mandatory; any deviation stops the task and returns the plan to `/check`.
- Missing `whereNumber` would regress to D2-23 `500` on `/abc` — explicitly required.
- `204` vs `200`-with-body is locked here as `204` (REST deletion, no invented contract); changing it later is a contract break, not a tweak.
- Cascade behavior is PG-enforced; SQLite suite cannot prove it — HTTP/PG probes cover it.
- No unresolved material decisions.

## Plan check

- Verified paths (`api.php:1-31`, `Business:1-57` no `SoftDeletes`, reviews `:16` + pivot `:15-16` cascades, design doc, `bootstrap/app.php:18-22`), confirmed `d2-27` slug free, suite shape (3 tests), SQLite-memory limit, 5-route baseline.
- Challenged soft vs hard delete: hard upheld — schema has no `deleted_at`, model has no trait, FKs already cascade; soft would need a migration + scoping with no stated requirement.
- Challenged `204` vs `200`: `204` upheld — deletion has no representation to return; matches REST and avoids inventing a body D2-28 would have to keep.
- Challenged explicit detach code: rejected — cascades own cleanup; manual deletes duplicate FK behavior.
- Challenged controller/Resource/tests: rejected — owned by adjacent tasks; scope stays one route.
- Challenged verification strength: create→delete→404 + count-restored + seeded-row-intact required; seeded deletion and `migrate:fresh` forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list` + grep.

## Implementation outcome

- Implemented DELETE wiring: `backend/laravel/routes/api.php` appends `Route::delete('/businesses/{business}', ... (Business $business) ... $business->delete() ... response()->noContent())->whereNumber('business')`; hard-delete policy (no `SoftDeletes`, PG `cascadeOnDelete` on reviews/pivot owns cleanup); existing GETs/POST/PUT/pagination untouched; no controller/Resource/test/migration/model changes.
- `php -l routes/api.php`: no syntax errors.
- `vendor/bin/pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 6 routes (`GET api/health`, `GET api/businesses`, `GET api/businesses/{business}`, `POST api/businesses`, `PUT api/businesses/{business}`, `DELETE api/businesses/{business}`).
- `php artisan test --compact`: passed (3 tests, 4 assertions; no new file).
- Functional HTTP against `php artisan serve 127.0.0.1:8001` + dev PG `caribeops` (baseline 40): probe `POST` (`D2-27-Probe-113235`) → `201` `id:42`; `GET /42` → `200`; `DELETE /42` → `204` empty body (len 0); `GET /42` → `404`; `DELETE /999999` → `404`; `DELETE /abc` → `404` (no 500); seeded `GET /1` → `200`, list → `200`, health `ok` unchanged; Tinker confirms count `40` and `0` rows matching `D2-27-Probe-%`. No seeded-row deletion, no `migrate:fresh`.
- `git diff --check`: clean. `git diff --stat`: `backend/laravel/routes/api.php | 6 ++++++` (1 file, 6 insertions) + untracked plan file.
- Note: the D2-27 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-27-create-delete-endpoint.md"`.
