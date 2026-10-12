# D4-06 — Implement Business Count Query

**Task:** D4-06 — Implement Business Count Query
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-06-implement-business-count-query.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`internal/repository` gains a pgx `Postgres` implementation whose
`BusinessCount` returns `SELECT COUNT(*) FROM businesses`, satisfying the
`Repository` interface. Gate (Day-4): Go result equals a direct PostgreSQL
query.

## Scope

New `analytics/go/internal/repository/postgres.go` (`Postgres{pool}`,
`NewPostgres`, `BusinessCount` via `QueryRow` + `Scan`, compile assertion
`var _ Repository = (*Postgres)(nil)`, wrapped errors) + new
`postgres_test.go` (skip-guarded live equality test: method result vs
independent raw `SELECT COUNT(*)`; no hardcoded count). Nothing else touched
— `main.go` stays unwired (first consumer is D4-09; an unused `repo` would not
compile).

## Non-goals

- The other five methods (the struct simply doesn't implement them until
  their tasks; no placeholder stubs).
- Service / handlers / endpoints.
- Filters.
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- Interface declared (`BusinessCount(ctx) (int64, error)`); zero
  implementations in the repo.
- Pool available via `db.Connect` but consumer-less; `businesses` table
  grounded in its migration.
- Tree clean at plan time; slug free.
- Equality-not-magic-number and skip-without-DB constraints.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/repository.go` (interface).
- `analytics/go/internal/db/db.go` (`Connect` → `*pgxpool.Pool`).
- `analytics/go/main.go` (pool unused — stays that way).
- `docs/day-4-go-analytics.md` (D4-06 section: `COUNT(*)`, compare with direct
  query).
- Businesses migration (`businesses` table).

## Learning objectives and just-in-time concept explanation

Aggregation at the database (`COUNT(*)` ships one integer, not N rows) and
pgx single-row reads — `QueryRow` checks out a pooled connection, runs the
query, `Scan`s into `int64`, and releases, all under `ctx`. The compile
assertion turns interface drift into a build error.

## Ordered implementation steps

1. Add `postgres.go` exactly as scoped; error wrap as `business count: %w`
   (no values in messages).
2. Add `postgres_test.go`: skip when `DATABASE_URL` unset; else open pool via
   `db.Connect`, call `NewPostgres(pool).BusinessCount`, run raw
   `SELECT COUNT(*)` independently, assert equality; close pool. Rationale:
   this *is* the Day-4 gate, executable on demand.
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → new test skips); live
   `DATABASE_URL=...localhost:5433... go test -count=1
   -run TestPostgresBusinessCount -v ./internal/repository/` → PASS with the
   live count reported; from root: `git diff --check`, `git status --short`.
   Expected: all clean, count matches (live value asserted by equality, not
   literal).

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (new test skips).
- Live run of the new test with host `DATABASE_URL` — PASS, method result
  equals direct query.
- `git diff --check` — clean.

No unit test without DB is meaningful for a SQL method (the skip-guard keeps
the suite green; the live run is the proof).

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Empty-table behavior needs no special case (`COUNT(*)` returns 0, never
  NULL).
- `main` stays untouched by unused-variable discipline.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, stub-free package (only interface + doc), clean tree
  at plan time.
- Rejected hardcoding the seeded count; equality assertion is seed-proof.
- Rejected wiring `main` (no consumer; avoids unused-variable or `_ =`
  shims).
- Rejected placeholder methods for the other five (unimplemented surface
  stays absent, not stubbed).
- Strengthened verification: `gofmt -l` + live-run reporting the actual count
  for the record.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. New
`analytics/go/internal/repository/postgres.go` (`Postgres{pool}`,
`NewPostgres`, `BusinessCount` via `QueryRow(SELECT COUNT(*) FROM
businesses)` + `Scan`, error wrapped as `business count: %w`) and
`postgres_test.go` (skip-guarded live equality test, no hardcoded count).
One recorded deviation: the `var _ Repository = (*Postgres)(nil)` assertion
was omitted — with 1 of 6 methods implemented it would fail the build and
contradict this plan's own all-clean expectations; it belongs in the task
that completes the surface (D4-13). Nothing else touched; `main.go` stays
unwired. Verification: `gofmt -l .` no output, `go vet`/`go build` clean,
`go test -count=1 ./...` PASS with no DB (new test skips), live
`DATABASE_URL=...localhost:5433... go test -run TestPostgresBusinessCount`
PASS (`method=40 direct=40`), `git diff --check` clean. No commit made.
