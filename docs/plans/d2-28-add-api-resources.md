# Plan — D2-28: Add API Resources

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-28 — Add API Resources
- **Plan path:** `docs/plans/d2-28-add-api-resources.md`

## Desired outcome

One `BusinessResource` declares the explicit 12-key business contract (`id`, 9 user attributes, `created_at`, `updated_at`). List, detail, POST (`201`), and PUT (`200`) return it; paginated list keeps its `data` + paginator metadata; DELETE (`204`), health, statuses, validation, and 404 semantics unchanged. Responses no longer track raw model serialization.

## Scope

### In scope

- Generate `app/Http/Resources/BusinessResource.php` via `php artisan make:resource BusinessResource --no-interaction`; implement `toArray()` returning exactly:
  `id`, `category_id`, `name`, `description`, `type`, `address`, `latitude`, `longitude`, `website`, `phone`, `created_at`, `updated_at`.
- Edit `backend/laravel/routes/api.php` (4 call sites, closures kept):
  ```php
  use App\Http\Resources\BusinessResource;
  Route::get('/businesses', fn () => BusinessResource::collection(Business::query()->orderBy('id')->paginate()));
  Route::get('/businesses/{business}', fn (Business $business) => new BusinessResource($business))->whereNumber('business');
  // POST: return (new BusinessResource($business))->response()->setStatusCode(201);
  // PUT:  return new BusinessResource($business->refresh());
  ```
  POST keeps `201`, PUT keeps `200` with refreshed state, DELETE/health untouched.
- Verify: `php -l`, Pint `--dirty`, `route:list` (6 routes), suite green, HTTP shape + pagination-meta + status parity vs raw baseline, `git diff --check`.

### Non-goals

- No `BusinessCollection` class, no versioning, no controller.
- No embedded `category`/`amenities`/`reviews` (shape change + N+1 risk; separate task if ever wanted).
- No key drops/renames (timestamps stay), no status-code changes, no validation/404 changes.
- No new feature-test file (D2-29–D2-32 own tests), no model/migration/seeder/factory/config changes.
- No `migrate:fresh`; no seeded-row mutation (PUT probe restores; POST probe row deleted).

## Analysis carried forward

