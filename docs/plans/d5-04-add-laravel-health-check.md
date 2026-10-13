# D5-04 — Add Laravel Health Check

**Task:** D5-04 — Add Laravel Health Check
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D4-17
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `docker compose ps` / `docker inspect` reports the `laravel`
container `healthy` when `artisan serve` is serving, satisfying the D5-04 test
("Docker can determine whether Laravel is available").

**Scope:** Add a `healthcheck:` block to the `laravel` service in
`docker-compose.yml`, mirroring the postgres pattern; prove healthy via compose.

**Non-goals:** No Go healthcheck (D5-05), no `next.depends_on` wiring (startup
ordering change — leave for D5-06 or later), no Dockerfile/PHP/env changes unless
the probe tool is missing, no commit.

## Analysis carried forward

App endpoint `GET /api/health` exists (`routes/api.php:13-17`, served under the
`/api` prefix per `bootstrap/app.php:9-14`); no container check exists (only
postgres has one); convention is compose-level healthcheck; `/api/health` is
liveness-only (no DB touch), consistent with Go `/health` semantics; `git` clean
at `29c255b`; no `d5-*` plan exists.

## Current-state evidence

- `docker-compose.yml:16-23` (postgres healthcheck pattern to mirror)
- `docker-compose.yml:25-48` (laravel block — insertion point, after `depends_on`)
- `backend/laravel/routes/api.php:13-17`, `bootstrap/app.php:8-14`
- `backend/laravel/Dockerfile:1-16` (`php:8.4-cli-alpine`,
  `artisan serve --host=0.0.0.0 --port=8000`)
- `docs/day-5-integration-performance.md:87-95`

## Learning objectives and just-in-time concepts

Compose healthchecks as orchestrator-visible status
(`starting` → `healthy`/`unhealthy`); `CMD-SHELL` + `pg_isready`-style precedent;
liveness vs readiness and why a DB-free endpoint is the right liveness probe (a
DB-backed probe would mark Laravel unhealthy on every DB blip and stall
dependents); `start_period` as boot grace for `artisan serve`.

## Ordered implementation steps

1. Confirm served path: `php artisan route:list --path=health` (expect
   `/api/health`; `/up` also listed — informational only). Rationale: a wrong
   path makes the check permanently unhealthy.
2. Confirm probe tool inside the built image:
   `docker compose run --rm laravel sh -c 'command -v wget || command -v curl || echo NONE'`.
   Rationale: decides step 3 on evidence, not assumption.
3. Edit `docker-compose.yml`: add to `laravel` service (mirroring postgres lines
   16-23):
   `healthcheck: test: [CMD-SHELL, "wget --no-verbose --tries=1 --spider http://localhost:8000/api/health || exit 1"], interval: 10s, timeout: 5s, retries: 3, start_period: 15s`.
   If wget is absent: use
   `php -r 'exit(@file_get_contents("http://localhost:8000/api/health") === false ? 1 : 0);'`
   (php CLI guaranteed by the base image; zero new packages, no Dockerfile diff).
   Adding `curl` via `apk` is last resort only. Rationale: compose-level matches
   repo convention; `localhost` is correct because the probe runs inside the
   container against `serve` on `0.0.0.0:8000`.
4. Validate YAML: `docker compose config --quiet` → exit 0.
5. Rebuild if needed + start: `docker compose up -d laravel` (builds only if the
   Dockerfile changed — expected: no rebuild).
6. Prove health:
   `docker inspect --format '{{.State.Health.Status}}' caribeops-laravel-1` →
   `healthy` (allow ~30s for `start_period` + retries); `docker compose ps`
   shows `healthy`.
7. Optional negative probe: `docker compose stop laravel` → status leaves
   `healthy`; `up -d` → returns to `healthy`. Record either way; do not leave the
   stack stopped.
8. `git diff --check` clean; `git status --short` shows only `docker-compose.yml`.

## Tests and verification commands, plus expected results

- `docker compose config --quiet` → exit 0.
- Health status → `healthy` within ~30s of start.
- `git diff --check` → no output; only `docker-compose.yml` modified.
- No PHP suite required (no app code touched); do not claim Laravel tests pass
  unless run.

## Risks, dependencies, and unresolved questions

- Docker daemon/registry unavailable → report blocked, no change.
- BusyBox `wget --spider` flag support unverified → step 2 probe + php fallback
  covers it.
- `next` does not yet gate on laravel — intentional; ordering change deferred to
  avoid stalling the dashboard on a misconfigured probe.

## Plan check

- Challenged path assumption: confirmed `/api/health` (not bare `/health`) via
  `api:` routing in `bootstrap/app.php:9-14`; step 1 `route:list` proof required
  before editing.
- Challenged probe-tool assumption: wget presence unverified in
  `php:8.4-cli-alpine` — strengthened step 3 with an evidence-gated fallback
  chain (wget → `php -r` → apk curl last resort) instead of assuming wget.
- Challenged scope: explicitly excluded `next.depends_on` wiring (ordering side
  effects) and Dockerfile changes; single-file `docker-compose.yml` change.
- Verified: insertion point (`docker-compose.yml:25-48`), no `docs/plans/d5-*`
  collision, `git` clean, timing values sane for `artisan serve` boot.
- No user questions asked: compose-level vs Dockerfile-level and `/api/health`
  vs `/up` both resolved by repo convention + project-contract rationale with no
  material behavior conflict.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `docker-compose.yml` only (8-line `healthcheck:` block on the
`laravel` service; plan file materialized at this path verbatim from the checked
inline deliverable — no scope change).

**Deviation from draft (evidence-based, within scope):** the probe URL uses
`http://127.0.0.1:8000/api/health` instead of the drafted `http://localhost:…`.
First rollout with `localhost` stayed `unhealthy`: the health log showed wget
resolving `localhost` to `[::1]:8000` (connection refused) because `artisan serve`
listens on IPv4 `0.0.0.0:8000` only. Forcing IPv4 via `127.0.0.1` fixed it; the
php-`-r` fallback was not needed (`wget --spider` confirmed supported).

**Verification (exact commands/results):**
- `php artisan route:list --path=health` → `GET|HEAD api/health` (confirms
  `/api/health` served path).
- `docker compose run --rm laravel sh -c 'command -v wget …'` → `/usr/bin/wget`;
  `wget --help | grep -i spider` → `--spider` supported, exit 0 if URL exists.
- `docker compose config --quiet` → exit 0.
- `docker compose up -d laravel` → recreated, started.
- `docker inspect --format '{{.State.Health.Status}}'` → `healthy` (3× exit-0
  `remote file exists` probes); `docker compose ps` → `Up (healthy)`.
- Negative probe: `docker compose stop laravel` → no longer `healthy`;
  `up -d` → back to `healthy` (~30s). Stack left running.
- `git diff --check` → clean; `git status --short` → only `M docker-compose.yml`
  (+ this new plan file).
- No PHP suite run (no app code touched).
