# D4-11 — Create Businesses-by-Category Query

**Task:** D4-11 — Create Businesses-by-Category Query
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-11-create-businesses-by-category-query.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`Postgres.BusinessesByCategory` returns one `CategoryCount{Slug, Name,
Businesses}` per category via `GROUP BY`. Gate (Day-4): results match manual
SQL.

## Scope

Append `BusinessesByCategory` to `postgres.go` (`LEFT JOIN categories` +
`GROUP BY slug, name`, `COUNT(businesses.id)`, `ORDER BY` count DESC + slug
ASC; `Query` → `defer Close` → `Next`/`Scan` → `rows.Err()`; wrap
`businesses by category: %w`) + append `TestPostgresBusinessesByCategory` to
`postgres_test.go` (skip-guarded live test: method slice vs independent raw
query compared element-wise, plus sum cross-checked against `BusinessCount`
from the same repo — no hardcoded literals). Nothing else touched.

## Non-goals

- Endpoint wiring (D4-14).
- Date-range / category filters (D4-15).
- Other methods.
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- Three single-row methods proven; first multi-row query.
- Contract needs slug + name via join.
- Tree clean at plan time; slug free.
- LEFT JOIN / ORDER BY / equality-not-literals decisions.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/postgres.go` (three single-row methods).
- `analytics/go/internal/repository/repository.go` (`BusinessesByCategory` +
  `CategoryCount`).
- `analytics/go/internal/repository/postgres_test.go` (pattern to mirror).
- `docs/day-4-go-analytics.md` (D4-11 section).
- Categories / businesses migrations.

## Learning objectives and just-in-time concept explanation

`GROUP BY` turns per-row data into per-group reporting rows server-side; pgx
row iteration differs from single-row reads in exactly three obligations —
`defer rows.Close()`, per-row `Scan` inside `Next`, and the terminal
`rows.Err()` check, since iteration errors surface only after the loop.

## Ordered implementation steps

1. Append the method to `postgres.go` as scoped.
2. Append the live test as scoped (element-wise equality + sum-vs-
   `BusinessCount` cross-check).
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → skips); live joint run
   of all four repository tests with host URL → PASS with rows logged; from
   root: `git diff --check`. Expected: all clean.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (all live tests skip).
- Live joint run of all four repository tests — PASS.
- `git diff --check` — clean.

Live element-wise equality *is* the Day-4 "match manual SQL" gate; the sum
cross-check ties the new query to the proven count without literals.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Empty category yields a zero row (LEFT JOIN working as designed).
- Interface assertion still deferred (4 of 6 methods).

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact method/contract to implement.
- Locked LEFT JOIN (complete breakdown incl. zero-count categories) over
  INNER, with rationale; locked deterministic `ORDER BY` in both queries so
  element-wise comparison is sound.
- Strengthened verification: sum-vs-`BusinessCount` cross-check added
  (literal-free second opinion); joint re-run of all four tests.
- Rejected endpoint/filter work as out of scope. Rejected hardcoding 8/16/16.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12. Appended `BusinessesByCategory` to
`postgres.go` (`LEFT JOIN categories` + `GROUP BY slug, name`,
`COUNT(businesses.id)`, `ORDER BY` count DESC + slug ASC; `Query` → `defer
Close` → `Next`/`Scan` → `rows.Err()`; wrapped `businesses by category: %w`)
and `TestPostgresBusinessesByCategory` to `postgres_test.go` (skip-guarded
live element-wise equality + sum-vs-`BusinessCount` cross-check, no literals).
Nothing else touched. Environment note: the Compose stack was fully down at
start (day change); `docker compose up -d postgres` recreated the container
with data intact via `postgres_data`. Verification: `gofmt -l .` no output,
`go vet`/`go build` clean, `go test -count=1 ./...` PASS with no DB, live
joint run PASS (`method=40 direct=40`; `method=320 direct=320`;
`method=3.0406 direct=3.0406`; by-category
`[{restaurants 16} {tours 16} {hotels 8}]` identical both sides, sum 40 ==
`BusinessCount`), `git diff --check` clean. No commit made.
