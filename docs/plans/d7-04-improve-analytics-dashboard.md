# D7-04 — Improve Analytics Dashboard

- Task: D7-04 — Improve Analytics Dashboard
- Date: 2026-10-18
- Status: Implemented — verified
- Scope decision: frontend-only; add aggregate KPIs (Total businesses / Total reviews / Average rating) to `/analytics` from existing Go `/analytics/overview` endpoint. Date range (D7-05) is explicitly out of scope.

## Desired outcome

`/analytics` displays all 6 spec items, each sourced from a live backend endpoint:
- Total businesses (Go `/analytics/overview`)
- Total reviews (Go `/analytics/overview`)
- Average rating (Go `/analytics/overview`)
- Reviews by month (Go `/analytics/reviews-by-month`, existing)
- Businesses by category (Go `/analytics/businesses-by-category`, existing)
- Top businesses (Go `/analytics/top-businesses`, existing)

Test per spec: every metric is sourced from a backend endpoint — no hardcoded values.

## Scope

Frontend (Next.js):
- `src/app/analytics/page.tsx`: add a KPI section above the 3 chart sections, reusing `GoKpiSection` with a `KpiGridSkeleton` fallback. Keep `connection()`, `instant=false`, per-section `Suspense`.
- No new components unless justified; reuse `GoKpiSection`, `KpiCard`, `LoadingSkeleton`, `SectionFallback`.
- No type changes needed (`AnalyticsOverview` already exists).

