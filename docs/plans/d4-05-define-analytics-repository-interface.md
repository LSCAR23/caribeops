# D4-05 — Define Analytics Repository Interface

**Task:** D4-05 — Define Analytics Repository Interface
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-05-define-analytics-repository-interface.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`internal/repository` declares the analytics query surface as a Go interface
plus its result structs — no SQL, no behavior change. `go build ./...` green
(the Day-4 gate: application compiles).

## Scope

One new file, `analytics/go/internal/repository/repository.go`: a
`Repository` interface with six methods (`BusinessCount`, `ReviewCount`,
`AverageRating`, `BusinessesByCategory`, `ReviewsByMonth`, `TopBusinesses`)
and three result structs (`CategoryCount{Slug, Name, Businesses}`,
`MonthlyReviews{Month, Reviews}`,
`TopBusiness{ID, Name, AverageRating, ReviewCount}`). `ctx context.Context`
first on every method; counts as `int64` (`COUNT(*)` maps to it in pgx);
`TopBusinesses` takes `limit int` now since top-N is meaningless without it.

## Non-goals

- Any SQL or pgx implementation (D4-06–D4-08, D4-11–D4-13).
- Overview service (D4-09).
- Handlers / endpoints (D4-10, D4-14).
- Query-param `?limit=` / `?category=` / `?from=` / `?to=` wiring (D4-15).
- Mocks / fakes (D4-17 can add them against this interface).
- New dependencies.
- Any other file touched.

## Analysis carried forward

- `internal/repository` is a doc-only stub; nothing references a repository.
- The six-method set covers the D4-06–D4-09 + D4-11–D4-14 endpoint needs.
- Schema grounded in the migrations: `categories.slug` unique,
  `businesses.category_id` FK, `reviews.rating`/`business_id`/`review_date`,
  UUID string IDs.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/doc.go` — doc-only stub.
- `analytics/go/main.go` — no repository use.
- `analytics/go/go.mod` — pgx present, unneeded here (stdlib `context`/`time`
  suffice).
- `docs/day-4-go-analytics.md` (D4-05 section + the six consuming tasks).
- The `categories`, `businesses`, and `reviews` migrations (columns above).

## Learning objectives and just-in-time concept explanation

Interfaces as seams — callers (D4-09 service, D4-17 fakes) depend on named
behavior, so D4-06+ pgx implementations slot in without touching them.
Narrow method-per-query beats one giant response; `ctx` first carries
cancellation through pool calls by convention.

## Ordered implementation steps

1. Add `repository.go` with the interface + structs exactly as scoped, each
   method documented with its consuming task (e.g. `BusinessCount` →
   D4-06/D4-09). Rationale: the docstring trail lets each later task find its
   contract.
2. Defaults recorded in comments: top-business ranking = average rating
   primary, review volume tiebreak (D4-13's first example; reversible); month
   rows = `time.Time` first-of-month ascending from `reviews.review_date`
   (domain date; D4-12 verifies against seed); empty-table `AVG NULL`
   handling deferred to D4-08 (`COALESCE` there, not here).
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...`; from root:
   `git diff --check`, `git status --short`. Expected: all clean, suite
   unchanged (no new tests — declarations only), status shows just the new
   file.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output (new file formatted).
- `go vet ./...` — clean.
- `go build ./...` — clean (the Day-4 gate).
- `go test -count=1 ./...` — pass, unchanged (no new tests for an interface
  with no behavior; fakes arrive in D4-17 as consumers).
- `git diff --check` — clean.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Signature churn risk contained by deferring filters to D4-15 (only `limit`
  included now, justified above).
- Placement alternative (consumer-side interfaces) noted and rejected as
  doc-unfaithful; no import cycle either way.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug `d4-05-define-analytics-repository-interface.md` is free; no
  overwrite.
- Confirmed stub-only package and clean tree at plan time.
- Confirmed six-method coverage against the D4-06–D4-14 needs (overview trio +
  three grouped/ranked queries); rejected adding filter params now except
  `TopBusinesses(limit)` with recorded rationale.
- Confirmed `time.Time` / `int64` / `float64` against pgx scan targets and
  UUID-string IDs; confirmed no pgx import needed.
- Strengthened verification: `gofmt -l` added for the new file;
  suite-must-pass explicit despite no new tests.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. New
`analytics/go/internal/repository/repository.go`: `Repository` interface
(`BusinessCount`, `ReviewCount`, `AverageRating`, `BusinessesByCategory`,
`ReviewsByMonth`, `TopBusinesses(ctx, limit)` — `ctx` first, counts `int64`)
plus `CategoryCount{Slug, Name, Businesses}`,
`MonthlyReviews{Month, Reviews}`, `TopBusiness{ID, Name, AverageRating,
ReviewCount}`; per-method docstrings trail to consuming tasks with ranking
(avg rating + volume tiebreak), month (`review_date`, first-of-month), and
NULL-deferral (`COALESCE` in D4-08) defaults recorded. Stdlib-only, no other
file touched. Verification: `gofmt -l .` no output, `go vet ./...` clean,
`go build ./...` clean (Day-4 gate), `go test -count=1 ./...` PASS unchanged
(root + config + db; repository `[no test files]` as expected), `git
diff --check` clean. No commit made.
