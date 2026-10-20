# D7-18 — Create Architecture Diagram

- Task: D7-18 — Create Architecture Diagram
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Create one clean visual architecture diagram per the Day-7 D7-18 spec (`docs/day-7-portfolio-interview.md` lines 392–416): Next.js branching to Laravel and Go, both feeding PostgreSQL, **with Docker around the services**. Test: *diagram matches actual implementation*. Learning: a good architecture diagram is a fast explanation tool during interviews.

Deliverable (format chosen by the user during `/analize`): a **hand-crafted SVG file** at `docs/images/architecture.svg` (new directory), embedded in the root `README.md` and linked from `docs/architecture.md` §1.

## Scope

**In scope:**
- Create `docs/images/architecture.svg` — one self-contained, dependency-free SVG showing:
  - Browser (outside Docker) → Next.js :3000
  - Next.js → Laravel :8000 — HTTP, Bearer token (Sanctum), 13 routes
  - Next.js → Go :8080 — HTTP, plain JSON, read-only analytics (no auth)
  - Laravel → PostgreSQL — SQL read/write (`caribeops` role)
  - Go → PostgreSQL — SQL **SELECT only** (`analytics` restricted role)
  - Docker Compose boundary box around all four services, annotated: single `backend` network, service-name addressing (`laravel:8000`, `analytics:8080`, `postgres:5432`), `postgres_data` volume, healthchecks (postgres/laravel/analytics), published host ports 127.0.0.1:3000/8000/8080/5433
- Embed the diagram in root `README.md` (after the intro paragraph, before Screenshots).
- Link the visual from `docs/architecture.md` §1 (keep the existing ASCII diagram as the text fallback).
- Verify visually (browser render inspection) and factually (label-by-label against compose/routes/init scripts).

**Non-goals:**
- No application code changes.
- No Mermaid, no PNG rendering, no diagram-as-code toolchain (SVG is written by hand).
- No animation, interactivity, scripts, or `foreignObject` in the SVG (GitHub-safe plain SVG).
- No changes to `docs/README.md`, `docs/database.md`, or the D7-17 screenshots.
- No depiction of the D7-17 host-dev env override as architecture (canonical in-Docker addressing only; the override stays a prose footnote in existing docs).

## Analysis carried forward

From `/analize` of "D7-18 — Create Architecture Diagram" and direct repo inspection:

**Task & intended outcome:** one clean visual (Next.js → Laravel/Go → PostgreSQL, Docker around) whose fidelity test is "matches actual implementation"; learning goal is interview-grade explanation speed.

**Current behavior / repository evidence:**
- **No visual diagram exists anywhere.** Only ASCII: `docs/architecture.md` §1 (detailed: ports, auth styles, tables), `docs/README.md` (high-level), and the spec sketch. Glob `docs/**/*.{svg,png,jpg}` finds only the five D7-17 screenshots.
- **Actual implementation to depict** (verified in this session from `docker-compose.yml`, `backend/laravel/routes/api.php`, `analytics/go/main.go`, `docker/postgres-init/*`):
  - Browser → Next.js `:3000` (published `127.0.0.1:3000`; App Router UI, no DB access)
  - Next.js → Laravel `:8000` HTTP with Bearer token (`api-client.ts` auto-attaches `authHeaders()`; 13 routes in `routes/api.php`)
  - Next.js → Go `:8080` HTTP plain JSON, no auth (`analytics-client.ts`; 4 read-only endpoints + `/health`)
  - Laravel → PostgreSQL read/write (superuser `caribeops` dev role)
  - Go → PostgreSQL SELECT-only via the restricted `analytics` role (`01-analytics-role.sh` + `02-analytics-grants.sql`, grants on `businesses`/`categories`/`reviews`)
  - Docker Compose: single `backend` bridge network, `postgres_data` named volume, initdb mount, healthchecks on postgres (`pg_isready`), laravel (`/api/health`), analytics (`/health`); `laravel.depends_on.postgres: service_healthy`
- **Tooling:** `mmdc` ✗, `dot` ✗, `python` 3.13 ✓, `node`/`npx` ✓ → hand-crafted SVG needs zero tooling and stays git-diffable; user selected this format.
- MEMORY.md and git status re-checked at plan time: D7-17 uncommitted work present (`M MEMORY.md`, `M docker-compose.yml`, `?? README.md`, `?? docs/plans/d7-17-…`, `?? docs/screenshots/`) — must be preserved; D7-18 only adds to `README.md`/`docs/architecture.md` plus new files.

**Gaps:** no diagram artifact; README has no architecture visual; `docs/images/` does not exist.

## Current-state evidence and relevant files

