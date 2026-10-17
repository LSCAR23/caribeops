# D7-02 — Improve Business List UX

- Task: D7-02 — Improve Business List UX
- Date: 2026-10-16
- Status: Implemented — verified
- Scope decisions: search matches `name` only (case-insensitive); pagination is Prev/Next + `Page X of Y` (no numbered links)

## Desired outcome

`/businesses` offers search, category filter, and pagination, and each control visibly changes the displayed data — every control backed by a backend query parameter, never by hardcoded client-side manipulation.

## Scope

Backend (Laravel):
- Add `?search=` to `GET /api/businesses`: case-insensitive match on `businesses.name` only, combined with the existing `category_id` filter and `paginate()`.
- New `BusinessSearchTest` covering match, no-match, and search+category combination.

Frontend (Next.js):
- `src/app/businesses/page.tsx`: read `search`, `category_id`, `page` from `searchParams`; build one list URL preserving all three; render search input, existing category filter, and Prev/Next pagination.
- New `SearchInput.tsx` client island: URL-driven submit/clear (same pattern as `CategoryFilter`), no live debounce.
- Extend `ApiListResponse` meta typing with `current_page`/`last_page`/`per_page` for the pagination UI.

## Non-goals

- No sorting UI, no per-page selector, no changes to detail/new/edit forms, analytics, dashboard (D7-01), auth, or seed data.
- No client-side filtering/sorting of fetched rows; no new dependencies.

## Analysis carried forward

`/businesses` today has only the D3-19 category filter: `CategoryFilter.tsx` writes `?category_id=` into the URL, `page.tsx` reads it and fetches `GET /api/businesses?category_id=`. The backend closure (`routes/api.php:63-72`) applies `when(category_id)`, orders by `id`, and `paginate()`s at 15/page — but the UI never sends `?page=` and has no search input, so with 40 seeded rows it shows `Showing 15 of 40` with no way to reach the rest. No `search` param exists anywhere. `BusinessListTest` pins the pagination contract (15/page, `last_page`, page 2 holds the remainder); `BusinessCategoryFilterTest` pins the filter contract. E2E `auth-flow` clicks `Businesses` and reads the first list item — the default (unfiltered page 1) view must stay intact. Git tree carries uncommitted D7-01 work (`page.tsx`, `MEMORY.md`, `d7-01` plan) which this task must not touch.

## Current-state evidence and relevant files

- `backend/laravel/routes/api.php:63-72` — list closure: `with category`, `withAvg reviews rating`, `when(category_id)`, `orderBy id`, `paginate()`; `throttle:reads`.
- `frontend/next/src/app/businesses/page.tsx:18-57` — reads only `category_id`; `Promise.all` list + categories; count line; `connection()` + `instant=false` build-safe pattern.
- `frontend/next/src/components/CategoryFilter.tsx:1-49` — URL-writing client island (pattern to reuse for search).
- `frontend/next/src/components/BusinessList.tsx:16-23` — `EmptyState` on zero rows (covers empty-search UX for free).
- `frontend/next/src/types/api.ts:4-10` — `ApiListResponse` meta has `total` + loose index; needs typed pagination keys.
- `backend/laravel/tests/Feature/BusinessListTest.php:34-63` — pagination contract; `BusinessCategoryFilterTest.php:15-52` — filter contract.
- `frontend/next/e2e/auth-flow.spec.ts:25-30` — default list view regression guard.
- Laravel Boost rules apply (artisan `make:test`, Pint `--dirty`, `search-docs` for version-sensitive APIs). Next.js rule: `dist/docs/` caching guide already covers the preserved `connection()` pattern (D7-01); no new pattern introduced.

## Learning objectives

- UI controls as query parameters: each control (`search`, `category_id`, `page`) maps to one backend capability; the URL is the shared state (shareable, back-button-safe).
- Just-in-time: Eloquent `when()` for optional filters; `paginate()` reads `?page=` automatically; ILIKE vs LIKE on PostgreSQL (LIKE is case-sensitive, ILIKE is not); URL-driven client islands keep the server fetch the single source of truth.

## Ordered implementation steps

1. Backend test first: `php artisan make:test --phpunit BusinessSearchTest` (RefreshDatabase + CategorySeeder precedent): seeded rows `Alpha Hotel` / `Beta Tours` → `?search=alpha` returns 1 row case-insensitively (`?search=ALPHA` same), `?search=zzz-no-match` returns `meta.total 0` + empty `data`, `?search=`+`category_id=` narrows to the intersection.
   Rationale: pins the new contract before the route change (repo microtask habit).
2. Backend route: extend the list closure with `->when($request->query('search'), fn ($query, $s) => $query->where('name', 'ilike', '%'.$s.'%'))` before `paginate()`; existing lines untouched.
   Rationale: reuses the D3-19 `when()` shape; bound parameter (no injection); `ilike` because the test DB is PostgreSQL (D2-29) and search UX must be case-insensitive. Accepted limitation: literal `%`/`_` in input act as wildcards (documented, not escaped — keeps the increment small).
3. Frontend type: extend `ApiListResponse['meta']` with `current_page: number; last_page: number; per_page: number` (all already served per `BusinessListTest`).
   Rationale: typed pagination UI without `unknown` casts.
4. Frontend `SearchInput.tsx`: `"use client"` form island (label `Search businesses`, textbox defaulted from `currentSearch` prop, submit → `router.push` preserving `category_id` and resetting `page`; `Clear` link back to filter-only URL). Styling mirrors `CategoryFilter` (label + bordered input, dark-mode classes).
   Rationale: same URL-driven pattern as the filter — shareable searches, no debounce state bugs, server fetch stays authoritative.
