# Plan — D2-24: Create Business Request Validation

- **Date:** 2026-10-10
- **Status:** Implemented — verified
- **Task:** D2-24 — Create Business Request Validation
- **Plan path:** `docs/plans/d2-24-create-business-request-validation.md`

## Desired outcome

A reusable `StoreBusinessRequest` Form Request exists at `backend/laravel/app/Http/Requests/StoreBusinessRequest.php` with `authorize()` + `rules()` mirroring the business domain (migration + `business-entity-design.md`), so malformed payloads fail with validation errors before touching the database. No routes, models, migrations, or response shapes change. HTTP 422 over the wire is **deferred** to D2-25 (POST wiring) / D2-31 (validation test) per the user's explicit Request-only scope decision.

## Scope

### In scope

- Generate one Form Request via `php artisan make:request StoreBusinessRequest --no-interaction`.
- Define `authorize(): bool` returning `true` (no auth layer exists yet; Day 6 owns security).
- Define `rules(): array` covering all nine user-provided attributes:
  - `category_id`: `required|integer|exists:categories,id`
  - `name`: `required|string|max:255`
  - `description`: `required|string`
  - `type`: `required|string|max:120`
  - `address`: `required|string`
  - `latitude`: `required|numeric|between:-90,90`
  - `longitude`: `required|numeric|between:-180,180`
  - `website`: `nullable|url`
  - `phone`: `required|string|max:32`
- Verify: `php -l`, Pint, `route:list` unchanged (3 routes), existing suite green, Validator-level rule probes (valid passes, invalid fails), `git diff --check`.

### Non-goals

- No `POST`/`PUT`/`DELETE` route wiring (D2-25/D2-26/D2-27 own endpoints).
- No controller, no API Resources (D2-28), no versioning.
- No new feature-test file (D2-31 owns the validation test; D2-29/30/32 own list/create/404 tests).
- No Store-vs-Update rule-reuse decision (D2-26 owns update semantics; this request is the store request).
- No model, migration, seeder, factory, `bootstrap/app.php`, `web.php`, dependency, or config changes.
- No custom 422 body/message shaping (framework default + `shouldRenderJsonWhen` already yields JSON).
- No `migrate:fresh` and no database writes.

## Analysis carried forward