Non-goals:
- No Go/Laravel changes — `/analytics/overview` already exists (D5-10/D5-11) and returns `{businesses, reviews, average_rating}`.
- No new dependencies.
- No date range picker (that's D7-05).
- No changes to dashboard `/`, businesses list, auth, or seed data.

## Analysis carried forward

From D7-03 implementation and repo inspection:
- `/analytics/page.tsx:18-42` renders 3 Suspense islands (CategorySection, MonthlySection, TopSection), `instant=false`, `connection()` build-safe pattern.
- `GoKpiSection.tsx:11-36` fetches `GET /analytics/overview` and renders 3 KpiCards (Total businesses, Total reviews, Average rating) with `SectionFallback` on Go outage; used today only on `/`.
- `AnalyticsOverview` type (`types/analytics.ts:4-7`) matches the Go overview response shape exactly.
- `analyticsGet` (`lib/analytics-client.ts:9-36`) is the Go fetch client used by all 4 islands.
- `KpiGridSkeleton` (`LoadingSkeleton.tsx:16-34`) matches the 3-card KPI grid shape.
- `SectionFallback` (`SectionFallback.tsx:7-17`) handles per-section outage honestly.
- E2E `auth-flow.spec.ts` covers login → `/` → businesses → detail; does NOT touch `/analytics`, so no regression risk there.
- `RequireAuth` in `layout.tsx` protects `/analytics` (anonymous → `/login`), already in place.

## Current-state evidence and relevant files

- `frontend/next/src/app/analytics/page.tsx` — sole edit target; add KPI section above the 3 chart sections.
- `frontend/next/src/components/GoKpiSection.tsx` — reused untouched; provides the 3 aggregate cards from `/analytics/overview`.
- `frontend/next/src/components/{KpiCard,LoadingSkeleton,SectionFallback}.tsx` — reused untouched.
- `frontend/next/src/lib/analytics-client.ts` — read-only ref; `analyticsGet` already used by all islands.
- `frontend/next/src/types/analytics.ts` — `AnalyticsOverview` already matches Go shape; no change.
- `frontend/next/src/app/layout.tsx` — `RequireAuth` already protects `/analytics`; untouched.
- `frontend/next/e2e/auth-flow.spec.ts` — regression guard; does not visit `/analytics`.

## Learning objectives

- Composition: a dashboard page is just islands, each owning its fetch and its fallback. Adding a metric means adding an island, not wiring props through the shell.
- Just-in-time: `AnalyticsOverview` type and `analyticsGet` client already exist from D5-11; no new concepts needed, only reuse.
- Truthful UI: every metric traces to a live endpoint (Day-7 test); the KPI section degrades to `SectionFallback` if Go is down, never shows placeholder/fake data.

## Ordered implementation steps

1. `page.tsx`: import `GoKpiSection` and `KpiGridSkeleton`; add a KPI section above the existing 3 chart sections, wrapped in `<Suspense fallback={<KpiGridSkeleton />}>`, with an `<h2>` heading "Aggregate KPIs".
   Rationale: mirrors the dashboard's use of `GoKpiSection`; keeps the per-section Suspense pattern; a slow Go delays only the KPI cards, never the charts.
2. Keep heading order sensible: KPIs first, then category, monthly, top. Each section keeps its own `aria-labelledby`/heading for accessibility.
3. Verify no type changes needed (`AnalyticsOverview` already matches); confirm `GoKpiSection` needs no props.

## Tests and verification commands, plus expected results

- `npx tsc --noEmit` → exit 0.
- `npm run lint` → exit 0.
- `npm test` → 5 files 12/12 pass (existing component tests unchanged; no new component unless added).
- `npm run build` → exit 0; `/analytics` stays ◐ partial (no backend at build).
- `git diff --check` clean; `git status` shows only `frontend/next/src/app/analytics/page.tsx` (+ plan file); D7-01/D7-02/D7-03 files untouched.
- Browser proof (`dev :3101` + rebuilt compose `laravel`/`analytics`): `/analytics` shows 3 KPI cards at top with live values (40 / 320 / 3.0) matching direct `/analytics/overview` JSON, followed by the 3 chart sections; Go stopped → KPI section shows `SectionFallback` while charts still resolve independently.

## Risks, dependencies, and unresolved questions

- Risk: none new — reusing existing, tested components and endpoint.
- Dependency: none new; Go `analytics` service must be running for live values (already required by existing 3 sections).
- Unresolved: none — scope confirmed frontend-only with existing endpoint.

## Plan check

- Confirmed against repo: `/analytics/page.tsx` renders 3 Suspense islands (`CategorySection`, `MonthlySection`, `TopSection`) with `instant=false`/`connection()`; `GoKpiSection.tsx` fetches `/analytics/overview` and renders the 3 aggregate cards with `SectionFallback`; `AnalyticsOverview` type matches Go shape; `analyticsGet` used by all islands; `KpiGridSkeleton` matches the 3-card grid; `RequireAuth` in `layout.tsx` protects `/analytics`; E2E `auth-flow.spec.ts` does not visit `/analytics`.
- Finding: plan correctly reuses existing components and endpoint — no new deps, no backend changes, no type changes needed.
- Finding: step 1's "(or its equivalent inline)" was tightened to a committed `GoKpiSection` import — implementation will import `GoKpiSection` + `KpiGridSkeleton`.
- Finding: verification commands match project scripts (`tsc`, `lint`, `vitest`, `build`, `git diff --check`); browser proof notes KPI values (40/320/3.0) match the seeded counts observed in prior D7 tasks.
- Changes: status → `Checked — awaiting user approval`; date → `2026-10-18`. No scope change; no app code edited.

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-04-improve-analytics-dashboard.md"` with this plan path.

## Implementation outcome

- Implemented D7-04 frontend-only analytics dashboard improvement: `frontend/next/src/app/analytics/page.tsx` now imports `GoKpiSection` and `KpiGridSkeleton` and adds an `Aggregate KPIs` Suspense section above the 3 existing chart sections, displaying Total businesses / Total reviews / Average rating from the existing Go `/analytics/overview` endpoint. `connection()`, `instant=false`, per-section `Suspense` preserved. No new components, no type changes, no backend changes.
- Verification (exact commands): `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm test` **5 files 12/12**; `npm run build` exit 0 with `/analytics` ◐ partial (no backend at build); `git diff --check` clean; `git status` shows only `frontend/next/src/app/analytics/page.tsx` modified (+ plan file).
- Browser proof (`dev :3101` + live compose stack): `/analytics` shows Aggregate KPIs section at top with live values `Total businesses 40`, `Total reviews 320`, `Average rating 3.0` (matching Go `/analytics/overview` `{"businesses":40,"reviews":320,"average_rating":3.040625}`), followed by Businesses by category (Restaurants 16 / Tours 16 / Hotels 8), Reviews by month (244 months), and Top businesses (ranked list). All 6 spec items now on `/analytics`, each from a live backend endpoint.
- No commit made.
- Note: the D7-04 plan file did not exist at `/implement` time (Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.
