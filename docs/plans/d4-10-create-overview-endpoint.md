# D4-10 — Create Overview Endpoint

**Task:** D4-10 — Create Overview Endpoint
**Date:** 2026-10-11
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-10-create-overview-endpoint.md`

> Note (2026-10-11, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

`GET /analytics/overview` returns HTTP 200 with the Day-4 JSON
(`businesses`, `reviews`, `average_rating`) from the live service stack.
Gate: HTTP 200 and correct JSON.

## Scope

- New `internal/handler/overview.go`: narrow `OverviewProvider` interface
  (`GetOverview(ctx) (service.Overview, error)`, satisfied implicitly by
  `*service.OverviewService`) + `NewOverviewHandler(p) http.Handler` — 200 +
  JSON on success; on error, server-side log and generic 500
  `{"error":"overview unavailable"}`.
- `main.go`: compose `repository.NewPostgres(pool)` →
  `service.NewOverviewService` → `handler.NewOverviewHandler`;
  `newHandler(svc OverviewProvider)` registers health (unchanged) +
  `GET /analytics/overview`.
- `main_test.go`: update `TestHealthEndpoint` with a one-method stub provider;
  health assertions byte-identical.
- New `internal/handler/overview_test.go`: httptest success (200,
  content-type, decoded struct equals fake values) + failure (500, generic
  body, no internals leaked).

## Non-goals

- Other endpoints (D4-14).
- Query params (D4-15).
- Full error mapping (D4-16 refines the generic 500).
- Rounding policy.
- New dependencies.
- Compose changes.

## Analysis carried forward

- Mux serves health only; `newHandler()` is zero-arg so its signature must
  change with a test update.
- Service ready with JSON-tagged struct; handler package is a stub.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/main.go` (mux + composition root).
- `analytics/go/main_test.go` (`TestHealthEndpoint` calls zero-arg
  `newHandler()`).
- `analytics/go/internal/service/overview.go` (`Overview` + `GetOverview`).
- `analytics/go/internal/handler/doc.go` (doc-only stub).
- `docs/day-4-go-analytics.md` (D4-10 section).

## Learning objectives and just-in-time concept explanation

Thin handlers own HTTP only — method routing, status codes, content-type,
envelope — while the narrow provider interface keeps the handler testable
with a 10-line stub and depending on behavior, not the concrete service.
`main` is the composition root: concrete types meet only there.

## Ordered implementation steps

1. Add `handler/overview.go` as scoped (provider interface + constructor +
   handler func).
2. Add `handler/overview_test.go` (success + failure via httptest, no DB).
3. Edit `main.go`: build repo → service → handler, pass provider into
   `newHandler`, register both routes; health body untouched.
4. Update `main_test.go` with the one-method stub; health expectations
   unchanged.
5. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB); live `go run` with
   host DB → `GET /analytics/overview` 200 with real values cross-checked
   against D4-06–08 logs (40/320/3.0406); `docker compose up -d --build
   analytics` + `curl :8080/analytics/overview` 200; from root:
   `docker compose config --quiet`, `git diff --check`. Expected: all green.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (handler tests DB-free).
- Live `go run` probe — 200 with real values.
- Rebuilt container `:8080/analytics/overview` — 200.
- `docker compose config --quiet` — valid.
- `git diff --check` — clean.

Handler unit tests (DB-free) + health regression + live endpoint proof with
real numbers + rebuilt-container proof. The Day-4 gate is the live 200 +
correct JSON.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Generic-500 choice is D4-16's explicitly deferred refinement, recorded.
- Method-not-allowed behavior comes free from the `GET` mux pattern.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact injection point (`newHandler`) and
  its test caller.
- Locked narrow provider interface over concrete-service dependency with
  recorded rationale (10-line vs 6-method stubs; consumer-side interface
  complements D4-05).
- Locked generic-500-plus-log as the D4-16-deferred minimum; rejected echoing
  service/pgx errors to clients.
- Confirmed live values have a cross-check baseline (D4-06–08 logs), so
  "correct JSON" is verifiable, not eyeballed.
- Added rebuilt-container proof (main wiring changes the served binary).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-11. New `internal/handler/overview.go`
(`OverviewProvider` 1-method iface + `NewOverviewHandler`: 200 + JSON, else
logged generic 500) and `overview_test.go` (httptest success/failure,
DB-free). `main.go` composes Postgres → service → handler with
`newHandler(svc)` registering health (untouched) + `GET /analytics/overview`;
`main_test.go` gained a 1-method stub with byte-identical health assertions.
One recorded deviation: `OverviewService` now takes a narrow
`OverviewRepository` trio interface (new in `service/overview.go`) instead of
the full `repository.Repository` — the partially implemented `*Postgres`
(3/6 methods) cannot satisfy the full interface, which failed the build; the
narrowing is consumer-side-idiomatic, keeps the D4-09 fake compiling
unchanged, and the full-interface assertion still belongs to D4-13.
Verification: `gofmt -l .` no output, `go vet`/`go build` clean,
`go test -count=1 ./...` PASS with no DB (handler 2/2 + health PASS),
live `go run` probe `:18083/analytics/overview` →
`{"businesses":40,"reviews":320,"average_rating":3.040625}` (matches D4-06–08),
`docker compose up -d --build analytics` succeeded with rebuilt
`:8080/analytics/overview` 200 identical, `:8080/health` 200,
`docker compose config --quiet` OK, `git diff --check` clean. No commit made.
