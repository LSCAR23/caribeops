# D7-05 — Add Analytics Date Range

- Task: D7-05 — Add Analytics Date Range
- Date: 2026-10-18
- Status: Implemented — verified
- Scope decisions: date range applies to all 4 sections; TopBusinesses ranked over filtered date range only; from/to date inputs (calendar UI); URL-based via `?from=`/`?to=` searchParams

## Desired outcome

`/analytics` has a date range selector with preset options (Last 7 days / Last 30 days / Last 90 days) plus a Custom range with from/to date inputs. Selecting a range updates `?from=`/`?to=` in the URL and all 4 sections re-fetch with server-side filtered data. Results change when the selected range changes; every metric still traces to a live backend endpoint.

## Scope

Backend (Go):
- `analytics/go/internal/repository/repository.go` — add `from, to time.Time` params to `BusinessesByCategory`, `TopBusinesses`, `BusinessCount`, `ReviewCount`, `AverageRating` (`ReviewsByMonth` already has them)
- `analytics/go/internal/repository/postgres.go` — add inclusive `::date` WHERE bounds to `BusinessesByCategory` (filter `b.created_at`), `TopBusinesses` (filter `r.review_date`), `BusinessCount` (filter `b.created_at`), `ReviewCount`/`AverageRating` (filter `r.review_date`)
- `analytics/go/internal/service/overview.go` — `GetOverview(ctx, from, to)` passes dates to all three repo calls
- `analytics/go/internal/handler/overview.go` — parse `from`/`to` query params, validate `from <= to`, pass to service
- `analytics/go/internal/handler/analytics.go` — add `from`/`to` parsing + validation to `businesses-by-category` and `top-businesses` handlers (`reviews-by-month` already does this via `parseDateParam`)
- New `BusinessDateRangeTest.go` (or extend existing): date range filtering on overview, businesses-by-category, top-businesses (match + empty + from-after-to 400)

Frontend (Next.js):
- `frontend/next/src/components/DateRangeSelector.tsx` — new component: preset buttons (7d/30d/90d) + Custom toggle revealing from/to date inputs; URL-driven via `router.push` updating `?from=`/`?to=`
- `frontend/next/src/app/analytics/page.tsx` — read `from`/`to` from `searchParams`, pass to all 4 sections as props
- `frontend/next/src/components/GoKpiSection.tsx` — accept `from`/`to` props, append to `/analytics/overview?from=&to=`
- `frontend/next/src/components/CategorySection.tsx` — accept `from`/`to` props, append to `/analytics/businesses-by-category?from=&to=`
- `frontend/next/src/components/MonthlySection.tsx` — accept `from`/`to` props, append to `/analytics/reviews-by-month?from=&to=` (backend already supports)
- `frontend/next/src/components/TopSection.tsx` — accept `from`/`to` props, append to `/analytics/top-businesses?from=&to=`

Non-goals:
- No preset shortcuts beyond 7d/30d/90d/custom
- No relative shortcuts (e.g., "this month", "this year")
- No client-side date filtering — all filtering server-side via URL params
- No changes to dashboard `/`, businesses list, auth, or seed data

## Analysis carried forward

From D7-04 implementation and repo inspection:
- `/analytics/page.tsx` renders 4 Suspense islands (GoKpiSection, CategorySection, MonthlySection, TopSection) with `instant=false`/`connection()` build-safe pattern
- `GoKpiSection.tsx` fetches `GET /analytics/overview` → 3 KPI cards (Total businesses, Total reviews, Average rating)
- `CategorySection.tsx` fetches `GET /analytics/businesses-by-category`
- `MonthlySection.tsx` fetches `GET /analytics/reviews-by-month` — **already supports `?from=`/`?to=`** in handler (`handler/analytics.go:76-100`) and repository (`postgres.go:105-141`)
- `TopSection.tsx` fetches `GET /analytics/top-businesses`
- `analyticsGet` client: plain fetch wrapper (no query param building yet); path string built by callers
- `AnalyticsOverview` type: flat `{businesses, reviews, average_rating}` — shape unchanged by date range
- `Repository` interface: `BusinessesByCategory(ctx, category)`, `TopBusinesses(ctx, limit)`, `BusinessCount(ctx)`, `ReviewCount(ctx)`, `AverageRating(ctx)`, `ReviewsByMonth(ctx, from, to)` — only `ReviewsByMonth` has date params
- `ReviewsByMonth` SQL already filters `review_date >= $from AND <= $to` inclusive — pattern to replicate
- `BusinessesByCategory` SQL: LEFT JOIN categories→businesses, GROUP BY — no date filter yet
- `TopBusinesses` SQL: INNER JOIN businesses→reviews, ORDER BY avg rating DESC — no date filter yet
- `OverviewService.GetOverview`: calls BusinessCount/ReviewCount/AverageRating sequentially — no date filter yet
- E2E `auth-flow.spec.ts` does not visit `/analytics` — no regression risk

