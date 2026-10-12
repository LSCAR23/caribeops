# D4-08 — Implement Average Rating Query

**Task:** D4-08 — Implement Average Rating Query
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-08-implement-average-rating-query.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`Postgres.AverageRating` returns the average review rating as `float64`,
completing the D4-09 overview trio. Gate (Day-4): Go output matches a
manually calculated database result.

## Scope

Append `AverageRating` to `postgres.go`
(`SELECT COALESCE(AVG(rating), 0) FROM reviews` + `Scan` into `float64`, wrap
`average rating: %w`) + append `TestPostgresAverageRating` to
`postgres_test.go` (skip-guarded live equality vs independent raw
`COALESCE(AVG…)`; value logged to 4 decimals for the record). Nothing else
touched.

## Non-goals

- Grouped / ranked queries.
- Service / handlers.
- Rounding policy for display (D4-09/D4-10 concern).
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- Two count methods proven live; `AverageRating` declared-but-unimplemented.
- `rating` is int 1–5, so `AVG` → `numeric` → `float64`.
- Empty-table NULL requires `COALESCE`.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/postgres.go` (two count methods).
- `analytics/go/internal/repository/repository.go` (`AverageRating`
  declaration + deferred-`COALESCE` note).
- `analytics/go/internal/repository/postgres_test.go` (pattern to mirror).
- `docs/day-4-go-analytics.md` (D4-08 section).

## Learning objectives and just-in-time concept explanation

`AVG()` keeps the math in the database; `COALESCE` keeps the Go contract
NULL-free (empty table reads 0, never a scan error); pgx maps `numeric` to
`float64`, and identical aggregates over identical data convert identically,
so exact equality is the correct assertion — no epsilon.

## Ordered implementation steps

1. Append `AverageRating` to `postgres.go` with `COALESCE(AVG(rating), 0)`.
2. Append the live equality test mirroring the count tests, logging the value.
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → all three live tests
   skip); live joint run of all three repository tests with host URL → PASS
   with values reported; from root: `git diff --check`. Expected: all clean.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (all three live tests skip).
- Live joint run of all three repository tests — PASS.
- `git diff --check` — clean.

The two count tests re-run as shared-file regression guards.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Rounding / display policy explicitly deferred.
- Interface assertion still deferred (3 of 6 methods).

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, pattern to mirror.
- Fixed the one real semantic difference from D4-06/07: `COALESCE` for the
  empty-table NULL case, in both method and reference query.
- Confirmed exact float equality is sound (deterministic aggregate +
  conversion); rejected epsilon as noise that would weaken the gate.
- Rejected display rounding (D4-09/10 scope).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. Appended `AverageRating` to `postgres.go`
(`SELECT COALESCE(AVG(rating), 0) FROM reviews` + `Scan` into `float64`,
wrapped `average rating: %w`) and `TestPostgresAverageRating` to
`postgres_test.go` (skip-guarded live exact-equality vs independent raw
`COALESCE(AVG…)`, value logged). Nothing else touched. Verification:
`gofmt -l .` no output, `go vet`/`go build` clean, `go test -count=1 ./...`
PASS with no DB (all three live tests skip), live joint run PASS
(`method=40 direct=40`; `method=320 direct=320`; `method=3.0406
direct=3.0406` — exact float equality holds), `git diff --check` clean. No
commit made.
