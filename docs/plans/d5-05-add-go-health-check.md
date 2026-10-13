# D5-05 — Add Go Health Check

**Task:** D5-05 — Add Go Health Check
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-04
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `docker compose ps` / `docker inspect` reports the
`analytics` container `healthy` only when `GET /health` serves, satisfying the
D5-05 test.

**Scope:** Change runtime base `scratch` → `alpine` in `analytics/go/Dockerfile`;
add `healthcheck:` to the `analytics` service in `docker-compose.yml`; prove
healthy via compose.

**Non-goals:** No Go source changes (no embedded probe subcommand — larger scope,
speculative), no Dockerfile `HEALTHCHECK` (breaks repo convention), no
`depends_on`/restart-policy changes (startup-ordering side effects, deferred), no
Next/Laravel/postgres changes, no commit.

## Analysis carried forward

`/health` exists and is DB-free (`main.go:39-44`); no container check exists;
`scratch` runtime has no shell so a base change is structurally required;
convention is compose-level + wget (D5-04 precedent incl. the IPv4 lesson); `git`
clean at `9809704`; `d5-05-*` slug free.

## Current-state evidence

- `analytics/go/Dockerfile:1-16` (`FROM scratch`, binary-only runtime)
- `analytics/go/main.go:37-44` (`GET /health` static JSON;
  `ListenAndServe(":"+cfg.Port)`)
- `docker-compose.yml:73-82` (analytics block, no healthcheck), `:16-23`
  (postgres pattern), D5-04 laravel block (wget pattern)
- `docs/day-5-integration-performance.md:99-107`

## Learning objectives and just-in-time concepts

Why minimal images resist shell probes and the standard answer (alpine runtime,
build stage untouched); re-application of the D5-04 IPv4 lesson from the start
(`127.0.0.1`, not `localhost`); liveness vs readiness continuity across all three
Day-5 healthchecks.

## Ordered implementation steps

1. Confirm port default: read `internal/config` (`DefaultPort`, expect `8080`) —
   compose sets no `PORT`, so the probe targets `:8080`.
2. Prove probe tooling on alpine before editing compose: `docker compose run --rm`
   a throwaway check or `docker run --rm alpine sh -c 'wget --spider --help'` —
   expect `--spider` supported. Rationale: decides the exact test string on
   evidence.
3. Edit `analytics/go/Dockerfile`: `FROM scratch` → `FROM alpine` (build stage
   untouched; no `apk add` — BusyBox wget ships with alpine). Rationale: smallest
   change that makes a shell probe possible; multi-stage shape preserved.
4. Edit `docker-compose.yml`: add to `analytics` service, mirroring D5-04 —
   `test: [CMD-SHELL, "wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1"]`,
   `interval: 10s`, `timeout: 5s`, `retries: 3`, `start_period: 10s`. Rationale:
   compose-level matches convention; `127.0.0.1` applies the D5-04 IPv4 lesson
   pre-emptively.
5. `docker compose config --quiet` → exit 0. Then `docker compose build analytics`
   (required — base image changed) + `docker compose up -d analytics`.
6. Prove health: `docker inspect --format '{{.State.Health.Status}}'` → `healthy`
   (~30s allowance); `docker compose ps` → `Up (healthy)`. Confirm the binary
   still serves real data (`curl localhost:8080/analytics/overview` shape
   unchanged — regression, not a new feature).
7. Negative probe: `docker compose stop analytics` → leaves `healthy`; `up -d` →
   `healthy` again. Record; leave stack running.
8. `git diff --check` clean; `git status --short` → only `Dockerfile` +
   `docker-compose.yml`.

## Tests and verification commands, plus expected results

- `config --quiet` exit 0; image builds (`build analytics` exit 0).
- Health → `healthy`; overview endpoint still returns live data (no regression
  from base change).
- `git diff --check` clean; only the two intended files modified. No Go unit suite
  required (no source touched).

## Risks, dependencies, and unresolved questions

- Registry/daemon unavailable → report blocked, no change.
- Image grows ~7MB and D5-03 minimalism softens — the flagged reviewer decision
  (see Plan check).
- DB-down boot behavior unchanged (process exits, no restart policy) —
  pre-existing, out of scope.

## Plan check

- Challenged the base change against alternatives (Dockerfile `HEALTHCHECK`,
  Go-embedded probe, shell-less TCP check): compose-level + alpine is the only
  option that is both viable on evidence and convention-consistent;
  embedded-probe would ripple into Go source/tests speculatively. Decision flagged
  for reviewer, not silent.
- Challenged probe path/port: `/health` at root confirmed (`main.go:39`, no
  prefix — unlike Laravel's `/api`); `:8080` follows from unset `PORT` +
  `DefaultPort` (step 1 re-confirms in code, not memory).
- Challenged IPv6 repeat: `127.0.0.1` baked in from the start per D5-04
  health-log evidence, not retried as an experiment.
- Challenged scope: `depends_on`/restart policy explicitly excluded (same
  reasoning as D5-04's `next.depends_on` exclusion); rebuild step mandatory here
  (base change) unlike D5-04.
- Honest limitation: the negative direction ("unhealthy when endpoint broken") is
  approximated via stop-probe; breaking the endpoint itself would require a code
  change outside scope.
- Verified: both file paths, slug free, `git` clean, timing sane for sub-second
  Go boot.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `analytics/go/Dockerfile` (1 line: runtime `FROM scratch` →
`FROM alpine`; build stage untouched) + `docker-compose.yml` (8-line
`healthcheck:` block on the `analytics` service); plan file materialized at this
path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results):**
- `internal/config/config.go:12` confirms `DefaultPort = "8080"`; compose sets no
  `PORT` → probe targets `:8080`.
- `docker run --rm alpine sh -c 'command -v wget; wget --help | grep -i spider'`
  → `/usr/bin/wget`, `--spider` supported (exit 0 if URL exists).
- `docker compose config --quiet` → exit 0.
- `docker compose build analytics` → exit 0 (binary recompiled clean, 17.9s).
- `docker compose up -d analytics` → recreated, started.
- `docker inspect --format '{{.State.Health.Status}}'` → `healthy` (4× exit-0
  `remote file exists` probes); `docker compose ps` → `Up (healthy)`.
- Regression: `GET :8080/analytics/overview` →
  `{"businesses":40,"reviews":320,"average_rating":3.040625}` — live seed data,
  byte-identical shape to pre-change behavior.
- Negative probe: `docker compose stop analytics` → no longer `healthy`;
  `up -d` → `healthy` (~30s). Full stack left running (all three `healthy`).
- `git diff --check` → clean; `git status --short` → only `M Dockerfile`,
  `M docker-compose.yml` (+ this new plan file).
- No Go unit suite run (no source touched); image build itself proves compilation.
