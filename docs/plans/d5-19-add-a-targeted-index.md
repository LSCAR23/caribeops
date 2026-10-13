# D5-19 — Add a Targeted Index

**Task:** D5-19 — Add a Targeted Index
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-18
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `reviews_business_id_index` exists live; the top query
re-planned with the delta (or reasoned no-change) recorded.

**Scope:** One live `CREATE INDEX` + before/after plan comparison. No migration
(D5-21), no query changes, no app/compose changes.

**Non-goals:** No covering `INCLUDE` refinement (no observable benefit at this
scale), no `ANALYZE`/stats work (separate concern), no other indexes (one
pattern, one index — the task's lesson), no commit.

## Analysis carried forward

Only pkeys exist; join key confirmed unindexed; GROUP key PK-covered; ORDER
expressions unindexable; `git` clean at `9868ef7`.

## Current-state evidence

- `pg_indexes` transcript (2 rows), D5-18 plan + verdict, `postgres.go:154-160`
- `docs/day-5-integration-performance.md:319-331`

## Learning objectives and just-in-time concepts

Pattern-driven choice (join key because the workload joins on it); when the
planner rightly ignores your index (small cached tables); naming for migration
convergence.

## Ordered implementation steps

1. Pre-check: confirm index absent (`pg_indexes` re-read — two-minute guard
   against a changed DB).
2. `CREATE INDEX reviews_business_id_index ON reviews (business_id);` as
   `caribeops` (owner path; the `analytics` role cannot DDL — boundary
   observed, not worked around). Plain btree: covering `INCLUDE (rating)`
   rejected (index-only scans need visibility-map scale to matter; extra width
   for zero signal). Laravel-conventional name chosen so D5-21's migration
   converges on one index (see constraint below). Rationale: the join pattern,
   nothing else.
3. Fresh `EXPLAIN (ANALYZE, BUFFERS)` of the identical top query → record new
   plan + timings; compare node-for-node with D5-18.
4. Record the delta honestly in the outcome: changed plan (which nodes moved and
   why) **or** reasoned no-change (hash join still optimal at 320 cached rows;
   benefit accrues with scale — the design, not the milliseconds, is the
   deliverable).
5. Regression: top endpoint 200 with identical values; counts `40|320`. `git
   diff --check` + status → clean except the new plan file (index lives in the
   DB, not the repo).
6. Handoff constraint recorded (outcome + MEMORY): the live index persists;
   **D5-21's migration must tolerate the pre-existing index** (e.g. `IF NOT
   EXISTS` / existence guard) and must use the same name — no second index on
   the column.

## Tests and verification commands, plus expected results

- Index present in `pg_indexes`; re-planned query on record; delta-or-reasoned-
  no-change recorded (the task's test).
- Endpoint values identical; counts intact; tree clean apart from plan file.

## Risks, dependencies, and unresolved questions

- Wrong-index risk is nil (single join pattern, single candidate); over-indexing
  risk handled by the one-index rule.
- Daemon down → report blocked.

## Plan check

- **Revision 1:** index name set to Laravel-conventional
  `reviews_business_id_index` (not `*_idx`) so D5-21 converges instead of
  duplicating — naming as cross-task coordination.
- **Revision 2:** keep-live + D5-21-tolerance constraint replaces any
  drop-and-recreate churn (no benefit gap, no rebuild cost).
- Challenged covering index: rejected on scale evidence (320 cached rows;
  visibility-map economics don't apply).
- Challenged running DDL as `analytics`: rejected — the denial *is* the
  least-privilege proof; owner path specified.
- Challenged `ANALYZE`-first: excluded as separate scope (stats anomaly stays
  noted, untouched).
- Verified: inventory evidence, SQL text, slug free, `git` clean, read-only-
  except-DDL safety, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** none in the repo — the index lives in the database (plan file
materialized at this path verbatim from the checked inline deliverable — no
scope change).

**What was done (exact commands/results):**
- Pre-check: `reviews_business_id_index` absent (count `0`).
- Boundary proof: same `CREATE INDEX` as `analytics` → `ERROR: must be owner of
  table reviews` (least privilege live); as `caribeops` → `CREATE INDEX`, exit
  0; `pg_indexes` now lists `reviews_business_id_index` + `reviews_pkey`.
- `CREATE INDEX reviews_business_id_index ON reviews (business_id);` — plain
  btree on the join pattern; `INCLUDE (rating)` rejected (no scale for
  index-only economics); Laravel-conventional name for D5-21 convergence.
- Re-plan (identical query, analytics role): node-for-node identical structure
  and costs (Limit → top-N heapsort 26kB → HashAggregate 40 groups → Hash Join
  320 rows → Seq Scans; all `shared hit`); 3-run median ≈ 0.29 ms vs pre-index
  0.25 ms — noise overlap, no signal.
- **Verdict: reasoned no-change.** The planner rightly ignores the new index:
  at 320 cached rows, hashing both seq-scanned sides beats index probing, and
  the top-N heapsort over 40 groups is already optimal in kind. The design
  (join-key index for the join pattern), not the milliseconds, is the
  deliverable — and it pays at scale, where the hash input stops fitting in
  cache. Honest negative result, recorded as such.
- Regression: top endpoint identical (`Bartoletti… 4.375/8` first row);
  counts `40|320`.
- `git diff --check` clean; `git status --short` → only the new plan file.
- Handoff constraint (for D5-21): the live index persists under the name
  `reviews_business_id_index`; D5-21's migration MUST tolerate the pre-existing
  index (e.g. `IF NOT EXISTS` / existence guard) and use the same name — no
  second index on the column.