- Roadmap D2-24 (`docs/day-2-laravel-postgresql.md:466-481`): validate required fields and formats; invalid payloads → 422; learning goal is protecting logic from malformed input.
- Current state: `routes/api.php:1-18` has only GET routes; `app/Http/` contains only `Controllers/` (no `Requests/`); no validation exists — the database (FK, CHECKs) is the only guard and would surface as 500, not 422 (same failure class D2-23 fixed for non-numeric ids with `whereNumber`).
- Domain ground truth: migration `2026_10_09_213759` (string bounds, decimal(10,7), `-90..90`/`-180..180` CHECKs, nullable `website`, required rest, cascading FK) + `business-entity-design.md:11-30` (only `website` optional; URL format is app-layer; phone as text) + `Business.php:22-32` fillable (nine user attributes).
- `bootstrap/app.php:18-22` already renders `api/*` errors as JSON, so future 422s need no handler work.
- PHPUnit uses SQLite `:memory:` (`phpunit.xml:26-27`); treated as regression-only, PG behavior via Validator probes against the dev database.
- Tree was clean at analysis and remains clean at check (`master...origin/master`); no `.ai/rules/`; conventions from root + `backend/laravel/AGENTS.md` apply.
- User scope decision: Request class only; HTTP 422 proof deferred to D2-25/D2-31. Roadmap's "send invalid payloads → 422" wording is therefore satisfied at Validator level in this task, not over HTTP.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md:466-481` — D2-24 target + learning goal; D2-25/26/27 own endpoints; D2-31 owns validation test.
- `backend/laravel/routes/api.php:1-18` — read-only reference; expected **no change** (prove with `route:list`). Re-verified at check: still 3 GET routes.
- `backend/laravel/app/Http/` — new `Requests/` subdirectory will be created by the generator; re-verified at check: no `Requests/*.php` exists today.
- `backend/laravel/app/Models/Business.php:22-32` — fillable reference for rule coverage; no change.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php:15-35` — bound source for rules; re-verified at check; no change.
- `docs/business-entity-design.md:11-30` — requiredness + URL-note source; no change.
- `backend/laravel/database/factories/BusinessFactory.php:32-42` — valid-value reference (factory output must pass new rules); no change.
- `backend/laravel/bootstrap/app.php:18-22` — JSON-error reference; re-verified at check; no change.
- `backend/laravel/tests/Feature/HealthEndpointTest.php:9-16` — existing API test pattern (regression only).
- `backend/laravel/AGENTS.md` — conventions applied (make: commands with `--no-interaction`, Pint `--dirty`, narrowest tests, tinker single-quote wrapping; file-less Validator probe justified because no test covers validation yet).

## Learning objectives

- Form Request lifecycle: routing → Request `authorize()`/`rules()` → 422 JSON (for `api/*`) before controller/closure runs.
- App-layer vs DB-layer validation: friendly 422 with field errors vs hard `QueryException`/CHECK violation; why both exist.
- Rule-to-schema tracing: each rule maps to a migration bound or design-designated app concern (`exists`↔FK, `between`↔CHECK, `max`↔varchar, `url`↔design note).

## Just-in-time concept explanation

When `POST /api/businesses` exists (D2-25) and type-hints `StoreBusinessRequest`, Laravel resolves the request class before the route closure/controller. It calls `authorize()` (true = allow), then validates input against `rules()`. On failure it throws `ValidationException`, rendered as HTTP 422 JSON (`message` + `errors` keyed by field) because the request `is('api/*')`. The closure never runs and no SQL executes. In D2-24 there is no POST route yet, so the same rules are exercised directly via `Validator::make($input, (new StoreBusinessRequest)->rules())` — identical rule engine, minus the HTTP framing.

## Ordered implementation steps

1. Confirm clean tree and read `routes/api.php`, `Business.php`, businesses migration, and `app/Http/` layout (read-only; no edits).
   - Rationale: smallest increment starts from verified current state; preserves prior closure/no-controller convention.
2. Run `php artisan make:request StoreBusinessRequest --no-interaction` from `backend/laravel`.
   - Rationale: Laravel-way generation; creates the canonical `app/Http/Requests/` location, `authorize()` + `rules()` stubs, correct namespace/imports.
3. Edit only the new `StoreBusinessRequest.php`: `authorize()` returns `true`; `rules()` returns the nine-field array from Scope. Keep default imports/structure; add no extra methods, messages, or attributes.
   - Rationale: surgical single-file change; each rule traces to migration/design; `integer` + `exists` prevent PG `22P02`/FK 500s from becoming user-facing errors; `between` mirrors CHECKs; `nullable|url` implements the design note without rejecting absent websites; `max` mirrors varchar bounds.
4. Run `php -l` and Pint from `backend/laravel` (see verification block).
   - Rationale: syntax + project style gate before any behavioral check.
5. Run `php artisan route:list --path=api --no-interaction`; expect the same 3 GET routes.
   - Rationale: proves no route registration change (Request-only scope).
6. Validator-level probes (file-less, read-only, no DB writes): via `php artisan tinker --execute '...'` with single-quote shell wrapping, build `$rules = (new App\Http\Requests\StoreBusinessRequest)->rules();` then `Validator::make($valid, $rules)` (factory-shaped valid array → passes) and `Validator::make($invalid, $rules)` (missing `name`, bad `category_id`, over-long `type`, out-of-range lat/long, bad `website`, missing `phone` → fails with errors for those keys). The `exists:categories,id` key requires the seeded dev database; if no DB is available, probe the non-`exists` keys only and leave `exists` to D2-25 wiring. Do not change `phpunit.xml`.
   - Rationale: only available proof of rule behavior without a POST route; justified because no test covers validation yet (D2-31 owns it); creates no files.
7. Regression: `php artisan test --compact` from `backend/laravel` (no `--no-interaction`; unsupported by `test`); suite must stay green. Then `git diff --check` and `git status --short`.
   - Rationale: narrowest existing coverage + whitespace hygiene; confirms additive-only change.

## Tests and verification

From `backend/laravel`:

```powershell
php -l app/Http/Requests/StoreBusinessRequest.php
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
git diff --check
git status --short
```

Expected results:

- `php -l`: no syntax errors.
- Pint: passed (only the new file styled, if anything).
- `route:list`: same 3 routes (`api/businesses`, `api/businesses/{business}`, `api/health`); no POST.
- `test --compact`: passed (currently 3 tests, 4 assertions; count unchanged — no new test file).
- Validator probes: valid array passes; invalid array fails with `errors` keys for `category_id`, `name`, `type`, `latitude`, `longitude`, `website`, `phone` as applicable. Exact message text NOT asserted (version-dependent).
- `git diff --check`: clean. Diff limited to one new file `app/Http/Requests/StoreBusinessRequest.php`.
- No `migrate:fresh`, no DB writes, no HTTP 422 asserted (deferred — no POST route exists).

## Risks, dependencies, and unresolved questions

- HTTP 422 cannot be observed in this task by design (no POST route). The roadmap test wording is satisfied at Validator level; over-HTTP proof belongs to D2-25/D2-31. Documented explicitly so "no 422 demo" is not mistaken for incompleteness.
- Over-strict rules risk: `website: nullable|url` may reject some factory-like strings (e.g. missing scheme); mitigation is the Validator probe with factory-shaped data — if the valid probe fails, stop and return the plan to `/check`, never silently relax.
- Empty-string `website` (`''`) fails `url` by design (must be a valid URL or absent/null) — intentional, not a gap.
- Lat/long `numeric` intentionally does not mirror `decimal(10,7)` precision; precision stays DB-side, range is the app concern.
- Phone has no format regex by design (`string|max:32` preserves `+`/formatting per design doc); adding a regex would be speculative scope.
- `authorize()` = `true` is correct today (no auth); tightening belongs to Day 6, not this task.
- Dependency: `exists:categories,id` assumes seeded categories at runtime (true for dev `caribeops`); see probe DB note above.
- No unresolved material decisions (scope decided: Request-only).

## Plan check

- Confirmed reference paths (`routes/api.php:1-18`, `app/Http/` with no `Requests/`, migration `2026_10_09_213759:15-35`, `bootstrap/app.php:18-22`) and that no `d2-24` plan file exists yet (canonical path `docs/plans/d2-24-create-business-request-validation.md` is free; file write deferred per Plan mode).
- Challenged "wire a POST route to prove 422": rejected — user chose Request-only; D2-25 owns POST, D2-31 owns the validation test.
- Challenged each rule against migration bounds + design doc: upheld — `exists`↔FK, `between`↔CHECKs, `max`↔varchar, `nullable|url`↔design note, phone without regex per text-storage design.
- Challenged `authorize()` = `true`: upheld — no auth layer exists; hardening belongs to Day 6.
- Challenged verification strength: tightened — normalized Windows command separators, documented `exists`-probe DB dependency with a no-DB fallback (probe non-`exists` keys only), explicitly forbade `phpunit.xml` changes and `migrate:fresh`.
- Challenged edge cases (`website: ''`, decimal precision, Store-vs-Update reuse): documented as intentional/deferred rather than changed.
- Confirmed no `.ai/rules`; `backend/laravel/AGENTS.md` conventions applied.
- Status set to `Checked — awaiting user approval`. No application code touched.

## Implementation outcome

- Implemented Request-only scope: one new file `backend/laravel/app/Http/Requests/StoreBusinessRequest.php` (`authorize()` returns `true`; nine rules exactly as specified in Scope). No route, model, migration, seeder, handler, or config changes.
- `php -l app/Http/Requests/StoreBusinessRequest.php`: no syntax errors.
- `vendor/bin/pint --dirty --format agent`: passed.
- `php artisan route:list --path=api --no-interaction`: same 3 routes (`api/businesses`, `api/businesses/{business}`, `api/health`); no POST.
- Validator probes via `php artisan tinker --execute` (read-only, dev PostgreSQL `caribeops`, no writes): rule keys confirmed (all nine attributes); seeded `catId=1`; factory-shaped valid array → `passes=true`; invalid array (bad `category_id` 999999, missing `name`, 121-char `type`, lat 91, long -181, bad `website`, missing `phone`) → `fails=true` with error keys `category_id`, `name`, `type`, `latitude`, `longitude`, `website`, `phone` (`description`/`address` were valid in the probe and correctly absent). Exact message text recorded, not specified. Note: this shell requires double-quote wrapping with backtick-escaped `$` for tinker probes (single-quote guidance in `backend/laravel/AGENTS.md` assumes bash and mangles `$vars`/`=>` here); no files created for probes.
- `php artisan test --compact`: passed (3 tests, 4 assertions; count unchanged, no new test file).
- `git diff --check`: clean. Working tree additive-only: new `app/Http/Requests/StoreBusinessRequest.php` + this plan file; no existing-file modifications. No `migrate:fresh`, no database writes, no HTTP 422 asserted (deferred to D2-25/D2-31 — no POST route exists).
- Note: the D2-24 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement "docs/plans/d2-24-create-business-request-validation.md"`.
