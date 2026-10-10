# Plan — D2-26: Create Update Endpoint

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-26 — Create Update Endpoint
- **Plan path:** `docs/plans/d2-26-create-update-endpoint.md`

## Desired outcome

`PUT /api/businesses/{business}` type-hints `StoreBusinessRequest`, resolves the target via implicit binding, applies `$business->update($request->validated())`, returns the refreshed model as JSON with `200`. Unknown numeric ids → framework-default `404` JSON; invalid payloads → `422` JSON without SQL. Existing GETs, POST, pagination unchanged.

## Scope

### In scope

- One `PUT /api/businesses/{business}` closure in `backend/laravel/routes/api.php`, following the existing closure pattern:
  ```php
  Route::put('/businesses/{business}', function (StoreBusinessRequest $request, Business $business) {
      $business->update($request->validated());

      return response()->json($business->refresh());
  })->whereNumber('business');
  ```
- Reuse `StoreBusinessRequest` as-is (no new Request file; full-PUT semantics match its required-field rules).
- Verify: `php -l`, Pint `--dirty`, `route:list --path=api` (5 routes), existing suite green, functional PUT valid → 200 + persisted change, PUT invalid → 422 with row unchanged, PUT unknown → 404, GETs/POST unchanged, `git diff --check`.

### Non-goals

- No `PATCH` alias (roadmap says `PUT`; partial-update semantics deferred, not assumed).
- No new `UpdateBusinessRequest`, no controller, no API Resource (D2-28), no versioning.
- No `DELETE` (D2-27), no amenity/review sync on update.
- No new feature-test file (update test belongs beyond D2-26 scope; list/create/validation/404 tests owned by D2-29–D2-32).
- No custom 200/404/422 body shaping, no auth tightening (Day 6), no model/migration/seeder/factory/config changes.
- No `migrate:fresh`.

## Analysis carried forward

- Roadmap D2-26 requires `PUT /api/businesses/{id}` with PG persistence + response reflection; learning goal is validating target + values.
- Current: `routes/api.php:1-25` has GETs + POST only; `StoreBusinessRequest:13-36` is the sole Request (D2-24 deferred reuse to D2-26); `Business:22-32` fillable matches; `bootstrap/app.php:18-22` already JSON-renders `api/*`.
- D2-23 lesson: non-numeric segments need `whereNumber` or PG raises `22P02` 500 — PUT must carry the same constraint as the GET detail route.
- Tree clean at analysis; no `.ai/rules`; closure/no-Resource convention from D2-20–D2-25 upheld per `laravel/core` rule.
- PHPUnit is SQLite-memory regression-only; PG update behavior needs serve + HTTP probes with restore.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:500-513` — D2-26 target; D2-27/28/29–32 own adjacent scope.
- `backend/laravel/routes/api.php:1-25` — only file to edit; append PUT closure with `whereNumber`.
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:13-36` — reuse as-is; no edit.
- `backend/laravel/app/Models/Business.php:22-32` — `fillable` enables `update(validated())`; no edit.
- `backend/laravel/bootstrap/app.php:18-22` — JSON-error proof; no edit.
- `backend/laravel/tests/Feature/HealthEndpointTest.php:9-16` — regression pattern only.

## Learning objectives

- PUT update lifecycle: binding → validation → `update()` → `200` with refreshed state.
- Why target validation (404) and value validation (422) are independent guards.
- Why `validated()` + `refresh()` matter: only clean input persists, response shows stored state.

## Just-in-time concept explanation

With `(StoreBusinessRequest $request, Business $business)` parameters, Laravel first resolves `{business}` via implicit binding (unknown numeric → `404` before validation), then runs `authorize()`/`rules()` (failure → `422` JSON, no SQL). Success gives `$request->validated()` → `$business->update()` persists only allowed keys → `->refresh()` reloads DB state (casts/defaults) → `200` JSON. `whereNumber('business')` keeps `/abc` on the JSON-404 path instead of hitting PG with invalid bigint syntax.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `routes/api.php`, `StoreBusinessRequest`, `Business.php` (read-only).
   - Rationale: start from verified state; preserve closure convention.
2. Edit only `routes/api.php`: append PUT closure above with `whereNumber('business')`; no other lines touched.
   - Rationale: minimal wiring; `200` states update (not `201`); `validated()` preserves D2-25 contract; Request reuse avoids a duplicate rule set for full-PUT semantics.