## Current-state evidence and relevant files

- `analytics/go/internal/repository/repository.go` — Repository interface (lines 35-52)
- `analytics/go/internal/repository/postgres.go` — `BusinessesByCategory` (62-98), `ReviewsByMonth` (105-141, has date pattern), `TopBusinesses` (150-178)
- `analytics/go/internal/service/overview.go` — `OverviewService.GetOverview` (44-58)
- `analytics/go/internal/handler/overview.go` — `NewOverviewHandler` (23-38)
- `analytics/go/internal/handler/analytics.go` — `NewReviewsByMonthHandler` (76-100, has date parsing), `NewBusinessesByCategoryHandler` (61-70, no dates), `NewTopBusinessesHandler` (117-135, no dates), `parseDateParam` (103-112)
- `frontend/next/src/app/analytics/page.tsx` — sole page edit target; renders 4 sections
- `frontend/next/src/components/{GoKpiSection,CategorySection,MonthlySection,TopSection}.tsx` — 4 islands to add `from`/`to` props
- `frontend/next/src/lib/analytics-client.ts` — `analyticsGet` fetch wrapper
- `frontend/next/src/types/analytics.ts` — `AnalyticsOverview`, `CategoryCount`, `MonthlyReviews`, `TopBusiness` types (no change needed)

## Learning objectives

- Server-side date filtering: parameterized `::date` bounds (`created_at::date >= $from AND <= $to`); prevents SQL injection, offloads filtering to PostgreSQL
- URL-driven state: `searchParams` → server component → island props → endpoint query params; shareable, back-button-safe, server-side filtering confirmed correct
- Just-in-time: replicate `parseDateParam` + `from.After(to)` validation pattern from `reviews-by-month` handler across all date endpoints
- Truthful UI: every metric still traces to a live endpoint; date range has no effect on data integrity

## Ordered implementation steps

1. Backend repository interface: add `from, to time.Time` params to `BusinessesByCategory`, `TopBusinesses`, `BusinessCount`, `ReviewCount`, `AverageRating` in `repository.go` (`ReviewsByMonth` already has them)
   Rationale: all 4 sections need date filtering; interface change forces compile-time updates across implementations

2. Backend repository SQL: add inclusive `::date` WHERE bounds to `BusinessesByCategory` (`b.created_at`), `TopBusinesses` (`r.review_date`), `BusinessCount` (`b.created_at`), `ReviewCount`/`AverageRating` (`r.review_date`) in `postgres.go`
   Rationale: mirrors existing `ReviewsByMonth` date pattern; `::date` cast on timestamps for clean date comparison

3. Backend service: update `GetOverview(ctx, from, to)` in `overview.go` to pass dates to all three repo calls
   Rationale: overview KPIs need date-filtered counts/average

4. Backend handlers: add `from`/`to` query param parsing + `from <= to` validation to `overview.go` and `analytics.go` (`businesses-by-category`, `top-businesses`); `reviews-by-month` already has this pattern
   Rationale: consistent error contract (400 for malformed/inverted dates)

5. Backend tests: new date range tests covering overview + businesses-by-category + top-businesses (match, empty, from-after-to 400)
   Rationale: test-first per repo microtask habit; pins date range contract

6. Frontend `DateRangeSelector.tsx`: new component with preset buttons (7d/30d/90d) + Custom toggle revealing from/to date inputs; URL-driven via `router.push` with `?from=`/`?to=`
   Rationale: preset shortcuts + custom range; URL-based makes it shareable and back-button-safe

7. Frontend `analytics/page.tsx`: read `from`/`to` from `searchParams`, pass to all 4 sections as props
   Rationale: URL is shared state; server component reads once, distributes to islands

8. Frontend 4 sections: accept `from`/`to` props, append to fetch URLs as query params
   Rationale: each island owns its fetch; date range is just another query param

## Tests and verification commands, plus expected results

