# Plan — D3-19: Add Category Filtering

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-19 — Add Category Filtering
- **Plan path:** `docs/plans/d3-19-add-category-filtering.md`

## Desired outcome

`/businesses` offers an "All + 3 categories" select; choosing one navigates to `?category_id=<uuid>` and the list shows only that category's businesses (server-filtered across all pages, count line reflecting the filtered total); "All" clears the param. Unknown ids render the D3-18 empty state.

## Scope

### In scope

1. Backend (`routes/api.php`, closure style): `GET /api/businesses` applies `->when($request->query('category_id'), fn ($q, $id) => $q->where('category_id', $id))` — `Request` import only if needed for the closure signature (`function (Request $request)` + `use Illuminate\Http\Request;`). No model/resource/validation changes.
2. Backend test `tests/Feature/BusinessCategoryFilterTest.php` (D3-13/17 precedent): `RefreshDatabase` + `CategorySeeder`, one Hotels + one Tours business via factories, assert unfiltered total, `?category_id=<hotels>` returns only the Hotels row with filtered total, unknown UUID returns empty `data: []`.
3. Frontend `src/components/CategoryFilter.tsx` (`"use client"`): `<select>` with "All categories" + category options, `value` from a `currentCategoryId: string | null` prop, `onChange` → `router.push("/businesses")` or `router.push(`/businesses?category_id=${encodeURIComponent(id)}`)` via `useRouter` (D3-16 precedent).
4. Frontend `src/app/businesses/page.tsx`: accept `searchParams: Promise<{ category_id?: string }>` (awaited — Next 16 promise convention per `[id]` page), parallel-fetch categories + (filtered) businesses via `Promise.all` (D3-11 precedent), render `<CategoryFilter>` above the count line. Count + `BusinessList` + `EmptyState` logic untouched.
5. Verify: `php -l`, Pint `--dirty`, `route:list` (count unchanged), new test + suite, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a live per-category proof (below).

### Non-goals

- No pagination UI, no multi-facet/search/sort controls; no category-name display changes; no `router.refresh`/revalidation work; no model/resource/migration changes; no dependencies.

## Analysis carried forward

D3-19 (`docs/day-3-nextjs.md:376-389`) needs category filtering proven per category. Evidence: zero filter UI/state/backend-param; page-1-only client filtering provably wrong over 40 paginated rows; categories endpoint + UUID ids + per-request pages + `useRouter` precedent ready; tree clean; slug free.

## Current-state evidence and relevant files

- `backend/laravel/routes/api.php` (list closure) — `when()` filter host; `Category`/`Business` models + factories exist.
- New: `tests/Feature/BusinessCategoryFilterTest.php`; edited: `routes/api.php` (filter only).
- New: `src/components/CategoryFilter.tsx`; edited: `src/app/businesses/page.tsx` (searchParams + parallel fetch + filter render).
- Reuse, no edits: `apiGet`, `Category`/`Business` types, `BusinessList` (+ its D3-18 empty branch), `EmptyState`.
- References: `docs/day-3-nextjs.md:376-389`; Next.js `dist/docs` fetching-data (parallel) + `useSearchParams`-adjacent navigation docs; Laravel Boost rules (Pint/PHPUnit, `.ai/rules` absent).

## Learning objectives and just-in-time concepts

- `searchParams` as input: the server page reads the URL (`await searchParams`) and fetches accordingly — filter state lives in the address bar, not in component memory.
- Client island writes, server reads: the select pushes URLs; the page re-renders from them. Full circle of the roadmap's "query parameters and client-side state" lesson.

## Ordered implementation steps

1. Confirm clean tree; re-read list closure, `CategoriesTest`/`DashboardSummaryTest` patterns, `page.tsx`, `[id]` params convention (read-only).
2. Read version-pinned Next.js `dist/docs` fetching-data guide before frontend writes.
3. Edit the list closure with the `when()` filter (add `Request` import iff the closure type-hints it).
4. Add the feature test (seeded two-category assertions + unknown-UUID empty case); run green alone, then the suite.
5. Create `CategoryFilter.tsx` per Scope ("All categories" first, `value=""`).
6. Edit `businesses/page.tsx` per Scope (awaited `searchParams`, `Promise.all`, filter above count line).
7. `php -l` + Pint `--dirty` (mandatory — PHP touched); `npx tsc --noEmit`, `npm run lint`, `npm run build` (page stays per-request, Laravel-independent build).
8. Live per-category proof (chrome-devtools available; production Next on non-`:3000` port, `npx next` directly): open `/businesses`, select each of Hotels/Restaurants/Tours, assert visible rows' category text matches and count line totals match direct `?category_id=` API JSON; select a bogus UUID via direct URL and assert "No businesses found."; reselect All and assert full list. Close pages, stop proof server.
9. `git diff --check` + `git status --short` — expect backend route-test pair + frontend component + page edit.