3. `php -l` + Pint `--dirty` from `backend/laravel`.
4. `php artisan route:list --path=api --no-interaction` — expect 5 routes (4 existing + `PUT api/businesses/{business}`).
5. `php artisan test --compact` — suite stays green.
6. Functional proof against local serve + dev PG: snapshot a seeded row (e.g. `id:1` fields); valid PUT (same 9 keys, changed `name`/`phone`) → `200` + reflected values; `GET /1` confirms persistence; invalid PUT (bad `category_id`, missing `name`) → `422` + row unchanged; PUT unknown (`999999`) → `404`; confirm list/health/POST/detail unchanged. Restore the snapshot with a second valid PUT; verify restore via `GET`. Never `migrate:fresh`; only the snapshot row is touched.
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
- `route:list`: 5 routes; `PUT api/businesses/{business}` present with `whereNumber`.
- `test --compact`: passed (currently 3 tests, 4 assertions; no new file).
- HTTP: valid PUT `200` + updated JSON and persisted `GET` match; invalid PUT `422` with field `errors` and unchanged row; unknown PUT `404`; existing routes unchanged; snapshot row restored.
- `git diff --check`: clean; one-file diff.

## Risks, dependencies, and unresolved questions

- `exists:categories,id` needs seeded category at runtime — use seeded ids for probes.
- Missing `whereNumber` would regress to D2-23 `500` on `/abc` — explicitly required.
- `PUT` is full-replacement here: all 9 rules stay `required`; sending partial bodies `422`s by design (use `PATCH`+`sometimes` only if a later task asks — not this one).
- PUT probe mutates data — snapshot + restore is mandatory; any restore failure stops the task and returns the plan to `/check`.
- SQLite suite can't prove PG update/404 — HTTP/PG probes cover it.
- No unresolved material decisions.

## Plan check

- Verified paths (`api.php:1-25`, Request `13-36`, `Business:22-32`, `bootstrap/app.php:18-22`), confirmed `d2-26` slug free, suite shape (3 tests), SQLite-memory limit, 4-route baseline.
- Challenged PUT vs PUT+PATCH: PUT-only upheld — roadmap wording is `PUT`; adding `PATCH` would assume partial semantics and a second rule mode.
- Challenged new `UpdateBusinessRequest` vs reuse: reuse upheld — full-PUT field set is identical to store; a separate class duplicates 9 rules with no stated difference.
- Challenged controller/Resource/tests: rejected — owned by adjacent tasks (D2-28+); scope stays one route.
- Challenged `update()` without `refresh()`: `refresh()` required — response must show stored state, not stale memory.
- Challenged `200` vs `204`: `200` with body upheld — roadmap requires the response to reflect the update.
- Challenged verification strength: snapshot/restore + unchanged-row check on 422 required; `migrate:fresh` forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list`.

## Implementation outcome

- Implemented PUT wiring: `backend/laravel/routes/api.php` appends `Route::put('/businesses/{business}', ... (StoreBusinessRequest $request, Business $business) ... $business->update($request->validated()) ... response()->json($business->refresh()))->whereNumber('business')`; reuses `StoreBusinessRequest`; existing GETs/POST/pagination untouched; no controller/Resource/test/migration/model changes.
- `php -l routes/api.php`: no syntax errors.
- `vendor/bin/pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 5 routes (`GET api/health`, `GET api/businesses`, `GET api/businesses/{business}`, `POST api/businesses`, `PUT api/businesses/{business}`).
- `php artisan test --compact`: passed (3 tests, 4 assertions; no new file).
- Functional HTTP against `php artisan serve 127.0.0.1:8001` + dev PG `caribeops` (snapshot `id:1` = `Kilback Ltd`): valid PUT (changed `name` → `D2-26-Probe-Updated`, `phone` → `+1-809-555-0199`) → `200` + reflected JSON; `GET /1` confirms persistence; invalid PUT (missing `name`, `category_id:999999`, bad `website`) → `422` with `category_id`/`name`/`website` errors and row unchanged (still probe values); PUT `999999` → `404`; PUT `abc` → `404` (no 500); snapshot restored via second valid PUT → `200`, `GET /1` back to `Kilback Ltd`/`+1.208.599.9955`; Tinker count `40`; list `200`, health `ok` unchanged. No `migrate:fresh`; only `id:1` touched and restored.
- `git diff --check`: clean. `git diff --stat`: `backend/laravel/routes/api.php | 6 ++++++` (1 file, 6 insertions) + untracked plan file.
- Note: the D2-26 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-26-create-update-endpoint.md"`.