5. Frontend `page.tsx`: await all three params; build `listPath` appending present `category_id`/`search`/`page`; render `<SearchInput>` beside `<CategoryFilter>`; add `<nav aria-label="Pagination">` with Prev/Next `Link`s preserving params (`page-1`/`page+1`, disabled via `aria-disabled` + non-link span on bounds) plus `Page {current} of {last}`; keep count line, `BusinessList`, `connection()`/`instant=false`.
   Rationale: every control changes the server query, so every control changes the data (the spec's test); default view (no params) renders byte-identical to today.

## Tests and verification commands, plus expected results

- `php artisan test --compact tests/Feature/BusinessSearchTest.php` → new file green (4 tests).
- Full suite `php artisan test --compact` → 63/63 + new = all green (D6-27 baseline 63/63).
- `vendor/bin/pint --dirty --format agent` → clean; `php -l` on touched PHP files → clean.
- `npx tsc --noEmit` (frontend/next) → exit 0; `npm run lint` → exit 0; `npm test` → 9/9 existing green + new `SearchInput.test.tsx` green (label association, rendered current value, Clear-link href preserving `category_id` — no `next/navigation` mock needed since `next/link` is already stubbed to an anchor in `vitest.setup.tsx`; submit-navigation itself is covered by the browser proof).
- `npm run build` → exit 0, `/businesses` stays partial/dynamic (no backend at build).
- `git diff --check` clean; `git status` shows only the intended app paths (+ plan file); D7-01 files untouched.
- Browser proof (`serve :8000` + `dev :3101`, seeded PG): typing a name + submit narrows the list; category select combines; Next/Previous walk pages with `Page X of Y` updating; unknown search shows `No businesses found.`; default `/businesses` unchanged (E2E still 1/1).

## Risks, dependencies, and unresolved questions

- Risk: `ilike` is PostgreSQL-specific — safe here because the suite runs on `pgsql`/`caribeops_testing` (D2-29); no SQLite fallback needed.
- Edge: `?page=abc` / out-of-range pages — Laravel coerces to page 1 / returns empty `data` with valid `meta`; UI shows `EmptyState` + `Page X of Y` from meta, no crash. Invalid `category_id` already returns empty (pinned test).
- Dependency: none new; rate limiter `reads` 60/min/IP comfortably covers manual control-clicking.
- Unresolved: none — search scope (name-only) and pagination style (Prev/Next) answered by the user before planning.

## Plan check

- Verified against repo: list closure shape (`when` + `paginate`, `api.php:63-72`), pagination contract (`BusinessListTest:34-63`), filter contract (`BusinessCategoryFilterTest:15-52`), URL-island pattern (`CategoryFilter:1-49`), `EmptyState` zero-rows path (`BusinessList:16-23`), E2E default-view guard (`auth-flow.spec:25-30`), and `vitest.setup.tsx` (`next/link` stubbed, `next/navigation` not mocked).
- Findings: (1) search scope + pagination style were genuine user-preference decisions — asked and resolved before planning (name-only, Prev/Next); (2) `ilike` accepted as PG-only since the suite runs on `pgsql` (D2-29); (3) component-test bullet was vague and a submit-navigation test would need a new `useRouter` mock — narrowed to router-mock-free assertions (label/value/Clear-href) with submit covered by browser proof; (4) `%`/`_` wildcard edge recorded as accepted limitation; (5) `?page=abc`/out-of-range behavior confirmed safe via paginator coercion + `EmptyState`.
- Changes made in this check: status → `Checked — awaiting user approval`; verification bullet now names `SearchInput.test.tsx` explicitly. No scope change; D7-01 files untouched; no app code edited.

## Reminder

Implementation is not authorized until the user checks the plan and invokes `/implement "docs/plans/d7-02-improve-business-list-ux.md"` with this plan path.

## Implementation outcome

- Backend: `GET /api/businesses` accepts `?search=` (`ilike` on `name`, combined with `category_id`, before `paginate()`; one line added, existing lines untouched) + new `BusinessSearchTest` (match / case-insensitive / no-match-empty / search+category intersection — 4/4 green, 15 assertions).
- Frontend: `ApiListResponse` meta typed (`current_page`/`last_page`/`per_page`); new `SearchInput` URL-driven island (submit preserves `category_id` and resets `page`; `Clear search` link); `businesses/page.tsx` reads `search`+`category_id`+`page`, single list URL preserving all three, Prev/Next nav with `Page X of Y` (clean `/businesses` for page 1, disabled spans on bounds); default view byte-identical.
- Verification: `php -l` clean ×2; Pint passed; narrow new test 4/4; full Laravel suite **67/67 green, 521 assertions** (63 baseline + 4 new); `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm test` **5 files 12/12** (9 existing + 3 new `SearchInput`); `npm run build` exit 0 (`/businesses` stays ◐ partial, no backend at build); `git diff --check` clean; browser proof on `dev :3101` + rebuilt compose `laravel` (`serve :8000` equivalent): default `Showing 15 of 40` + `Page 1 of 3`; search submit → `?search=Kerluke` → `1 of 1` Kerluke-Towne + Clear link; `?page=2` → new rows + `Page 2 of 3` (Prev → clean URL, Next → `?page=3`); `?search=zzz-no-match` → `0 of 0` + `No businesses found.` + `Page 1 of 1`.
- Notes: (1) first browser pass showed unfiltered search because compose `laravel` serves the baked image — fixed via `docker compose build laravel && up -d` (D5-11 precedent), then API + UI both filter; (2) `SearchInput.test.tsx` needs a 5-line in-file `useRouter` push-stub (component calls it unconditionally) — shared `vitest.setup.tsx` untouched, submit path covered by browser proof; (3) `test:e2e` not re-run (needs `E2E_*` env creds, not in repo) — default-view snapshot confirms its selectors intact. No commit made.
