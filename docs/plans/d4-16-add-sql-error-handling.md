# D4-16 — Add SQL Error Handling

**Task:** D4-16 — Add SQL Error Handling
**Date:** 2026-10-12
**Status:** Implemented — verified
**Plan path:** `docs/plans/d4-16-add-sql-error-handling.md`

> Note (2026-10-12, `/implement` materialization): this file did not exist at
> `/implement` time because the prior orchestrator session ran in Plan mode,
> which blocks writes to `docs/plans/`. It was materialized verbatim from the
> checked inline deliverable in that conversation (status
> `Checked — awaiting user approval` with `Plan check`); no scope change.

## Desired outcome

With PostgreSQL unavailable, every data route answers controlled generic
500s with zero DB internals on the wire while `/health` stays 200; the
database returns and the service recovers with no restart. Gate (Day-4):
controlled behavior, no leaks.

## Scope

1. Audit (read-only): enumerate every error-to-client path — 4 data handlers
   (generic 500, pinned), 4 validation 400s (client input only), health
   (infallible encode aside), startup `log.Fatal`s (stderr only) — with a leak
   verdict per path.
2. Outage probe against the running `analytics` container:
   `docker compose stop postgres` → curl all five routes → assert four
   generic 500 bodies byte-identical to the healthy-failure contract and
   `/health` still 200; grep bodies for deny-list tokens (`postgres`,
   `SQLSTATE`, `pgx`, `password`, `5432`, `connect`); `docker compose start
   postgres` → re-prove 200s (recovery without restart).
3. Fix only what the probe exposes (expected: nothing). If clean, land zero
   code change and say so — this outcome is explicitly authorized, not a
   failure.
4. Extend test pinning only for exposed gaps (existing exact-body failure
   tests already pin the contract).

## Non-goals

- 503-vs-500 changes (500 stays: established since D4-10, test-pinned,
  doc-silent on codes).
- Typed-error hierarchies.
- Retry / circuit logic.
- Timeout hardening.
- Encode-partial-write rework.
- New dependencies.
- Compose changes.

## Analysis carried forward

- Generic-500 + server-log contract already end to end; failure tests seed
  internals (`"host=db"`) and pin generic bodies; startup errors are
  stderr-only; pgx redacts passwords.
- Tree clean at plan time; slug free.

## Current-state evidence and relevant files

- `analytics/go/internal/handler/analytics.go` + `overview.go` (error
  helpers).
- `analytics_test.go` / `overview_test.go` (failure cases).
- `analytics/go/main.go` (startup fatals).
- `docs/day-4-go-analytics.md` (D4-16 section).

## Learning objectives and just-in-time concept explanation

The failure-domain split — 400s describe client mistakes specifically, 500s
deliberately describe nothing; observability (logs) and client contract
(bodies) are separate channels with opposite detail policies. Liveness
(`/health`, DB-free) vs degraded readiness (data routes) is the observable
shape of a partial outage.

## Ordered implementation steps

1. Audit paths, record verdicts in the outcome (no edits).
2. Run the outage matrix; record every status + body.
3. Deny-list grep over all four 500 bodies.
4. Restart postgres, re-prove all five 200s.
5. Standard `gofmt` / `vet` / `build` / `test` + `git diff --check` (expect
   only plan + MEMORY churn if probe is clean).
6. Write the outcome: verdict per path, probe transcript, fixes (if any) or
   explicit zero-change landing.

## Tests and verification commands, plus expected results

- Existing failure tests (no-leak pins) pass.
- Live outage matrix: 4 × generic 500 + health 200.
- Deny-list grep: no hits.
- Recovery: 5 × 200 without restart.
- `git diff --check` clean.

The Day-4 gate is the probe transcript, not a unit test.

## Risks, dependencies, and unresolved questions

- No new dependencies.
- Forgetting the postgres restart is the one operational risk — restart +
  re-proof is a mandatory step, not cleanup.
- Encode-partial-write accepted as-is, noted.

## Reminder

Implementation is not authorized until the user checks the plan and invokes
`/implement` with this plan path. This `/implement` invocation is that
explicit approval for this checked plan only.

## Plan check

- Confirmed slug free, clean tree, exact audit surface (no new files
  presumed).
- Challenged "what is there to build": the contract predates this task, so
  the plan centers the unrun Day-4 probe and explicitly authorizes a
  zero-change landing — inventing typed errors or 503s would churn the pinned
  contract for no gate benefit.
- Locked 500 (established, pinned, doc-silent) over 503 with rationale; user
  can object at review.
- Locked deny-list grep as the leak check (stronger than eyeballing).
- Made postgres restart + recovery proof mandatory (operational safety).
- Scope preserved; no application code touched during planning.

## Implementation outcome

Implemented — verified on 2026-10-12 as an explicit zero-code-change landing
(authorized by the plan): the outage probe exposed nothing to fix.

Audit verdicts: 4 data handlers → static generic 500s, details server-side
only (pinned by exact-body tests, one seeded with `"host=db"`); 4 validation
400s echo client input only; `/health` has no failure path; startup fatals
are stderr-only with pgx-redacted passwords.

Outage transcript (`docker compose stop postgres`, container kept running):
`/health` 200 `{"status":"ok"}`; overview + 3 analytics routes 500 with
byte-identical generic bodies (`overview unavailable`, `businesses by
category unavailable`, `reviews by month unavailable`, `top businesses
unavailable`); deny-list grep (`postgres|SQLSTATE|pgx|password|5432|connect|
caribeops|dial|FATAL`) over all four bodies — clean; `?limit=many` still 400
during the outage (validation independent of DB).

Recovery (`docker compose start postgres`, no restart): all routes 200 with
real data (overview 40/320/3.040625, tours single row, top-2). Standard:
`gofmt`/`vet`/`build` clean, `go test -count=1 ./...` PASS,
`git diff --check` clean. No application file touched; no commit made.
