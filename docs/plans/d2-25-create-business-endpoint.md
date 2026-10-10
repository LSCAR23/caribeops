# Plan — D2-25: Create Business Endpoint

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-25 — Create Business Endpoint
- **Plan path:** `docs/plans/d2-25-create-business-endpoint.md`

## Desired outcome

`POST /api/businesses` type-hints `StoreBusinessRequest`, creates exactly one business via `Business::create($request->validated())`, returns the model as JSON with `201`. Invalid payloads get framework-default `422` JSON without reaching SQL. Existing GETs, pagination, 404 semantics unchanged.

## Scope

### In scope

- One `POST /api/businesses` closure in `backend/laravel/routes/api.php`, following existing closure pattern:
  ```php
  use App\Http\Requests\StoreBusinessRequest;
  Route::post('/businesses', function (StoreBusinessRequest $request) {
      $business = Business::create($request->validated());
      return response()->json($business, 201);
  });
  ```
- Verify: `php -l`, Pint `--dirty`, `route:list --path=api` (4 routes), existing suite green, functional POST valid → 201 + DB row, POST invalid → 422, GETs unchanged, `git diff --check`.

### Non-goals

- No controller, no API Resource (D2-28), no versioning.
- No `PUT`/`DELETE` (D2-26/D2-27), no amenity/review attach on create.
- No new feature-test file (D2-30 owns creation test; D2-31 owns validation test).
- No custom 422/201 body shaping, no auth tightening (Day 6), no model/migration/seeder/factory/config changes.
- No `migrate:fresh` unless user confirms disposable DB.

## Analysis carried forward

