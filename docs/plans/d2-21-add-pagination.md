# Plan — D2-21: Add Pagination

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-21 — Add Pagination
- **Plan path:** `docs/plans/d2-21-add-pagination.md`

## Desired outcome

`GET /api/businesses` returns a Laravel paginated response with stable ordering and paginator metadata, so different `?page=` requests return the correct slice plus `current_page` / `last_page` / `per_page` / `total`.

## Scope

### In scope

- Change `GET /api/businesses` in `backend/laravel/routes/api.php` from `Business::all()` to ordered pagination using the Laravel default per-page (15).
- Verify registration (`route:list`), syntax (`php -l`), style (Pint), functional paged GETs against local PostgreSQL (read-only), and existing suite regression.

### Non-goals

- No API Resources or response reshaping (D2-28); default paginator JSON shape stands.
- No `per_page` query-param support, no `simplePaginate`/cursor pagination, no explicit per-page size change.
- No detail endpoint (D2-22), no 404 handling (D2-23).
- No validation / create / update / delete (D2-24–D2-27).
- No new feature-test file (D2-29 owns the list feature test).
- No `web.php`, model, migration, seeder, dependency, or versioning changes.

## Analysis carried forward

- Roadmap D2-21: paginate listing; test different pages + metadata; learning goal is avoiding full-dataset responses.
- `routes/api.php:12-14` holds the D2-20 `Business::all()` closure; `route:list --path=api` should show 2 routes; no pagination exists.
- `Business` model exposes fillable + three relations; sufficient, no changes.
- `phpunit.xml` uses SQLite `:memory:`; seeded-PostgreSQL paging must be checked against local PostgreSQL, not PHPUnit. D2-19 dataset 40 businesses per MEMORY, not re-verified in analysis.
- Working tree clean; no `d2-21` plan existed; no `.ai/rules` directory.
- Decision carried forward: Laravel default 15 per page, ordered by `id` for deterministic pages.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:420-433` — D2-21 target; D2-28 owns Resources; D2-29 asserts pagination exists.
- `backend/laravel/routes/api.php:12-14` — the only file to change.
- `backend/laravel/routes/web.php:5-7` — must stay untouched.
- `backend/laravel/app/Models/Business.php:12-57` — pagination source; no change.
- `backend/laravel/tests/Feature/HealthEndpointTest.php:9-16` — existing API test pattern.
- `backend/laravel/phpunit.xml:26-27` — SQLite regression-only config.
- `backend/laravel/AGENTS.md` — conventions applied (existing patterns, Pint, narrow tests).

## Learning objectives

- `paginate()` vs `all()`: bounded query + total count vs full-table load.
- Paginator JSON contract: `data[]` plus `current_page`, `last_page`, `per_page`, `total`, links.
- `?page=` drives slices; `orderBy('id')` keeps pages stable.

## Just-in-time concept explanation

`Business::query()->orderBy('id')->paginate()` issues one `select ... order by id limit 15 offset N` plus a `count(*)` for metadata. Laravel serializes the `LengthAwarePaginator` to `{current_page, data, first_page_url, last_page, per_page, total, ...}`. With 40 seeded rows at 15/page: page 1 → 15 items, page 2 → 15, page 3 → 10, page 4 → empty `data[]` with `current_page: 4`. An empty table yields `total: 0`, `data: []`, still HTTP 200.

## Ordered implementation steps

1. In `backend/laravel/routes/api.php`, change the `/businesses` closure to return `Business::query()->orderBy('id')->paginate()` as JSON beside `/health`.
   - Rationale: keeps D2-20 closure convention (smallest one-file diff); controller deferred until CRUD surface grows (D2-22+). `orderBy('id')` makes pages deterministic. Default 15 avoids new scope; `per_page` param deferred.
2. Run `php -l routes\api.php` and `vendor\bin\pint --dirty --format agent` from `backend/laravel`.
3. Run `php artisan route:list --path=api --no-interaction`; expect 2 routes (`api/health`, `api/businesses`).
4. Functional check against local dev PostgreSQL (non-destructive read-only GETs): `GET /api/businesses`, `?page=2`, `?page=3`, `?page=999`; expect HTTP 200 + JSON + paginator metadata and 15/15/10/0 item counts on the seeded 40-row DB.
5. Regression: `php artisan test --compact --no-interaction` from `backend/laravel`; suite must stay green. No new test file.

## Tests and verification

From `backend/laravel`:

```powershell
php -l routes\api.php
vendor\bin\pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact --no-interaction
```

Then paged GETs (local server + HTTP client):

- Expected: HTTP 200, `Content-Type: application/json`, body has `data` array + `current_page`/`last_page`/`per_page`/`total`.
- On seeded dev DB: `per_page: 15`, `total: 40`, `last_page: 3`; page 1/2/3 yield 15/15/10 items; out-of-range page yields `data: []` with 200.
- On empty DB: `total: 0`, `data: []`, still 200.
- `GET /api/health` and `GET /` unchanged.

PHPUnit is regression-only: its SQLite config cannot assert the PostgreSQL-seeded paging. Do not change test DB config. Do not run `migrate:fresh`.

## Risks, dependencies, and unresolved questions

- Breaking shape change (array → paginator object): expected per roadmap; D2-29 test will lock the new contract. Not a defect.
- Default 15 is a roadmap-silent choice; changing to 10/20 later is trivial but would alter `last_page` expectations.
- Functional GETs need running local backend on dev PostgreSQL; if unavailable, `route:list` + suite green prove registration, GET checks stay open follow-up.
- No schema/destructive commands; no disposable-DB confirmation needed.
- No unresolved material decisions.

## Plan check

- Confirmed proposed path (`routes/api.php`) and no `d2-21` plan overwrite; tree clean at analysis.
- Challenged closure-vs-controller: kept closure per `/health` convention and smallest-increment rule; controller deferred to D2-22+.
- Challenged `paginate` vs `simplePaginate`: chose `paginate` because D2-21 requires verifiable `total`/`last_page` metadata, which `simplePaginate` omits.
- Challenged per-page size and `per_page` param: kept Laravel default 15, no custom param — roadmap silent, smallest scope, 40-row seed demonstrates 15/15/10 well.
- Challenged ordering: added `orderBy('id')` for deterministic pages; unordered pagination would risk flaky page contents.
- Challenged Resources/versioning/new tests: excluded — owned by D2-28/D2-29.
- Challenged verification DB: functional GETs must target local PostgreSQL read-only; PHPUnit stays regression-only.
- Confirmed no `.ai/rules`; `backend/laravel/AGENTS.md` conventions applied.
- Status set to `Checked — awaiting user approval`. No application code touched.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-21-add-pagination.md"`.

