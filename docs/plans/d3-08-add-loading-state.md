# Plan — D3-08: Add Loading State

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-08 — Add Loading State
- **Plan path:** `docs/plans/d3-08-add-loading-state.md`

## Desired outcome

Navigating to `/businesses` shows a loading indicator (matching page styles)
while the Laravel fetch resolves, instead of a blank page. No behavior change
once data arrives.

## Scope

### In scope

1. New static `src/app/businesses/loading.tsx`: route-segment fallback with a
   `Loading businesses…` label plus skeleton rows mirroring the list layout
   (same `max-w-5xl` container, zinc tones, dark-mode classes).
2. Verification with a throttled or dev-delayed fetch, then proof the fallback
   is gone from the final diff.

### Non-goals

- No `<Suspense>` refactor of `page.tsx` (header/count streaming stays as-is);
  no error UX/`error.js` (D3-09); no skeletons for other routes; no artificial
  delay left in shipped code; no Laravel, type, or client changes; no
  dependencies.

## Analysis carried forward

D3-08 (`docs/day-3-nextjs.md:170-184`) needs an explicit loading state with a
throttle/delay proof. Evidence: page blocks on `await connection()` + `apiGet`
with zero fallback (its own comment defers streaming to D3-08); no
`loading.*`/`error.*` exists; `cacheComponents: true` enables the `loading.tsx`
convention; root layout is static so the segment fallback covers the page;
tree clean, slug free. No open material question; Suspense-granular alternative
kept as review-overridable.

## Current-state evidence and relevant files

- New: `src/app/businesses/loading.tsx` — sole UI addition.
- Untouched: `src/app/businesses/page.tsx:15-30` (fetch host),
  `src/components/BusinessList.tsx`, `src/app/layout.tsx:21-32` (static),
  `frontend/next/next.config.ts:5-6` (`cacheComponents`).
- References: `docs/day-3-nextjs.md:170-184`; version-pinned
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading*`
  + `01-getting-started/06-fetching-data.md` streaming section (implement must
  read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- `loading.tsx`: file-convention `<Suspense>` boundary for the segment — the
  fallback prerenders into the static shell while the page's uncached fetch
  streams at request time. No `useEffect`/state bookkeeping.
- Meaningful fallbacks: skeleton rows in the page's own layout signal progress
  instead of a blank screen or a bare spinner.

## Ordered implementation steps

1. Confirm clean tree; re-read page, layout, next config (read-only).
2. Read the version-pinned `loading` file-convention + fetching-data streaming
   guides before writing.
3. Create `src/app/businesses/loading.tsx`: default-exported sync component, no
   fetch/`connection()`; container + heading-width skeleton + 3–5 pulsing rows
   (`animate-pulse`, zinc palette, dark variants) + screen-reader text.
4. Proof: add a temporary `await new Promise(r => setTimeout(r, 1500))` in the
   page (or throttle via devtools), serve dev/prod on a non-`:3000` port
   against fresh Laravel `:8001`, curl/capture `/businesses` showing the
   fallback; then remove the delay completely.
5. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`
   (must stay Laravel-independent, `/businesses` `ƒ Dynamic`); repo-root
   `git diff --check` + `git status --short` — expect one new file only.
   Rationale: file convention is the smallest code satisfying the roadmap test
   and leaves D3-09 its natural `error.js` increment; static fallback keeps
   Cache Components validation green.

## Tests and verification commands

```powershell
# from frontend/next (+ repo root for git)
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the throttle/delay visual proof (fallback HTML contains the loading label
while delayed; absent-delay render unchanged from D3-07). Expected: all checks
clean; diff = 1 new file. No checks run in planning. If Laravel/PG is down,
build + proof are reported blocked, not faked.

## Risks, dependencies, unresolved questions

- Fallback must not touch runtime APIs — else build/dev validation errors.
- Temp delay must not survive into the final diff (verify via `git diff`).
- Stale Docker `:8000` — use fresh local serve until Day-5 rebuild.
- No open questions.

## Plan check

- Verified paths (no loading/error files, static layout, cacheComponents on,
  clean tree, free slug) by reads/globs; no code edited.
- Challenged `<Suspense>`-in-page refactor: rejected for now — larger churn
  for identical roadmap test; one-step change later if you prefer granularity.
- Challenged spinner-only fallback: revised to skeleton rows matching page
  layout per meaningful-loading-states guidance.
- Challenged permanent delay helper: rejected — temp-only, removed pre-verify.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-08-add-loading-state.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation. Note: the plan file did
not exist at `/implement` time (prior Plan-mode session was blocked from writing
`docs/plans/`), so it was first materialized verbatim from the checked inline
deliverable before implementing (same as D3-06/07).

Files:

- `frontend/next/src/app/businesses/loading.tsx` — new: static Server Component
  fallback (same `max-w-5xl` container, heading + count skeletons, 5 pulsing
  rows, `aria-busy` + screen-reader `Loading businesses…` text, dark variants).
  Sole application change; `page.tsx` untouched in the final diff.

Verification (exact commands, all from `frontend/next` unless noted):
`npx tsc --noEmit` clean (exit 0); `npm run lint` clean;
`npm run build` passed (Next 16.4.0; `/businesses` is now
`◐ Partial Prerender` — static HTML shell + dynamic streamed content, vs `ƒ`
before — build needs no Laravel); `git diff --check` clean (LF→CRLF notice on
`page.tsx` only, content identical); `git status --short` shows 1 new component
+ 1 new plan file only. Version-pinned `dist/docs` `loading` reference read
before writing. No Laravel changes, no dependencies.

Live streaming proof: temp 3s delay added to the page + temp `.env.local`
override to a fresh `php artisan serve` on `:8001`, production `next start` on
`:3101` — first streamed TCP chunk (22,793 bytes at ~1.2s) contained
`Loading businesses` and no business content; full delayed render still
resolved. Delay then removed (verified absent via `git diff`), `.env.local`
restored to `:8000`, final clean rebuild; full `/businesses` HTML contained
`Kilback Ltd`, `Hotels`, `Rating:`, `Showing`. Both proof servers stopped;
Postgres verification container (image freshly pulled, data volume intact)
stopped again. Nothing committed.
