# D4-03 — Create PostgreSQL Connection

**Task:** D4-03 — Create PostgreSQL Connection
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-03-create-postgresql-connection.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`analytics/go` depends on `pgx/v5`, owns one `*pgxpool.Pool` built from
`cfg.DatabaseURL` at startup with a bounded-time ping; a bad or missing DB
fails fast with a useful message, a good DB leaves the service up with
`/health` 200. `go test ./...` green with no DB running.

## Scope

`go get github.com/jackc/pgx/v5` (+ `tidy`), new `internal/db/db.go`
(`Connect`), new `db_test.go` (fast bad-DSN cases + skip-guarded live
`SELECT 1`), minimal `main.go` wiring (timeout context, `log.Fatal` on error,
`defer pool.Close()`), Compose `analytics.environment.DATABASE_URL` via the
existing `${POSTGRES_*}` interpolation.

## Non-goals

- Repository interface / queries (D4-05+).
- `POSTGRES_*` decomposition.
- URL-format validation beyond driver parsing.
- `PORT` / Compose changes beyond `DATABASE_URL`.
- CA-certs / `sslmode` changes.
- Dockerfile changes.
- New endpoints.

## Analysis carried forward

- Module is stdlib-only; `main` has config but no DB access.
- Compose passes no `DATABASE_URL` to `analytics`, so a rebuilt container
  would exit 1 on boot (D4-02 gating) unless this task plumbs the URL.
- PostgreSQL is healthy (`postgres:5432` in-network, host `127.0.0.1:5433`);
  Go 1.25.6 with module proxy available.
- Dockerfile is `CGO_ENABLED=0` + `COPY . .`; a pure-Go driver needs no
  Dockerfile change, but the image build now downloads modules.

## Current-state evidence and relevant files

- `analytics/go/go.mod` — `module caribeops/analytics`, stdlib only.
- `analytics/go/main.go` — config load + listen, no DB.
- `analytics/go/internal/config/config.go` — `Load()` yields `DatabaseURL`
  (required) + `Port` (default `8080`).
- `analytics/go/Dockerfile` — no `ENV`, `CGO_ENABLED=0` build.
- `docker-compose.yml` (`analytics` service) — no `environment:`.
- `docs/day-4-go-analytics.md` (D4-03 section) — add driver, pool, `SELECT 1`
  check.
- `docker compose ps` at plan time — all services up, PG healthy.

## Learning objectives and just-in-time concept explanation

Connection pooling (bounded reusable connections instead of per-request dials)
and pool-as-infrastructure: `pgxpool.ParseConfig` turns the URL into pool
settings, `NewWithConfig` builds the pool, `Ping` proves reachability — all
under a `context.WithTimeout` so startup can't hang. `main` owns the
lifecycle; later layers receive the pool and never dial themselves.

## Ordered implementation steps

1. `go get github.com/jackc/pgx/v5` + `go mod tidy` in `analytics/go/`.
   Rationale: pgx v5 is the maintained native driver with a context-aware
   pool; `lib/pq` is maintenance-mode without one. Expected `go.mod`/`go.sum`
   churn recorded, not avoided.
2. Add `internal/db/db.go` (`package db`):
   `func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error)`
   — blank URL errors naming the variable; `ParseConfig` → `NewWithConfig` →
   `Ping(ctx)`; errors wrapped without the URL value.
   Rationale: one pool owner, testable seam, ping is the "equivalent
   connectivity check".
3. Add `internal/db/db_test.go` (no `t.Parallel`): bad-DSN / blank-URL cases
   error fast with no network; `TestConnectLiveSELECT1` skips when
   `DATABASE_URL` is unset, else connects, runs `SELECT 1` expecting `1`,
   closes. Rationale: suite stays green without a DB; live path literally
   executes the Day-4 gate query.
4. Wire `main.go`: after `config.Load`, 5s-timeout context, `db.Connect` →
   `log.Fatal` on error, `defer cancel(); defer pool.Close()`. Pool unused by
   handlers until D4-05 (defer keeps it referenced).
   Rationale: Day-4 gate — bad DB fails fast at startup.
