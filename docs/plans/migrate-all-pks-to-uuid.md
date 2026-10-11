# Plan — Migrate all primary keys from bigint to UUID

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** Migrate all primary keys from bigint to UUID
- **Plan path:** `docs/plans/migrate-all-pks-to-uuid.md`

## Desired outcome

All four domain models expose UUID string ids end to end: PG `uuid` PKs,
`HasUuids` models, UUID validation + route constraints, green suite, seeded
data intact in shape (40/320 counts), and the Next.js list linking to
`/businesses/{uuid}`.

## Scope

### In scope

1. Migrations (edit in place): `$table->id()` → `$table->uuid('id')->primary()`
   in `categories`, `businesses`, `amenities`, `reviews` creates;
   `foreignId` → `foreignUuid` for `businesses.category_id`,
   pivot `business_id`/`amenity_id`, `reviews.business_id` (constraints +
   cascades unchanged).
2. Models: `use HasUuids` on Category, Business, Amenity, Review (confirm
   trait in installed Laravel version first).
3. `StoreBusinessRequest`: `category_id` rule `integer` → `uuid`.
4. Routes: 3× `whereNumber('business')` → `whereUuid('business')`;
   keep `orderBy('id')`.
5. Frontend `types/business.ts`: `id` + `category_id` `number` → `string`.
6. Docs: `business-entity-design.md` id row → UUID (plans are history, left
   alone). Factories/seeders/tests: change only if red (expected: untouched).

### Non-goals

- No `users`/`cache`/`jobs` tables; no ULIDs; no `generateStaticParams`;
  no D3-11 fetch; no additive ALTER migrations (see decision below); no new
  dependencies; no commits.

## Analysis carried forward

User chose all-entities UUID. Evidence: `$table->id()` ×4 + `foreignId` FKs;
no UUID traits; `integer` validation rule; 3× `whereNumber`; tests flow
through model-derived values; frontend numeric ids with string-safe
consumers; factories/seeders id-agnostic; tree clean, slug free. Decision
requiring review (not blocking): edit-in-place + fresh over ALTER; framework
tables out.

## Current-state evidence and relevant files

- Migrations: `..._create_categories/businesses/amenities/business_amenities/
  reviews_table.php` (ids + FK columns listed above).
- Models: `app/Models/{Category,Business,Amenity,Review}.php`.
- `app/Http/Requests/StoreBusinessRequest.php:26`, `routes/api.php:15-38`.
- Tests: `Business{List,Creation,Validation,NotFound}Test.php`.
- Frontend: `src/types/business.ts:2-3`, `BusinessList.tsx:26-31`,
  `[id]/page.tsx:10` (already `string`).
- References: `docs/business-entity-design.md`; Laravel Boost
  `search-docs` on UUID/HasUuids if trait behavior is unclear at implement.

## Learning objectives and just-in-time concepts

- `HasUuids`: ordered client-generated UUIDs; sets non-incrementing string
  keys so factories, seeders, and binding work without DB defaults.
- `whereUuid`: same D2-23 lesson — garbage segments must 404 at the router,
  never reach PG as invalid-uuid `22P02` 500s.
- Env-spanning types: one schema decision ripples through validation, JSON,
  and TypeScript — UUIDs are strings everywhere outside PG.

## Ordered implementation steps

1. Confirm clean-enough tree (preserve D3-10/infra changes); re-read the
   migration/model/route/test files (read-only); confirm `HasUuids` +
   `whereUuid` + `uuid` rule exist in the installed Laravel version.
2. Edit the 4 create-migrations (`uuid('id')->primary()`, `foreignUuid`
   columns); add `use HasUuids` to the 4 models.
3. Validation rule → `required|uuid|exists:categories,id`; routes
   `whereNumber` → `whereUuid` (×3).
