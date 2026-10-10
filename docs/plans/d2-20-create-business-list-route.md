# Plan — D2-20: Create Business List Route

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-20 — Create Business List Route
- **Plan path:** `docs/plans/d2-20-create-business-list-route.md`

## Desired outcome

`GET /api/businesses` returns HTTP 200 with a JSON array of businesses from PostgreSQL,
proving API routes are separated from web page routes.

## Scope

### In scope

- Add `GET /api/businesses` to `backend/laravel/routes/api.php` as a closure returning
  `Business::all()` as JSON (imports `App\Models\Business`).
- Verify registration (`route:list`), syntax (`php -l`), style (Pint), a functional
  `GET /api/businesses` check (200 + JSON array), and no regressions in the existing suite.

### Non-goals

- No pagination (D2-21), no detail endpoint (D2-22), no 404 handling (D2-23).
- No validation / create / update / delete (D2-24–D2-27).
- No API Resources or response reshaping (D2-28); raw model serialization stands for this step.
- No new feature-test file (D2-29 owns the list feature test).
- No `web.php`, model, migration, seeder, dependency, or versioning changes.

## Analysis carried forward

- Roadmap D2-20 (`docs/day-2-laravel-postgresql.md`): `GET /api/businesses`, test HTTP 200
  with JSON, learning goal is separating API routes from web routes.
- `routes/api.php` holds only the `/health` closure; `route:list --path=api` shows 1 route.
  No `/businesses` route, no business controller (only abstract `Controller.php`).
- `Business` model exposes `$fillable` plus `category()` BelongsTo, `amenities()`
  BelongsToMany, `reviews()` HasMany — sufficient for a list route.
- `phpunit.xml` uses SQLite `:memory:`; seeded-PostgreSQL behavior must be checked against
  local PostgreSQL, not PHPUnit. D2-19 dataset (3/20/40/320) per MEMORY, not re-verified here.
- Working tree clean; no `d2-20` plan existed; no `.ai/rules` directory.
- No blocking questions. Closure-vs-controller decided below (closure, with rationale).

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-20 target and learning goal; D2-21/D2-28 own
  pagination and Resources.
- `backend/laravel/routes/api.php` — the only file to change (add route beside `/health`).
- `backend/laravel/routes/web.php` — must stay untouched (proves API/web separation).
- `backend/laravel/app/Models/Business.php` — list source; no changes needed.
- `backend/laravel/app/Http/Controllers/Controller.php` — abstract base only; no new
  controller for this step (see rationale).
- `backend/laravel/tests/Feature/HealthEndpointTest.php` — existing API test pattern.
- `backend/laravel/phpunit.xml` — SQLite suite config (regression only).
- `backend/laravel/AGENTS.md` — conventions followed (existing patterns, Pint, narrow tests).

## Learning objectives

- API routes live in `routes/api.php` (stateless, `/api`-prefixed, JSON); page routes live
  in `routes/web.php`. Adding the route to `api.php` is the lesson, not just the endpoint.
- An Eloquent collection returned from a route serializes to a JSON array; explicit
  response contracts (Resources) come later in D2-28.

## Just-in-time concept explanation

Laravel loads `routes/api.php` with API middleware and automatically prefixes URIs with
`/api`, so `Route::get('/businesses', ...)` there answers at `GET /api/businesses`.
The existing `Route::get('/health', fn () => response()->json(['status' => 'ok']))`
is the template: same file, same closure style, JSON response. `Business::all()`
fetches every row; Laravel converts the returned collection to a JSON array with a 200
status. An empty table correctly yields `200` with `[]`.

## Ordered implementation steps

1. In `backend/laravel/routes/api.php`, import `App\Models\Business` and register
   `Route::get('/businesses', fn () => response()->json(Business::all()));`
   beside `/health`.
   - Rationale: matches the file's existing closure convention (smallest diff, one file);
     a dedicated controller is deferred until the CRUD surface grows (D2-22+).
     No Resource (D2-28) and no pagination (D2-21) per explicit non-goals.
2. Run `php -l routes\api.php` and `vendor\bin\pint --dirty --format agent`
   from `backend/laravel`.
3. Run `php artisan route:list --path=api --no-interaction`; expect 2 routes
   (`api/health`, `api/businesses`).
4. Functional check against local dev PostgreSQL (non-destructive read-only GET):
   request `GET /api/businesses`, expect HTTP 200 and a JSON array (40 items on the
   seeded dev database; `[]` on an empty database is correct).
5. Regression: `php artisan test --compact --no-interaction` from `backend/laravel`;
   existing suite must stay green. No new test file (D2-29 owns it).

## Tests and verification

From `backend/laravel`:

```powershell
php -l routes\api.php
vendor\bin\pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact --no-interaction
```

Then `GET /api/businesses` (local server + curl, or equivalent HTTP client):

- Expected: HTTP 200, `Content-Type: application/json`, body is a JSON array.
- On the seeded dev database: 40 business objects. On an empty database: `[]` (still 200).
- `GET /api/health` and `GET /` behavior unchanged.

PHPUnit is regression-only here: its SQLite `:memory:` config cannot assert the
PostgreSQL-seeded dataset. Do not change test DB configuration for this task.
Do not run `migrate:fresh` (destructive, unneeded — this task makes no schema changes).

## Risks, dependencies, and unresolved questions

- Unpaginated full-table read: fine at ~40 rows; D2-21 adds pagination. Not a defect.
- Raw model serialization exposes all columns until D2-28 Resources. Accepted for D2-20.
- Functional GET needs a running local backend pointed at dev PostgreSQL; if unavailable,
  `route:list` + suite green still prove registration without regressions, and the GET
  check stays open follow-up (record exact outcome in the implementation notes).
- No schema/destructive commands involved; no disposable-DB confirmation needed.
- No unresolved material decisions.

## Plan check

- Confirmed proposed path (`routes/api.php`) and that no `d2-20` plan was overwritten;
  tree was clean at analysis.
- Challenged closure-vs-controller: chose closure per existing `/health` convention and
  smallest-increment rule; controller deferred to D2-22+ growth. No user decision needed
  (not user-visible).
- Challenged adding pagination/Resources/versioning: excluded — owned by D2-21/D2-28.
- Challenged adding a test file now: excluded — D2-29 owns the list feature test;
  verification uses `route:list` + functional GET + existing suite.
- Challenged verification DB: functional GET must target local PostgreSQL (read-only,
  non-destructive); PHPUnit stays regression-only given SQLite config.
- Confirmed no `.ai/rules` extra rules; `backend/laravel/AGENTS.md` conventions applied.
- Status set to `Checked — awaiting user approval`. No application code touched.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly
invokes `/implement "docs/plans/d2-20-create-business-list-route.md"`.

## Implementation outcome

- Added `GET /api/businesses` closure to `backend/laravel/routes/api.php` (imports
  `App\Models\Business`, returns `response()->json(Business::all())`); `web.php` untouched.
- `php -l routes\api.php`: no syntax errors.
- `vendor\bin\pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 2 routes (`api/health`, `api/businesses`).
- `php artisan test --compact`: passed (3 tests, 4 assertions).
- Functional check via local server (`php artisan serve --port=8001`, read-only GETs):
  `GET /api/businesses` → HTTP 200, `Content-Type: application/json`, JSON array of
  40 businesses with raw model keys; `GET /api/health` → HTTP 200 `{"status":"ok"}` unchanged.
  Server stopped afterward. No database writes; no `migrate:fresh`.
- `git diff --check`: clean. No new test file (D2-29 owns the list feature test); no
  pagination/Resource changes (D2-21/D2-28).