## Implementation outcome

- Changed `GET /api/businesses` in `backend/laravel/routes/api.php` from `Business::all()` to `Business::query()->orderBy('id')->paginate()`; closure style kept beside `/health`; `web.php` untouched.
- `php -l routes\api.php`: no syntax errors.
- `vendor\bin\pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 2 routes (`api/businesses`, `api/health`).
- `php artisan test --compact`: passed (3 tests, 4 assertions). Note: plan-listed `test --compact --no-interaction` is not accepted by this command; ran without the flag.
- Functional check via local server (`php artisan serve --port=8001`, read-only GETs against dev PostgreSQL `caribeops` with 40 businesses confirmed via Tinker count): `GET /api/businesses` → 200 JSON paginator page 1/15 items first ids 1,2,3; `?page=2` → 15 items first ids 16,17,18; `?page=3` → 10 items first ids 31,32,33; `?page=999` → 200 with `data: []`; all pages `per_page: 15`, `total: 40`, `last_page: 3` with `current_page`/`data`/`links` keys; `GET /api/health` → 200 `{"status":"ok"}` unchanged. Server stopped afterward. No database writes; no `migrate:fresh`.
- `git diff --check`: clean. Diff limited to the one route line. No new test file (D2-29 owns the list feature test); no Resources changes (D2-28).
