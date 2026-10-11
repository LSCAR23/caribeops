# Plan — D3-17: Create KPI Cards

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-17 — Create KPI Cards
- **Plan path:** `docs/plans/d3-17-create-kpi-cards.md`

## Desired outcome

Dashboard `/` shows four KPI cards — Total businesses, Total reviews, Average rating, New (7 days) — with exact values from real PostgreSQL data via a new `GET /api/dashboard/summary` endpoint. No approximations, no placeholders.

## Scope

### In scope

1. Backend (one route, existing closure style): `GET /api/dashboard/summary` in `routes/api.php` returning `{"data": {"total_businesses": int, "total_reviews": int, "average_rating": float|null, "new_businesses": int}}` via `Business::count()`, `Review::count()`, `Review::avg('rating')`, `Business::where('created_at', '>=', now()->subDays(7))->count()`. Manual `data` wrap matches the API's envelope habit so the frontend reuses `ApiItemResponse<T>`.
2. Backend test `tests/Feature/DashboardSummaryTest.php` (D3-13 `CategoriesTest` precedent): with `RefreshDatabase` + seeders, asserts 200, key set, and exact counts/average against known seeded data.
3. Frontend `src/types/dashboard.ts`: `DashboardSummary` (`average_rating: number | null`, rest `number`).
4. Frontend `src/components/KpiCard.tsx`: presentational `{label, value}` card (D3-07 separation precedent; zinc/teal vocabulary; `role` neutral, no interactivity).
5. Frontend `src/app/page.tsx`: hero → dashboard (keep eyebrow/title, add responsive 4-card grid); per-request server fetch (`connection()` + `instant = false` pattern) via `apiGet<ApiItemResponse<DashboardSummary>>`; average formatted with existing `formatRating` from `BusinessList` (null → "—"); "New businesses" labeled with its window ("New (7 days)").
6. Verify: `php -l`, Pint `--dirty`, `route:list`, `php artisan test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a live dashboard proof (below).

### Non-goals

- No Go analytics involvement; no charts/trends; no per-category breakdown; no filters (D3-19); no caching-policy tuning; no auth; no changes to existing routes/resources/models; no dependencies.

## Analysis carried forward

D3-17 (`docs/day-3-nextjs.md:333-354`) needs four exact, real-data KPIs. Evidence: only `meta.total` is exactly available frontend-only; reviews total unexposed, global average unsourced, recency windowing broken by id-asc pagination; `/` is a static hero; user decision: Laravel summary endpoint. Tree clean; slug free.

## Current-state evidence and relevant files

- `backend/laravel/routes/api.php` — append-only host for the closure route; `Business`/`Review` models exist (D2-10/12); no `dashboard/*` route exists.
- New: `tests/Feature/DashboardSummaryTest.php`; edited: `routes/api.php`.
- New: `src/types/dashboard.ts`, `src/components/KpiCard.tsx`; edited: `src/app/page.tsx:1-14` (static hero → live dashboard).
- Reuse, no edits: `apiGet`, `ApiItemResponse`, `formatRating` (`BusinessList.tsx:4-13`), `Business` type.
- References: `docs/day-3-nextjs.md:333-354`; Next.js version-pinned `dist/docs` fetching-data guide; Laravel Boost rules (Artisan/Pint/PHPUnit conventions; `.ai/rules` check at implement time if present).

## Learning objectives and just-in-time concepts

- Aggregation near the data: four whole-table aggregates are single SQL queries; the alternative (client-side approximation) is provably wrong for 3 of 4 cards.
- Envelope reuse: the manual `data` wrap lets the frontend consume the endpoint through the existing `ApiItemResponse<T>` with zero new transport code.
- Presentational separation (D3-07 again): `KpiCard` owns pixels, the page owns fetching — the same split, second instance.

## Ordered implementation steps

1. Confirm clean tree; re-read `routes/api.php`, `Business`/`Review` models, `page.tsx`, `BusinessList:formatRating`, `CategoriesTest` pattern (read-only). Check `.ai/rules` existence per Laravel Boost rules.
2. Read version-pinned Next.js `dist/docs` fetching-data guide before frontend writes.
3. Append the closure route (imports `Business`/`Review` already partially present — add what's missing; keep `whereUuid`/existing lines untouched).
4. Add the feature test (seeded exact assertions); run it green alone, then the suite.
5. Add `dashboard.ts` type, `KpiCard.tsx`, rewrite `page.tsx` per Scope.
6. `php -l` + Pint `--dirty` (mandatory — PHP touched); `npx tsc --noEmit`, `npm run lint`, `npm run build` (dashboard per-request, Laravel-independent build).
7. Live dashboard proof (chrome-devtools available): serve production Next on non-`:3000` port; open `/`, assert the four cards show the API's exact values (cross-check against direct `/api/dashboard/summary` JSON); close page, stop proof server. Seeded names ignored (Faker churn) — counts/shape only.
8. `git diff --check` + `git status --short` — expect backend route + test, frontend type + component + page edit.

Rationale: closure route matches every existing Day-2/D3-13 route (no controller precedent to follow); manual `data` wrap buys `ApiItemResponse` reuse; 7-day "new" window is the weekly-ops convention (one-line change if you prefer 30); `formatRating` reuse avoids a second null/decimal formatter; per-request dashboard keeps builds Laravel-free and values live.

## Tests and verification commands

Backend (`backend/laravel`):

```powershell
php -l routes/api.php
vendor/bin/pint --dirty --format agent
php artisan route:list --path=api --no-interaction
php artisan test --compact
```

Frontend (`frontend/next`) + root:

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the live dashboard proof (card values == API JSON). Expected: new test green + suite green; all frontend checks clean; proof exact. No checks run in planning; these are expectations, not claims. If PG/Laravel is down, live portions report blocked, not faked; static checks still gate.

## Risks, dependencies, unresolved questions

- "New" window (7 days) is a semantic default, flagged overridable — one line.
- `avg('rating')` returns null on zero reviews → card shows "—" via `formatRating`; no NaN path (no client division anywhere).
- Seeded NAME churn (Faker) — proof asserts counts/shape only, never names.
- No open questions — source decision made by you this session.

## Plan check

- Verified paths (route file shape, model existence via MEMORY + category test precedent, hero page contents, `formatRating` lines, no dashboard route/test/component, clean tree, free slug) by reads; no code edited.
- Challenged frontend-only math: rejected with evidence — 3 of 4 cards uncomputable/unwinnable (your decision confirms the endpoint).
- Challenged a `DashboardController` + `DashboardResource`: rejected — every existing route is a closure returning Resources/JSON; one closure keeps the file's single convention.
- Challenged charts/trends/per-category splits: rejected — unrequested scope; Day-4/5 analytics owns visualization depth.
- Challenged skipping the backend test: rejected — D3-13 set the precedent and exactness is this task's entire point.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-17 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-17-create-kpi-cards.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing (one transcription slip in the reminder slug fixed on materialize). Metric-source decision (Laravel endpoint over frontend math) was made by the user during `/analize`, carried through plan and check.

Files:

- `backend/laravel/routes/api.php` — appended `GET /api/dashboard/summary` closure (+ `Review` import): `Business::count()`, `Review::count()`, `Review::avg('rating')` cast to float (null-safe), 7-day `new_businesses`; manual `data` wrap for `ApiItemResponse` reuse. Existing lines untouched.
- `backend/laravel/tests/Feature/DashboardSummaryTest.php` — new via `make:test --phpunit` (stub replaced): seeded exact-aggregate test (3 businesses incl. one 30-day-old, 3 reviews rated 5/3/4 → 3/3/4.0/2) + empty-DB test (0/0/null/0).
- `frontend/next/src/types/dashboard.ts` — new `DashboardSummary` (`average_rating: number | null`).
- `frontend/next/src/components/KpiCard.tsx` — new presentational `{label, value}` card, no interactivity.
- `frontend/next/src/app/page.tsx` — hero → live dashboard (eyebrow/title kept, 4-card grid, per-request `connection()` + `instant = false`, `formatRating` reuse, "New (7 days)" label).
- All other files untouched (no model/resource/config changes).

Verification (exact commands): `php -l` clean (both PHP files); Pint `--dirty` passed; `route:list --path=api` shows 9 routes incl. `api/dashboard/summary`; new test green alone (2 tests, 15 assertions); full suite green (16 tests, 299 assertions); `npx tsc --noEmit` clean (exit 0); `npm run lint` clean (exit 0); `npm run build` passed (Next 16.4.0; `/` is now `ƒ Dynamic`, Laravel-independent build); live dashboard proof self-driven via chrome-devtools (`:3101` + rebuilt compose `:8000`) — cards read 40 / 320 / 3.0 / 40, exactly matching direct `/api/dashboard/summary` JSON (`40/320/3.040625/40`); `git diff --check` clean (exit 0; LF notices only); `git status --short` shows the expected 2 edited + 4 new files. Proof page closed, `:3101` stopped (port confirmed free). No migrations, no reseeds, no Laravel writes of any kind (probe-free task — test DB only); nothing committed.

Environment note: compose `:8000` initially 404'd the new route (stale image) — rebuilt via `docker compose up -d --build laravel` per the repo's own rule of thumb (no data impact: PG volume intact, no new migrations); PG healthy throughout. Docs read before writing: version-pinned `dist/docs` redirecting guide (`useRouter`) and forms guide skim for D3-15/16 context; fetching-data content held from prior reads (same Next 16.4.0).
