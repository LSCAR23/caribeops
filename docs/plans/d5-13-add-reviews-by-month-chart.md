# D5-13 — Add Reviews-by-Month Chart

**Task:** D5-13 — Add Reviews-by-Month Chart
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-12
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `/analytics` gains a labeled last-12-months review-volume
chart whose values equal Go's rows exactly.

**Scope:** `MonthlyReviews` type + `MonthlyChart` (horizontal CSS bars, UTC month
labels, count caption) + page section with parallel fetch.

**Non-goals:** No full-series rendering (see decision), no chart lib, no
interactivity, no loading/error states beyond the boundary (D5-15/16), no
Go/compose changes, no commit.

## Analysis carried forward

~270 ASC-ordered month rows (`{month, reviews}`, RFC3339 UTC); D5-11/12 fetch +
section patterns ready; `git` clean at `cb05b49`.

## Current-state evidence

- `src/app/analytics/page.tsx:1-28`, `src/components/CategoryChart.tsx`,
  `src/types/analytics.ts`
- `repository.go:16-21` (shape), D4-12 proof (equality + sum cross-check)
- `docs/day-5-integration-performance.md:230-242`

## Learning objectives and just-in-time concepts

Labeled windowing as honest visualization (subset + caption, never silent
truncation); UTC-anchored bucket labels; sections-append page growth.

## Ordered implementation steps

1. Extend `src/types/analytics.ts` with `MonthlyReviews { month: string;
   reviews: number }` (document: RFC3339 over JSON; Go orders ASC).
2. New `src/components/MonthlyChart.tsx`: props `{ rows: MonthlyReviews[] }`;
   takes `rows.slice(-12)`; `Intl.DateTimeFormat("en-US", { month: "short", year:
   "numeric", timeZone: "UTC" })` labels; max-relative widths with `max || 1`
   guard; caption `"Showing last {shown} of {total} months"`. Rationale: recent
   window = the business-useful default per the task's learning outcome; explicit
   label + caption keep it honest; UTC kills TZ month-flip.
3. `page.tsx`: add the by-month fetch to the existing `Promise.all`, append
   "Reviews by month" section with `<MonthlyChart/>`. Rationale: parallel,
   independent fetches; sections-append growth.
4. `npx tsc --noEmit` + `npm run lint` → clean.
5. `docker compose config --quiet` → 0; `build next && up -d next` (no bind
   mount) → `:3000/analytics` second section matches the JSON tail (labels +
   counts) and caption count matches JSON length.
6. `git diff --check` clean; `git status --short` → type + component + page (+
   new plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean. Displayed 12 labels/counts equal Go's last 12 rows;
  caption total equals JSON length (the task's test, adapted to the labeled
  window).
- `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Go down → boundary (D5-15/16 refine). Sparse months render short/zero bars —
  correct, values match.

## Plan check

- **Revision:** formatter pinned to `timeZone: "UTC"` — without it, host-dev
  timezones west of UTC rename edge-month buckets (e.g. Apr 1 00:00Z → "Mar" in
  UTC-5). Container/host divergence eliminated.
- Challenged full-series vs window: full ~270-bar rendering is honest but useless
  (the learning outcome demands business-useful); labeled recent-12 with count
  caption is standard honest practice — flagged for reviewer override, not
  silent.
- Challenged vertical columns vs horizontal bars: horizontal reuses the D5-12
  visual language with zero new CSS idioms; chronological order preserved
  top-to-bottom oldest→newest.
- Verified: Go keys/order, file paths (no clashes), scripts, slug free, `git`
  clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `src/types/analytics.ts` extended (`MonthlyReviews`) + new
`src/components/MonthlyChart.tsx` + `src/app/analytics/page.tsx` (parallel
fetch + second section); plan file materialized at this path verbatim from the
checked inline deliverable — no scope change. No Go/compose changes.

**Verification (exact commands/results — the task's test):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `build next` (cached) + `up -d
  next` → `Started`.
- Go JSON: 244 rows, tail `2023-10=1 … 2026-04=1` (with `2024-10=3`,
  `2024-12=2`). Browser `:3000/analytics`: all 12 aria pairs identical
  (`Oct 2023: 1` … `Apr 2026: 1`, incl. `Oct 2024: 3`, `Dec 2024: 2`); caption
  `Showing last 12 of 244 months`. Section values match Go rows exactly.
- `git diff --check` → clean (LF/CRLF advisory only); `git status --short` →
  exactly the 3 intended paths (+ new plan file).
