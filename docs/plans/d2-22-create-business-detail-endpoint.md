# Plan — D2-22: Create Business Detail Endpoint

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-22 — Create Business Detail Endpoint
- **Plan path:** `docs/plans/d2-22-create-business-detail-endpoint.md`

## Desired outcome

`GET /api/businesses/{id}` returns HTTP 200 with the JSON object for a valid business id, proving single-resource reads by domain identifier.

## Scope

### In scope

- Add `GET /businesses/{business}` to `backend/laravel/routes/api.php` via implicit route-model binding, returning the bound `Business` as JSON beside `/health` and the paginated list.
- Verify registration (`route:list`), syntax (`php -l`), style (Pint), a functional valid-id GET against local PostgreSQL (read-only), list/pagination/health unchanged, and existing suite regression.

### Non-goals

- No custom 404 handling or error-body design (D2-23 owns unknown-id behavior; framework-default 404 on unknown ids is accepted as-is, not specified here).
- No API Resources or response reshaping (D2-28); raw model serialization stands.
- No validation / create / update / delete (D2-24–D2-27).
- No new feature-test file (D2-29–D2-32 own the HTTP test surface).
- No `web.php`, model, migration, seeder, controller file, dependency, or versioning changes.

## Analysis carried forward

- Roadmap D2-22: `GET /api/businesses/{id}`, valid ID returns one business; learning goal is identifier-mapped resource endpoints.
- `routes/api.php:6-14` holds only `/health` + paginated `/businesses`; no detail route; `route:list --path=api` should show 2 routes before, 3 after.
- `Controller.php` is abstract-only; D2-20/D2-21 closure precedent applies — no new controller file for one route.
- `Business` model exposes fillable + three relations; sufficient, no changes.
- `phpunit.xml` uses SQLite `:memory:`; seeded-PostgreSQL detail read must be checked against local PostgreSQL, not PHPUnit. D2-19 dataset (40 businesses, ids 1–40) per MEMORY, not re-verified here.
- Working tree clean; no `d2-22` plan existed; no `.ai/rules` directory.
- Decision carried forward: implicit route-model binding with `{business}` placeholder (URL still `/api/businesses/<id>`).

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:436-463` — D2-22 target; D2-23 owns 404; D2-28 owns Resources.
- `backend/laravel/routes/api.php:6-14` — the only file to change (add route beside existing two).
- `backend/laravel/routes/web.php` — must stay untouched.
- `backend/laravel/app/Models/Business.php` — detail source; no change.
- `backend/laravel/app/Http/Controllers/Controller.php:5-7` — abstract only; no new controller (see rationale).
- `backend/laravel/tests/Feature/HealthEndpointTest.php` — existing API test pattern.
- `backend/laravel/phpunit.xml` — SQLite regression-only config.
- `backend/laravel/AGENTS.md` — conventions applied (existing patterns, Pint, narrow tests).

## Learning objectives

- Collection vs member routes: `/businesses` (many, paginated) vs `/businesses/{id}` (one object).
- Implicit binding: placeholder ↔ typed parameter (`{business}` ↔ `Business $business`) auto-resolves the row.
- Route order safety: member route coexists with the collection route without conflict.

## Just-in-time concept explanation

Laravel matches `Route::get('/businesses/{business}', ...)` in `routes/api.php` at `GET /api/businesses/7`. With the handler typed `fn (Business $business)`, the framework loads row 7 before the closure runs and injects it; the closure returns it as a JSON object with HTTP 200. A missing row aborts with the framework-default 404 before the closure runs — that default is accepted here and specified by D2-23, so this task adds no error-handling code. The paginated list is unaffected.

## Ordered implementation steps

1. In `backend/laravel/routes/api.php`, register `Route::get('/businesses/{business}', fn (Business $business) => response()->json($business));` after the list route.
   - Rationale: matches the file's closure convention (smallest one-file diff); implicit binding is the idiomatic Laravel show-route form and avoids manual `find`/`findOrFail` plumbing; a dedicated controller is deferred until the CRUD surface grows (D2-24+). No Resource (D2-28), no custom 404 (D2-23).
2. Run `php -l routes\api.php` and `vendor\bin\pint --dirty --format agent` from `backend/laravel`.
3. Run `php artisan route:list --path=api --no-interaction`; expect 3 routes (`api/health`, `api/businesses`, `api/businesses/{business}`).
4. Functional check against local dev PostgreSQL (non-destructive read-only GETs): `GET /api/businesses/1` → 200 JSON object with `id: 1`; spot-check another id (e.g. 40); confirm list (`GET /api/businesses` still paginated) and `/api/health` unchanged.
5. Regression: `php artisan test --compact` from `backend/laravel`; existing suite must stay green (note: `test` does not accept `--no-interaction`; omit that flag). No new test file.

## Tests and verification

From `backend/laravel`:

```powershell
php -l routes\api.php
vendor\bin\pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
```

Then valid-id GETs (local server + HTTP client):

- Expected: HTTP 200, `Content-Type: application/json`, body is a JSON object (not array) whose `id` matches the requested id and which carries the raw business keys.
- On the seeded dev database: `/api/businesses/1` → object with `id: 1`; `/api/businesses/40` → object with `id: 40`.
- Unchanged: `GET /api/businesses` still paginated (`data` + metadata); `GET /api/health` → `{"status":"ok"}`.
- Unknown ids (e.g. 999999) will 404 via framework default; observed only, not asserted or customized — D2-23's scope.

PHPUnit is regression-only: its SQLite `:memory:` config cannot assert the PostgreSQL-seeded dataset. Do not change test DB configuration. Do not run `migrate:fresh` (no schema changes).

## Risks, dependencies, and unresolved questions

- Framework-default 404 on unknown ids overlaps D2-23 observably but adds no D2-23 code; D2-23 will specify and lock that behavior. Not a scope violation.
- `{business}` placeholder vs roadmap `{id}` wording: the URL shape is identical (`/api/businesses/7`); only the placeholder name differs, as required for binding. Documented, not a deviation.
- Raw model serialization exposes all columns until D2-28 Resources. Accepted for D2-22.
- Functional GETs need a running local backend on dev PostgreSQL; if unavailable, `route:list` + suite green prove registration, GET checks stay open follow-up.
- No schema/destructive commands; no disposable-DB confirmation needed.
- No unresolved material decisions.

## Plan check

- Confirmed proposed path (`routes/api.php`) and that no `d2-22` plan was overwritten; tree was clean at analysis.
- Challenged closure-vs-controller: kept closure per `/health`/list convention and smallest-increment rule; controller deferred to CRUD growth (D2-24+). No user decision needed (not user-visible).
- Challenged binding vs `findOrFail($id)`: chose implicit binding — same valid-id observable, less plumbing, idiomatic show-route form; unknown-id 404 identical either way and left to D2-23.
- Challenged placeholder naming: `{business}` required for binding; URL unchanged. Noted explicitly to avoid `{id}`-wording confusion.
- Challenged adding `whereNumber`, Resources, custom 404, versioning: excluded — unneeded scope (D2-23/D2-28 own it).
- Challenged adding a test file now: excluded — D2-29–D2-32 own the HTTP test surface; verification uses `route:list` + functional GETs + existing suite.
- Challenged verification DB: functional GETs must target local PostgreSQL read-only; PHPUnit stays regression-only; `test --compact` without `--no-interaction` (flag unsupported).
- Confirmed no `.ai/rules`; `backend/laravel/AGENTS.md` conventions applied.
- Status set to `Checked — awaiting user approval`. No application code touched.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-22-create-business-detail-endpoint.md"`.

## Implementation outcome

- Added `GET /api/businesses/{business}` to `backend/laravel/routes/api.php` via implicit route-model binding (`fn (Business $business) => response()->json($business)`); closure style kept; `web.php` untouched.
- `php -l routes\api.php`: no syntax errors.
- `vendor\bin\pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 3 routes (`api/businesses`, `api/businesses/{business}`, `api/health`).
- `php artisan test --compact`: passed (3 tests, 4 assertions).
- Functional check via local server (`php artisan serve --port=8001`, read-only GETs against dev PostgreSQL `caribeops`): `GET /api/businesses/1` → 200 JSON object `id=1`; `GET /api/businesses/40` → 200 JSON object `id=40`; `GET /api/businesses` → still paginated (page 1, 15 items, total 40); `GET /api/health` → 200 `{"status":"ok"}` unchanged; `GET /api/businesses/999999` → 404 via framework default (observed only, D2-23 scope, no custom handling). Server stopped afterward. No database writes; no `migrate:fresh`.
- `git diff --check`: clean. Diff limited to the one added route. No new test file (D2-29–D2-32 own the HTTP test surface); no Resources changes (D2-28).