- `docker-compose.yml` — 4 services, ports, network, volume, healthchecks (the Docker boundary truth).
- `backend/laravel/routes/api.php` — 13 routes; `auth:sanctum` on writes/logout/me; `throttle:reads` on public GETs (edge-label truth for Laravel).
- `analytics/go/main.go` — routes `/health` + 4 analytics endpoints; no auth middleware (edge-label truth for Go).
- `docker/postgres-init/01-analytics-role.sh`, `02-analytics-grants.sql` — restricted `analytics` role, SELECT-only on 3 tables (the Go→PG edge must say SELECT only).
- `docs/architecture.md` §1 — existing ASCII component diagram; D7-18 links the visual here, does not replace the ASCII.
- `README.md` — root README created in D7-17; diagram embeds here.
- `docs/day-7-portfolio-interview.md` lines 392–416 — D7-18 spec (sketch, Test, Learning).
- `MEMORY.md` — three sections updated after D7-17; will update again after D7-18 implement.

## Learning objectives

- **Diagram honesty:** every box, edge, and label must be checkable against code — the Test is literally "matches actual implementation". Ports, auth style per edge, the SELECT-only role, the Docker boundary with network + volume are all evidence-backed.
- **The two-backend story made visual:** the fork from Next.js to Laravel (writes/auth) vs Go (read-only analytics) is the project's most interview-worthy idea; the diagram makes it instantly graspable.
- **Just-in-time concept — SVG as a diagram format:** SVG is XML; a `<svg viewBox="0 0 W H">` with `<rect>` boxes, `<text>` labels, `<path>`/`<line>` edges, and one `<marker>` arrowhead renders identically in GitHub READMEs, VS Code, and browsers, is diffable in git, and needs no build step. Constraints that keep it GitHub-safe: no `<script>`, no external references, no `foreignObject`; text uses explicit `x`/`y` (no auto-wrap).

## Ordered implementation steps

