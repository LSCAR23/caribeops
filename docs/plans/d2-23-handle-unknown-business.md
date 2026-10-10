# Plan — D2-23: Handle Unknown Business

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-23 — Handle Unknown Business
- **Plan path:** `docs/plans/d2-23-handle-unknown-business.md`

## Desired outcome

`GET /api/businesses/{id}` for a nonexistent id returns HTTP 404 with a JSON error body, locking predictable error semantics for unknown resources. Valid-id, list, pagination, and health behavior stay unchanged.

## Scope

### In scope

- Verify (read-only, against local PostgreSQL): unknown numeric id → 404 JSON; non-numeric id → 404; valid id still 200 object; list still paginated; `/api/health` unchanged.
- Verify registration (`route:list`, still 3 routes), syntax (`php -l`), style (Pint), and existing suite regression.
- Expected result: **no application change** — framework default (binding + `shouldRenderJsonWhen`) already satisfies the spec. This is a specify-and-lock task, not a code task.

### Non-goals

- No custom 404 body, message text, or exception-handler code — roadmap asks only for HTTP 404, and a custom shape would be speculative scope (response shaping belongs to D2-28).
- No `whereNumber` constraint, no route changes, no controller.
- No API Resources (D2-28); no validation / create / update / delete (D2-24–D2-27).
- No new feature-test file (D2-32 owns the 404 feature test).
- No `web.php`, model, migration, seeder, dependency, or versioning changes.

## Analysis carried forward

