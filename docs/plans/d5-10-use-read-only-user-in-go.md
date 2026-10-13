# D5-10 — Use Read-Only User in Go

**Task:** D5-10 — Use Read-Only User in Go
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-09
> precedent recorded in `MEMORY.md`.

**Desired outcome:** The analytics service authenticates as `analytics`, serves
every endpoint correctly, and stays `healthy` — proving least privilege
end-to-end.

**Scope:** Compose `DATABASE_URL` → analytics-role credentials; analytics
`.env.example` mirror line; full endpoint matrix re-proof under the restricted
role.

**Non-goals:** No Go source changes (nothing to change — zero write paths), no
image rebuild (env-only), no Laravel/postgres/grants changes (all proven), no
secret values in files (interpolation + empty example, as D5-08), no commit.

## Analysis carried forward

Superuser URL in compose `:80` + example mirror; D5-09 grants live and proven;
zero write statements in Go source (grep-verified); Go reads only `DATABASE_URL`/
`PORT`; `git` clean at `6d27a72`.

## Current-state evidence

- `docker-compose.yml:80` (superuser URL), `analytics/go/.env.example:11`
  (mirror)
- `config.go:28-35` (URL required, PORT defaults `8080`); `ANALYTICS_DB_PASSWORD`
  wiring from D5-08
- D5-09 `02-analytics-grants.sql` + live matrix (`40`/`42501`, zero writes)
- `docs/day-5-integration-performance.md:184-193`

## Learning objectives and just-in-time concepts

Least privilege lands only at adoption; per-service credentials; env-only changes
as zero-build deploys (compose recreates, image untouched).

## Ordered implementation steps

1. Edit compose analytics env: `DATABASE_URL:
   postgres://analytics:${ANALYTICS_DB_PASSWORD:-<same-default>}@postgres:5432/${POSTGRES_DB:-caribeops}?sslmode=disable`.
   Rationale: same default as the postgres side (single dev secret, no drift);
   service-name host unchanged.
2. Mirror in `analytics/go/.env.example:11` → analytics-role userinfo (keeps the
   D5-07 examples-match-runtime invariant; `POSTGRES_USER/PASSWORD` lines stay —
   still consumed by postgres + Laravel).
3. `docker compose config --quiet` → exit 0 (no secret values echoed anywhere).
4. `docker compose up -d analytics` (env change recreates; no rebuild) →
   container `Started`; `db.Connect` ping as `analytics` must succeed or the
   container crash-loops visibly (fail-fast by design).
5. Endpoint matrix under the restricted role (the task's test): `/health` 200;
   `/analytics/overview` → known `40/320/3.040625`;
   `/analytics/businesses-by-category`, `/analytics/reviews-by-month`,
   `/analytics/top-businesses` → 200 with live shapes; `?limit=many` → 400
   (validation path intact); container back to `healthy`; logs free of auth
   errors.
6. Regression beyond Go: `:8000/api/businesses` 200 (Laravel untouched, still
   superuser — Day 6 scope).
7. `git diff --check` clean; `git status --short` → only compose + analytics
   example (+ new plan file).

## Tests and verification commands, plus expected results

- All 5 analytics routes correct under `analytics`; healthcheck `healthy`; no
  `FATAL`/`permission denied` in container logs.
- Values byte-comparable to pre-switch baselines (overview triple is the anchor).
- `git diff --check` clean. No unit suites (no source change; live matrix covers
  all six queries).

## Risks, dependencies, and unresolved questions

- Daemon down → report blocked.
- Password reserved characters (`@`, `/`, `:`) would need URL percent-encoding —
  dev default avoids this; production secret handling belongs to Day 6.
- Go test-suite-under-restricted-role deliberately omitted: the endpoint matrix
  exercises every query path live; suite needs host toolchain + host-side secrets
  for no extra signal.

## Plan check

- **Revision:** added the URL-encoding limitation to risks (interpolating a raw
  secret into userinfo is correct for the alphanumeric dev default, fragile for
  arbitrary production secrets — flagged, not fixed, Day-6 territory).
- Challenged whether the example mirror is scope creep: no — D5-07's invariant
  (examples match runtime) would otherwise regress the day it was completed.
- Challenged rebuild need: none (env-only; compose recreates the container,
  image untouched) — faster and safer than D5-05's base change.
- Challenged proof strength: healthcheck alone can't prove DB access (`/health`
  is DB-free by design) — hence the full 5-route matrix plus log scan;
  crash-loop fail-fast makes silent breakage impossible.
- Verified: exact lines both files, slug free, `git` clean, zero-write-path grep,
  secret hygiene.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `docker-compose.yml` (analytics `DATABASE_URL` → `analytics`
role + existing password var, same dev default both sides) +
`analytics/go/.env.example` (mirror line keeps the D5-07 invariant); plan file
materialized at this path verbatim from the checked inline deliverable — no scope
change. No source, no rebuild, no secret values in files.

**Verification (exact commands/results — the task's test, under the role):**
- `docker compose config --quiet` → exit 0.
- `docker compose up -d analytics` → recreated (env-only, no rebuild),
  `Started` with no crash-loop (pool ping as `analytics` succeeded).
- `/health` → `{"status":"ok"}`; `/analytics/overview` → `40/320/3.040625`
  (byte-identical to pre-switch baseline); `businesses-by-category` →
  `16/16/8`; `reviews-by-month` → live month series; `top-businesses?limit=2` →
  ranked rows (avg `4.375` top); `?limit=many` → `400`.
- Container back to `healthy`; log scan for `FATAL|permission denied|password
  authentication failed` → zero hits.
- Regression: `:8000/api/businesses` 200 live rows (Laravel untouched, still
  superuser per Day-6 scope).
- `git diff --check` → clean; `git status --short` → only the two intended files
  (+ new plan file). No unit suites (no source change; matrix covers all six
  queries).
