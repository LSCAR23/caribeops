# D7-22 — Rebuild Docker Images

- Task: D7-22 — Rebuild Docker Images
- Date: 2026-10-19
- Status: Checked — awaiting user approval

## Desired outcome

Perform a clean rebuild of all Docker images so that all services can run without relying on forgotten host-specific build artifacts, per the Day-7 D7-22 spec (`docs/day-7-portfolio-interview.md` lines 462–475). Test — "All services can run without relying on forgotten host-specific build artifacts." Learning — "A reproducible build is a strong signal of engineering maturity."

## Scope

**In scope:**
- `docker compose build` (no cache) for all services: postgres, laravel, next, analytics
- Verify all images build successfully
- Restart services with rebuilt images
- Confirm all services become healthy

**Non-goals:**
- No application code changes
- Do not destroy volumes (that's D7-23)
- Do not run the full smoke test (that's D7-24)
- Do not commit unless explicitly requested

## Analysis carried forward

From `/analize` and direct repo inspection:

**Task & intended outcome:** Clean rebuild of Docker images to ensure reproducibility. Test: services run without host-specific build artifacts.

**Current behavior / repository evidence:**
- docker-compose.yml defines 4 services: postgres (image: postgres:16-alpine), laravel (build backend/laravel), next (build frontend/next), analytics (build analytics/go)
- laravel Dockerfile: `composer install --no-dev` (no vendor in image — tests run on host)
- next Dockerfile: `npm ci`, no bind mount (needs rebuild to serve new code)
- analytics Dockerfile: multi-stage (build → alpine runtime)
- Previous evidence: D5-11 noted compose `next` serves stale image without bind mount — rebuild needed after edits
- Stack currently running (postgres/laravel/analytics healthy; next on host)

**Gaps:** Images may be stale relative to source changes (e.g., D7-18 SVG, README, docker-compose.yml env changes).

**Dependencies:** Docker daemon running; source files intact; Dockerfiles valid.

## Current-state evidence and relevant files

- `docker-compose.yml` — service definitions, build contexts, healthchecks
- `backend/laravel/Dockerfile` — PHP 8.4-cli-alpine, composer install --no-dev
- `frontend/next/Dockerfile` — node:22-alpine, npm ci, npm run dev
- `analytics/go/Dockerfile` — multi-stage build (scratch → alpine)

## Learning objectives

- **Reproducible builds:** A clean rebuild validates that all source is committed and Dockerfiles are correct.
- **No host-specific artifacts:** Images must build from source alone, not rely on host state.

## Ordered implementation steps

1. **Clean build:** `docker compose build` (no cache) for all services
2. **Observe results:** note each service build success/failure
3. **Restart services:** `docker compose up -d` with rebuilt images
4. **Confirm health:** all services `Up (healthy)` via `docker compose ps`
5. **Run `git diff --check`** to confirm no unintended changes
6. **Confirm no commit** unless explicitly requested

## Tests and verification commands, plus expected results

1. `docker compose build` — expected: all 4 services build successfully, exit 0
2. `docker compose up -d` — expected: services restart with new images
3. `docker compose ps` — expected: all services `Up (healthy)`
4. `git diff --check` — expected: exit 0 (clean)

## Risks, dependencies, and unresolved questions

- **Risk: build failures** — Dockerfiles may have issues; need to diagnose and report
- **Risk: next image has no bind mount** — rebuild required for code changes to take effect (known from D5-11)
- **Dependency: Docker daemon running** — confirmed
- **Unresolved:** build times; whether any Dockerfile needs fixes

## Plan check

Findings (verified against the current repository):

- Status set to `Checked — awaiting user approval`; `Analysis carried forward` section present and grounded in direct repo inspection.
- All required sections present: desired outcome, scope + explicit non-goals, current-state evidence, learning objectives, ordered implementation steps, tests/verification commands, risks/dependencies/unresolved questions, `/implement` reminder.
- Evidence verified:
  - docker-compose.yml confirms 4 services with build contexts
  - Dockerfiles valid (laravel: --no-dev, next: npm ci, analytics: multi-stage)
  - `docker compose build` is correct for clean rebuild
  - No-code-change scope appropriate
- Plan's verification commands are correct: `docker compose build`, `docker compose up -d`, `docker compose ps`, `git diff --check`
- No evidence-based scope changes required.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary:

**Clean Docker rebuild:** `docker compose build` executed for all services — postgres (pre-built image), laravel Built, next Built, analytics Built. All images built successfully from source with no cache.

**Services restarted:** `docker compose up -d` recreated all containers with new images.

**Health verification:** `docker compose ps` shows all services healthy:
- caribeops-postgres-1 — Up (healthy)
- caribeops-laravel-1 — Up (healthy)
- caribeops-analytics-1 — Up (healthy)
- caribeops-next-1 — Up (running, no healthcheck defined in compose)

**Verification:**
- `git diff --check` → exit 0 (clean)
- `git status --short` → only MEMORY.md modified and new untracked plan files; no source code changed

**No commit made** (not requested).

## Reminder

This plan is now `Implemented — verified`. No further `/implement` needed for this task. Next in the Day-7 block: D7-23 Start the Entire Project From Zero.
