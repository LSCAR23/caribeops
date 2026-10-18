# D7-12 — Document SQL Optimization

- Task: D7-12 — Document SQL Optimization
- Date: 2026-10-18
- Status: Checked — awaiting user approval

## Desired outcome

Create/ensure `docs/performance.md` documents the SQL optimization story in the required format:

```
Problem
  ↓
Original query
  ↓
EXPLAIN
  ↓
Index decision
  ↓
New plan
  ↓
Result
```

Test: the optimization can be reproduced from the documented dataset/query.

## Scope

- `docs/performance.md` already exists (D5-20) with the full TopBusinesses before/after story. This task verifies/expands it to explicitly cover the D7-12 format: Problem → Original query → EXPLAIN (before) → Index decision → New plan (after) → Result, plus a reproduction recipe. No separate new file if the existing one satisfies the format; otherwise extend it.
- Content grounded in `docs/performance.md` (verified: D5-17 candidate selection, D5-18 execution plan, D5-20 before/after comparison), migration `2026_10_13_042916_add_reviews_business_id_index.php` (idempotent `CREATE INDEX reviews_business_id_index ON reviews (business_id)`), and `analytics/go/internal/repository/postgres.go` `TopBusinesses` SQL.
- No application code changes; no schema changes (the index already landed in D5-19/D5-21).

Non-goals:
- No new index (already landed).
- No re-measurement claiming a win (D5-20 honestly reports flat line).
- No application code.

## Analysis carried forward

From `/analize` and direct inspection of `docs/performance.md` (153 lines):

**Problem:** TopBusinesses (`LIMIT 10`) was the slowest of the six analytics queries (0.251 ms median vs 0.051–0.221 ms for the others) — the JOIN + GROUP BY + double sort + LIMIT does the most work.

**Original query (exact UI-default variant):**

```sql
SELECT b.id, b.name, AVG(r.rating), COUNT(r.id)
FROM businesses b
INNER JOIN reviews r ON r.business_id = b.id
GROUP BY b.id, b.name
ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC
LIMIT 10;
```

**EXPLAIN (before):** Limit → top-N heapsort → HashAggregate → Hash Join → Seq Scan on reviews (320 rows) + Seq Scan on businesses (40 rows). Execution 0.338 ms (representative run), join key `r.business_id = b.id` unindexed → planner hashes both sides from seq scans; 320 rows in, 10 out (32:1 amplification).

**Index decision (D5-19):** `CREATE INDEX reviews_business_id_index ON reviews (business_id);` — the join key is the prime suspect. Landed as migration `2026_10_13_042916_add_reviews_business_id_index.php` (idempotent IF NOT EXISTS), kept live.

**New plan (after / D5-20):** Node-identical before and after (Limit → top-N heapsort → HashAggregate → Hash Join → Seq Scans; all `shared hit`). At 320 rows / 40 businesses, both relations are cache-resident, so probing the index costs more than scanning; planner correctly keeps hashing.

**Result:** Before 0.251 ms median → After 0.282 ms median (0.276/0.284/0.298/0.282/0.274). Inside each other's noise bands — flat line, honestly reported; no win, no regression. Value accrues with scale (hash inputs outgrowing cache), not on today's dev volume.

**Reproduce:** `docker exec -e PGPASSWORD=... caribeops-postgres-1 psql -h localhost -U analytics -d caribeops -tAX -c "EXPLAIN (ANALYZE) ..." | grep "Execution Time"`, six runs, discard warmup, median of five — seeded volume 40 businesses / 320 reviews / 3 categories, `analytics` role.

## Current-state evidence and relevant files

- `docs/performance.md` — existing before/after story (lines 1-153), to verify against D7-12 format and extend if needed.
- `backend/laravel/database/migrations/2026_10_13_042916_add_reviews_business_id_index.php` — index DDL (idempotent).
- `backend/laravel/database/migrations/2026_10_09_223250_create_reviews_table.php` + `..._add_rating_range_check_to_reviews_table.php` — reviews table + rating constraint.
- `analytics/go/internal/repository/postgres.go` — `TopBusinesses` SQL (lines 206-248), the query being optimized.
- `docs/plans/d5-17-identify-a-candidate-slow-query.md`, `d5-18-run-explain.md`, `d5-19-add-a-targeted-index.md`, `d5-20-compare-before-and-after.md` — underlying Day-5 plans (context only).

