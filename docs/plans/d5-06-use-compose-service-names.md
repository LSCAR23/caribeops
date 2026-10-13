# D5-06 — Use Compose Service Names

**Task:** D5-06 — Use Compose Service Names
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-05
> precedent recorded in `MEMORY.md`.

**Desired outcome:** Proven — with evidence, not assertion — that every
inter-service connection resolves via Compose service names, satisfying the D5-06
test.

**Scope:** Connection audit (this plan's inventory, re-verified live) + live stack
proof that the dashboard works end-to-end through DNS names. Explicit zero-change
landing if verification passes (D4-16 precedent).

**Non-goals:** No analytics-URL wiring (no consumer until D5-11 — wiring it now
would be unverifiable; explicitly deferred, not dropped), no
fallback/`APP_URL`/ports/`allowedDevOrigins` changes (all correct in context —
changing them breaks host-local dev or host browsers), no `depends_on` changes,
no commit.

## Analysis carried forward

All three live inter-service targets already use service names (postgres,
`laravel:8000`, `@postgres`); single code entry point (`apiBaseUrl`) with
host-only fallback; Next→Go connection doesn't exist yet; host-loopback values
are all correct-context (publishing, browser URLs, gitignored dev files,
unused-driver defaults); `git` clean at `ce6e026`.

## Current-state evidence

- `docker-compose.yml:34` (DB_HOST), `:67` (API URL + D3-10 comment), `:78`
  (DATABASE_URL)
- `frontend/next/src/lib/api-config.ts:1-6`, `api-client.ts:1,26,59`
- `frontend/next/.env.example:6-8`, `.env.local:1-3` (gitignored),
  `next.config.ts:1-20`
- `backend/laravel/config/database.php:87-91`, `.env:5,24-25` (gitignored
  host-dev)
- `docs/day-5-integration-performance.md:111-124`

## Learning objectives and just-in-time concepts

Reading a compose file as a service-discovery map; why `localhost` inside a
container means the container itself (the D3-10 lesson this task generalizes);
why host-reachable values must stay host-reachable (`APP_URL`, published ports,
dev fallbacks).

## Ordered implementation steps

1. Re-run the connection audit live: grep app source for IP literals/hostnames in
   connection paths; re-read the three compose env targets. Expected: only the
   documented host-context values.
2. `docker compose config` (non-quiet) — record the rendered `next.environment`
   (`http://laravel:8000`), `laravel.DB_HOST` (`postgres`), analytics
   `DATABASE_URL` (`@postgres`) as the discovery map.
3. `docker compose up -d` (full stack) — all three health-gated services must
   reach `healthy`.
4. End-to-end proof through names: host `GET :3000/businesses` renders with live
   data (its server-side fetches resolve `laravel:8000` over the backend
   network); `GET :8080/analytics/overview` returns live seed values (its
   `DATABASE_URL` resolves `postgres`). Record both bodies.
5. If and only if a literal-IP connection is found: fix it to the service name,
   rebuild/restart affected service, re-prove. Otherwise land zero-change
   (plan-authorized, D4-16 precedent).
6. `git diff --check`; `git status --short` → clean (or only intended files).

## Tests and verification commands, plus expected results

- Audit grep → no IP literals in live connection paths.
- `compose config` render → the three service-name targets on record.
- All services `healthy`; dashboard + analytics endpoints return live data
  through DNS names.
- `git diff --check` clean. No unit suites required (no code change expected).

## Risks, dependencies, and unresolved questions

- Daemon down → report blocked, no change.
- Honest limitation: the "changed IPs" test is approximated (audit + live DNS
  proof); literally renumbering the Docker subnet is out of scope.
- If verification fails anywhere, the landing is a fix, not zero-change —
  outcome records whichever occurred.

## Plan check

- **Revision from draft:** dropped the planned one-line
  `NEXT_PUBLIC_ANALYTICS_URL` addition — challenged as speculative (no consumer
  until D5-11, hence unverifiable) and replaced with an explicit audit-and-prove
  scope plus authorized zero-change landing. Reviewer may override at approval:
  if you want the placeholder var now, say so and `/implement` will include it.
- Closed the remaining audit gaps with fresh reads (`next.config.ts`, host
  `.env`) — both correct-context, no stragglers.
- Challenged each host-loopback value for "should it be a service name" — each
  resolves to keep (ports/APP_URL/fallbacks/dev-files serve host contexts;
  service names there would break host access).
- Verified: slug free, `git` clean, steps use only Docker + grep (no app-code
  risk), D4-16 precedent supports the zero-change landing form.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Landing:** Explicit zero-change (plan-authorized, D4-16 precedent). No literal-IP
inter-service connection exists, so no file was fixed. Only this plan file is new
(materialized verbatim from the checked inline deliverable — no scope change).

**Verification (exact commands/results):**
- Audit greps: `frontend/next/src` → sole hit `api-config.ts:5` host-dev fallback;
  `analytics/go` → service-name `.env.example` + opaque test hostnames + one
  deliberately-unreachable `127.0.0.1:1` failure-path DSN (`db_test.go:38`);
  `backend/laravel/app|routes|tests` → zero hits. No fix required.
- `docker compose config` render: `DB_HOST: postgres`,
  `NEXT_PUBLIC_API_URL: http://laravel:8000`,
  `DATABASE_URL: …@postgres:5432/…` on record.
- `docker compose up -d` → full stack up; `compose ps`: postgres/laravel/
  analytics all `(healthy)`, next `Up` (no healthcheck by design).
- End-to-end through DNS names: `:8080/analytics/overview` →
  `{"businesses":40,"reviews":320,"average_rating":3.040625}`;
  `:3000/businesses` → HTTP 200, 42KB HTML containing live seeded business data
  (server-side fetch via `laravel:8000`); `:8000/api/businesses` → live rows
  (Laravel via `DB_HOST=postgres`).
- `git diff --check` → clean; `git status --short` → only this new plan file.
- No unit suites run (no code touched).
