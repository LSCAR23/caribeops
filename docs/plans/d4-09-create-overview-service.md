# D4-09 — Create Overview Service

**Task:** D4-09 — Create Overview Service
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-09-create-overview-service.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`internal/service` exposes an overview service that combines the three proven
repository reads into one `Overview{Businesses, Reviews, AverageRating}` value
shaped for the Day-4 JSON (`businesses`, `reviews`, `average_rating`). Gate:
the service combines repository results correctly — proven by fake-based unit
tests, no DB.

## Scope

New `analytics/go/internal/service/overview.go` (`Overview` struct with
`json:` tags, `OverviewService{repo}`, `NewOverviewService`,
`GetOverview(ctx)` calling the trio sequentially with step-named wraps) + new
`overview_test.go` (hand fake of all six `Repository` methods; success case
asserts passthrough combination; error cases assert propagation naming the
failing step). `main.go` stays unwired (D4-10 handler is the first consumer).

## Non-goals

- HTTP / handler / endpoint (D4-10).
- Grouped / ranked service methods.
- Rounding / display policy.
- Parallelism.
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- Service package is a doc-only stub.
- Trio proven live (40 / 320 / 3.0406 exact); no combiner exists.
- JSON keys from the Day-4 doc.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/service/doc.go` — doc-only stub.
- `analytics/go/internal/repository/repository.go` (trio signatures).
- `analytics/go/internal/repository/postgres.go` (proven bodies).
- `docs/day-4-go-analytics.md` (D4-09 section).

## Learning objectives and just-in-time concept explanation

Services coordinate — constructor takes the interface (not the pool, not SQL),
so the service is testable with a fake and the handler later depends on the
service, never the repository directly. Sequential reads keep the change
small: three sub-ms local aggregates gain nothing from goroutines but would
pay errgroup complexity + a new dependency.

## Ordered implementation steps

1. Add `overview.go` exactly as scoped; wraps read `overview <step>: %w`.
2. Add `overview_test.go`: `fakeRepository` (configured trio values +
   per-method error injection; other three methods return zeros); success
   asserts exact struct equality; one error case per trio method asserts a
   non-nil error naming the step.
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (all green with no DB — new
   tests are DB-free); from root: `git diff --check`. Expected: all clean,
   new service tests pass.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` — pass with no DB (fake-based tests).
- `git diff --check` — clean.

Fake-based unit tests are the Day-4 gate ("combines correctly"); error cases
prove failures surface with their step named. No live-DB test needed —
composition logic has no SQL.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Rounding deferred.
- No interface declared here, so no assertion question.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, doc-only service package.
- Locked sequential over parallel with recorded rationale (no errgroup dep
  for sub-ms local reads).
- Locked `json:` tags now so D4-10 serializes the struct directly.
- Confirmed fake covers all six methods (interface compliance at compile time
  in the test package).
- Rejected `main` wiring (unused service would not compile).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. New
`analytics/go/internal/service/overview.go` (`Overview` with Day-4 `json:`
tags, `OverviewService{repo}`, `NewOverviewService`, sequential
`GetOverview` with step-named wraps) and `overview_test.go`
(`fakeRepository` covering all six interface methods; combination +
per-step error propagation cases). `main.go` stays unwired. Verification:
`gofmt -l .` no output, `go vet`/`go build` clean, `go test -count=1 ./...`
PASS with no DB (new service tests 2/2 PASS, DB-free), `git diff --check`
clean. No commit made.