- Roadmap D2-25 requires POST creation of one record; D2-24 left `StoreBusinessRequest` unwired by explicit scope decision.
- Current: `routes/api.php:1-18` GET-only; `StoreBusinessRequest:13-36` 9 rules mirror migration bounds + design doc; `Business:22-32` fillable matches; `bootstrap/app.php:18-22` already JSON-renders `api/*`.
- Tree clean; no `.ai/rules`; closure/no-Resource convention from D2-20–D2-23 upheld per `laravel/core` rule.
- PHPUnit is SQLite-memory regression-only; PG behavior needs serve + Tinker/HTTP probes.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:484-498` — D2-25 target; D2-26/27/28/30/31 own adjacent scope.
- `backend/laravel/routes/api.php:1-18` — only file to edit; add `StoreBusinessRequest` import + POST closure.
- `backend/laravel/app/Http/Requests/StoreBusinessRequest.php:13-36` — reuse as-is; no edit.
- `backend/laravel/app/Models/Business.php:22-32` — `fillable` + `HasFactory`; no edit.
- `database/migrations/2026_10_09_213759_create_businesses_table.php:15-35` — bound source; no edit.
- `docs/business-entity-design.md:11-30` — only `website` optional; no edit.
- `database/factories/BusinessFactory.php:32-42` — valid-payload reference for manual POST.
- `bootstrap/app.php:18-22` — JSON-error proof; no edit.
- `tests/Feature/HealthEndpointTest.php:9-16` — regression pattern only.

## Learning objectives

- POST → validate → persist → `201` lifecycle.
- Why `validated()` matters for mass assignment.
- App-layer 422 vs DB-layer `QueryException`/CHECK.

## Just-in-time concept explanation

With `StoreBusinessRequest` type-hinted, Laravel runs `authorize()` then `rules()` before the closure. Failure throws `ValidationException` → `422` JSON (`message` + `errors`) via `shouldRenderJsonWhen`. Success gives `$request->validated()` (9 keys only) → `Business::create()` → `201` JSON of the new row. The closure never runs on validation failure; no SQL executes.

## Ordered implementation steps

1. Re-confirm clean tree; re-read `routes/api.php`, `StoreBusinessRequest`, `Business.php` (read-only).
   - Rationale: start from verified state; preserve closure convention.
2. Edit only `routes/api.php`: add `use App\Http\Requests\StoreBusinessRequest;` + POST closure above returning `response()->json($business, 201)`.
   - Rationale: minimal wiring; `201` states creation; `validated()` enforces Request-only contract; no controller/Resource per non-goals.
3. `php -l` + Pint `--dirty` from `backend/laravel`.
4. `php artisan route:list --path=api --no-interaction` — expect 4 routes (3 GET + 1 POST).
5. `php artisan test --compact` — suite stays green.
6. Functional proof against local serve + dev PG (read existing GETs first, then): valid POST (factory-shaped, seeded `category_id`) → `201` + JSON `id`; fetch `GET /api/businesses/{id}` matches; invalid POST (missing `name`, bad `category_id`) → `422` + `errors` keys; confirm list/health/404 unchanged. Roll back or delete only the probe row; never `migrate:fresh` without confirmation.
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
- `route:list`: 4 routes; `POST api/businesses` present.
- `test --compact`: passed (currently 3 tests, 4 assertions; no new file).
- HTTP: valid POST `201` + object with `id`; invalid POST `422` with field `errors`; GET list paginated, detail `200`, unknown `404`, health `ok` unchanged.
- `git diff --check`: clean; one-file diff.

## Risks, dependencies, and unresolved questions

- `exists:categories,id` needs seeded category at runtime — use seeded id for probes.
- `website: nullable|url` rejects `''` — intentional.
- `numeric` ≠ `decimal(10,7)` precision — precision stays DB-side.
- No phone regex — intentional per design doc.
- SQLite suite can't prove PG CHECKs — HTTP/PG probes cover it.
- No unresolved material decisions.

## Plan check

- Verified paths (`api.php:1-18`, Request `13-36`, `Business:22-32`, migration `15-35`, `bootstrap/app.php:18-22`), confirmed `d2-25` slug free, suite shape (3 tests), SQLite-memory limit.
- Challenged controller vs closure: closure upheld — matches D2-20–D2-23, avoids speculative structure; controller belongs beyond D2-25 if ever.
- Challenged `200` vs `201`: `201` chosen — REST creation semantics; roadmap silent but `201` is testable and conventional.
- Challenged adding Resource/tests/amenities: rejected — owned by D2-28/D2-30/D2-31; scope stays one route.
- Challenged `all()` vs `validated()`: `validated()` required — prevents mass-assignment bypass.
- Challenged `migrate:fresh`/DB writes: forbidden without disposable-DB confirmation; probe-row cleanup required.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status`.

## Implementation outcome

- Implemented POST wiring: `backend/laravel/routes/api.php` adds `use App\Http\Requests\StoreBusinessRequest;` + `Route::post('/businesses', ... StoreBusinessRequest ... Business::create($request->validated()) ... response()->json($business, 201))` appended after the GET detail route; existing GETs/pagination/`whereNumber` untouched; no controller/Resource/test/migration/model changes.
- `php -l routes/api.php`: no syntax errors.
- `vendor/bin/pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: 4 routes (`GET api/health`, `GET api/businesses`, `GET api/businesses/{business}`, `POST api/businesses`).
- `php artisan test --compact`: passed (3 tests, 4 assertions; no new file).
- Functional HTTP against `php artisan serve 127.0.0.1:8001` + dev PG `caribeops` (pre-count 40, `catId=1`): valid POST (unique `D2-25-Probe-111923`, factory-shaped) → `201` + JSON `id:41`; `GET /api/businesses/41` → `200` matching name; invalid POST (missing `name`, `category_id:999999`, `website:not-a-url`) → `422` with `errors` keys `category_id`/`name`/`website`; `GET /api/businesses/999999` → `404`; `GET /api/health` `ok`, list `200`, detail `1` `200` unchanged. Probe row `id:41` deleted via Tinker; count back to `40`. No `migrate:fresh`.
- `git diff --check`: clean. `git diff --stat`: `backend/laravel/routes/api.php | 7 +++++++` (1 file, 7 insertions) + untracked plan file.
- Note: the D2-25 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-25-create-business-endpoint.md"`.
