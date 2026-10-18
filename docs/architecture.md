# CaribeOps — Architecture

A developer should be able to understand this system without reading source code.
This document covers the component diagram, per-technology responsibilities, the
representative request flows, and the Docker runtime. Schema details live in
`docs/database.md` (D7-10) and the SQL optimization story in `docs/performance.md`
(D7-12).

## 1. Component diagram

```text
                         Browser
                           │
                           ▼
                   ┌─────────────────┐
                   │     Next.js     │  UI, routing, dashboard, forms,
                   │  (port 3000)    │  API consumption
                   └────────┬────────┘
                            │ HTTP: Bearer token (Laravel)
                            │ HTTP: plain JSON      (Go)
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌───────────────┐             ┌──────────────────┐
    │    Laravel    │             │      Go          │
    │  Core API     │             │  Analytics API   │
    │   :8000       │             │    :8080         │
    │               │             │                  │
    │  REST API     │             │  Read-only       │
    │  (13 routes)  │             │  analytics SQL   │
    └───────┬───────┘             └────────┬─────────┘
            │                              │
            │ SQL                          │ SQL (SELECT only)
            ▼                              ▼
    ┌─────────────────────────────────────────────┐
    │           PostgreSQL  (port 5433/5432)      │
    │  users · categories · businesses ·          │
    │  amenities · business_amenities · reviews   │
    │  personal_access_tokens · sessions …        │
    └─────────────────────────────────────────────┘

Docker Compose: single `backend` network, `postgres_data` volume,
service-name addressing (laravel:8000, analytics:8080), healthchecks
on every service.
```

### What each box owns

| Box | Role | Key detail |
|-----|------|------------|
| Next.js | Presentation layer | App Router; never holds business logic or DB access |
| Laravel | Transactional business domain | REST API, Sanctum auth, policies, validation, rate limiting |
| Go | Read-heavy analytics | 4 aggregated endpoints, SELECT-only DB role |
| PostgreSQL | Relational storage + analytics | 7 domain tables, `reviews(business_id)` index (D5-19) |

## 2. Responsibilities

### Next.js — Dashboard & UI (frontend/next/)

Owns **UI, routing, dashboard, forms, and API consumption**. Responsibilities are explicitly separate from backend concerns: Next.js contains no business rules and no database access — it calls Laravel and Go over HTTP.

- **Routing:** App Router pages — `/` (dashboard), `/login`, `/businesses`, `/businesses/[id]`, `/businesses/new`, `/analytics`.
- **Dashboard:** KPI grid (Go overview + Laravel summary card), "Live operations snapshot", "What data is available" list, "Get started" navigation.
- **Forms:** `LoginForm`, `NewBusinessForm`/`BusinessForm` with client-side validation.
- **API consumption:** `src/lib/api-client.ts` for Laravel (auto-attaches Bearer token from `src/lib/auth.ts`); `src/lib/analytics-client.ts` for Go — kept in a separate file so the two-backend boundary is visible in code, not only in docs.
- **Resilience:** per-section `<Suspense>` islands (`GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`) with `SectionFallback`; `connection()` / `instant=false` so builds do not require backends; `RequireAuth` optimistic route guard.

### Laravel — Core API & Business Domain (backend/laravel/)

Owns **business logic, CRUD, authentication, authorization, and validation**. Laravel manages the main transactional domain; Go is deliberately not used for writes or business mutations.

- **Business logic:** domain model users → categories → businesses → amenities → reviews (N:N via `business_amenities`), plus ownership (`user_id` on businesses).
- **CRUD:** `POST /businesses`, `GET /businesses`, `GET /businesses/{id}`, `PUT /businesses/{id}`, `DELETE /businesses/{id}` (`routes/api.php`).
- **Authentication:** Sanctum API tokens (`HasApiTokens`, `personal_access_tokens` table); `POST /login` (`LoginRequest` + `Auth::attempt`), `POST /logout` (revokes current token), `GET /me` (current user).
- **Authorization:** `BusinessPolicy` — create/update/delete; non-viewer roles; admin bypass; strict owner-match with null-guard; `can` middleware on write routes (`auth:sanctum` first, then `can`, so 401 precedes 403).
- **Validation:** `StoreBusinessRequest` (`user_id => prohibited`, ownership immutable via API), `LoginRequest`; rate limiters `throttle:login` (10/min email+IP) and `throttle:reads` (60/min IP) in `AppServiceProvider`.
- **Read endpoints:** `GET /health`, `GET /categories`, `GET /dashboard/summary`, `GET /businesses` (category slug filter + `?search=` + pagination), `GET /businesses/{id}/amenities`, `GET /businesses/{id}/reviews`.

### Go — Analytics API (analytics/go/)

Owns **analytics, aggregation, read-only database access, and performance-oriented queries**. Go is isolated as a read-heavy analytics service — a clear second-backend-language use case, not "Go because it's popular". No writes, no authentication, no business mutations.

