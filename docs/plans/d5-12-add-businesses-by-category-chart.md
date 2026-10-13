# D5-12 — Add Businesses-by-Category Chart

**Task:** D5-12 — Add Businesses-by-Category Chart
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-11
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `/analytics` shows a per-category bar chart whose values
equal Go's endpoint row-for-row.

**Scope:** `CategoryCount` type + presentational `CategoryChart` (CSS bars) +
page wiring (fetch in page, replace placeholder). D5-13/14 sections untouched
(later tasks append their own).

**Non-goals:** No chart library (dependency rule), no client interactivity
(static bars, KpiCard-grade presentational), no loading/error states beyond the
existing boundary (D5-15/16), no Go/compose changes, no commit.

## Analysis carried forward

Placeholder page with stale Day-4 note; Go array shape `{slug,name,businesses}`
= `16/16/8`; D5-11 fetch path ready; no chart deps allowed; `git` clean at
`d536f1b`.

## Current-state evidence

- `src/app/analytics/page.tsx:1-15`, `src/components/` (8 files, no chart)
- `repository.go:8-13` (shape + tags), `src/lib/analytics-client.ts`,
  `src/lib/analytics-config.ts`
- `package.json` deps (no chart lib);
  `docs/day-5-integration-performance.md:218-228`

## Learning objectives and just-in-time concepts

Consumer-not-source visualization; max-relative scaling (`width =
businesses/max*100%`, leader always full-width); placeholder retirement honesty.

## Ordered implementation steps

1. Extend `src/types/analytics.ts` with `CategoryCount { slug: string; name:
   string; businesses: number }` (document: Go row shape, rendered in returned
   order).
2. New `src/components/CategoryChart.tsx`: presentational only — props `{ rows:
   CategoryCount[] }`; one labeled bar per row (`name` + count), width `%` of
   the max, zero-guard (`max || 1` so an empty set renders 0-width, never
   `NaN`). Rationale: KpiCard-grade pixels-only component, no deps, no
   interactivity.
3. Rewrite `analytics/page.tsx` body: server component fetches
   `analyticsGet<CategoryCount[]>("/analytics/businesses-by-category")`, renders
   section heading + `<CategoryChart rows={…}/>`; remove `EmptyState` + stale
   Day-4 note (both false once content exists). Rationale: page owns fetching per
   the established split; placeholder retirement is part of the task.
4. `npx tsc --noEmit` + `npm run lint` → clean.
5. `docker compose config --quiet` → 0; `build next && up -d next` (D5-11
   lesson: no bind mount — rebuild required) → `:3000/analytics` shows
   `Restaurants 16 / Tours 16 / Hotels 8` with full/half bar proportions,
   cross-checked against `:8080/analytics/businesses-by-category` JSON.
6. `git diff --check` clean; `git status --short` → type extension + new
   component + page rewrite (+ new plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean. Browser values equal Go rows in order and count (the
  task's test); bar widths proportional (16s full, 8 half).
- `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Go down → boundary (D5-15/16 refine). Empty array → guarded 0-width bars.

## Plan check

- **Revision:** added the explicit `max || 1` zero-guard — an empty set must
  render 0-width bars, never `NaN%`.
- Challenged EmptyState retention: rejected — "No analytics available" is false
  once the chart exists; placeholder + stale note both go.
- Challenged chart-library adoption: rejected — dependency rule + a 3-bar static
  chart needs none; CSS widths suffice.
- Challenged page placement: `/analytics` is the reserved home (placeholder says
  so); D5-13/14 append later sections.
- Verified: Go keys/tags, endpoint path, component dir (no name clash), scripts,
  slug free, `git` clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `src/types/analytics.ts` extended (`CategoryCount`) + new
`src/components/CategoryChart.tsx` + `src/app/analytics/page.tsx` rewritten
(fetch + section, placeholder retired); plan file materialized at this path
verbatim from the checked inline deliverable — no scope change. No Go/compose
changes.

**Verification (exact commands/results — the task's test):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `build next` (npm-ci cached) +
  `up -d next` → `Started` (rebuild required — no bind mount, D5-11 lesson).
- Go JSON: `restaurants 16 / tours 16 / hotels 8`. Browser `:3000/analytics`:
  same three rows in order with counts, bar widths `100% / 100% / 50%`;
  placeholder text absent. Chart values match Go row-for-row.
- `git diff --check` → clean (LF/CRLF advisory only); `git status --short` →
  exactly the 3 intended paths (+ new plan file).