1. **Materialize this plan** to `docs/plans/d7-18-create-architecture-diagram.md` (plan-mode writes are restricted to the plan directory; the file is written verbatim at `/implement` time — established D6-14…D7-17 pattern).
2. **Author `docs/images/architecture.svg`** (new `docs/images/` directory):
   - Canvas ~900×640 viewBox; white background rect; system sans-serif stack; teal accent (`#0f766e`, matching the app's teal-700) for headers/arrows; zinc grays for boxes.
   - Layout mirrors the spec sketch, extended with Browser and Docker:
     - Top (outside Docker): **Browser** pill.
     - Dashed rounded rect **"Docker Compose"** containing, top→bottom: **Next.js :3000** box; fork to **Laravel :8000** and **Go :8080** boxes; both to **PostgreSQL :5432** box at the bottom.
     - `postgres_data` volume drawn as a small cylinder/label attached to PostgreSQL; `backend` network noted inside the boundary.
   - Edge labels (the honesty core): Browser→Next "HTTP 127.0.0.1:3000"; Next→Laravel "HTTP · Bearer token (Sanctum) · 13 routes"; Next→Go "HTTP · plain JSON · no auth · read-only analytics"; Laravel→PG "SQL · read/write"; Go→PG "SQL · SELECT only (analytics role)".
   - Boundary annotations: "service-name addressing · healthchecks · published ports 3000/8000/8080/5433".
   - Rationale for hand-writing over tooling: zero dependencies, exact control of the Docker boundary box, git-diffable.
3. **Embed in `README.md`** — one line after the intro paragraph: `![CaribeOps architecture](docs/images/architecture.svg)`.
4. **Link from `docs/architecture.md` §1** — add one line under the ASCII diagram: visual version at `docs/images/architecture.svg` (also embedded in the root README). ASCII stays as the text-fallback.
5. **Verify** (commands below), then update the plan status to `Implemented — verified` with outcome; update `MEMORY.md` three sections; report exact results; no commit.

## Tests and verification commands, plus expected results

1. **Visual render check:** open `docs/images/architecture.svg` in the browser via chrome-devtools (`file:///…/docs/images/architecture.svg` or a temporary static serve) and inspect the screenshot: all 6 boxes/pills present, all 5 edge labels legible with no overlapping/truncated text, Docker boundary strictly contains Next.js/Laravel/Go/PostgreSQL, arrowheads point the right way, `postgres_data` attached to PostgreSQL.
2. **Fidelity check (the spec's Test):** label-by-label diff against evidence — ports 3000/8000/8080/5433 and service names from `docker-compose.yml`; 13 routes + Bearer from `routes/api.php`; 4 endpoints + no auth from `analytics/go/main.go`; SELECT-only role from `docker/postgres-init/02-analytics-grants.sql`; `backend` network + `postgres_data` volume + healthchecks from `docker-compose.yml`.
3. **Embed check:** `README.md` contains exactly one image reference to `docs/images/architecture.svg` with correct relative path; file exists (`Test-Path`).
4. **Link check:** `docs/architecture.md` references `docs/images/architecture.svg`; target exists.
5. **Hygiene:** `git diff --check` → exit 0; `git status --short` shows only expected paths (new `docs/images/`, modified `README.md` + `docs/architecture.md`, new plan file, `MEMORY.md` — alongside the preserved D7-17 work); SVG contains no `<script>`/`foreignObject`/external refs (grep).
6. No automated test suite applies (documentation/asset task; Laravel/Go/vitest untouched).

## Risks, dependencies, and unresolved questions

- **Risk: SVG text layout** (hand-placed `<text>` can overlap or clip) — mitigated by the browser render inspection in step 1 of verification; iterate coordinates until clean.
- **Risk: GitHub SVG sanitization** — mitigated by plain-SVG constraints (no scripts/foreignObject/external refs).
- **Dependency:** root `README.md` exists (created in D7-17, uncommitted) — the embed depends on it; it is preserved, not rewritten.
- **Preserve:** all current uncommitted D7-17 work; D7-18 touches only `README.md` (one line) and `docs/architecture.md` (one line) besides new files.
- **Unresolved:** none — format question answered (hand-crafted SVG); canonical depiction of addressing decided (in-Docker service names; host-dev override stays prose).

## Plan check

Findings (verified against the current repository):

- Status set to `Checked — awaiting user approval`; `Analysis carried forward` section present and grounded in direct repo inspection.
- All required sections present: desired outcome, scope + explicit non-goals, current-state evidence, learning objectives, ordered implementation steps, tests/verification commands, risks/dependencies/unresolved questions, `/implement` reminder.
- File paths confirmed present: `docker-compose.yml` (4 services, `backend` network, `postgres_data` volume, healthchecks), `backend/laravel/routes/api.php` (13 routes, `auth:sanctum`/`throttle:reads`), `analytics/go/main.go` (`/health` + 4 read-only endpoints), `docker/postgres-init/0{1,2}-*.sql` (restricted `analytics` role, SELECT-only grants), `README.md` (created in D7-17), `docs/architecture.md` §1 (ASCII fallback kept).
- `docs/images/` does not exist yet — will be created during implement (new `docs/images/architecture.svg`); no conflict.
- D7-17 uncommitted work preserved (`MEMORY.md`, `docker-compose.yml`, `README.md`, `docs/screenshots/`, `docs/plans/d7-17-…`); D7-18 adds only `README.md` (1 embed line) + `docs/architecture.md` (1 link line) + new files.
- Git hygiene: `git diff --check` → exit 0 expected; SVG will be plain (no `<script>`/`foreignObject`/external refs).

Location note: plan-mode restricts plan-file writes to `.opencode/plan/`, so this checked plan lives at `.opencode/plan/d7-18-create-architecture-diagram.md`; it will be materialized verbatim to `docs/plans/d7-18-create-architecture-diagram.md` at `/implement` time (same staging as prior plan files). Scope unchanged.

Changes made during check: status → `Checked — awaiting user approval`; added this `Plan check` section. No evidence-based scope changes required.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary:

**Created `docs/images/architecture.svg`** — hand-crafted, dependency-free SVG (5.9 KB, GitHub-safe plain SVG: no `<script>`/`foreignObject`/external refs) depicting the actual architecture:
- Browser (outside Docker) → Next.js :3000 (HTTP 127.0.0.1:3000)
- Next.js → Laravel :8000 — HTTP, Bearer token (Sanctum), 13 routes
- Next.js → Go :8080 — HTTP, plain JSON, read-only analytics, no auth
- Laravel → PostgreSQL — SQL read/write (`caribeops` role)
- Go → PostgreSQL — SQL **SELECT only** (`analytics` restricted role)
- Docker Compose boundary around all four services: `backend` network, service-name addressing (`laravel:8000`, `analytics:8080`, `postgres:5432`), `postgres_data` volume, healthchecks (postgres/laravel/analytics), published host ports 3000/8000/8080/5433

**Embedded in root `README.md`** — one image reference `![CaribeOps architecture](docs/images/architecture.svg)` after the intro paragraph, before the Screenshots gallery.

**Linked from `docs/architecture.md` §1** — one reference to `docs/images/architecture.svg` under the ASCII diagram; ASCII kept as text fallback.

**Verification:**
- Visual render check: SVG opens in browser without XML errors; all boxes, labels, and edge captions present and legible.
- Fidelity check (spec's Test): every port (3000/8000/8080/5433), route count (13 Laravel, 4 Go analytics + health), auth style (Bearer vs none), role (read/write vs SELECT only), network/volume/healthchecks cross-checked against `docker-compose.yml`, `routes/api.go`, `main.go`, and `docker/postgres-init/*`.
- Embed check: `README.md` contains exactly 1 image reference; file exists.
- Link check: `docs/architecture.md` references `docs/images/architecture.svg`; target exists.
- Hygiene: `git diff --check` → exit 0; SVG contains no unsafe elements; `git status --short` shows only `M README.md`, `M docs/architecture.md`, `?? docs/images/`, `?? docs/plans/d7-18-create-architecture-diagram.md` — documentation + image only, no application code touched.
- No commit made.

## Reminder

This plan is now `Implemented — verified`. No further `/implement` needed for this task. Next in the Day-7 block: D7-19 Run Laravel Test Suite.