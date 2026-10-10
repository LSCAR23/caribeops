# D3-02 — Create Navigation

- Date: 2026-10-10
- Status: `Implemented — verified`
- Intended path: `docs/plans/d3-02-create-navigation.md`

## Desired outcome, scope, non-goals

Outcome: persistent feature nav with `Dashboard → /`, `Businesses → /businesses`, `Analytics → /analytics`, built with `next/link`, visible on every page, and every link lands on an implemented route.

Scope:

1. One reusable nav component (e.g. `src/app/_components/Navigation.tsx` or `src/components/Navigation.tsx`) rendering the three `<Link>` items.
2. Wire it into `src/app/layout.tsx` in a minimal persistent position (nav above `{children}`), preserving `LayoutProps<"/">`, fonts, metadata, Tailwind classes.
3. Two minimal stub pages (`src/app/businesses/page.tsx`, `src/app/analytics/page.tsx`) with placeholder headings so the test passes; full content stays in D3-06/Day-4.
4. Verify with lint, typecheck/build, and manual click-through of all three links.

Non-goals: D3-01 full sidebar/header/main layout redesign; D3-03 types; D3-04 env config; D3-05 API client; any Laravel/Go/data fetching; auth; active-link highlighting beyond a minimal approach (stretch only); responsive drawer/menu; styling system changes.

## Analysis carried forward

Task D3-02 (`docs/day-3-nextjs.md:47-64`): add feature-based links for `Dashboard`, `Businesses`, `Analytics`. Test: every link navigates to an implemented route. Learning: navigation reflects features, not components.

Repository evidence (verified by file reads, no tests run in planning): `frontend/next/src/app/layout.tsx:1-29` is scaffold-only (Geist fonts, metadata, `RootLayout({ children }: LayoutProps<"/">)`, no `<nav>` or `next/link`); `frontend/next/src/app/page.tsx:1-14` is a static `/` hero; no `app/businesses/`, `app/analytics/`, or `app/dashboard/` directories exist; `frontend/next/package.json` pins `next 16.4.0` / `react 19.3.0` with Tailwind v4; `docs/plans/` holds D2-01–D2-32 and zero `d3-*` plans, so D3-01 layout is also unimplemented; `git status` clean. Next.js version-pinned docs confirm `<Link>` from `next/link` gives prefetch + client-side transitions while `<a>` does not.

Assumptions recorded: Dashboard maps to `/` (the only existing route); D3-02 creates minimal stub pages for `/businesses` and `/analytics` so the task test passes without preempting D3-06/Day-4 content.

## Current-state evidence and relevant files

- `frontend/next/src/app/layout.tsx` — edit host (add nav, keep typing/metadata).
- `frontend/next/src/app/page.tsx` — untouched `/` target for Dashboard.
- New: nav component + `src/app/businesses/page.tsx` + `src/app/analytics/page.tsx`.
- References: `docs/day-3-nextjs.md:47-64`; Next.js `04-linking-and-navigating.md` (`<Link>` prefetch/client-transition behavior); `03-layouts-and-pages.md` (folders define routes, `page.tsx` makes them visitable, root layout requires `<html>`/`<body>`).

## Learning objectives and just-in-time concepts

- File-system routing: creating `app/businesses/page.tsx` creates the `/businesses` URL.
- `<Link>` vs `<a>`: `<Link>` prefetches on viewport entry and swaps content client-side, preserving shared layout state; `<a>` forces a full reload.
- Server Components by default: a link list needs no client JS; adding `usePathname()` for active state would require `'use client'` — deferred as optional stretch to keep this increment small.

## Ordered implementation steps

