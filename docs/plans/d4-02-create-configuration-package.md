# D4-02 — Create Configuration Package

**Task:** D4-02 — Create Configuration Package
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-02-create-configuration-package.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`internal/config` exposes a `Config` (`Port`, `DatabaseURL`) loaded from the
environment; `main` fails fast with a message naming the missing variable when
required config is absent, and otherwise listens on the configured port.
`go test ./...` green.

## Scope

New `analytics/go/internal/config/config.go` (`Load`), new
`config_test.go` (`t.Setenv` cases), minimal `main.go` wiring
(`config.Load` + `log.Fatal` on error + `":" + cfg.Port`). No other behavior
change.

## Non-goals

- PostgreSQL driver / connection pool (D4-03).
- `POSTGRES_*` decomposition.
- URL-format validation beyond non-empty.
- Dockerfile / Compose env additions.
- New module dependencies.
- Handler / service work.

## Analysis carried forward

- `internal/config` is a doc-only stub (`doc.go`); there is no `Config` type,
  no loader, no config test.
- `main.go` hardcodes `http.ListenAndServe(":8080", ...)` and ignores the
  environment entirely.
- `.env.example` documents `PORT=8080` and
  `DATABASE_URL=postgres://...` (plus `APP_ENV` and `POSTGRES_*`, unused by Go
  code).
- The `analytics` Compose service passes no `environment:` and the Dockerfile
  sets no `ENV`, so the container runs with an empty env today and works only
  because the port is hardcoded. Therefore `PORT` must default to `"8080"`
  (today's value) while `DATABASE_URL` is the required variable.
- Module is stdlib-only; the health test calls `newHandler()` directly and
  bypasses `main`, so wiring `main` does not disturb it.

## Current-state evidence and relevant files

- `analytics/go/internal/config/doc.go` — doc-only stub.
- `analytics/go/main.go` — hardcoded `:8080`, no env use.
- `analytics/go/main_test.go` — `TestHealthEndpoint` only.
- `analytics/go/go.mod` — `module caribeops/analytics`, stdlib only.
- `analytics/go/.env.example` — documents `PORT` / `DATABASE_URL`.
- `analytics/go/Dockerfile` — no `ENV` lines.
- `docker-compose.yml` (`analytics` service) — no `environment:`.
- `docs/day-4-go-analytics.md` (D4-02 section) — read `DATABASE_URL` and `PORT`
  from env; gate is starting without a required variable fails usefully.

## Learning objectives and just-in-time concept explanation

Twelve-factor config and fail-fast startup: `main` is the composition root —
it loads config once, aborts with a named-variable error before binding any
port, and passes values down. `os.LookupEnv` plus `strings.TrimSpace` turn
"unset or blank" into one check; `strconv.Atoi` plus a range check keep `PORT`
honest without over-validating. `testing.T.Setenv` gives hermetic env tests
(auto-restores; forbids `t.Parallel`).

## Ordered implementation steps

1. Add `analytics/go/internal/config/config.go`: `type Config struct { Port,
   DatabaseURL string }`, `func Load() (Config, error)` — `DATABASE_URL`
   required (trimmed, blank counts as missing, error names `DATABASE_URL`);
   `PORT` optional defaulting to `"8080"` (blank counts as unset; otherwise
   numeric 1–65535, error names `PORT`). No logging of values.
   Rationale: matches the Day-4 required vars while keeping today's Compose
   runtime (empty env) working.
2. Add `analytics/go/internal/config/config_test.go` (`t.Setenv`, no
   `t.Parallel`): missing `DATABASE_URL` errors; blank `DATABASE_URL` errors;
   unset `PORT` yields `8080`; valid pair returns the struct; bad `PORT`
   errors. Rationale: proves the D4-02 contract without starting a server.
3. Wire `analytics/go/main.go`: `cfg, err := config.Load()` → `log.Fatal(err)`
   on failure; `http.ListenAndServe(":"+cfg.Port, ...)`. Keep `newHandler`
   and the log line shape.
   Rationale: implements the Day-4 gate (missing var → non-zero exit with a
   useful message).
4. Verify from `analytics/go/`: `go mod tidy`, `go vet ./...`,
   `go test -count=1 -v ./...`, `go build ./...`; negative probe `go run .`
   with `DATABASE_URL` unset → non-zero exit naming `DATABASE_URL`; from repo
   root: `docker compose config --quiet`, `git diff --check`.
   Expected: all green, no `go.mod` churn, existing health test still passes.

## Tests and verification commands, plus expected results

- `go mod tidy` — clean, no `go.mod`/`go.sum` churn expected (stdlib only).
- `go vet ./...` — clean.
- `go test -count=1 -v ./...` — pass (existing `TestHealthEndpoint` plus new
  config cases).
- `go build ./...` — clean.
- Negative probe: `go run .` with `DATABASE_URL` unset → process exits
  non-zero with a message naming `DATABASE_URL` (fails before binding any
  port, so quick).
- `docker compose config --quiet` from repo root — valid.
- `git diff --check` — clean.

D4-02 gate: starting without the required variable fails with a useful
message. Existing `TestHealthEndpoint` is the `/health` regression guard.

## Risks, dependencies, and unresolved questions

- No new dependencies; stdlib only.
- Secret safety: error messages name variables only, never values.
- `PORT` default preserves the current Compose runtime.
- Exact error strings are set at implement time; any deviation stays within
  this scope.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug `d4-02-create-configuration-package.md` is free; no overwrite.
- Confirmed empty-env Compose runtime — plan defaults `PORT` to `"8080"`
  instead of requiring it, avoiding a Compose breakage the naive reading of
  the Day-4 doc would cause.
- Confirmed the Day-4 gate needs `main` wiring (not a standalone package) —
  included as step 3.
- Rejected scope creep: no `POSTGRES_*` support, no URL parsing, no
  Dockerfile/Compose edits, no new dependencies.
- Strengthened verification: `t.Setenv` isolation noted (no `t.Parallel`),
  negative `go run` probe added, `go.mod`-churn and secret-safety expectations
  explicit.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. New
`analytics/go/internal/config/config.go` (`Config{Port, DatabaseURL}`,
`DefaultPort = "8080"`, `Load()` requiring trimmed non-blank `DATABASE_URL`
and accepting blank-`PORT`-as-default with numeric 1–65535 validation; errors
name variables only) and `config_test.go` (5 `t.Setenv` cases, no
`t.Parallel`); `analytics/go/main.go` wired (`config.Load` → `log.Fatal` on
error, listen on `":"+cfg.Port`; `newHandler` untouched). `go.mod` untouched,
no `go.sum`, no new dependencies. Verification: `go mod tidy` clean,
`go vet ./...` clean, `go test -count=1 ./...` PASS (root + config packages;
3 stub packages `[no test files]`), `go test -count=1 -v ./internal/config/`
5/5 PASS, `go build ./...` clean, negative probe `go run .` with
`DATABASE_URL` unset → exit 1 naming `DATABASE_URL` before binding,
positive probe with `PORT=18081` → `GET /health` `{"status":"ok"}`,
`docker compose config --quiet` OK, `git diff --check` clean. No commit made.