Rationale: server-side `when()` filter is the only correct shape over pagination (client-only filtering disproven by the 15-of-40 window); `category_id` reuses the API's own key vocabulary (same as the form field); URL-held state keeps the filter shareable and the page server-rendered; `useRouter` (not Links) honors the roadmap's client-state half; unknown-id → natural empty state needs zero code.

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

Plus the live per-category + bogus-UUID + All proof (assertions quoted in the outcome). Expected: new test green + suite green; route count unchanged; all frontend checks clean; each category's rows match with filtered totals; bogus id shows the empty state. No checks run in planning; these are expectations, not claims. If PG/Laravel is down, live portions report blocked, not faked; static checks still gate.

## Risks, dependencies, unresolved questions

- `Request` import need depends on closure signature style — decided at implement time (import iff type-hinted; Pint will confirm).
- Select a11y: associated `<label>` included (D3-13 form precedent).
- Seeded NAME churn (Faker) — proof asserts category/count/shape, never names.
- No open questions.

## Plan check

- Verified paths (unconditional paginate line, no existing client/fetch usage, api-config contents, health route shape, no test runner, clean tree, free slug) by reads; no code edited.
- Challenged client-only filtering: rejected with evidence — 15-of-40 window makes it incorrect, not just incomplete.
- Challenged `<Link>` pills instead of a select island: rejected — pills skip the roadmap's client-state half; select + `useRouter` teaches both.
- Challenged validating `category_id` against categories server-side (404 on unknown): rejected — empty-list + D3-18 state is the honest, zero-code answer.
- Challenged skipping the backend test: rejected — D3-13/17 precedent; the filter is new backend behavior.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-19 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-19-add-category-filtering.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `backend/laravel/routes/api.php` — list closure takes `Request $request` (+ import) and applies `->when(query('category_id'), where category_id)`; existing lines untouched.
- `backend/laravel/tests/Feature/BusinessCategoryFilterTest.php` — new via `make:test --phpunit` (stub replaced): seeded Hotels+Tours exact assertions (unfiltered total, filtered total/row/category) + unknown-UUID empty case.
- `frontend/next/src/components/CategoryFilter.tsx` — new `"use client"` select island (label, All + categories, `useRouter` push with `encodeURIComponent`, current-value prop).
- `frontend/next/src/app/businesses/page.tsx` — awaited `searchParams`, `Promise.all` categories + filtered list, `<CategoryFilter>` above the count line; count/`BusinessList`/empty logic untouched.
- All other files untouched (no pagination UI, no model/resource changes).

Verification (exact commands): `php -l` clean (both PHP files); Pint `--dirty` passed; `route:list --path=api` shows 9 routes (count unchanged); new test green alone (2 tests, 10 assertions); full suite green (18 tests, 309 assertions); `npx tsc --noEmit` clean (exit 0); `npm run lint` clean (exit 0); `npm run build` passed (Next 16.4.0; route table unchanged); live per-category proof self-driven via chrome-devtools against production Next on `127.0.0.1:3101` + rebuilt compose `:8000` — Tours 15 of 16 all-Tours rows, Hotels 8 of 8 all-Hotels rows, Restaurants 15 of 16 all-Restaurants rows, bogus UUID "Showing 0 of 0" + "No businesses found.", All restored "15 of 40"; `git diff --check` clean (exit 0; LF notice on the page file only). Proof page closed, `:3101` stopped (port confirmed free). No Laravel writes of any kind (test DB only; no probes needed — live data sufficed), no migrations, no dependencies; nothing committed.

Environment note: compose `:8000` initially ignored the filter (stale image, bogus UUID returned 40) — rebuilt via `docker compose up -d --build laravel` per the repo rule of thumb (no data impact; PG volume intact).
