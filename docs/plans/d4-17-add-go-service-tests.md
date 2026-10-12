# D4-17 — Add Go Service Tests

**Task:** D4-17 — Add Go Service Tests
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-17-add-go-service-tests.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

Every suite layer has a no-DB test — the three D4-17 bullets (overview
calculation, category aggregation, top-business ordering) are covered DB-free
where the behavior lives in Go and live where the behavior lives in SQL, plus
the two genuine DB-free gaps closed. Gate: `go test ./...` green with and
without a database.

## Scope (tests only, no production code)

1. Wire-key pins in `handler/analytics_test.go` (+ `overview_test.go` for the
   fourth shape): marshal each response struct, decode into `map[string]any`,
   assert the exact key set (`businesses`/`reviews`/`average_rating`;
   `slug`/`name`/`businesses`; `month`/`reviews`;
   `id`/`name`/`average_rating`/`review_count`). Catches tag renames/drops
   that struct-decoding tests cannot.
2. `TopBusinesses` non-positive guard case in `postgres_test.go`:
   `NewPostgres(nil)` with limits `0`/`-1` returns empty + nil error — returns
   before touching the pool, so no DB needed (comment says so).
3. Full suite green both ways: `go test -count=1 ./...` with no DB, and live
   with host `DATABASE_URL`.

## Non-goals

- New service layers or fakes for SQL behavior (a fake-based aggregation test
  would assert nothing).
- Production code changes (none expected).
- Endpoint / contract changes.
- New dependencies.

## Analysis carried forward

- Bullet-by-bullet coverage audit (overview DB-free done; aggregation +
  ordering live-covered by nature).
- The two real DB-free gaps.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/service/overview_test.go` (fake combination +
  errors).
- `analytics/go/internal/repository/postgres_test.go` (live equality/order/
  cap tests).
- `analytics/go/internal/handler/*_test.go` (struct-decoding + leak pins +
  parsing matrix).
- `analytics/go/internal/repository/repository.go` (tag sets).
- `analytics/go/internal/repository/postgres.go` (guard clause).
- `docs/day-4-go-analytics.md` (D4-17 section).

## Learning objectives and just-in-time concept explanation

Cheapest-test-per-layer — fakes for coordination, map-decoding for wire
contracts, live equality for SQL truth; skip-guards keep one suite runnable
everywhere. The key-pin duplication is deliberate: wire renames must be
conscious, not accidental.

## Ordered implementation steps

1. Append key-set tests (4 shapes, map-decoded exact keys).
2. Append the nil-pool guard test.
3. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB — new tests must run,
   not skip), then live `DATABASE_URL=... go test -count=1 ./...`; from root:
   `git diff --check`. Expected: all green both ways.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass, new tests running (not
  skipped).
- Live full run — pass.
- `git diff --check` — clean.

The new tests *are* the deliverable; the gate is green both with and without
a DB, with the new cases visibly running (not skipped) in the no-DB run.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Key pins intentionally duplicate tag strings.
- Guard test documents its nil-pool safety inline.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact files and the two real gaps.
- Challenged scope inflation (grouped-query services, SQL-behavior fakes) and
  rejected both: no behavior exists to house, and fakes can't verify SQL —
  the plan adds only tests that can actually fail for the right reasons.
- Confirmed no production change is expected; the outcome will state the
  coverage map explicitly.
- Strengthened verification: new tests must be observed *running* in the
  no-DB pass (a skipped new test would be a silent no-op).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12, tests only, no production code touched.
`handler/analytics_test.go`: `TestResponseWireKeys` pins the exact JSON key
sets of all four response shapes via map-decoding (catches tag renames the
struct-decoding tests miss). `postgres_test.go`:
`TestTopBusinessesNonPositiveLimit` covers the guard with a nil pool (returns
before touching the DB). Coverage map: overview calculation DB-free (fake),
aggregation + ordering live (SQL truth), wire keys + guard + parsing +
leak-pins DB-free, config/db-failure paths DB-free. Verification:
`gofmt -l .` no output, `go vet`/`go build` clean, `go test -count=1 ./...`
PASS with no DB (both new tests visibly PASS, not skipped), live full run
with host `DATABASE_URL` PASS all six packages, `git diff --check` clean. No
commit made.