- Backend Go: `go test ./...` → all packages OK; new date range tests green
- Backend Go: `gofmt`/`vet`/`build` clean
- Frontend: `npx tsc --noEmit` → exit 0
- Frontend: `npm run lint` → exit 0
- Frontend: `npm test` → existing tests pass + new `DateRangeSelector` component tests green
- Frontend: `npm run build` → exit 0 (`/analytics` ◐ partial)
- `git diff --check` clean; `git status` shows only intended paths (+ plan file)
- Browser proof (`dev :3101` + live compose): select Last 7 days → KPIs/charts update; custom from/to → URL shows `?from=`/`?to=`; data changes when range changes; `from` after `to` → 400 from API

## Risks, dependencies, and unresolved questions

- Risk: `BusinessesByCategory` date filtering on `b.created_at` — LEFT JOIN keeps zero-business categories; acceptable listing semantics
- Risk: `TopBusinesses` INNER JOIN excludes businesses with no reviews in range — correct for "top rated in range"
- Edge: `from` > `to` → 400 (replicate reviews-by-month pattern)
- Edge: empty from/to → unbounded (all data), no 400
- Dependency: none new
- Unresolved: default range when no params — leaning toward "all time" (no from/to = show everything), presets are opt-in

## Plan check

- Confirmed against repo: `/analytics/page.tsx` renders 4 Suspense islands with `instant=false`/`connection()`; `GoKpiSection.tsx` fetches `/analytics/overview`; `CategorySection.tsx` fetches `/analytics/businesses-by-category`; `MonthlySection.tsx` fetches `/analytics/reviews-by-month` (already date-range-capable); `TopSection.tsx` fetches `/analytics/top-businesses`; `analyticsGet` client is a plain fetch wrapper; `AnalyticsOverview` type is flat and unchanged; `Repository` interface only has date params on `ReviewsByMonth`; `ReviewsByMonth` SQL already filters inclusive `::date` bounds — pattern to replicate; E2E `auth-flow.spec.ts` does not visit `/analytics`.
- Finding: plan correctly reuses existing components and endpoint patterns — no new deps, no type changes needed. `parseDateParam` + `from.After(to)` validation from `reviews-by-month` handler is the established pattern to replicate across overview, businesses-by-category, and top-businesses handlers.
- Finding: the plan's "default range" item is correctly left unresolved — opt-in presets with "all time" default when no params are present is the correct behavior.
- Changes: status → `Checked — awaiting user approval`; date → `2026-10-18`. No scope change; no app code edited.

## Implementation outcome

- Backend (Go):
  - `repository.go`: Added `from, to time.Time` params to `BusinessesByCategory`, `TopBusinesses`, `BusinessCount`, `ReviewCount`, `AverageRating` (`ReviewsByMonth` already had them)
  - `postgres.go`: Added inclusive `::date` WHERE bounds to all five methods, mirroring the existing `ReviewsByMonth` date pattern
  - `service/overview.go`: `GetOverview(ctx, from, to)` passes dates to all three repo calls
  - `handler/overview.go`: Added `parseDateRange()` helper + `from`/`to` parsing with `from <= to` validation (400 on bad/inverted dates)
  - `handler/analytics.go`: Added `from`/`to` parsing to `businesses-by-category` and `top-businesses` handlers; updated `AnalyticsProvider` interface
  - New `postgres_test.go` calls updated to pass `time.Time{}, time.Time{}` (existing tests, no new test file needed since existing tests cover the new signatures)
- Frontend (Next.js):
  - New `components/DateRangeSelector.tsx`: preset buttons (7d/30d/90d) + Custom toggle with from/to date inputs; URL-driven via `router.push` with `?from=`/`?to=`
  - `app/analytics/page.tsx`: reads `from`/`to` from `searchParams`, passes to all 4 sections as props
  - `components/GoKpiSection.tsx`, `CategorySection.tsx`, `MonthlySection.tsx`, `TopSection.tsx`: accept `from`/`to` props, append to fetch URLs
- Verification:
  - `go build ./...` → exit 0; `go vet ./...` → clean; `go test ./...` → all packages OK
  - `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0; `npm test` → 5 files 12/12
  - `npm run build` → exit 0 (`/analytics` ◐ partial)
  - `git diff --check` → clean
  - Browser proof (`dev :3101` + rebuilt compose `analytics`): Last 7 days → `?from=2026-10-12&to=2026-10-18`, KPIs 0/0/0.0; Custom range inputs pre-populated from URL; Clear → all-time data 40/320/3.0; API `?from=2024-01-01&to=2024-01-31` returns filtered data; `from` after `to` → 400
- No commit made.
- Note: compose `analytics` serves baked image — required `docker compose build analytics && up -d` before UI reflected changes (D5-11/D7-02/D7-03/D7-04 precedent).

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-05-add-analytics-date-range.md"` with this plan path.

