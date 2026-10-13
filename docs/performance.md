# CaribeOps query performance notes

Evidence-first SQL optimization for the Go analytics service (Day 5).
Dataset: seeded dev volume — `businesses 40`, `reviews 320`, `categories 3`
(all relations KB-scale, cache-resident; timings are sub-ms throughout, so plan
shape carries more weight than the clock).

## D5-17 — Candidate selection (measured, not guessed)

All six analytics queries timed via `EXPLAIN (ANALYZE, BUFFERS)` as the
`analytics` role (1 warmup + 5 runs, Execution-time medians):

| Query (UI-default variant) | Median Execution |
|---|---|
| TopBusinesses (`LIMIT 10`) | **0.251 ms** ← candidate |
| ReviewsByMonth (unbounded) | 0.221 ms |
| BusinessesByCategory (unbounded) | 0.186 ms |
| ReviewCount | 0.067 ms |
| BusinessCount | 0.066 ms |
| AverageRating | 0.051 ms |

Full ranking table and method: `docs/plans/d5-17-add-go-service-tests.md`
(plan file) — hypothesis (JOIN + GROUP + double-sort + LIMIT does the most
work) confirmed by the medians.

## D5-18 — Execution plan: TopBusinesses

Candidate SQL (exact UI-default variant, `LIMIT 10`):

```sql
SELECT b.id, b.name, AVG(r.rating), COUNT(r.id)
FROM businesses b
INNER JOIN reviews r ON r.business_id = b.id
GROUP BY b.id, b.name
ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC
LIMIT 10;
```

Representative plan (`EXPLAIN (ANALYZE, BUFFERS)`, fresh run — shape identical
to the D5-17 measurement runs, no drift):

```text
Limit  (cost=32.46..32.48 rows=10 width=572) (actual time=0.202..0.204 rows=10 loops=1)
   Buffers: shared hit=23
   ->  Sort  (cost=32.46..32.63 rows=70 width=572) (actual time=0.201..0.203 rows=10 loops=1)
         Sort Key: (avg(r.rating)) DESC, (count(r.id)) DESC, b.id
         Sort Method: top-N heapsort  Memory: 26kB
         Buffers: shared hit=23
         ->  HashAggregate  (cost=30.07..30.95 rows=70 width=572) (actual time=0.131..0.140 rows=40 loops=1)
               Group Key: b.id
               Batches: 1  Memory Usage: 24kB
               Buffers: shared hit=14
               ->  Hash Join  (cost=11.57..27.67 rows=320 width=552) (actual time=0.038..0.096 rows=320 loops=1)
                     Hash Cond: (r.business_id = b.id)
                     Buffers: shared hit=14
                     ->  Seq Scan on reviews r  (cost=0.00..15.20 rows=320 width=36) (actual time=0.005..0.032 rows=320 loops=1)
                           Buffers: shared hit=12
                     ->  Hash  (cost=10.70..10.70 rows=70 width=532) (actual time=0.015..0.015 rows=40 loops=1)
                           Buckets: 1024  Batches: 1  Memory Usage: 11kB
                           Buffers: shared hit=2
                           ->  Seq Scan on businesses b  (cost=0.00..10.70 rows=70 width=532) (actual time=0.003..0.007 rows=40 loops=1)
                                 Buffers: shared hit=2
 Planning:
   Buffers: shared hit=154
 Planning Time: 0.915 ms
 Execution Time: 0.338 ms
```

### Findings (spec checklist)

- **Sequential scans:** two — `reviews` (320 rows) and `businesses` (40 rows).
  Tolerable today only because both relations fit in a handful of cached pages;
  neither scan can seek — there is no index on either side of the join key.
- **Expensive sorts:** one — `top-N heapsort` over the 40 grouped rows (26 kB,
  in-memory). It dominates measured time (~0.20 of ~0.34 ms) but only because
  everything else is tiny; the sort itself is optimal in kind (top-N, not full).
- **Large row counts:** none absolute (320/40, all `shared hit`). Relatively,
  the join emits all 320 review rows to produce 10 output rows.
- **Join row amplification:** 320 rows in, 40 groups, 10 rows out (32:1
  in-to-out). The join condition `r.business_id = b.id` has **no supporting
  index** — the planner hashes both sides from seq scans instead.
- **Estimate anomaly (bonus):** the planner predicts `rows=70` where reality is
  40 (both scans and the aggregate). Estimates this far off on a 40-row table
  smell of stale planner statistics — worth confirming with a stats check
  before indexing (an `ANALYZE` may move the estimates for free).

### Verdict (observation for D5-19, not a prescription)

The cost centers, in order: (1) unindexed join key forcing hash-from-seq-scans
on both sides; (2) per-group AVG + double-key sort (inherent to the ranking
definition — an index cannot remove the grouping work, only feed it faster);
(3) possibly stale statistics skewing row estimates. The join key is the prime
suspect **for D5-19 to evaluate** — choosing the index (which column, which
kind, covering or not) is D5-19's task, not this file's.

## D5-20 — Before/after comparison (same query, same data)

**Query** (exact UI-default text, both sides — `LIMIT 10`, unbounded,
`analytics` role, `EXPLAIN (ANALYZE)` Execution medians):

```sql
SELECT b.id, b.name, AVG(r.rating), COUNT(r.id)
FROM businesses b
INNER JOIN reviews r ON r.business_id = b.id
GROUP BY b.id, b.name
ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC
LIMIT 10;
```

**Before** (D5-17, warmup + 5 runs): **0.251 ms** median
(`0.227 / 0.238 / 0.251 / 0.322 / 0.259`).

**Index** (D5-19, live, kept):

```sql
CREATE INDEX reviews_business_id_index ON reviews (business_id);
```

**After** (this task, warmup + 5 fresh runs, same method): **0.282 ms** median
(`0.276 / 0.284 / 0.298 / 0.282 / 0.274`; warmup `0.329`).

**Observations:**

- Plans are node-identical before and after (Limit → top-N heapsort →
  HashAggregate → Hash Join → Seq Scans; all `shared hit`). The planner keeps
  hashing both cached sides — correctly: at 320 rows, probing a new index
  costs more than scanning two tiny relations.
- The medians (0.251 vs 0.282) sit inside each other's noise bands — single
  runs on either side spanned 0.21–0.48 ms across all sessions. No win, no
  regression; a flat line, honestly reported.
- Dataset-sameness is proven, not assumed: counts re-verified `40|320` at
  D5-17, D5-19, D5-18, and again here, with no reseed between any measurement.
  The "before" numbers are reused from record deliberately — re-measuring them
  would require dropping the landed index to re-prove it.
- The value of this index accrues with scale (hash inputs outgrowing cache),
  not on today's dev volume. The design reasoning transfers; the milliseconds
  don't — which is itself the D5-20 lesson: a claim backed by measurement,
  including a flat one.

**Reproduce** (read-only; needs the seeded volume + landed index):

```bash
docker exec -e PGPASSWORD=<dev-default> caribeops-postgres-1 \
  psql -h localhost -U analytics -d caribeops -tAX -c \
  "EXPLAIN (ANALYZE) SELECT b.id, b.name, AVG(r.rating), COUNT(r.id) \
   FROM businesses b INNER JOIN reviews r ON r.business_id = b.id \
   GROUP BY b.id, b.name \
   ORDER BY AVG(r.rating) DESC, COUNT(r.id) DESC, b.id ASC LIMIT 10;" \
  | grep "Execution Time"
```

Run six times, discard the first (warmup), take the median of the remaining
five — the exact D5-17/D5-20 discipline.
