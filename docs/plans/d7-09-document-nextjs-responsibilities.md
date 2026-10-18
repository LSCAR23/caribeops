# D7-09 — Document Next.js Responsibilities

- Task: D7-09 — Document Next.js Responsibilities
- Date: 2026-10-18
- Status: Checked — awaiting user approval

## Desired outcome

Document Next.js's responsibilities so frontend architecture is explicit and clearly separate from backend concerns. Cover:

- UI
- routing
- dashboard
- forms
- API consumption

Test: responsibilities are clearly separate from backend concerns.

## Scope

- Document in `docs/architecture.md` (a dedicated "Next.js" subsection under Responsibilities) — no separate file.
- Content grounded in real files: `frontend/next/src/app/` (App Router pages: `/`, `/login`, `/businesses`, `/businesses/[id]`, `/businesses/new`, `/analytics`), `src/components/` (islands: `GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`, `CategoryFilter`, `SearchInput`, `ReviewList`, `TopBusinesses`, `LoginForm`, `LogoutButton`, `RequireAuth`), `src/lib/api-client.ts` (Laravel Bearer), `src/lib/analytics-client.ts` (Go, kept separate), `connection()`/`instant=false` (build-safe, no backend required at build), per-section `Suspense` + `SectionFallback`.
- Explicitly state: Next.js owns UI, routing, dashboard shells, forms, and API consumption; it never holds business logic or DB access — both backends are called over HTTP.

Non-goals:
- No code changes.
- No endpoint contract (D7-16).
- No backend content (separate tasks).

## Analysis carried forward

From `/analize` of the D7-06→D7-12 block:

- `frontend/next/src/app/page.tsx`: dashboard with KpiGrid + `GoKpiSection` (Go overview) + Laravel `dashboard/summary` card, `Get started` nav, `What data is available` list, `connection()`/`instant=false`.
- `frontend/next/src/app/analytics/page.tsx`: 4 Suspense islands (GoKpiSection, CategorySection, MonthlySection, TopSection), each owning its fetch + fallback, `instant=false`.
- `frontend/next/src/app/businesses/page.tsx`: search + category slug + pagination, URL-driven.
- `frontend/next/src/app/businesses/[id]/page.tsx`: full info block (owner, amenities, description/type/website/phone, rating, reviews), single fetch, `notFound()`.
- `frontend/next/src/app/businesses/new/page.tsx`, `login/page.tsx`, `layout.tsx` (`RequireAuth`).
- `src/lib/api-client.ts`: `apiGet` auto-attaches Bearer token (`auth.ts`), explicit overrides win.
- `src/lib/analytics-client.ts`: `analyticsGet` for Go; kept apart from `api-client` so the service boundary is visible in code.
- `src/components/RequireAuth.tsx`: optimistic gate (tokenless → `/login`, authed `/login` → `/`).

## Current-state evidence and relevant files

- `frontend/next/src/app/page.tsx`, `analytics/page.tsx`, `businesses/page.tsx`, `businesses/[id]/page.tsx`, `businesses/new/page.tsx`, `login/page.tsx`, `layout.tsx`.
- `frontend/next/src/components/GoKpiSection.tsx`, `CategorySection.tsx`, `MonthlySection.tsx`, `TopSection.tsx`, `CategoryFilter.tsx`, `SearchInput.tsx`, `ReviewList.tsx`, `TopBusinesses.tsx`, `LoginForm.tsx`, `LogoutButton.tsx`, `RequireAuth.tsx`, `SectionFallback.tsx`, `LoadingSkeleton.tsx`.
- `frontend/next/src/lib/api-client.ts`, `frontend/next/src/lib/analytics-client.ts`, `frontend/next/src/lib/auth.ts`, `frontend/next/src/lib/analytics-config.ts`.

## Learning objectives

- Frontend architecture is easier to understand when responsibilities are explicit (UI vs backend).
- Keeping the Go client separate from the Laravel client makes the two-backend boundary visible in code, not just docs.

## Ordered implementation steps

1. In `docs/architecture.md`, add a "Next.js — Dashboard & UI" subsection under Responsibilities.
2. List: UI (KpiCard, charts, tables, forms), routing (App Router: `/`, `/login`, `/businesses`, `/businesses/[id]`, `/businesses/new`, `/analytics`), dashboard (KPI grid, snapshot, data-availability list), forms (LoginForm, NewBusinessForm/BusinessForm), API consumption (`api-client` for Laravel with Bearer, `analytics-client` for Go), per-section Suspense + build-safe `instant=false`.
3. Cross-reference actual files; keep concise and interview-ready.
4. Verify markdown well-formed; no app code touched.

## Tests and verification commands, plus expected results

- `docs/architecture.md` contains a Next.js responsibilities subsection covering all five required items (UI, routing, dashboard, forms, API consumption).
- `git diff --check` clean; documentation-only.

## Risks, dependencies, and unresolved questions

- Risk: none — documentation only.
- Dependency: D7-06 creates `docs/architecture.md`.
- Unresolved: none.

## Plan check

- Confirmed Next.js surface: App Router pages (`/`, `/login`, `/businesses`, `/businesses/[id]`, `/businesses/new`, `/analytics`), Suspense islands (`GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`), `api-client.ts` (Laravel Bearer via `auth.ts`) vs `analytics-client.ts` (Go, kept separate to make the service boundary visible in code), `RequireAuth` optimistic gate, `connection()`/`instant=false` build-safe, per-section `SectionFallback`.
- Next.js subsection inside `docs/architecture.md`; no separate file; no code changes.
- No material decisions pending. Status → `Checked — awaiting user approval`; date `2026-10-18`.

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-09-document-nextjs-responsibilities.md"` with this plan path.

## Implementation outcome

- Implemented D7-09 — Document Next.js Responsibilities: the Next.js responsibility subsection ("Next.js — Dashboard & UI") was written into `docs/architecture.md` as part of the D7-06 deliverable (same file, no duplication). It covers UI (KpiCard, charts, tables, forms), routing (App Router: /, /login, /businesses, /businesses/[id], /businesses/new, /analytics), dashboard (KPI grid, Live operations snapshot, What data is available, Get started nav), forms (LoginForm, NewBusinessForm/BusinessForm), API consumption (api-client.ts for Laravel with Bearer via auth.ts; analytics-client.ts for Go, kept separate so the two-backend boundary is visible in code), per-section Suspense + SectionFallback, connection()/instant=false build-safe pattern, and RequireAuth optimistic gate, each cross-referenced to `frontend/next/src/`.
- Verification: `git diff --check` clean; `git status --short` shows `docs/architecture.md` already created by D7-06; no additional files changed for this task. No application code changed; no tests affected.
- No commit made.