5. Compose: `analytics.environment.DATABASE_URL` =
   `postgres://${POSTGRES_USER:-caribeops}:${POSTGRES_PASSWORD:-caribeops_local}@postgres:5432/${POSTGRES_DB:-caribeops}?sslmode=disable`.
   Rationale: same interpolation style as sibling services; prevents the
   post-rebuild crash-loop; `PORT` untouched (default matches).
6. Verify from `analytics/go/`: `go vet ./...`, `go test -count=1 ./...` (no
   DB), live `DATABASE_URL=...localhost:5433... go test -count=1
   -run TestConnectLiveSELECT1 -v ./internal/db/`, negative `go run` probe
   (bad URL → non-zero exit), positive `go run` probe (`/health` 200); then
   `docker compose up -d --build analytics` + `curl :8080/health`; from root:
   `docker compose config --quiet`, `git diff --check`. Expected: all green.

## Tests and verification commands, plus expected results

- `go vet ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (live test skips).
- Live `go test -count=1 -run TestConnectLiveSELECT1 -v ./internal/db/` with
  host `DATABASE_URL` — PASS, `SELECT 1` returns 1.
- Negative `go run` probe (bad URL) — non-zero exit with useful message.
- Positive `go run` probe (good URL) — stays up, `/health` 200.
- `docker compose up -d --build analytics` + `curl :8080/health` — 200.
- `docker compose config --quiet` — valid.
- `git diff --check` — clean.

D4-03 gate: start Go and execute `SELECT 1` or the equivalent ping check.
Existing health/config tests are the regression guards.

## Risks, dependencies, and unresolved questions

- New third-party dependency (pgx v5) — the first in the Go service.
- Docker build now needs module downloads (covered by compose-build
  verification).
- `scratch` image is fine for `sslmode=disable` (pure Go, no CA certs needed);
  `sslmode=require` would need certs — deferred, noted.
- Log the returned error only, never the URL value.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug `d4-03-create-postgresql-connection.md` is free; no overwrite.
- Confirmed PG reachable on both networks with healthy status at plan time.
- Locked driver choice (pgx v5 + pgxpool) over `database/sql` + `lib/pq` with
  maintenance-status rationale — technical default, left visible for review
  rather than asked blocking.
- Flagged `internal/db` as a deliberate deviation from the Day-4 tree
  (pool-lifecycle owner; repositories consume the pool in D4-05+).
- Fixed crash-loop risk: Compose `DATABASE_URL` is in-scope, not deferred.
- Fixed suite-without-DB risk: fast bad-DSN tests + skip-guarded live test;
  `Ping` plus a literal `SELECT 1` covers the doc's "or equivalent" wording
  exactly.
- Fixed hang risk: 5s startup timeout; fixed secret risk: URL never logged.
- Added docker-build-downloads verification (new dep changes build-time
  network needs).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. `go get github.com/jackc/pgx/v5`
(v5.11.0; `go.mod` + new `go.sum`, no other dep changes). New
`analytics/go/internal/db/db.go` (`Connect`: blank-URL guard,
`ParseConfig` → `NewWithConfig` → `Ping`, errors name variables only) and
`db_test.go` (blank/unparseable/unreachable fast cases + skip-guarded live
`SELECT 1`). `analytics/go/main.go` wired (5s-timeout context, `log.Fatal` on
error, `defer pool.Close()`; `newHandler` untouched). `docker-compose.yml`
gives `analytics` a `DATABASE_URL` built from the existing `${POSTGRES_*}`
interpolation. Verification: `go mod tidy` clean, `go vet ./...` clean,
`go test -count=1 ./...` PASS with no DB (live test SKIP; root + config +
db ok), live `DATABASE_URL=...localhost:5433... go test -run
TestConnectLiveSELECT1` PASS (`SELECT 1` = 1), negative `go run` probe (wrong
password) → exit 1 with useful message redacting the secret, positive probe
(`PORT=18082`) → `/health` `{"status":"ok"}`, `go build ./...` clean,
`docker compose up -d --build analytics` succeeded (module downloads in-Docker
OK) with rebuilt `:8080/health` 200 and log `listening on :8080`,
`docker compose config --quiet` OK, `git diff --check` clean. No commit made.
