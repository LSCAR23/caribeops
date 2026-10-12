# D4-07 — Implement Review Count Query

**Task:** D4-07 — Implement Review Count Query
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-07-implement-review-count-query.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`Postgres.ReviewCount` returns `SELECT COUNT(*) FROM reviews`, second leg of
the overview trio. Gate (Day-4): Go result equals the PostgreSQL result.

## Scope

Append `ReviewCount` to `postgres.go` (same `QueryRow` + `Scan` shape, wrap
`review count: %w`) + append `TestPostgresReviewCount` to `postgres_test.go`
(skip-guarded live equality: method vs independent raw `COUNT(*)`, no
hardcoded 320). Nothing else touched.

## Non-goals

- Average rating (D4-08).
- Grouped / ranked queries.
- Service / handlers.
- `main` / Compose changes.
- New dependencies.

## Analysis carried forward

- `BusinessCount` pattern proven live (`method=40 direct=40`);
  `ReviewCount` declared-but-unimplemented.
- `reviews` table grounded in its migration.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/postgres.go` (D4-06 method).
- `analytics/go/internal/repository/repository.go` (`ReviewCount` declaration).
- `analytics/go/internal/repository/postgres_test.go` (D4-06 pattern to mirror).
- `docs/day-4-go-analytics.md` (D4-07 section).
- Reviews migration.

## Learning objectives and just-in-time concept explanation

Repetition of the deterministic-query pattern — each overview input is an
independent, directly-verifiable aggregate; two working methods prove the seam
carries more than one query.

## Ordered implementation steps

1. Append `ReviewCount` to `postgres.go` mirroring `BusinessCount`.
2. Append `TestPostgresReviewCount` mirroring the D4-06 test against
   `reviews`.
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → both live tests skip);
   live `DATABASE_URL=...localhost:5433... go test -count=1
   -run 'TestPostgres(Business|Review)Count' -v ./internal/repository/` →
   both PASS with counts reported; from root: `git diff --check`.
   Expected: all clean, review count matches (live value asserted by
   equality, not literal).

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (both live tests skip).
- Live joint run of both count tests — both PASS.
- `git diff --check` — clean.

D4-06 test re-run guards against regression in the shared file.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- `COUNT(*)` never NULL.
- Interface assertion still deferred (2 of 6 methods).

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact D4-06 pattern to mirror.
- Rejected hardcoding 320; rejected `main` wiring (still no consumer).
- Strengthened verification: joint re-run of both count tests to catch
  shared-file regressions.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. Appended `ReviewCount` to `postgres.go`
(same `QueryRow(SELECT COUNT(*) FROM reviews)` + `Scan` shape, wrapped
`review count: %w`) and `TestPostgresReviewCount` to `postgres_test.go`
(skip-guarded live equality, no hardcoded 320). Nothing else touched.
Verification: `gofmt -l .` no output, `go vet`/`go build` clean,
`go test -count=1 ./...` PASS with no DB (both live tests skip), live joint
run PASS (`businesses: method=40 direct=40`; `reviews: method=320
direct=320`), `git diff --check` clean. No commit made.