1. Create nav component with three `next/link` `<Link>` items (`/` Dashboard, `/businesses` Businesses, `/analytics` Analytics), Tailwind styling consistent with `globals.css`/`page.tsx`.
2. Render it persistently in `RootLayout` above `{children}`; preserve `LayoutProps<"/">`, fonts, metadata, body classes.
3. Create stub `businesses/page.tsx` and `analytics/page.tsx` with plain headings (e.g. "Businesses", "Analytics") and one-line placeholder text marking them as D3-06/Day-4 targets.
4. Run `eslint`, TypeScript check/build, fix issues, then click through Dashboard/Businesses/Analytics confirming each renders its route with layout persistent.

Rationale: Server-Component `<Link>` list is the smallest construct satisfying the roadmap; stubs are the minimal means to satisfy "every link navigates to an implemented route" without stealing D3-06/Day-4 scope; root-layout placement keeps nav persistent without pretending D3-01 is done.

## Tests and verification commands

- `npm run lint` (from `frontend/next`) — expect clean.
- `npx tsc --noEmit` or `npm run build` — expect success; note `LayoutProps` typing preserved.
- Manual: `npm run dev`, visit `/`, click all three links, confirm URL + content change with nav persistent; browser back/forward works. Expected: no 404, no full-page reload artifacts.
- `git diff --check` clean; `git status` shows only the nav component, `layout.tsx` modification, and two stub pages.

No checks were run in this planning stage; results above are expectations, not claims.

## Risks, dependencies, unresolved questions

- D3-01 missing: nav placement is intentionally minimal; D3-01 may relocate it into a sidebar/header later — accepted churn.
- URL mapping assumption (`/` = Dashboard) is recorded; if the user prefers `/dashboard`, that is a one-line change.
- Stub pages could be mistaken for finished D3-06/Day-4 work; placeholder copy must say so explicitly.
- Next 16 breaking-change risk mitigated by following the version-pinned `dist/docs` guides above.

## Plan check

- Verified proposed paths against the repo: `layout.tsx`/`page.tsx` contents, absence of `businesses`/`analytics` routes, absence of `d3-*` plans, clean `git status` — all confirmed by reads in this session.
- Challenged scope: creating two stub pages is necessary work, not gold-plating — without them the task's own test fails. Kept stubs content-free to avoid D3-06/Day-4 overlap.
- Challenged assumptions: Dashboard=`/` uses the only existing route and matches D3-06's `/businesses` convention; alternative `/dashboard` would require an extra stub with no roadmap basis — rejected as unnecessary work, flagged as the single user-overridable decision.
- Challenged verification: lint + typecheck/build + manual click-through is proportionate; no API/PG interaction exists at this stage, so no backend checks apply.
- Status set to `Checked — awaiting user approval`. No application code edited in this stage.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-02-create-navigation.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-10 as a Server-Component `<Link>` nav plus two stub routes, per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/components/Navigation.tsx` — new `Navigation()` Server Component; brand link `/` + `<nav aria-label="Primary">` with `Dashboard → /`, `Businesses → /businesses`, `Analytics → /analytics` via `next/link`; Tailwind zinc/teal styling matching `page.tsx`.
- `frontend/next/src/app/layout.tsx` — imports `@/components/Navigation` and renders `<Navigation />` above `{children}`; `LayoutProps<"/">`, Geist fonts, metadata, html/body classes preserved.
- `frontend/next/src/app/businesses/page.tsx` — new stub (`Businesses` heading + D3-06 placeholder note).
- `frontend/next/src/app/analytics/page.tsx` — new stub (`Analytics` heading + Day-4 placeholder note).
- `frontend/next/src/app/page.tsx` — untouched.

Verification (exact commands, all from `frontend/next`): `npm run lint` passed (clean, no output); `npx tsc --noEmit` passed (clean, no output); `npm run build` passed (Next 16.4.0 Turbopack, compiled + TypeScript clean, route table `○ /`, `○ /analytics`, `○ /businesses`, `○ /_not-found`); `git diff --check` clean (LF→CRLF notice on `layout.tsx` only, no whitespace errors). Manual dev click-through was not run. No backend/PG interaction; no dependencies added; nothing committed.
