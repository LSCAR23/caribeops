# Plan — D3-06: Connect Business List Page

- **Date:** 2026-10-10
- **Status:** `Implemented — verified`
- **Task:** D3-06 — Connect Business List Page
- **Plan path:** `docs/plans/d3-06-connect-business-list.md`

## Desired outcome

`/businesses` is an async Server Component that fetches page 1 of `GET /api/businesses` via `apiGet` and renders the real business names plus a "showing X of Y" count from `meta.total`. First vertical slice: seeded PostgreSQL rows visible in the browser. No component extraction, no loading/error UX, no filters.

## Scope

### In scope

1. New tracked `frontend/next/src/types/api.ts`: generic `ApiListResponse<T>` (`{data: T[], meta: {total: number, ...}}` with loose extra meta) + `ApiItemResponse<T>` (`{data: T}`) for the imminent D3-11 detail call.
2. Rewrite of `src/app/businesses/page.tsx` (stub → async Server Component): `export const dynamic = "force-dynamic"`, fetch `apiGet<ApiListResponse<Business>>("/api/businesses")`, render heading + count + `<ul>` of business names (name + `type · address` secondary line at most).
3. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build` (needs Laravel up — documented), `git diff --check`, plus a live HTML proof (below).

### Non-goals

- No `BusinessList` component extraction or card design (D3-07); no category-name resolution or rating display (D3-07's problem — neither is in the list payload); no `loading.js`/skeletons (D3-08); no error UX/`error.js`/try-catch (D3-09 — failures surface via Next default until then); no pagination controls, no filtering (D3-19); no cache-policy tuning beyond `force-dynamic`; no Laravel changes; no dependencies.

## Analysis carried forward

D3-06 (`docs/day-3-nextjs.md:121-144`) wires `/businesses` to `GET /api/businesses` for the first frontend→backend→database slice. Evidence: stub page with zero data; `apiGet`/`apiBaseUrl`/`Business` ready; list endpoint returns paginated `{data, links, meta}` (15/page, 40 seeded rows per MEMORY); no envelope types; tree clean; slug free. `force-dynamic` (build independence + freshness), minimal name-list render (D3-07 boundary), and Server-Component structure (D3-08/09 shape) carried as check items.

## Current-state evidence and relevant files

- `src/app/businesses/page.tsx:1-12` — rewrite host (stub, static prerender).
- New (tracked): `src/types/api.ts` — envelope types; edited: `page.tsx` — sole UI change.
- `src/lib/api-client.ts:21-48`, `src/lib/api-config.ts:1-6`, `src/types/business.ts:1-14` — reuse sources, no edits.
- `backend/laravel/routes/api.php:14-16` — data source, no edit.
- References: `docs/day-3-nextjs.md:121-144`; Next.js version-pinned `dist/docs` fetching-data + caching guides (implement stage must read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Async Server Components as data fetchers: `await` at the top of the page, HTML streams when ready — no `useEffect`, no loading-state bookkeeping (that's D3-08's lesson, kept separate on purpose).
- Envelopes vs resources: `Business` is one row; the page consumes `ApiListResponse<Business>` — typing the transport shape callers actually receive.
- `force-dynamic`: opts the route out of prerender so builds don't require Laravel and every visit reads live data.

## Ordered implementation steps

1. Confirm clean tree; re-read stub page, `api-client.ts`, `business.ts`, list route (read-only).
2. Read the version-pinned Next.js `dist/docs` fetching-data (and caching, for the `force-dynamic` call) guides before writing.
3. Create `src/types/api.ts` with `ApiListResponse<T>` and `ApiItemResponse<T>` (minimal meta: `total: number` required, rest via index-tolerant optional fields — no invented requirements).
4. Rewrite `businesses/page.tsx`: `export const dynamic = "force-dynamic"`; `const result = await apiGet<ApiListResponse<Business>>("/api/businesses")`; render existing heading styles + count line (`Showing {data.length} of {meta.total} businesses`) + `<ul>` mapping `data` to `<li key={id}>` with name primary and `type · address` secondary. No try/catch, no `'use client'`, no new components.
5. From `frontend/next` (Laravel must be serving `:8000`): `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only D3-06-file issues.
6. Live HTML proof: serve production or dev on a non-`:3000` port (`npx next` directly; user's `:3000` server untouched); fetch `/api/businesses` JSON directly, take a returned name, then curl `/businesses` HTML and assert that name plus the `of 40` count appear; stop server.
7. `git diff --check` + `git status --short` — expect one new + one edited tracked file.

Rationale: Server Component is the smallest code satisfying the roadmap test and leaves D3-08/09 their natural Suspense/`loading.js`/`error.js` increments; `force-dynamic` keeps `npm run build` Laravel-independent and matches D3-16 freshness needs; name-list render proves the slice without consuming D3-07's card/component scope; shared envelope types (not page-local) serve D3-11 without speculative extras.

## Tests and verification commands

From `frontend/next` (+ repo root for git):

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the live HTML proof above (API name + `of 40` in rendered HTML). Expected: all checks clean; proof shows real seeded rows; diff = 1 new + 1 edited file. No checks run in planning; these are expectations, not claims. If Laravel/PG is down at implement time, build + live proof are reported as blocked (exact commands shown), not faked; tsc/lint still gate.

## Risks, dependencies, unresolved questions

- `meta.total` assumption (40 rows): proof asserts whatever the API returns, not a hardcoded 40 — reseed-safe.
- Decimal `latitude`/`longitude` and `website: string | null` flow through untouched (display uses name/type/address only).
- Review-overridable: Client-Component structure, dropping `force-dynamic`, richer first render — each is a one-step change but churns D3-07/08/09 boundaries, hence rejected unless you prefer otherwise.

## Plan check

- Verified paths (stub contents, client/config/type sources, list-route envelope, no `api.ts`, clean tree, free slug) by reads; no code edited.
- Challenged page-local vs shared envelope types: shared `src/types/api.ts` accepted — D3-11 needs `ApiItemResponse` imminently; two interfaces, no speculative fields.
- Challenged rendering full cards now: rejected — consumes D3-07's component + category/rating scope; names + count prove the slice.
- Challenged adding try/catch or loading UI "while here": rejected — D3-08/09 own those states; premature handling would have to be redesigned there.
- Challenged `force-dynamic` as D3-16 creep: rejected — without it, `npm run build` requires a live Laravel; it's a build-correctness call, not a feature.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-06 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-06-connect-business-list.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-10 with one documented mechanism deviation (see below); scope unchanged. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/types/api.ts` — new: `ApiListResponse<T>` (`data` + `meta.total`, loose extra meta) + `ApiItemResponse<T>` (`data`) for D3-11. Two interfaces exactly as planned (two speculative aliases added mid-task were removed before verification).
- `frontend/next/src/app/businesses/page.tsx` — stub rewritten to async Server Component: `await connection()` + `export const instant = false` (see deviation), `apiGet<ApiListResponse<Business>>("/api/businesses")`, heading + `Showing X of Y` count + `<ul>` of name + `type · address`. No try/catch, no `'use client'`, no new components.
- `api-client.ts`, `api-config.ts`, `business.ts`, `.env.example`, all Laravel files — untouched. `.env.local` temporarily pointed at `:8001` for the proof, restored to `:8000` after.

Deviation (loud, not silent): the plan's `export const dynamic = "force-dynamic"` does not build under this repo's `nextConfig.cacheComponents` (Next 16.4.0 Turbopack: `Route segment config "dynamic" is not compatible`). Per the version-pinned `dist/docs` caching guides, replaced with `await connection()` (request-time rendering) + `export const instant = false` (documented opt-out letting the route block on the server; Suspense/streaming stays D3-08 scope). Same intent (per-request live data, Laravel-independent builds), version-correct API. Also fixed one self-inflicted duplicated function header mid-task (caught by tsc/lint, no trace in final diff).

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0); `npm run lint` passed (exit 0); `npm run build` passed (Next 16.4.0 Turbopack; `/businesses` is `ƒ Dynamic`, rest static — build needs no Laravel); live HTML proof — fresh local `php artisan serve` on `127.0.0.1:8001` returned 40 businesses (`Kilback Ltd` first); production Next on `127.0.0.1:3101` rendered `/businesses` HTML containing `Kilback Ltd`, its address fragment, and `Showing 15 of 40 businesses` (React SSR comment separators confirmed in raw HTML); both proof servers stopped afterward (ports 3101/8001 confirmed free); final rebuild with restored `:8000` env clean; `git diff --check` clean (exit 0; LF→CRLF notice on `page.tsx` only); `git status --short` shows `M businesses/page.tsx` + untracked plan + `src/types/api.ts` only. Version-pinned `dist/docs` caching guides read before writing. No Laravel writes (4 read-only GETs served), no `migrate:fresh`, no dependencies; nothing committed.

Environment findings (not caused by this task): (1) the Docker Laravel on `:8000` (`/var/www/html`) is stale — has `/api/health` but 404s `/api/businesses`; its image predates the Day-2 routes and needs a Day-5 rebuild (until then, local dev against `:8000` business endpoints fails; the user's `:3000` dev server was never touched). (2) Live JSON confirms the D3-03 caveat: decimal `latitude`/`longitude` serialize as strings (`"-31.8605050"`); display here uses name/type/address only, so no impact — D3-07+/D3-11 should keep it in mind.