## Learning objectives

- The story of optimization matters as much as the index: identify → measure → change → measure again (D7-12 learning).
- Honest reporting includes flat-line results; an index's value is scale-dependent, not always visible on dev volume.

## Ordered implementation steps

1. Re-read `docs/performance.md` and confirm it contains all D7-12 elements (Problem, Original query, EXPLAIN before, Index decision, New plan after, Result, Reproduce).
2. If any element is missing or implicit, extend `docs/performance.md` to make the D7-12 format explicit (add a clearly labeled "D7-12" summary block mapping each element to the existing evidence).
3. Do NOT add a new index or re-measure to claim improvement; preserve the honest flat-line finding.
4. Verify markdown well-formed; `git diff --check` clean.

## Tests and verification commands, plus expected results

- `docs/performance.md` contains: Problem, Original query, EXPLAIN (before), Index decision, New plan (after), Result, Reproduce recipe.
- Reproduction recipe references real, runnable commands against the seeded dev volume (40|320|3).
- `git diff --check` clean; documentation-only.

## Risks, dependencies, and unresolved questions

- Risk: claiming a performance win that doesn't exist — mitigated by D5-20's honest flat-line reporting; this task preserves it.
- Dependency: none (index already landed in D5-19/D5-21).
- Unresolved: none — all evidence verified in `docs/performance.md`.

## Plan check

- Confirmed `docs/performance.md` (153 lines) already holds the D5-17→D5-20 story: Problem (TopBusinesses slowest at 0.251 ms), Original query (exact UI-default `LIMIT 10` text), EXPLAIN before (Limit → top-N heapsort → HashAggregate → Hash Join → 2 Seq Scans, 0.338 ms representative), Index decision (`CREATE INDEX reviews_business_id_index ON reviews (business_id)`, landed via idempotent migration `2026_10_13_042916...`), New plan after (node-identical, all `shared hit`), Result (0.251 → 0.282 ms, flat line honestly reported), Reproduce recipe (6 runs, discard warmup, median of 5, `analytics` role, 40|320|3 seeded volume).
- No new index, no re-measurement claiming a win; preserves honest flat-line finding.
- No application code changes. Status → `Checked — awaiting user approval`; date `2026-10-18`.

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-12-document-sql-optimization.md"` with this plan path.

## Implementation outcome

- Implemented D7-12 — Document SQL Optimization: `docs/performance.md` (existing from D5-20) now carries an explicit D7-12 summary block mapping the required format to the verified evidence: Problem (TopBusinesses `LIMIT 10` slowest at 0.251 ms median; unindexed join key `r.business_id = b.id`), Original query (exact UI-default text), EXPLAIN before (`Limit → top-N heapsort → HashAggregate → Hash Join → 2 Seq Scans`, 0.338 ms representative run), Index decision (`CREATE INDEX reviews_business_id_index ON reviews (business_id)`, landed via idempotent migration `2026_10_13_042916...`, D5-19/D5-21), New plan after (node-identical to before, all `shared hit`; planner correctly keeps hashing at dev volume), Result (0.251 → 0.282 ms median, flat line honestly reported: no win, no regression; index value accrues with scale), and a Reproduce recipe (6 runs, discard warmup, median of 5, `analytics` role, seeded 40|320|3 volume). No new index added, no re-measurement claiming a win — the honest flat-line finding is preserved.
- Verification: `git diff --check` clean; `git status --short` shows only `docs/performance.md` modified by this task; all evidence traced to `docs/performance.md` (D5-17/D5-18/D5-20), the index migration, and `analytics/go/internal/repository/postgres.go` `TopBusinesses` SQL. No application code changed; no tests affected.
- No commit made.
