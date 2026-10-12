# D4-15 — Add Query Parameters

**Task:** D4-15 — Add Query Parameters
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-15-add-query-parameters.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

Clients control the slice — `?limit=` on top-businesses, `?category=` slug on
businesses-by-category, `?from=` / `?to=` (`YYYY-MM-DD`, inclusive) on
reviews-by-month. Gate (Day-4): changed parameters change results.

## Scope

- Repository: `BusinessesByCategory(ctx, category string)` (`""` = all;
  `WHERE c.slug = $1` when set; unknown slug → 200 empty, listing semantics)
  and `ReviewsByMonth(ctx, from, to time.Time)` (`IsZero` = unbounded side;
  `WHERE review_date >= $1 AND <= $2`). `TopBusinesses(ctx, limit)` unchanged.
  Dynamic `WHERE` built with positional args (no string interpolation of
  values).
- Handler: parse + validate per endpoint — limit absent → 10, valid 1–100 →
  use, else 400; dates parsed `2006-01-02`, invalid or `from > to` → 400;
  category passed through raw (unknown → empty 200, never 400). 400 bodies
  name the bad param (`{"error":"invalid limit ..."}` style); 500 contract
  untouched.
- Ripple updates (mechanical, compiler-checked): `AnalyticsProvider` +
  `handler/analytics_test.go` fake, `main_test.go` stub,
  `service/overview_test.go` 6-method fake, existing live tests to new
  signatures (unfiltered defaults).
- Tests: handler unit cases per param (default/valid/invalid × three
  endpoints, DB-free) + live filtered proofs (limit=2 → 2 rows;
  category=tours → 1 row of 16; from/to window → subset summing ≤ 320).

## Non-goals

- New endpoints.
- Service-layer changes (trio untouched).
- Error mapping (D4-16).
- Other filters.
- New dependencies.
- Compose changes.

## Analysis carried forward

- Handlers ignore query strings; only `TopBusinesses` is parameterized.
- 4-test-file ripple identified.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/handler/analytics.go` (fixed-shape handlers).
- `analytics/go/internal/repository/repository.go` (filterless signatures).
- The three D4-11–13 method bodies.
- `docs/day-4-go-analytics.md` (D4-15 section).

## Learning objectives and just-in-time concept explanation

Parse-at-the-edge (HTTP owns string→typed conversion and 400s),
filter-at-the-source (`WHERE` keeps unneeded rows off the wire),
unbounded-by-default (empty/zero = today's behavior, so the default path
needs no branching in callers).

## Ordered implementation steps

1. Change the two repository signatures + `WHERE` support in `postgres.go`
   (positional args only).
2. Update handler parsing/validation + wire params through; `AnalyticsProvider`
   follows the new signatures.
3. Update all four fakes/stubs + existing live tests to new signatures
   (unfiltered).
4. Add handler unit cases + live filtered proofs.
5. Verify from `analytics/go/`: `gofmt -l .`, `go vet ./...`,
   `go build ./...`, `go test -count=1 ./...` (no DB); live `go run` probes
   (`?limit=2`, `?category=tours`, `?from/&to=`, invalid → 400s);
   `docker compose up -d --build analytics` + curl param matrix; from root:
   `docker compose config --quiet`, `git diff --check`. Expected: all green.

## Tests and verification commands, plus expected results

- `gofmt -l .` — no output.
- `go vet ./...` — clean.
- `go build ./...` — clean.
- `go test -count=1 ./...` with no DB — pass (handler tests DB-free).
- Live `go run` probe — all three endpoints 200 with real values.
- Rebuilt container — param matrix 200s/400s as specified.
- `docker compose config --quiet` — valid.
- `git diff --check` — clean.

Unit parsing matrix (DB-free) + live filtered-vs-unfiltered differentiation
(the Day-4 "result changes accordingly" gate) + rebuilt-container param
matrix.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Max-100 clamp prevents LIMIT abuse.
- Echoing the client's own bad value in 400s is safe (no secrets involved).

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact signatures and all four ripple files.
- Locked param→endpoint mapping (limit→top, category→by-category,
  from/to→by-month) covering all four Day-4 examples with nowhere else
  sensible to put them.
- Locked validation semantics (400s for malformed, empty-200 for unknown
  slug, clamp 1–100) with rationale; rejected 404 for unknown slug (listing,
  not lookup).
- Locked positional-args-only dynamic SQL (no value interpolation —
  injection-safe by construction).
- Strengthened verification: live differentiation proofs per param + container
  param matrix, not just 200s.
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12. Repository: `BusinessesByCategory(ctx,
category)` (`WHERE c.slug = $1` when set) and `ReviewsByMonth(ctx, from, to)`
(positional `WHERE`/`AND review_date` bounds, `IsZero` = unbounded);
`TopBusinesses` unchanged; multi-row methods now return `[]` instead of null
on empty. Handler: `?limit=` (default 10, valid 1–100, else 400),
`?category=` passthrough (unknown → 200 `[]`), `?from`/`?to` `YYYY-MM-DD`
inclusive (malformed or from-after-to → 400); 500 contract untouched.
Ripple: `AnalyticsProvider` + all 4 fakes/stubs + existing live tests moved
to new signatures (unfiltered). Tests: 4 new handler unit cases (limit
matrix, range, rejects, slug passthrough) + live `TestPostgresFilteredQueries`
(top2=2, tours single row, unknown empty, 2024 window sum 8 ≤ 320).
Verification: `gofmt -l .` no output, `go vet`/`go build` clean,
`go test -count=1 ./...` PASS with no DB, live `go run` differentiation
verified (`?limit=2` 2 rows, `?category=tours` 1 row, 2024 window 5 rows,
`?limit=many`/`?from=yesterday` 400s, `?category=nope` 200 `[]`), rebuilt
container param matrix green (`?limit=2`, `?category=tours`, `?limit=0` 400,
overview regression), `docker compose config --quiet` OK,
`git diff --check` clean. One probe artifact (`out.txt`) removed. No commit
made.