- **Endpoints (all GET, read-only):** `GET /health`, `GET /analytics/overview`, `GET /analytics/businesses-by-category`, `GET /analytics/reviews-by-month`, `GET /analytics/top-businesses` (`analytics/go/main.go`).
- **Aggregation:** `COUNT(*)`, `AVG(rating)`, `GROUP BY`, `date_trunc('month', …)` executed in PostgreSQL; single integer/float shipped instead of raw rows.
- **Read-only DB access:** connects as the `analytics` PostgreSQL role with `SELECT`-only grants on the three Go-read tables (`businesses`, `categories`, `reviews`) via `docker/postgres-init/01-analytics-role.sh` + `02-analytics-grants.sql`.
- **Performance-oriented queries:** parameterized `pgx` SQL with optional inclusive `::date` bounds (`from`/`to`), indexed join key `reviews.business_id` (`reviews_business_id_index`, D5-19), `LIMIT` clamping (1–100) on top-businesses.
- **Layered design:** `config` → `db` (pgxpool with Ping) → `repository` (6-method interface + `Postgres` impl) → `service` (`OverviewService`) → `handler` (thin handlers) → `main`. SQL never leaks into HTTP; handlers return generic 500s with details logged server-side; date validation (`from <= to`, YYYY-MM-DD) returns 400.

### PostgreSQL — Relational storage & SQL analytics

Stores the relational domain and serves the aggregated analytical queries. Full schema, constraints, and indexes are documented in `docs/database.md` (derived from the 10 Laravel migrations); the `reviews(business_id)` index and its honest before/after measurement are in `docs/performance.md`.

### Docker — Infrastructure (docker-compose.yml)

Owns containers, services, networking, volumes, and environment variables so the multi-service stack starts reproducibly.

- **Containers / services:** `postgres` (postgres:16-alpine, :5432, healthcheck `pg_isready`), `laravel` (build backend/laravel, :8000, `depends_on: postgres` healthy, healthcheck `/api/health`), `next` (build frontend/next, :3000), `analytics` (build analytics/go, :8080, `DATABASE_URL` with analytics credentials, healthcheck `/health`).
- **Networking:** single `backend` bridge network; containers reach each other by Compose service name (`laravel:8000`, `analytics:8080`, `postgres:5432`) — never `localhost` from inside a container (D5-06/D5-11 lesson); host reaches published ports on 127.0.0.1 only (5433, 8000, 3000, 8080).
- **Volumes:** named volume `postgres_data` (persists across restarts; `docker compose down -v` destroys it); initdb mount `./docker/postgres-init:/docker-entrypoint-initdb.d:ro` bootstraps the `analytics` login role and its `SELECT`-only grants on first init.
- **Environment variables:** `POSTGRES_DB/User/Password`, `POSTGRES_PORT`, `ANALYTICS_DB_PASSWORD` (`.env.example`); Laravel `APP_ENV/APP_DEBUG/APP_URL`, `DB_*`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=file`; Next `NODE_ENV`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ANALYTICS_URL`; Go `DATABASE_URL`, `PORT` (default 8080).
- **Startup:** `docker compose up --build -d` (Makefile target `up`); health-gated ordering (`laravel` waits for `postgres` healthy). Smoke checks: `make smoke` curls `/api/health`, `/health`, and Next.js.

## 3. Request flows

### Flow A — User opens Analytics (the full stack story)

```text
User clicks Analytics
        ↓
Next.js server renders /analytics (connection(), instant=false)
        ↓
4 per-section Suspense islands fetch Go in parallel:
  GET /analytics/overview      →  Go  →  PostgreSQL (COUNT/AVG)
  GET /analytics/businesses-by-category  →  Go  →  PostgreSQL (LEFT JOIN + GROUP BY)
  GET /analytics/reviews-by-month        →  Go  →  PostgreSQL (date_trunc + GROUP BY)
  GET /analytics/top-businesses          →  Go  →  PostgreSQL (INNER JOIN + AVG + ORDER BY + LIMIT)
        ↓
PostgreSQL returns aggregated rows (analytics role, SELECT only)
        ↓
Go returns JSON to Next.js
        ↓
Next.js renders each chart/KPI section independently;
a slow Go section degrades via SectionFallback, never blocks the others.
```

### Flow B — User browses the business list (Laravel path)

```text
User opens /businesses
        ↓
Next.js calls GET /api/businesses?category=<slug>&search=<q>&page=2
        ↓
Laravel: throttle:reads → list closure → with('category')
  → when('category') whereHas('category.slug')
  → when('search') where('name','ilike',…) → orderBy('id') → paginate()
        ↓
PostgreSQL returns the page; BusinessResource serializes
        ↓
Next.js renders list + Prev/Next "Page X of Y"; SearchInput preserves
  category + search in the URL (shareable, back-button safe)
```

## 4. Relationship to other docs

- `docs/database.md` (D7-10): ER diagram, relationships, constraints, indexes — derived from the 10 Laravel migrations.
- `docs/performance.md` (D7-12): SQL optimization story (Problem → Original query → EXPLAIN → Index decision → New plan → Result → Reproduce).
- `docs/README.md`: high-level diagram + technology responsibility table (this file expands it to component level).
- `docs/day-7-portfolio-interview.md`: Day-7 task list and interview talking points.
