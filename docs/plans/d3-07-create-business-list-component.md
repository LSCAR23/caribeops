# Plan — D3-07: Create Business List Component

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-07 — Create Business List Component
- **Plan path:** `docs/plans/d3-07-create-business-list-component.md`

## Desired outcome

`/businesses` keeps its Server-Component fetch and delegates rendering to a new
presentational `BusinessList` component showing `name / category / address / rating`
for every returned business. Laravel list payload additively gains `category_name`
+ average rating; existing pagination, statuses, and 12 base keys unchanged.

## Scope

### In scope

1. Laravel (additive only): `GET /api/businesses` eager-loads `category` and
   `reviews_avg_rating` via `with()` + `withAvg('reviews', 'rating')`;
   `BusinessResource` adds `category_name` and `average_rating` (null-tolerant).
2. Frontend: extend `src/types/business.ts` with the two new fields;
   new `src/components/BusinessList.tsx` (Server Component, `businesses` prop,
   null-safe category/rating lines); `src/app/businesses/page.tsx` passes
   `result.data` through, keeping fetch + count line.
3. Tests/verification: existing suite stays green; new assertions for the two
   keys; `tsc` + `lint` + `build`, `pint`, `phpunit`, live HTML proof.

### Non-goals

- No `loading.js`/skeletons (D3-08); no error UX/`error.js`/try-catch (D3-09);
  no detail route (D3-10/11), reviews list (D3-12), form/validation (D3-13–15),
  KPIs (D3-17), empty states (D3-18), filtering/pagination controls (D3-19);
  no new API routes; no dependencies.

## Analysis carried forward

D3-07 (`docs/day-3-nextjs.md:147-167`) needs name/category/address/rating per
business. Evidence: page renders name + type·address inline with no component;
`Business`/`BusinessResource` carry only `category_id`, no name/rating; list
query has no `with`/`withAvg` though `Business::category()`/`reviews()` exist;
`BusinessListTest` pins 12 keys; D3-06 deferred category/rating as D3-07's
problem; tree clean, slug free. User decision (2026-10-11): include additive
Laravel extension rather than frontend-only placeholder. Docker `:8000` stale.

## Current-state evidence and relevant files

- `src/app/businesses/page.tsx:14-43` — rewrite host, keeps fetch.
- New: `src/components/BusinessList.tsx` — sole UI addition.
- Edited: `src/types/business.ts:1-14`, `businesses/page.tsx`,
  `backend/laravel/routes/api.php:14-16`,
  `backend/laravel/app/Http/Resources/BusinessResource.php:17-30`.
- Reuse, no edits: `src/lib/api-client.ts:21-48`, `src/types/api.ts:1-16`,
  `src/components/Navigation.tsx:1-33` (pattern).
- Tests: `backend/laravel/tests/Feature/BusinessListTest.php:19-64`.
- References: `docs/day-3-nextjs.md:147-167`; version-pinned Next.js
  `node_modules/next/dist/docs/` fetching-data + caching guides (implement
  must read before writing, per `frontend/next/AGENTS.md`); Laravel Boost
  guidelines for `withAvg`/resource conventions.

## Learning objectives and just-in-time concepts

- Presentational components: `BusinessList({ businesses })` has no fetch,
  no hooks — same input always renders same output; testable and reusable
  for D3-16 refresh and D3-19 filtering.
- `withAvg`: `withAvg('reviews', 'rating')` adds `reviews_avg_rating`
  (null when zero reviews) in one query; `with('category')` avoids N+1 for
  `category_name`. Resource maps them to stable nullable display fields.

## Ordered implementation steps

1. Confirm clean tree; re-read page, `business.ts`, resource, `api.php`,
   `Business.php` relations, `BusinessListTest` (read-only).
2. Read version-pinned Next.js `dist/docs` fetching-data/caching guides
   before writing; confirm Laravel `withAvg` shape via installed-version docs.
3. Laravel: `api.php` list → `Business::query()->with('category')
   ->withAvg('reviews', 'rating')->orderBy('id')->paginate()`.
4. Laravel: `BusinessResource` adds `category_name => $this->category?->name`
   and `average_rating => $this->reviews_avg_rating` (null passthrough,
   no rounding in API).
5. Frontend: extend `Business` with `category_name: string | null` and
   `average_rating: number | string | null`.
6. Frontend: create `src/components/BusinessList.tsx` — `<ul>` mapping
   `businesses` to `<li key={id}>` with name, `category_name ?? '—'`,
   address, rating formatted to 1 decimal or `No ratings yet` when null.
7. Frontend: `businesses/page.tsx` renders `<BusinessList businesses={result.data} />`,
   keeping `await connection()`, `export const instant = false`, count line.
