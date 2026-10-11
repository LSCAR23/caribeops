# D4-01 — Define Go Project Structure

**Task:** D4-01 — Define Go Project Structure
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-01-define-go-project-structure.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`analytics/go/` contains `cmd/`, `internal/config/`, `internal/handler/`,
`internal/repository/`, `internal/service/`, and `tests/` boundaries, the
existing `/health` behavior is unchanged, and `go test ./...` run from
`analytics/go/` is green.

## Scope

Filesystem-only scaffolding plus minimal package stubs that compile. No logic
moves, no config/env wiring, no DB driver, no handler refactor, no
Dockerfile/Compose/Makefile changes unless verification forces it.

## Non-goals

- D4-02 config package logic.
- D4-03 PostgreSQL driver / connection pool.
- D4-04 `/health` rework.
- D4-05+ repository / service / handler code.
- Dependency additions.
- `main.go` relocation to `cmd/`.

## Analysis carried forward

- Flat `package main` health service at `analytics/go/main.go` (`newHandler()`
  with `GET /health` returning `{"status":"ok"}` JSON) plus
  `analytics/go/main_test.go` (`TestHealthEndpoint` asserting 200,
  `application/json`, exact body).
- Module `caribeops/analytics`, Go 1.25.6, stdlib only, no dependencies.
- Dockerfile builds the root package (`COPY . .` then `go build -o /analytics .`
  into `scratch`, `EXPOSE 8080`); moving `main` to `cmd/` now would break it.
- Compose `analytics` service uses context `./analytics/go`, host
  `127.0.0.1:8080:8080`.
- Day-4 target tree (`cmd/`, `internal/config|handler|repository|service/`,
  `tests/`) is absent; git tree is clean.
- No `d4-01-*` plan existed; slug `d4-01-define-go-project-structure.md` is free.
- Keep root `main` in D4-01 to avoid breaking the Docker build; use minimal
  stubs so `go test ./...` keeps compiling.

## Current-state evidence and relevant files

- `analytics/go/go.mod` — `module caribeops/analytics`, `go 1.25.6`.
- `analytics/go/main.go` — flat `package main`, `newHandler()`, `GET /health`.
- `analytics/go/main_test.go` — `TestHealthEndpoint` regression guard.
- `analytics/go/Dockerfile` — multi-stage build of root package, `scratch` final.
- `analytics/go/.env.example` — documents `PORT`, `POSTGRES_*`, `DATABASE_URL`
  (unread by code until D4-02).
- `docker-compose.yml` (`analytics` service) — context `./analytics/go`.
- `docs/day-4-go-analytics.md` (D4-01 section + target structure) — folders and
  package boundaries; gate is `go test ./...` still compiles.
- `Makefile` (`test` target) — smoke-checks `:8080/health`.

## Learning objectives and just-in-time concept explanation

Practice `internal/` encapsulation and the `cmd/` vs library split, plus the
Handler → Service → Repository separation: HTTP stays thin in `handler`,
coordination lives in `service`, SQL stays in `repository`.

`internal/` packages are only importable inside `caribeops/analytics` — this
enforces the boundary the Day-4 doc wants. `cmd/` is the conventional home for
binaries; library code lives under `internal/` (and later `tests/` holds
integration-style tests while unit tests stay colocated as `*_test.go`).

## Ordered implementation steps

1. From the repo root, create `analytics/go/cmd/`,
   `analytics/go/internal/config/`, `analytics/go/internal/handler/`,
   `analytics/go/internal/repository/`, `analytics/go/internal/service/`, and
   `analytics/go/tests/`.
   Rationale: exact Day-4 target shape with zero code impact.
2. Add one `doc.go` per `internal/*` containing only a package doc comment and
   the `package <name>` clause — no imports. Add `.gitkeep` in `cmd/` and
   `tests/` (code moves there belong to later tasks).
   Rationale: git tracks the shape; Go sees no unused-import breakage.
3. Keep `analytics/go/main.go`, `main_test.go`, `go.mod`, `Dockerfile`, and
   `.env.example` untouched.
   Rationale: smallest diff; preserves `go build -o /analytics .` and the
   health contract.
4. Verify from `analytics/go/`: `go mod tidy`, `go vet ./...`,
   `go test ./...`, `go build ./...`; from repo root:
   `docker compose config`, `git status --short`, `git diff --check`.
   Expected: all green, health test still passes, no tracked content change
   beyond the new scaffold files.

## Tests and verification commands, plus expected results

- `cd analytics/go && go mod tidy` — clean, no `go.mod`/`go.sum` churn expected
  (stdlib only).
- `go vet ./...` — clean.
- `go test ./...` — pass (`TestHealthEndpoint` green; new `internal/*`
  packages have no tests yet but must compile).
- `go build ./...` — clean.
- `docker compose config` from repo root — valid, no service breakage.
- `git diff --check` — clean; `git status --short` shows only new scaffold files.

D4-01 gate: `go test ./...` compiles/passes. Existing `TestHealthEndpoint` is
the regression guard; no new tests required.

## Risks, dependencies, and unresolved questions

- No new dependencies; must stay stdlib-only until D4-03.
- Risk of over-scaffolding real types now — mitigated by docs-only stubs.
- Moving the binary entrypoint to `cmd/` is deferred to D4-02/D4-04 together
  with the Dockerfile update.
- Package names stay singular (`config`, `handler`, `repository`, `service`)
  per the Day-4 target tree.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed no existing `d4-01` plan; slug `d4-01-define-go-project-structure.md`
  is free.
- Confirmed Dockerfile builds the root package — plan avoids the `cmd/` move,
  so no Dockerfile edit is needed.
- Confirmed module path `caribeops/analytics` supports
  `caribeops/analytics/internal/...` imports later.
- Strengthened verification: added `go vet`, `go build`,
  `docker compose config`, and `git diff --check` alongside `go test`.
- Fixed empty-directory tracking: explicit `doc.go` / `.gitkeep` instead of
  bare `mkdir`.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. Created `analytics/go/cmd/.gitkeep`,
`analytics/go/tests/.gitkeep`, and one `doc.go` stub per
`internal/{config,handler,repository,service}/` (package clause + doc comment,
no imports). `main.go`, `main_test.go`, `go.mod`, `Dockerfile`, and
`.env.example` untouched. Verification: `go mod tidy` clean (no `go.mod`
churn, no `go.sum` created), `go vet ./...` clean, `go test -count=1 -v ./...`
PASS (`TestHealthEndpoint` PASS; 4 new packages `[no test files]` as expected),
`go build ./...` clean, `docker compose config --quiet` OK,
`git diff --check` clean, `git status --short` shows only the new scaffold dirs
plus this plan file. No commit made.
