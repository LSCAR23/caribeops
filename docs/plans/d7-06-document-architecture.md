# D7-06 — Document Architecture

- Task: D7-06 — Document Architecture
- Date: 2026-10-18
- Status: Checked — awaiting user approval

## Desired outcome

Create `docs/architecture.md` so a developer can understand the system without reading source code. It must include:

- Component diagram (Next.js ↔ Laravel ↔ Go ↔ PostgreSQL, with Docker around services)
- Responsibilities per technology
- Request flow (a representative end-to-end request traced through the stack)

## Scope

- New file `docs/architecture.md` only. No application code changes.
- Use evidence from the actual repo: `docker-compose.yml`, `backend/laravel/routes/api.php`, `analytics/go/main.go`, Next.js App Router pages/components, `docs/README.md` existing high-level diagram.
- Responsibilities section covers: Next.js (UI, routing, dashboard, forms, API consumption), Laravel (business logic, CRUD, authentication, authorization, validation), Go (analytics, aggregation, read-only DB access, performance-oriented queries), PostgreSQL (relational storage + SQL analytics), Docker (containers, services, networking, volumes, env vars).
- Request flow: one worked example (e.g. user opens Analytics → Next.js → Go → PostgreSQL → JSON → Next.js renders chart), plus a note on the Laravel business path (e.g. GET /businesses).

Non-goals:
- No code changes, no new dependencies, no tests.
- No screenshots (that's D7-17).
- No detailed endpoint contract (that's D7-16 API docs).

## Analysis carried forward

From `/analize` of the D7-06→D7-12 block and repo inspection:

- `docs/architecture.md` does not exist. `docs/README.md` (lines 19-53) has a high-level ASCII diagram (Next.js → Laravel/Go → PostgreSQL, Docker Compose) and a responsibilities table — a good starting point but not component-level and without request flow.
- Laravel (`backend/laravel/routes/api.php`): 13 routes — `POST /login`, `POST /logout`, `GET /me`, `GET /health`, `GET /categories`, `GET /dashboard/summary`, `GET /businesses`, `GET /businesses/{id}`, `GET /businesses/{id}/amenities`, `GET /businesses/{id}/reviews`, `POST /businesses`, `PUT /businesses/{id}`, `DELETE /businesses/{id}`. Sanctum auth (`HasApiTokens`, `personal_access_tokens` table), limiters `throttle:login`/`throttle:reads`, `BusinessPolicy` (create/update/delete with admin bypass), `StoreBusinessRequest` (`user_id => prohibited`).
- Go (`analytics/go/main.go`): 4 read-only analytics endpoints `GET /analytics/{overview,businesses-by-category,reviews-by-month,top-businesses}` + `GET /health`. Layers: `config`, `db` (pgxpool), `repository` (6-method interface + `Postgres` impl), `service` (`OverviewService`), `handler` (thin handlers, `parseDateRange`, generic 500s).
- Next.js (`frontend/next/`): App Router, `connection()`/`instant=false`, per-section Suspense islands (`GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`), `api-client.ts` (Laravel Bearer), `analytics-client.ts` (Go, kept separate so the service boundary is visible in code), `RequireAuth` protects routes.
- Docker (`docker-compose.yml`): services `postgres`/`laravel`/`next`/`analytics` on network `backend`, volume `postgres_data`, initdb `docker/postgres-init/{01-analytics-role.sh,02-analytics-grants.sql}`, healthchecks, ports 5433/8000/3000/8080.
- Existing `docs/README.md` diagram and responsibility table can be quoted/expanded, not replaced.

## Current-state evidence and relevant files

- `docs/README.md` — existing high-level architecture diagram + responsibilities table (lines 19-53), to reuse/expand.
- `docker-compose.yml` — 4 services, network, volumes, env vars, healthchecks (D7-11 evidence too).
- `backend/laravel/routes/api.php` — full route list + middleware + policies (D7-07 evidence).
- `analytics/go/main.go`, `internal/handler/`, `internal/service/overview.go`, `internal/repository/repository.go` — Go surface (D7-08 evidence).
- `frontend/next/src/app/`, `src/lib/api-client.ts`, `src/lib/analytics-client.ts`, `src/components/RequireAuth.tsx` — Next.js surface (D7-09 evidence).
- `backend/laravel/database/migrations/*.php` — schema source of truth (D7-10 evidence).
- `docs/performance.md` — existing SQL optimization story (D7-12 evidence).

## Learning objectives

- Architecture documentation as a portfolio artifact: a reviewer must grok the system without opening source.
- Service boundary: Laravel = transactional business domain (auth, CRUD, validation); Go = isolated read-heavy analytics; Next.js = UI layer; PostgreSQL = relational storage; Docker = reproducible multi-service runtime.
- Request flow as the interview demo thread (also D7-26).

## Ordered implementation steps

1. Write `docs/architecture.md` with: title/purpose, component diagram (ASCII or Mermaid), responsibilities per technology (next to existing README table), representative request flows (Analytics via Go; business list/detail via Laravel), and a "data flow" note on Docker networking.
2. Keep language concise and interview-ready; every claim traceable to a real file/route listed above.
3. Verify the file renders as valid markdown and paths referenced actually exist.

## Tests and verification commands, plus expected results

- File exists at `docs/architecture.md`; markdown is well-formed (headings, code fence for diagram).
- `git diff --check` clean; `git status` shows only `docs/architecture.md` (+ this plan file).
- No application tests affected (documentation-only).

## Risks, dependencies, and unresolved questions

- Risk: none — documentation only, no code.
- Dependency: none new.
- Unresolved: none — all content grounded in verified repo files.

## Plan check

- Confirmed `docs/architecture.md` does not exist; `docs/README.md` (lines 19-53) holds a high-level diagram + responsibilities table to expand, not replace.
- All plan content verified against real files: `routes/api.php` (13 routes + Sanctum + policies + limiters), `analytics/go/main.go` + handler/repository/service layers (5 endpoints), Next.js App Router + `api-client`/`analytics-client` split, `docker-compose.yml` (4 services, backend network, `postgres_data` volume, healthchecks).
- No application code changes, no new dependencies, no tests affected; documentation-only.
- No material decisions pending — every claim is traceable to a verified repo file.
- Status → `Checked — awaiting user approval`; date `2026-10-18`.

## Reminder

Implementation is not authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d7-06-document-architecture.md"` with this plan path.

## Implementation outcome

- Implemented D7-06 — Document Architecture: created `docs/architecture.md` with the component diagram (Next.js ↔ Laravel ↔ Go ↔ PostgreSQL, Docker around services), per-technology responsibilities (Next.js: UI/routing/dashboard/forms/API consumption; Laravel: business logic/CRUD/authentication/authorization/validation; Go: analytics/aggregation/read-only DB access/performance-oriented queries; PostgreSQL: relational storage; Docker: containers/services/networking/volumes/env vars), and two representative request flows (Analytics via Go → PostgreSQL → JSON → Next.js; business list via Laravel → PostgreSQL → Next.js). The same file now also hosts the D7-07 Laravel, D7-08 Go, D7-09 Next.js, and D7-11 Docker responsibility subsections, so those tasks are covered by this deliverable.
- Verification: `git diff --check` clean (only pre-existing LF/CRLF warnings in existing files); `git status --short` shows only `docs/architecture.md` as the new file from this task; every path referenced in the document was confirmed present in the repo. No application code changed; no tests affected.
- No commit made.