8. Verify: `vendor/bin/pint --dirty`, Laravel `php artisan test --compact`
   (at minimum `BusinessListTest`), `npx tsc --noEmit`, `npm run lint`,
   `npm run build`, live HTML proof (fresh serve, assert seeded name +
   category + `of 40` in `/businesses` HTML), `git diff --check`.
   Rationale: additive keys keep contract; Server Component preserves
   D3-08/09 boundaries; formatting lives in UI, not API.

## Tests and verification commands

```powershell
# from backend/laravel
vendor/bin/pint --dirty --format agent
php artisan test --compact --filter=BusinessListTest
# from frontend/next (Laravel serving)
npx tsc --noEmit
npm run lint
npm run build
# from repo root
git diff --check
git status --short
```

Plus live HTML proof per step 8. Expected: all clean; HTML shows real
seeded name, category label, rating text, `of 40`; diff = 2 Laravel edits
+ 1 type edit + 1 new component + 1 page edit (+ test touch-up if needed).
No checks run in planning.

## Risks, dependencies, unresolved questions

- `reviews_avg_rating` type (string vs float vs null) — frontend union +
  `Number()` formatting absorbs it; verify against live JSON.
- Zero-review businesses (factory tests) — null path must render
  `No ratings yet`, not crash.
- Extra resource keys — `assertJsonStructure` allows extras, but full-suite
  run confirms no strict-equality test breaks.
- Stale Docker `:8000` — use fresh local serve until Day-5 rebuild.
- No open scope questions; user chose backend extension.

## Plan check

- Verified paths, 12-key payload, missing category/rating, free slug,
  clean tree by reads/grep; no code edited.
- Challenged frontend-only mapping: rejected per your scope answer —
  plan uses additive `with`/`withAvg` + resource keys.
- Challenged new routes or rounding in API: rejected — no new endpoints,
  formatting stays in component.
- Challenged adding loading/error/filtering "while here": rejected —
  D3-08/09/19 own those.
- Challenged strict `number` typing for avg: revised to
  `number | string | null` after live-JSON/string-serialization evidence.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-07-create-business-list-component.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation. Note: the plan file did
not exist at `/implement` time (prior Plan-mode session was blocked from writing
`docs/plans/`), so it was first materialized verbatim from the checked inline
deliverable before implementing (same as D3-06).

Files:

- `backend/laravel/routes/api.php` — list query extended: `with('category')` +
  `withAvg('reviews', 'rating')`, still `orderBy('id')->paginate()`.
- `backend/laravel/app/Http/Resources/BusinessResource.php` — two additive keys:
  `category_name => $this->category?->name`,
  `average_rating => $this->reviews_avg_rating` (null passthrough, no rounding).
- `frontend/next/src/types/business.ts` — `Business` gains
  `category_name: string | null` + `average_rating: number | string | null`.
- `frontend/next/src/components/BusinessList.tsx` — new presentational Server
  Component (`businesses` prop, no fetch/hooks): name, `category_name ?? '—'`,
  address, `Rating: X.X` (1 decimal via `Number()`) or `No ratings yet`.
- `frontend/next/src/app/businesses/page.tsx` — inline `<ul>` replaced with
  `<BusinessList businesses={result.data} />`; fetch, count line,
  `await connection()` + `export const instant = false` unchanged.

Mechanism note (loud, not silent): the `:3101` proof first attempted `next dev`,
which refuses to start while the user's `:3000` dev server runs in the same
directory — used `next start` (production) on `:3101` instead, matching D3-06.

Verification (exact commands): `vendor/bin/pint --dirty --format agent` passed;
`php artisan test --compact` passed (10 tests, 239 assertions, exit 0; narrow
`--filter=BusinessListTest` also 2/2 green — zero-review factory rows prove the
null-avg path); `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run build` passed (Next 16.4.0; `/businesses` `ƒ Dynamic`,
Laravel-independent); live JSON via `php artisan serve` on `:8001` showed
`total=40`, 15 rows, first `Kilback Ltd` with `category_name=Hotels`,
`average_rating=2.875`; production Next on `:3101` rendered `/businesses` HTML
containing `Kilback Ltd`, `Hotels`, `Rating:` + `2.9`, and
`Showing <!-- -->15<!-- --> of <!-- -->40<!-- --> businesses` (React SSR comment
separators, as in D3-06); `git diff --check` clean (LF→CRLF notice on the two
frontend edits only). Proof build used a temp `.env.local` override to `:8001`,
restored to `:8000` after with a final clean rebuild. Both proof servers stopped;
Postgres container (started only for verification) stopped again. Nothing
committed. PHP 8.4 `php -l` clean on both Laravel files. Initial
`BusinessListTest` run failed with connection-refused to `127.0.0.1:5433`
(Postgres down) before the container was started — reported as blocked, not
faked, then re-run green.
