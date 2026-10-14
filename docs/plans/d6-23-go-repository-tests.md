# D6-23 — Go Repository Tests

**Task:** D6-23 — Go Repository Tests
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-23-go-repository-tests.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-22 precedent in `MEMORY.md`.

**Desired outcome:** `go test ./...` green without a DB (visible skips) and green live against seeded PostgreSQL with predictable data.
**Scope:** `gofmt`/`vet`/`build` gates + no-DB run + live run (`DATABASE_URL` to dev PG, 40/320 pre-counts) + minimal pins only for unpinned methods + matrix in the outcome.
**Non-goals:** No new test database, no SQL changes, no handler changes, no commit.

## Analysis carried forward

`postgres_test.go` holds skip-guarded live equality tests per method (D4-06…13 + D4-15 filtered) and DB-free pins exist (D4-17 guard + wire keys + parsing/config/db-failure). Strategy is skip-guarded-live + DB-free units over the predictable 40/320/3.040625 seed. Tests are SELECT-only, seed-safe.

## Current-state evidence

- `analytics/go/internal/repository/postgres_test.go` — live tests per method (verified D4-06…15 in `MEMORY.md`)
- `analytics/go/internal/repository/postgres.go` — 6 query methods under test
- `go test -count=1 ./...` PASS with and without DB in Day 4 (per `MEMORY.md`)

## Learning objectives and just-in-time concepts

Live-SQL-truth vs DB-free logic in Go testing; skip guards keep CI green without a database.

## Ordered implementation steps

1. `gofmt -l .`, `go vet ./...`, `go build ./...` clean in `analytics/go`.
2. `go test -count=1 ./...` with no DB: PASS with visible skips.
3. Live: compose postgres up if needed, verify 40/320 counts, `DATABASE_URL` to dev PG, `go test -count=1 ./...` PASS with repository live tests un-skipped.
4. Minimal pin in the same mold only for a method lacking one (not expected).
5. `git diff --check` clean; outcome with the method→test→mode matrix.

## Tests and verification commands, plus expected results

- Both runs green; probable zero-Go-change landing.

## Risks, dependencies, and unresolved questions

- Dev PG must be up and seeded; read-only SELECTs never mutate the dataset.

## Plan check

- Existing strategy matches the spec (predictable data + skips); live run uses seeded dev, not fixtures; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** plan file materialized at this path verbatim from the checked inline deliverable — no scope change. Zero Go changes (verify-only landing): every repository method already pinned.

**Method→test→mode matrix (all green):**
- `BusinessCount` / `ReviewCount` / `AverageRating` — `TestPostgres*` live equality (D4-06…08)
- `BusinessesByCategory` / `ReviewsByMonth` / `TopBusinesses` — live element-wise equality + order/cap (D4-11…13)
- Filtered queries (`LIMIT`/`category`/`from`/`to`) — `TestPostgresFilteredQueries` live (D4-15)
- Guard `TopBusinesses(limit<=0)` — `TestTopBusinessesNonPositiveLimit` DB-free, nil pool (D4-17)

**Verification (exact commands/results — the spec's test):**
- `gofmt -l .` empty; `go vet ./...` + `go build ./...` clean.
- No-DB `go test -count=1 ./...` → 6/6 packages ok, 7 live repository tests visibly SKIP + guard PASSes.
- Live (`DATABASE_URL` to dev PG 127.0.0.1:5433, seed pre-verified 40|320 via `psql`, read-only SELECTs): `go test -count=1 -v ./internal/repository/` → **8/8 PASS, 0 SKIP**; full `go test -count=1 ./...` → **6/6 packages ok**.
- Env note: dev PG listens on **5433** (Laravel `.env`), not 5432 — two wrong-password probes against :5432 failed with 28P01 before reading the port from config; password taken from local `.env` at runtime, never recorded.
- `git diff --check` clean; `git status --short` → only the new plan file.