- Roadmap D2-28 requires intentional response shapes decoupled from model serialization.
- Current: `routes/api.php:1-37` returns raw models/paginators on 4 business routes; no `Resources/` exists; raw payload = 12 keys.
- `laravel/core` "default to Resources" applies at this task (MEMORY notes raw serialization was held "until D2-28").
- Tree clean at analysis; no `.ai/rules`; PHPUnit SQLite-memory is regression-only; shape proof needs serve probes.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:532-544` — D2-28 target; D2-29–32 own tests.
- `backend/laravel/routes/api.php:1-37` — 4 call sites to edit; DELETE/health untouched.
- `backend/laravel/app/Models/Business.php:22-32` — 12-key source; no edit.
- `backend/laravel/app/Http/` — new `Resources/` subdir via generator; `Controllers/Controller.php` untouched.
- `backend/laravel/bootstrap/app.php:18-22` — JSON framing; no edit.
- `tests/Feature/HealthEndpointTest.php:9-16` — regression pattern only.

## Learning objectives

- Resource as contract: `toArray()` is the boundary, not `$fillable`/casts.
- Paginated collections: `Resource::collection($paginator)` transforms items, keeps meta.
- Status preservation: `->response()->setStatusCode(201)` keeps POST semantics through a Resource.

## Just-in-time concept explanation

A `JsonResource` wraps one model; `toArray($request)` returns only declared keys. Returning `new BusinessResource($m)` serializes through that method instead of the model's `toArray`. `BusinessResource::collection($paginator)` returns an anonymous collection that maps each item yet forwards paginator `meta`/`links`, so `data` items change shape while `current_page`/`total` etc. persist. Status codes stay explicit: detail/PUT default `200`, POST sets `201`, DELETE stays `204` (no Resource involved).

## Ordered implementation steps

1. Re-confirm clean tree; re-read `routes/api.php`, `Business.php`, `app/Http/` layout (read-only).
   - Rationale: prove raw baseline and free `Resources/` path before generating.
2. Run `php artisan make:resource BusinessResource --no-interaction` from `backend/laravel`.
   - Rationale: Laravel-way generation; canonical namespace/location/stub.
3. Edit only the new `BusinessResource.php`: `toArray()` returns the 12 keys above; keep stub structure/imports; no conditionals, no `whenLoaded`, no extra methods.
   - Rationale: faithful contract — same keys consumers already receive, now declared.
4. Edit `routes/api.php` 4 call sites per Scope; add the `BusinessResource` import; keep closures, `whereNumber`s, and DELETE/health lines untouched.
   - Rationale: surgical shape swap; `refresh()` before PUT resource shows stored state; explicit `201` preserves POST semantics.
5. `php -l` + Pint `--dirty` from `backend/laravel`.
6. `php artisan route:list --path=api --no-interaction` — still 6 routes.
7. `php artisan test --compact` — suite stays green.
8. Functional proof vs raw baseline against local serve + dev PG (read-only except two disposable probes): `GET /1` key set equals the 12 declared keys (order-insensitive) with matching values; list page 1 has `data[0]` with 12 keys + `current_page`/`per_page`/`total` meta; `POST` probe → `201` with 12 keys then `DELETE` → `204` (count restored); `PUT` on `id:1` with snapshot values → `200` 12 keys then restore verified; invalid PUT → `422`, unknown → `404` unchanged. Never `migrate:fresh`; never leave probe rows.
9. `git diff --check` + `git status --short` — app diff limited to new Resource + `routes/api.php`.

## Tests and verification

From `backend/laravel`:

```powershell
php -l app/Http/Resources/BusinessResource.php
php -l routes/api.php
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
git diff --check
git status --short
```

Expected:

- `php -l`: no errors (both files). Pint: passed.
- `route:list`: 6 routes; methods/URIs unchanged.
- `test --compact`: passed (currently 3 tests, 4 assertions; no new file).
- HTTP: business payloads expose exactly the 12 keys with correct values; list keeps paginator meta; `201`/`200`/`204`/`404`/`422` parity with baseline; no leftover probe rows.
- `git diff --check`: clean; app diff = 1 new file + `routes/api.php`.

## Risks, dependencies, and unresolved questions

- Key-set drift (adding/dropping a key) is a contract break — the 12-key list is locked; any change returns the plan to `/check`.
- Relationship embedding deferred by design (N+1 + shape expansion); `whenLoaded` adds speculative branches.
- `Resource::collection` misuse (e.g. wrapping `->items()` instead of the paginator) would drop meta — explicitly construct from the paginator.
- `make:resource` stub may include docblock/examples — keep the file minimal, matching repo style.
- No unresolved material decisions.

## Plan check

- Verified paths (`api.php:1-37` 6 routes, `Business:22-32`, no `Resources/`, `bootstrap/app.php:18-22`), confirmed `d2-28` slug free, suite shape (3 tests), SQLite-memory limit.
- Challenged new Collection class/versioning/controller: rejected — one Resource suffices; closures stay per D2-20–27 precedent.
- Challenged timestamp dropping: rejected — raw consumers receive them; removal is a silent break.
- Challenged relationship embedding: rejected — expansion + N+1 with no stated requirement.
- Challenged `201` preservation: enforced via `->response()->setStatusCode(201)` — plain `new BusinessResource` would regress POST to `200`.
- Challenged verification strength: 12-key set assertion + paginator-meta + status parity + probe cleanup required; `migrate:fresh` forbidden.
- Status set to `Checked — awaiting user approval`. No application code touched; no verification commands run beyond reads + `git status` + `route:list` + glob.

## Implementation outcome

- New `backend/laravel/app/Http/Resources/BusinessResource.php` (via `make:resource`): `toArray()` returns exactly the 12 keys `id`, `category_id`, `name`, `description`, `type`, `address`, `latitude`, `longitude`, `website`, `phone`, `created_at`, `updated_at`; no conditionals, no relations.
- `backend/laravel/routes/api.php`: added `BusinessResource` import; list → `BusinessResource::collection(paginate())`, detail → `new BusinessResource`, POST → `(new BusinessResource)->response()->setStatusCode(201)`, PUT → `new BusinessResource($business->refresh())`; closures, `whereNumber`s, DELETE/health untouched.
- `php -l` clean (both files). Pint `--dirty` passed. `route:list --path=api`: 6 routes, methods/URIs unchanged. `php artisan test --compact`: passed (3 tests, 4 assertions; no new file).
- Functional HTTP vs raw baseline (`serve 127.0.0.1:8001` + dev PG, baseline 40): business objects expose exactly the 12 keys with correct values (`GET /1`, list items, POST/PUT bodies). Standard Resource envelopes observed and locked: single responses are `{"data": {...}}`; paginated list is `{"data":[...],"links":{...},"meta":{current_page:1,per_page:15,total:40,last_page:3}}` (page meta now nested under `meta`, slicing unchanged). Statuses parity: POST probe → `201`, PUT → `200`, DELETE probe → `204` empty then `GET` → `404`, invalid PUT → `422`, unknown → `404`, health/list unchanged. Probe `id:43` created + deleted; Tinker count `40`, `0` `D2-28-Probe-%` rows. No `migrate:fresh`, no seeded-row mutation.
- `git diff --check`: clean. App diff: 1 new file (`BusinessResource.php`) + `routes/api.php` (5 insertions, 4 deletions) + untracked plan file.
- Notes: (a) the D2-28 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change. (b) Envelope clarification: the plan's "exactly 12 keys" is the business object; the `data` wrapper / `meta` nesting is the framework-standard Resource envelope and is now the contract D2-29+ tests must target.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-28-add-api-resources.md"`.