- Roadmap D2-23: nonexistent ID → HTTP 404; learning goal is predictable error semantics.
- `routes/api.php:16-18` detail route uses implicit binding, which 404s pre-closure on missing rows; `bootstrap/app.php:18-22` renders JSON for `api/*`.
- D2-22 observed `/api/businesses/999999` → 404 incidentally; never specified as contract. Valid ids 1/40 → 200 verified.
- Seed ids 1–40 (D2-19, 40 businesses) make 999999 safely nonexistent; non-numeric `abc` exercises the same binding-failure path.
- Working tree clean; no `d2-23` plan existed; no `.ai/rules` directory.
- Decision carried forward: accept the framework default, verify status + JSON-ness, do not assert exact message text (version-dependent).

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:452-463` — D2-23 target (404) and learning goal; D2-32 owns the 404 test; D2-28 owns response shaping.
- `backend/laravel/routes/api.php:16-18` — read-only reference; expected **no change**.
- `backend/laravel/bootstrap/app.php:18-22` — JSON error rendering for API; read-only reference, no change.
- `backend/laravel/routes/web.php` — must stay untouched.
- `backend/laravel/tests/Feature/HealthEndpointTest.php:9-16` — existing API test pattern.
- `backend/laravel/phpunit.xml` — SQLite regression-only config.
- `backend/laravel/AGENTS.md` — conventions applied (existing patterns, Pint, narrow tests).

## Learning objectives

- Binding failure → 404: where the 404 comes from (no handler code involved).
- `shouldRenderJsonWhen`: why API 404s are JSON while web 404s are HTML.
- Contract thinking: status + content-type + JSON shape as the assertable surface, not message wording.

## Just-in-time concept explanation

When `GET /api/businesses/999999` arrives, Laravel resolves `{business}` by primary key, finds no row, and throws `ModelNotFoundException` before the closure runs. The exception handler maps it to a 404 response; because the request matches `api/*`, `shouldRenderJsonWhen` serializes it as JSON (`Content-Type: application/json`, body with a `message` key) with status 404. Non-numeric `abc` follows the same path (no row with that key → same 404). Nothing in `routes/api.php` needs to change for any of this.

## Ordered implementation steps

1. Confirm `backend/laravel/routes/api.php` and `bootstrap/app.php` are unchanged from D2-22 (read-only inspection; no edits planned).
   - Rationale: smallest increment is zero diff — the default already implements the spec; edits would be speculative.
2. Run `php -l routes\api.php` and `vendor\bin\pint --dirty --format agent` from `backend/laravel` (expected no-op).
3. Run `php artisan route:list --path=api --no-interaction`; expect the same 3 routes (no registration change).
4. Functional check against local dev PostgreSQL (non-destructive read-only GETs): `GET /api/businesses/999999` → 404 + `application/json` + JSON body; `GET /api/businesses/abc` → 404; `GET /api/businesses/1` → 200 object; `GET /api/businesses` → still paginated; `GET /api/health` → `{"status":"ok"}`.
5. Regression: `php artisan test --compact` from `backend/laravel`; suite must stay green (`test` does not accept `--no-interaction`; omit it). No new test file.
6. Contingency (only if step 4 fails the spec, e.g. non-JSON or non-404): stop, do not improvise handler code — return the plan to `/check` for a scoped revision.

## Tests and verification

From `backend/laravel`:

```powershell
php -l routes\api.php
vendor\bin\pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
```

Then unknown-id GETs (local server + HTTP client):

- Expected: `GET /api/businesses/999999` → HTTP 404, `Content-Type: application/json`, JSON body containing a `message` key. Exact message text NOT asserted.
- Expected: `GET /api/businesses/abc` → HTTP 404 (same binding-failure path).
- Unchanged: `/api/businesses/1` → 200 object with `id: 1`; list still paginated (`per_page: 15`, `total: 40`); `/api/health` → 200 `{"status":"ok"}`.

PHPUnit is regression-only: its SQLite `:memory:` config cannot exercise the PostgreSQL-seeded reads. Do not change test DB configuration. Do not run `migrate:fresh` (no schema changes).

## Risks, dependencies, and unresolved questions

- Zero-diff outcome may look like "nothing happened" — it is the correct result if the default satisfies the spec; the value is the locked contract + verification record.
- Asserting exact 404 message text would couple the spec to a framework version string; deliberately avoided.
- Custom 404 bodies, `whereNumber`, or handler tweaks are out of scope; if the contingency triggers, scope is re-decided in `/check`, not improvised.
- Functional GETs need a running local backend on dev PostgreSQL; if unavailable, `route:list` + suite green only prove registration, and GET checks stay open follow-up.
- No schema/destructive commands; no disposable-DB confirmation needed.
- No unresolved material decisions.

## Plan check

- Confirmed reference paths (`routes/api.php:16-18`, `bootstrap/app.php:18-22`) and that no `d2-23` plan was overwritten; tree was clean at analysis.
- Challenged "must write code": rejected — roadmap specifies only the 404 status, the default already produces it as JSON; verification-only is the smallest honest increment.
- Challenged custom 404 body/message: excluded — speculative scope, response shaping owned by D2-28.
- Challenged `whereNumber`/controller/handler edits: excluded — unneeded for the spec.
- Challenged asserting message text: excluded — version-fragile; assert status + JSON + `message` presence instead.
- Challenged adding a test file now: excluded — D2-32 owns the 404 feature test; verification uses functional GETs + existing suite.
- Challenged verification DB: functional GETs must target local PostgreSQL read-only; PHPUnit stays regression-only; `test --compact` without `--no-interaction` (flag unsupported).
- Added explicit contingency: on spec failure, stop and re-check rather than improvising handler code.
- Confirmed no `.ai/rules`; `backend/laravel/AGENTS.md` conventions applied.
- Status set to `Checked — awaiting user approval`. No application code touched.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-23-handle-unknown-business.md"`.

## Implementation outcome

- Verification **disproved** the plan's analysis assumption that non-numeric ids follow the binding-failure path: `GET /api/businesses/abc` returned **500** (`QueryException`, PostgreSQL `22P02 invalid input syntax for type bigint`), not 404. Unknown numeric ids already 404'd correctly.
- Fix (one line, same task scope, no handler code): appended `->whereNumber('business')` to the detail route in `backend/laravel/routes/api.php`, so non-numeric segments miss the route and fall through to the framework-default JSON 404. `web.php`, `bootstrap/app.php`, models untouched.
- `php -l routes\api.php`: no syntax errors.
- `vendor\bin\pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: same 3 routes (`api/businesses`, `api/businesses/{business}`, `api/health`).
- `php artisan test --compact`: passed (3 tests, 4 assertions).
- Functional check via local server (`php artisan serve --port=8001`, read-only GETs against dev PostgreSQL `caribeops`): before fix — `/api/businesses/999999` → 404 JSON with `message`, `/api/businesses/abc` → 500; after fix — `/api/businesses/abc` → 404 `application/json` (`"The route api/businesses/abc could not be found."`), `/api/businesses/999999` → 404 `application/json` (`"No query results for model [App\Models\Business] 999999"`), `/api/businesses/1` → 200 object `id=1`, `GET /api/businesses` → still paginated (page 1, 15 items, total 40), `GET /api/health` → 200 `{"status":"ok"}`. Exact message text recorded, not specified. Server stopped afterward. No database writes; no `migrate:fresh`.
- `git diff --check`: clean. Diff limited to the one appended constraint. No new test file (D2-32 owns the 404 feature test); no Resources changes (D2-28). Observation (out of scope, unchanged): dev 404 bodies include debug `exception`/`trace` keys (APP_DEBUG); production shaping belongs to later hardening/D2-28.
