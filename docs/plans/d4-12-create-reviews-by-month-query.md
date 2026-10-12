# D4-12 — Create Reviews-by-Month Query

**Task:** D4-12 — Create Reviews-by-Month Query
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-12-create-reviews-by-month-query.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`Postgres.ReviewsByMonth` returns one `MonthlyReviews{Month, Reviews}` per
month via `date_trunc`. Gate (Day-4): a sample month verified manually — the
live test logs all rows and asserts element-wise equality with manual SQL.

## Scope

Append `ReviewsByMonth` to `postgres.go`
(`SELECT date_trunc('month', review_date)::date, COUNT(*) FROM reviews
GROUP BY 1 ORDER BY 1`; same iteration shape; wrap `reviews by month: %w`) +
append `TestPostgresReviewsByMonth` (skip-guarded live element-wise equality +
month-row sum cross-checked against `ReviewCount`; rows logged so a sample
month is human-verifiable). Nothing else touched.

## Non-goals

- Endpoint wiring (D4-14).
- `?from` / `?to` filters (D4-15).
- Other methods.
- New dependencies.
- `main` / Compose changes.

## Analysis carried forward

- D4-11 iteration pattern proven.
- `review_date` (`date`, factory-spread across months) is the bucket source.
- `date` scans to midnight-UTC `time.Time` on both sides.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/repository/postgres.go` (4 methods).
- `analytics/go/internal/repository/repository.go` (`ReviewsByMonth` +
  `MonthlyReviews`).
- `analytics/go/internal/repository/postgres_test.go` (pattern to mirror).
- `backend/laravel/database/factories/ReviewFactory.php:26`
  (`review_date` via `fake()->date()`).
- `docs/day-4-go-analytics.md` (D4-12 section).

## Learning objectives and just-in-time concept explanation

`date_trunc` floors timestamps to period starts inside the database — the
canonical time-series transform; `::date` drops the time part so months
compare as calendar days. Everything else (iteration, equality gate, sum
cross-check) reuses D4-11 exactly.

## Ordered implementation steps

1. Append the method to `postgres.go` as scoped.
2. Append the live test as scoped (equality + sum-vs-`ReviewCount`, rows
   logged).
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB → skips); live joint run
   of all five repository tests with host URL → PASS with month rows in
   output; from root: `git diff --check`. Expected: all clean.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (all live tests skip).
- Live joint run of all five repository tests — PASS.
- `git diff --check` — clean.

Live equality + logged rows *are* the "verify a sample month" gate (reviewer
picks any logged month against the DB). Sum cross-check ties volume to the
proven 320 without literals.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Months with zero reviews simply absent (review-sourced grouping, correct by
  construction).
- Interface assertion still deferred (5 of 6 methods).

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact contract to implement.
- Locked `review_date` over `created_at` with factory-spread evidence; locked
  `::date` cast so both sides scan plain calendar days.
- Confirmed `time.Time` equality is sound (same `date` → same midnight UTC on
  both sides).
- Strengthened verification: logged rows make the "sample month" gate
  human-auditable, not just asserted.
- Rejected filters/endpoint work as out of scope.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12. Appended `ReviewsByMonth` to
`postgres.go` (`date_trunc('month', review_date)::date` + `GROUP BY 1 ORDER BY
1`, same iteration shape, wrapped `reviews by month: %w`) and
`TestPostgresReviewsByMonth` to `postgres_test.go` (skip-guarded live
element-wise equality with `.Equal` month comparison + sum-vs-`ReviewCount`
cross-check; every month row logged). Nothing else touched. Verification:
`gofmt -l .` no output, `go vet`/`go build` clean, `go test -count=1 ./...`
PASS with no DB, live joint run of all five repository tests PASS
(40/40, 320/320, 3.0406/3.0406, by-category identical, by-month ~270 rows
1970-02→2026-04 identical both sides with month sum 320 == `ReviewCount`),
`git diff --check` clean. No commit made.
