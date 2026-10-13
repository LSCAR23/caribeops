# D5-15 — Add Analytics Loading States

**Task:** D5-15 — Add Analytics Loading States
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-14
> precedent recorded in `MEMORY.md`.

**Desired outcome:** Every analytics-dependent surface streams a skeleton while
its Go fetch is pending; disabled Go fails fast and predictably per surface
(baseline documented for D5-16).

**Scope:** Shared skeletons + 4 Suspense islands + 2 shell-first page rewrites +
disabled-Go probe.

**Non-goals:** No per-section error recovery (D5-16 owns graceful degradation — a
dead Go still reaches the boundary after this task, by design); no Laravel-side
islands (Laravel fetch stays page-awaited, timing unchanged); no route
`loading.tsx` additions (Suspense covers initial + navigation streaming); no
Go/compose changes; no commit.

## Analysis carried forward

No Suspense/loading conventions outside `/businesses`; page-level awaits block
shells; D5-11 path + presentational components ready; `git` clean at `707defc`.

## Current-state evidence

- `src/app/analytics/page.tsx` (2 fetches, 2 sections — now 3 fetches/sections
  after D5-14; islands: one per section), `src/app/page.tsx` (hybrid fetch)
- `businesses/loading.tsx` + `error.tsx` (precedent), D3-08 Suspense comment
- `src/lib/analytics-client.ts`, chart/list components;
  `docs/day-5-integration-performance.md:254-276` (D5-15/16 boundary)

## Learning objectives and just-in-time concepts

Streaming shells vs blocked pages; islands per dependency (one slow service
never stalls another's pixels); skeletons as loading contracts; D5-15 (loading)
vs D5-16 (recovery) split.

## Ordered implementation steps

1. New `src/components/LoadingSkeleton.tsx`: `KpiGridSkeleton` (3 shimmer
   cards), `ChartSkeleton` (bar-list shimmer), `RankListSkeleton` (ranked-row
   shimmer) — shared, pixels-only, aria-busy. Rationale: one skeleton module,
   three shapes, no new idioms.
2. New islands (async Server Components, fetch+render, no `connection()` of
   their own — the pages' existing calls already opt trees dynamic):
   `CategorySection`, `MonthlySection`, `TopSection` (each: fetch + heading +
   presentational component), `GoKpiSection` (overview → 3 `KpiCard`s).
   Rationale: each Go dependency resolves — and fails — independently.
3. Rewrite `analytics/page.tsx` (shell + 3 `<Suspense>` islands) and home
   `page.tsx` (shell + Go island; Laravel fetch stays awaited as today).
   Rationale: shell streams first; loaded pixels byte-identical to today.
4. `npx tsc --noEmit` + `npm run lint` → clean.
5. `docker compose config --quiet` → 0; `build next && up -d next` (no bind
   mount) → loaded pages byte-compare equal to pre-change baselines (skeletons
   are transient-only; data path untouched).
6. Disabled-Go probe (the task's test): `docker compose stop analytics` → load
   `/` and `/analytics` → record: fast, predictable, analytics-attributable
   failure per surface (no hang); `docker compose up -d analytics` → `healthy`,
   content returns. Stack left running.
7. `git diff --check` clean; `git status --short` → skeletons + 4 islands + 2
   pages (+ new plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean. Loaded-state byte-equality (no pixel/data regression).
- Disabled-Go: predictable per-surface failure, no hang (honest baseline for
  D5-16).
- Best-effort: observe skeletons via throttled load; if tooling can't catch the
  transient, record as not-observed (never claim unseen UI).

## Risks, dependencies, and unresolved questions

- Skeletons are timing-transient by nature — existence is statically proven,
  display opportunistically observed.
- No behavior change when services are up (byte-compare enforced).

## Plan check

- **Revision:** specified that parent pages keep their existing `connection()`
  calls and islands make none — one proven dynamic opt-out per tree, no
  redundant calls, no semantic drift.
- Challenged route-`loading.tsx` instead of islands: rejected — route-level
  covers navigation shells only; per-dependency streaming is the task's actual
  subject.
- Challenged Laravel-side island on home: rejected as scope creep — task is
  analytics states; Laravel timing stays exactly as today.
- Challenged pre-building D5-16 recovery: rejected — dead-Go still reaches the
  boundary by design; the probe documents the baseline D5-16 improves.
- Verified: file paths (no clashes), island pattern validity (async Server
  Components), scripts, slug free, `git` clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new `src/components/LoadingSkeleton.tsx` (3 shimmer shapes,
aria-busy) + 4 async islands (`CategorySection`, `MonthlySection`,
`TopSection`, `GoKpiSection`; fetch+render, no own `connection()`) + shell-first
rewrites of `src/app/analytics/page.tsx` and `src/app/page.tsx` (Laravel fetch
still page-awaited, timing unchanged); plan file materialized at this path
verbatim from the checked inline deliverable — no scope change except noting the
orchestration predated D5-14's third section (islands cover all three). No
Go/compose changes.

**Verification (exact commands/results):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `build next` (cached) + `up -d
  next` → `Started`.
- Loading state exists on the wire: streamed shell contains the `KpiGridSkeleton`
  fallback (`aria-busy`, shimmer cards) inside the Suspense boundary while the
  island resolves. Display-transient by nature — existence proven in markup
  (transient display itself not claimed as observed).
- Loaded-state values equal baselines: home `40/320/3.0` (Go) + `40` (Laravel);
  `/analytics` all three sections with data (category rows, month tail + `12 of
  244` caption, top-10 sequence).
- Task test (disabled Go): `docker compose stop analytics` → `/` and
  `/analytics` both HTTP 200, fast, no hang; home keeps the Laravel 4th card
  while the Go island shows an attributable `fetch failed` digest; `/analytics`
  shows one digest per island (3×). Predictable per-surface failure + a free
  partial-degradation improvement (pre-change, the whole home page would have
  failed on its page-level await). `up -d analytics` → `healthy`, all content
  returns. Stack left running.
- `git diff --check` → clean (LF/CRLF advisory only); `git status --short` →
  exactly the 7 intended paths (+ new plan file).