4. Frontend `id`/`category_id` → `string`; `business-entity-design.md` id row.
5. Verify: `vendor/bin/pint --dirty --format agent`; disposable-DB
   `migrate:fresh --seed` + count/shape checks (40 businesses, 320 reviews,
   3 categories); full `php artisan test --compact`; `db:table` confirming
   `uuid` PK/FK types; `npx tsc --noEmit`, `npm run lint`, `npm run build`;
   live JSON proof (uuid-string ids, detail-by-uuid, unknown-uuid 404,
   garbage-segment 404); `git diff --check`.
   Rationale: in-place + fresh is the only sane path pre-production with a
   full seeder (ALTER can't map bigint→uuid across FKs); `whereUuid`
   preserves D2-23; string ids need zero logic changes in consumers.

## Tests and verification commands

```powershell
# from backend/laravel
vendor/bin/pint --dirty --format agent
php artisan migrate:fresh --seed
php artisan test --compact
# from frontend/next
npx tsc --noEmit
npm run lint
npm run build
# from repo root
git diff --check
```

Plus live uuid-shape/404 proofs above. Expected: suite green (tests
expected unchanged — any red test is revised minimally with cause noted, not
silently weakened); diff = 4 migrations + 4 models + request + routes + type
+ design doc. No checks run in planning. Dev `caribeops` data is rebuilt by
the seeder; `migrate:fresh` only on disposable/dev DBs, never prod-like.

## Risks, dependencies, unresolved questions

- Editing old migrations rewrites shared history — accepted pre-production;
  D2-08 chain check re-validates the fresh chain at implement time.
- `orderBy('id')` becomes lexicographic (deterministic; ordered UUIDs stay
  roughly chronological) — accepted, no reseed-safe order assertions break.
- Unknown-uuid and garbage segments must both 404 (covered by proof).
- Uncommitted D3-10/infra work must be preserved, not swept into this diff.
- Open for your review: framework tables out; ALTER rejected — speak now or
  at `/implement` (concerns return the plan to `/check`).

## Plan check

- Verified every touchpoint by reads/grep (migrations, models, request,
  routes, all 4 tests, factories, seeders, frontend); no code edited.
- Challenged additive ALTER migrations: rejected — PG can't cast
  bigint→uuid across live FKs; fresh+seed is the dev-stage answer.
- Challenged touching factories/seeders/tests preemptively: rejected —
  all id-agnostic by inspection; change only on red with cause.
- Challenged including `users`/framework tables: rejected — zero domain
  benefit, real auth-session risk; flagged for review instead.
- Challenged ULIDs/`generateStaticParams`: rejected — user said UUID;
  prerendering needs Laravel at build time.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/migrate-all-pks-to-uuid.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation, no test/factory/seeder
changes needed. Note: the plan file did not exist at `/implement` time (prior
Plan-mode session was blocked from writing `docs/plans/`), so it was first
materialized verbatim from the checked inline deliverable before implementing.

Files:

- 4 create-migrations: `$table->id()` → `$table->uuid('id')->primary()`
  (categories, businesses, amenities, reviews); `foreignId` → `foreignUuid`
  for `businesses.category_id`, pivot `business_id`/`amenity_id`,
  `reviews.business_id` (constraints + cascades unchanged).
- 4 models (`Category`, `Business`, `Amenity`, `Review`): `use HasUuids`
  (+ one pint-added blank line in Category/Amenity).
- `StoreBusinessRequest`: `category_id` rule `integer` → `uuid`.
- `routes/api.php`: 3× `whereNumber('business')` → `whereUuid('business')`;
  `orderBy('id')` kept.
- `frontend/next/src/types/business.ts`: `id` + `category_id`
  `number` → `string` (consumers needed no logic changes).
- `docs/business-entity-design.md`: id/category_id rows → `uuid`.

Verification (exact commands): `vendor/bin/pint --dirty --format agent`
passed (fixed 2 blank lines); `php -l` clean on all 5 migrations;
`php artisan migrate:fresh --seed` green (full 9-migration chain);
`db:table businesses` confirms `id: uuid` + `category_id: uuid` + uuid pkey/FK;
seeded shape intact (3 categories, 40 businesses, 320 reviews; sample
`01a12937-faad-713a-8809-ed2b0c43ac36`); `php artisan test --compact` green
(10 tests / 239 assertions, zero test edits); `npx tsc --noEmit` clean;
`npm run lint` clean; `npm run build` passed (Next 16.4.0, dynamic routes
unchanged, Laravel-independent); live JSON on fresh local `:8001` —
list 40/15 with uuid-string ids, detail-by-uuid 200, unknown-uuid 404,
garbage `/abc` 404; production Next on `:3101` — list `href` carries real
uuids, detail URL 200 with placeholder; `git diff --check` clean;
temp `.env.local` override restored to `127.0.0.1:8000` with final rebuild.
All proof servers stopped; temp count script removed. Pre-existing
uncommitted D3-10/infra work preserved untouched. Nothing committed.
Note: `:8000` Docker Laravel still runs the pre-UUID image — rebuild it
before relying on `:8000` business endpoints (Day-5).
