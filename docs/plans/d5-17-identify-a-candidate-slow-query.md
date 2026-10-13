# D5-17 — Identify a Candidate Slow Query

**Task:** D5-17 — Identify a Candidate Slow Query
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-16
> precedent recorded in `MEMORY.md`.

**Desired outcome:** All six analytics queries timed on the seeded dataset; the
slowest named as the D5-18+ candidate with its plan inspected.

**Scope:** Read-only measurement (`EXPLAIN ANALYZE`, medians, plan shapes) as
the `analytics` role; ranked table + candidate recorded in the plan outcome +
MEMORY.

**Non-goals:** No index or query changes (D5-19/21 own those), no
`docs/performance.md` yet (D5-18 owns the artifact), no app/compose changes, no
commit.

## Analysis carried forward

Six exact SQL texts (counts, average, by-category JOIN+GROUP, by-month
date_trunc+GROUP, top JOIN+GROUP+double-sort+LIMIT); no indexes beyond
scaffolding; zero existing measurements; structural hypothesis favors
top-businesses (JOIN+GROUP+double-sort+LIMIT); `git` clean at `a85ffaa`.

## Current-state evidence

- `analytics/go/internal/repository/postgres.go:27-178` (all six statements)
- Table sizes from seed proofs (`40/320`, 3 categories, ~244 month groups)
- D4-12 equality/sum cross-checks (queries correct — we tune, not fix)
- `docs/day-5-integration-performance.md:280-292`

## Learning objectives and just-in-time concepts

Reading `EXPLAIN (ANALYZE, BUFFERS)` (node costs, actual rows/loops, buffer
hits, Planning vs Execution split); warmup discipline; ranking relatively on
small data; measuring what the UI actually runs.

## Ordered implementation steps

1. Context snapshot (one query): table row counts + total relation sizes per
   domain table — anchors the timings.
2. As the `analytics` role (password via `PGPASSWORD`, established pattern):
   `EXPLAIN (ANALYZE, BUFFERS)` each of the six UI-default variants (top `LIMIT
   10`, unbounded month/category, three aggregates) — 1 warmup + 5 timed runs
   each; record Planning/Execution medians + plan node shapes. Rationale: app's-
   eye view under least privilege (also re-proves D5-09 grants); warmup
   separates cache costs; split times separate planner noise.
3. Rank slowest-first; name the candidate **only** from the medians (hypothesis
   bows to data). Inspect its plan for the expensive node (join type, sorts, row
   counts) — the D5-18 handoff.
4. Sanity: row counts returned equal known seed values (measurements didn't
   perturb data — read-only by construction).
5. `git diff --check` + `git status --short` → clean except the new plan file
   (likely zero-change landing).

## Tests and verification commands, plus expected results

- Six timed plans on record with medians; candidate named with its full plan
  text.
- `EXPLAIN ANALYZE` executes SELECTs only — zero writes (counts re-verified
  equal).
- Tree clean apart from the plan file.

## Risks, dependencies, and unresolved questions

- Sub-ms noise dominates absolute numbers — ranking + plan shape carry the
  conclusion, not the clock.
- Daemon down → report blocked.

## Plan check

- **Revision 1:** added the table-size snapshot step — timings without
  data-volume context are meaningless to a later reader.
- **Revision 2:** Planning/Execution split recorded separately — planner noise
  must not masquerade as query cost.
- Challenged measuring filtered variants (`?category=`, bounded months):
  rejected — the task says the queries the app runs; UI uses unbounded/default
  variants.
- Challenged superuser-vs-role measurement: role wins (app reality + grant
  re-proof); zero extra cost via the established `PGPASSWORD` pattern.
- Verified: all six SQL texts read verbatim, size evidence, slug free, `git`
  clean, read-only safety (SELECT-only statements), no secrets in records.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** none — measurement-only landing (plan file materialized at
this path verbatim from the checked inline deliverable — no scope change).

**Context snapshot:** `businesses 40` (64 kB), `reviews 320` (160 kB),
`categories 3` (48 kB). Entire working set is KB-scale and cache-resident —
all timings sub-ms, so ranking + plan shape carry the conclusion, not the
clock.

**Measurements** (`EXPLAIN (ANALYZE, BUFFERS)` as the `analytics` role, 1
warmup + 5 timed runs, Execution-time medians):
- TopBusinesses (`LIMIT 10`): 0.227 / 0.238 / **0.251** / 0.322 / 0.259 → **0.251 ms**
- ReviewsByMonth (unbounded): 0.276 / 0.216 / **0.221** / 0.221 / 0.214 → **0.221 ms**
- BusinessesByCategory (unbounded): 0.186 / 0.185 / **0.186** / 0.235 / 0.181 → **0.186 ms**
- ReviewCount: → **0.067 ms** · BusinessCount: → **0.066 ms** ·
  AverageRating: → **0.051 ms**
- (Planning medians: by-category ~0.89 ms highest — planner overhead, not query
  cost; recorded, not ranked on.)

**Candidate (from medians, not hypothesis): TopBusinesses.** Full plan:
`Limit → top-N heapsort (26kB) → HashAggregate (40 groups) → Hash Join
(reviews ⨝ businesses on unindexed `business_id`) → Seq Scans`. All buffer
hits; join + per-group AVG + double-sort dominate. Handoff note for D5-18:
planner estimates `rows=70` vs actual 40 on `businesses` (stale-stats scent);
join column has no index.

**Sanity:** counts still `40|320` (zero writes — SELECT-only by construction).
`git diff --check` clean; tree clean apart from this plan file. No secrets
recorded.
