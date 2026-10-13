# D5-18 — Run `EXPLAIN`

**Task:** D5-18 — Run `EXPLAIN`
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-17
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `docs/performance.md` holds the candidate query, its fresh
full plan, finding-per-checklist-item, and an evidence verdict that hands off to
D5-19 without pre-empting it.

**Scope:** Fresh `EXPLAIN (ANALYZE, BUFFERS)` + authored analysis doc. D5-17
files used read-only and preserved untouched.

**Non-goals:** No index or query changes (D5-19/21 own those), no before/after
comparison (D5-20), no app/compose changes, no commit.

## Analysis carried forward

Candidate + full plan from D5-17 measurement; `performance.md` absent; checklist
pre-answers; uncommitted D5-17 pair to preserve; `git` otherwise clean.

## Current-state evidence

- `docs/plans/d5-17-identify-a-candidate-slow-query.md` (outcome: medians, plan
  text, handoff notes)
- `postgres.go:150-160` (candidate SQL), table sizes (`40/320`)
- `docs/day-5-integration-performance.md:296-315`; `docs/` tree (no
  `performance.md`)

## Learning objectives and just-in-time concepts

Node-by-node plan reading; estimate-vs-actual diagnostics; amplification ratios;
baselines as artifacts.

## Ordered implementation steps

1. Fresh `EXPLAIN (ANALYZE, BUFFERS)` of the exact UI-default top query (`LIMIT
   10`) as the `analytics` role — one representative run (medians already own
   the statistics; this run owns the artifact). Rationale: guards against data
   drift since D5-17; proves reproducibility.
2. Author `docs/performance.md`: query text + why chosen (D5-17 medians recap) +
   full plan + finding per checklist item (seq scans: which nodes/why
   tolerable-today; sort: top-N heapsort cost/share; row counts: 320/40 cached;
   join: 320-in/10-out amplification on unindexed `business_id`; estimate anomaly
   `70-vs-40`) + verdict: observations + prime suspect **for D5-19 to evaluate**
   (no prescription). Rationale: the task's test is this file; verdict-fencing
   keeps D5-19's "choose" intact.
3. `git diff --check` clean; `git status --short` → only `docs/performance.md`
   (+ new plan file); D5-17 pair untouched (verify byte-identical via `git diff
   --stat` showing no D5-17 paths).
4. Sanity: counts still `40|320`.

## Tests and verification commands, plus expected results

- `performance.md` exists with query + plan + 4 findings + fenced verdict (the
  task's test).
- Fresh plan shape matches D5-17's (no drift); counts intact.
- `git diff --check` clean; D5-17 files unmodified.

## Risks, dependencies, and unresolved questions

- Daemon down → report blocked (doc unwritten, plan still materialized).
- Doc-wording tunable at approval.

## Plan check

- **Revision:** verdict explicitly fenced to observation + handoff — D5-18 must
  not prescribe D5-19's index choice ("Choose an index" is D5-19's task verb,
  not ours).
- Challenged copy-vs-fresh plan: fresh wins (drift guard + reproducibility
  proof) for one query's cost.
- Challenged all-six-plans in the doc: rejected — spec says the relevant
  (singular) plan; medians recap covers context.
- Challenged docs-rule conflict: resolved — the task spec is the explicit
  creation request; `docs/plans/` precedent supports docs-tree writes.
- Verified: spec lines, absence of `performance.md`, D5-17 evidence paths, slug
  free, preservation constraint, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit by this stage; note:
the user committed the D5-17 pair plus this plan file mid-turn as `7839377`
before the outcome below was recorded — the outcome edit since is the only
pending modification to this file).

**Files changed:** new `docs/performance.md` (candidate query + fresh plan +
4 findings + fenced verdict). No app/compose/config changes.

**Verification (exact commands/results — the task's test):**
- Fresh `EXPLAIN (ANALYZE, BUFFERS)` as the `analytics` role: shape
  node-for-node identical to D5-17 (Limit → top-N heapsort 26kB →
  HashAggregate 40 groups → Hash Join 320 rows → Seq Scans; all `shared hit`;
  rows=70-vs-40 anomaly persists; Execution 0.338 ms single-run, consistent
  with the 0.251 ms median — no drift).
- `docs/performance.md` exists with the query text, D5-17 medians recap, full
  plan, one finding per checklist item (seq scans / sort / row counts / 32:1
  join amplification / stats anomaly), and a verdict fenced to observation +
  D5-19 handoff (no index prescribed).
- Sanity counts still `40|320` (read-only by construction).
- `git diff --check` clean; `git status --short` → only `docs/performance.md`
  untracked (+ this plan file's outcome edit); D5-17 pair verified preserved
  (committed as `7839377`, unmodified since).
