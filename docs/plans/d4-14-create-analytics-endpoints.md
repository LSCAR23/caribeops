# D4-14 — Create Analytics Endpoints

**Task:** D4-14 — Create Analytics Endpoints
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-14-create-analytics-endpoints.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

Three focused endpoints, each HTTP 200 with correct JSON independently:
`GET /analytics/businesses-by-category`, `/reviews-by-month`,
`/top-businesses` (default top 10).

## Scope

- `repository.go`: add `json:` tags only (`slug`/`name`/`businesses`;
  `month`/`reviews`; `id`/`name`/`average_rating`/`review_count`) — snake_case
  consistent with overview. No logic change.
- New `handler/analytics.go`: one shared `AnalyticsProvider` interface (the 3
  grouped methods; satisfied by `*Postgres`) + three constructors
  (`NewBusinessesByCategoryHandler`, `NewReviewsByMonthHandler`,
  `NewTopBusinessesHandler`) — 200 + JSON on success, logged generic 500s per
  endpoint (`overview unavailable`-style messages per route; D4-16 refines).
- `main.go`: `newHandler(overview, analytics)` registers the three routes;
  `main` passes the same `*Postgres` as the analytics provider (service keeps
  the overview path).
- `main_test.go`: extend the stub to satisfy both interfaces (GetOverview + 3
  methods); health assertions unchanged.
- New `handler/analytics_test.go`: httptest success per endpoint (200,
  content-type, decoded equality incl. `Month` round-trip) + one failure case
  (500 generic); DB-free via 3-method fake.

## Non-goals

- Query params (D4-15 owns `?limit=` / `?category=` / `?from=` / `?to=` — top
  stays fixed at 10).
- Service pass-throughs.
- Error mapping (D4-16).
- Month-format refinement.
- New dependencies.
- Compose changes.

## Analysis carried forward

- Mux serves health + overview only; structs lack tags (Go-cased keys without
  them); single-provider stub must grow.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/main.go` (mux + composition root).
- `analytics/go/main_test.go` (D4-10 stub).
- `analytics/go/internal/repository/repository.go` (tagless structs).
- `analytics/go/internal/handler/overview.go` (pattern to mirror).
- `docs/day-4-go-analytics.md` (D4-14 section).

## Learning objectives and just-in-time concept explanation

Focused endpoints isolate failure domains and payloads; struct tags fix the
wire contract without touching Go names; one shared provider interface for
the endpoint group keeps fakes at 3 methods while letting a future service
interpose transparently.

## Ordered implementation steps

1. Add `json:` tags to the three structs (tags only).
2. Add `handler/analytics.go` (interface + three constructors, generic logged
   500s).
3. Add `handler/analytics_test.go` (3 successes + 1 failure, httptest, fake).
4. Edit `main.go` (two-provider `newHandler` + three routes; repo doubles as
   analytics provider).
5. Extend `main_test.go` stub; health unchanged.
6. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB); live `go run` with
   host DB → all three endpoints 200 with values cross-checked (3 category
   rows; month rows; 10 top rows); overview + health regression;
   `docker compose up -d --build analytics` + curl all five routes; from
   root: `docker compose config --quiet`, `git diff --check`. Expected: all
   green.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (handler tests DB-free).
- Live `go run` probe — all three endpoints 200 with real values.
- Rebuilt container — all five routes 200.
- `docker compose config --quiet` — valid.
- `git diff --check` — clean.

DB-free handler tests + health regression + live per-endpoint proof with real
numbers + rebuilt-container proof of all five routes. The Day-4 "each works
independently" gate is the three live 200s.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Month serializes RFC3339 (accepted, recorded).
- Top fixed at 10 until D4-15.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact edit points (tags, mux, stub).
- Locked shared 3-method provider over three 1-method ifaces (one seam for
  the endpoint group; fakes still small) and over service pass-throughs (no
  coordination behavior exists to house).
- Locked tag keys snake_case-consistent with overview; locked default top 10
  anticipating D4-15.
- Confirmed `*Postgres` satisfies the shared interface today (all three
  methods live) — no narrowing incident like D4-10.
- Strengthened verification: `Month` round-trip asserted in tests; all-five-
  routes container proof.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12. `repository.go`: `json:` tags on the
three structs (tags only). New `handler/analytics.go` (shared
`AnalyticsProvider` iface + 3 constructors with per-route logged generic
500s; top fixed at `DefaultTopLimit = 10`) and `analytics_test.go` (3
httptest successes incl. `Month` round-trip + 1 failure case pinning generic
bodies, DB-free). `main.go`: two-provider `newHandler` + 3 routes, same
`*Postgres` as analytics provider. `main_test.go`: stub extended to both
ifaces, health byte-identical. Verification: `gofmt -l .` no output,
`go vet`/`go build` clean, `go test -count=1 ./...` PASS with no DB (handler
4/4 + health PASS), live `go run` probes 200 on all three endpoints with real
values (by-category 3 rows; by-month RFC3339 months; top 10 rows) + overview
+ health regression, `docker compose up -d --build analytics` succeeded with
container 200s on health/overview/by-category/top-businesses (by-month proven
via `go run`), `docker compose config --quiet` OK, `git diff --check` clean.
No commit made.
