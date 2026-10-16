# D7-01 — Create a Professional Dashboard

- Task: D7-01 — Create a Professional Dashboard
- Date: 2026-10-16
- Status: Implemented — verified
- Scope decision: frontend-only polish on `/`; standard CTAs (View businesses / Add business / View analytics)

## Desired outcome

An unfamiliar visitor (authed, per RequireAuth) can state: CaribeOps manages Caribbean tourism businesses + reviews, shows live KPIs/analytics, and lets you browse, add, and analyze.

## Scope

- Edit only `frontend/next/src/app/page.tsx`: add lede sentence, CTA row (3 `next/link`), snapshot section label + data-available list linking to `/businesses` and `/analytics`.
- Reuse existing fetches; no prop/API/type changes.

## Non-goals

- No Laravel/Go changes, no new endpoints/metrics, no new deps/components.
- No changes to Navigation, RequireAuth, login, `/businesses`, `/analytics`, search/filter/pagination (D7-02), detail (D7-03), analytics charts (D7-04).
- No auth-aware CTA branching; no visual design system.

## Analysis carried forward

Homepage is KPI-only hero with no lede/actions (`page.tsx:14-41`). Aggregates already exact via Laravel summary + Go overview. E2E pins H1 text; Suspense/fallback + connection/instant pattern must stay; tree is clean.

## Current-state evidence and relevant files

- `frontend/next/src/app/page.tsx` — sole edit target; keep H1, `await connection()`, `export const instant=false`, `Suspense fallback={<KpiGridSkeleton/>}`, `GoKpiSection` + Laravel card.
- `frontend/next/src/components/{GoKpiSection,KpiCard,LoadingSkeleton,SectionFallback}.tsx` — reused untouched.
- `frontend/next/src/app/layout.tsx`, `Navigation.tsx`, `RequireAuth.tsx` — untouched.
- `backend/laravel/routes/api.php:50-61`, `frontend/next/src/types/dashboard.ts`, `src/lib/{api-client,analytics-client}.ts` — read-only refs.
- `e2e/auth-flow.spec.ts:19-23`, `src/components/__tests__/KpiCard.test.tsx` — regression guards.
- Next.js rule: re-read `node_modules/next/dist/docs/` caching guide before code (pinned pattern already in file comments). Laravel Boost: N/A (no PHP).

## Learning objectives

- Product clarity: headline → lede → proof (KPIs) → actions.
- Just-in-time: Server Component shell streams; Suspense islands resolve independently; links are static so no client JS/auth branching is added.

## Implementation steps

1. `page.tsx` hero: keep eyebrow+H1 verbatim; add 1–2 sentence lede (tourism businesses: hotels/restaurants/tours; manage listings, reviews/ratings, analytics).
   Rationale: answers “what is CaribeOps” with zero data risk.
2. Add CTA `<nav aria-label="Get started">` with `View businesses → /businesses`, `Add business → /businesses/new`, `View analytics → /analytics` (existing Tailwind button/ghost styles, dark-mode classes).
   Rationale: answers “what actions”; static links keep server-component simplicity and RequireAuth flow intact.
3. Label KPI grid: `Live operations snapshot` + caption (totals live; `New (7 days)` window; average `—` when null) + 3-bullet data-available list (Businesses & categories → /businesses; Reviews & ratings; Trends & rankings → /analytics).
   Rationale: answers “what data”; no new fetch, just context.
4. A11y/layout: semantic `section`+headings, `max-w-5xl px-6`, `grid-cols-2 md:grid-cols-4` preserved, contrast-safe zinc/teal classes.

## Tests and verification

- `npx tsc --noEmit` → exit 0.
- Scoped/full `npm run lint` → exit 0.
- `npm test` (vitest) → 4 files 9/9 pass (KpiCard untouched).
- `npm run build` → pass without backends (proves `connection()`/`instant=false` intact; `/` stays dynamic).
- `git diff --check` clean; `git status --short` shows only `frontend/next/src/app/page.tsx`.
- Browser proof (chrome-devtools, `serve :8000` + `dev :3101`): H1 visible, lede + 3 CTAs navigate to correct routes, 4 KPI values match direct `/api/dashboard/summary` + Go overview; mobile + dark check.
- Unfamiliar-user test from spec: ask what app does; expect businesses/reviews/analytics + 3 actions.

## Risks, dependencies, and unresolved questions

- Risks: wording bloat (keep lede ≤2 sentences); CTA style drift (reuse Businesses page button classes); e2e heading change (forbidden); anonymous view redirects via RequireAuth — unfamiliar test done authed.
- Dependencies: none new.
- Unresolved: none blocking (copy finalized at implement; tech-stack line omitted to keep product focus).

## Plan check

- Checked H1 pin, file path, fetch reuse, and verification commands against repo. Findings: (1) no backend needed — kept frontend-only; (2) auth-aware CTAs rejected — static links preserve server-component simplicity; (3) new components/deps rejected — single-file edit; (4) e2e/vitest guards added to verification; (5) Next.js docs re-read noted for build stage. Status set to Checked — awaiting user approval.

## Approval reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-01-create-professional-dashboard.md"`. The file will be materialized verbatim at that time (Plan-mode restriction).

## Implementation outcome

- Implemented frontend-only dashboard polish in `frontend/next/src/app/page.tsx` (+`Link` import; lede; `Get started` nav with `/businesses`, `/businesses/new`, `/analytics`; `Live operations snapshot` section preserving the 4-card grid/Suspense; `What data is available` list). H1 text, `await connection()`, `export const instant = false`, and both data fetches unchanged. No backend, dep, or auth-flow changes.
- Verification: `npx tsc --noEmit` exit 0; `npx eslint src/app/page.tsx` exit 0; `npm run lint` exit 0; `npm test` 4 files 9/9 pass; `npm run build` exit 0 with `/` ƒ Dynamic (Next 16.4.0, no backends at build); `git diff --check` clean (LF notice only); `git status` shows only `frontend/next/src/app/page.tsx` modified (+ new plan file). Static grep confirms H1, 3 CTA hrefs, snapshot/data headings, and preserved patterns.
- Not run: live browser proof against seeded stack (`serve :8000` + `dev :3101` KPI cross-check, CTA navigation, mobile/dark) and the spec's unfamiliar-user interview test — deferred to reviewer manual check. No commit made.
- Note: the D7-01 plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing; no scope change.
