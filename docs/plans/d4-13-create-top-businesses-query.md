# D4-13 — Create Top Businesses Query

**Task:** D4-13 — Create Top Businesses Query
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-13-create-top-businesses-query.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`Postgres.TopBusinesses(ctx, limit)` returns at most `limit` ranked rows,
completing the 6/6 `Repository` surface (assertion lands). Gate (Day-4):
records appear in the correct order.

## Scope

Append `TopBusinesses` to `postgres.go` (`INNER JOIN reviews`, `GROUP BY b.id,
b.name`, `AVG(rating)` + `COUNT(*)`, `ORDER BY avg DESC, count DESC, b.id
ASC`, `LIMIT $1`; `limit <= 0` short-circuits to empty; wrap `top businesses:
%w`) + add `var _ Repository = (*Postgres)(nil)` + append
`TestPostgresTopBusinesses` (skip-guarded live test at limit 5: element-wise
equality vs independent raw query, explicit order assertions — avg
non-increasing, count non-increasing on avg ties — row count ≤ 5, rows
logged). Nothing else touched.

## Non-goals

- Endpoint wiring (D4-14).
- `?limit=` / `?category=` plumbing (D4-15).
- Combined-score metrics.
- Other methods.
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- Last interface method; contract + join columns grounded.
- Seeded ties near-certain, so the `id` tail matters.
- INNER-vs-LEFT decision.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/postgres.go` (5 methods, no assertion).
- `analytics/go/internal/repository/repository.go` (`TopBusinesses` +
  `TopBusiness`).
- `analytics/go/internal/repository/postgres_test.go` (pattern to mirror).
- `docs/day-4-go-analytics.md` (D4-13 section).
- Businesses / reviews migrations.

## Learning objectives and just-in-time concept explanation

An explicit metric *is* the feature — `ORDER BY` avg DESC, count DESC makes
"top" unambiguous and reviewable; the `id` tail removes the last
nondeterminism. `LIMIT $1` keeps the cap server-side; the `limit <= 0` guard
exists because PG rejects negative LIMIT. The compile assertion converts
future interface drift into a build error — the payoff for deferring it since
D4-06.

## Ordered implementation steps

1. Append the method + the assertion to `postgres.go` as scoped.
2. Append the live test as scoped (equality + order assertions + count cap,
   rows logged).
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → skips); live joint run
   of all six repository tests with host URL → PASS; from root:
   `git diff --check`. Expected: all clean.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (all live tests skip).
- Live joint run of all six repository tests — PASS.
- `git diff --check` — clean.

Element-wise equality plus *independent* order assertions (not just mirroring
the same SQL — avg sequence non-increasing checked directly on the method
output) *are* the "correct order" gate; the cap check covers `LIMIT`.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Zero-review businesses excluded by construction (INNER JOIN).
- Combined-score metrics stay a documented future option.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact contract to implement.
- Locked INNER JOIN over LEFT+COALESCE with NULLS-first rationale; locked `id
  ASC` tail for seeded ties; locked `limit <= 0` → empty.
- Strengthened verification beyond mirroring: independent order assertions on
  the method output itself, so a wrong-but-identical `ORDER BY` in both
  queries would still fail.
- Confirmed the assertion is now safe to land (6/6 methods); service
  narrowing unaffected (`*Postgres` satisfies both interfaces).
- Rejected metric invention beyond the D4-05 default; rejected endpoint/filter
  work.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12. Appended `TopBusinesses` to
`postgres.go` (INNER JOIN + `GROUP BY b.id, b.name`, `ORDER BY avg DESC, count
DESC, b.id ASC`, `LIMIT $1`, `limit <= 0` → empty; wrapped `top businesses:
%w`) plus `var _ Repository = (*Postgres)(nil)`, closing the D4-06 deferral
(build proves 6/6). Appended `TestPostgresTopBusinesses` (skip-guarded live
test at limit 5: element-wise equality + independent avg/count order
assertions + cap check, rows logged). Nothing else touched. Verification:
`gofmt -l .` no output, `go vet`/`go build` clean (assertion holds),
`go test -count=1 ./...` PASS with no DB, live joint run of all six
repository tests PASS (top 5: 4.3750/8, 4.1250/8, 3.7500/8, 3.7500/8,
3.6250/8 — correctly ordered incl. the avg tie), `git diff --check` clean. No
commit made.
