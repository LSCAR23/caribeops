# CaribeOps — 7-Day Laravel + Go + Next.js Study & Build Plan

## Purpose

CaribeOps is a portfolio project designed to help you learn **Laravel, Go, Next.js, PostgreSQL, and Docker** while building one coherent application that can be demonstrated during a technical interview.

The project is a small tourism operations and analytics platform for businesses such as hotels, restaurants, and tour operators.

The learning strategy is intentionally iterative:

```text
LEARN → CODE → TEST → COMMIT → MOVE TO THE NEXT MICROTASK
```

Each task represents one small, testable unit of work. Avoid combining unrelated tasks into one commit unless there is a strong dependency between them.

---

## Project Architecture

```text
                    ┌─────────────────┐
                    │     Next.js     │
                    │   Web Dashboard │
                    └───────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
        ┌────────────────┐    ┌─────────────────┐
        │    Laravel     │    │       Go        │
        │   Core API     │    │ Analytics API   │
        │ Business Logic │    │ Read/Analytics  │
        └───────┬────────┘    └────────┬────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘

                  Docker Compose
```

### Responsibilities

| Technology | Responsibility |
|---|---|
| Next.js | Dashboard, routing, forms, visualization, API consumption |
| Laravel | Core REST API, business rules, authentication, authorization, validation |
| Go | Read-heavy analytics service and optimized analytics queries |
| PostgreSQL | Persistent relational data and SQL analytics |
| Docker | Reproducible local development environment and service networking |

---

## Core Domain

The initial domain contains:

```text
users
categories
businesses
amenities
business_amenities
reviews
```

Relationships:

```text
Category 1 ──── N Business
Business 1 ──── N Review
Business N ──── N Amenity
User     1 ──── N Business
```

Example categories:

- Hotels
- Restaurants
- Tours

Example analytics:

- Total businesses
- Total reviews
- Average rating
- Businesses by category
- Reviews per month
- Top businesses
- Most common complaints
- Most requested amenities

---

## Final Vertical Flow

The project should eventually support this path:

```text
Browser
  ↓
Next.js
  ↓
Laravel API ───────────────┐
  ↓                        │
PostgreSQL                 │
                           │
Next.js → Go Analytics API │
              ↓            │
         PostgreSQL ←──────┘
```

A strong interview demonstration is:

```text
User opens Analytics
        ↓
Next.js requests analytics
        ↓
Go receives the request
        ↓
Go executes an optimized PostgreSQL query
        ↓
PostgreSQL returns aggregated data
        ↓
Go returns JSON
        ↓
Next.js renders the result
```

---

## Seven-Day Map

### Day 1 — Foundation
Docker, PostgreSQL, Laravel, Next.js, Go, networking, environment configuration.

### Day 2 — Laravel + PostgreSQL
Domain model, migrations, relationships, seed data, CRUD API, Laravel tests.

### Day 3 — Next.js
Dashboard, routing, API client, business pages, forms, filtering, states.

### Day 4 — Go
Go service structure, PostgreSQL access, analytics repository/service/handlers, tests.

### Day 5 — Integration + Performance
Docker images, service networking, read-only analytics database user, dashboards, EXPLAIN, indexes.

### Day 6 — Security + Testing
Authentication, roles, authorization, validation, CORS, rate limiting, automated tests, end-to-end flow.

### Day 7 — Portfolio + Interview
UX polish, analytics polish, documentation, screenshots, final test, Docker rebuild, five-minute demo.

---

## Microtask Rules

For every task:

1. Read the task.
2. Learn only the concept needed for that task.
3. Implement the smallest possible change.
4. Test the change immediately.
5. Commit the change.
6. Move to the next task only when the current task passes.

Suggested commit format:

```text
feat: add businesses migration
feat: add business model relationships
test: add business creation feature test
feat: add businesses endpoint
feat: add business list page
feat: add analytics overview endpoint
```

---

## Final Definition of Done

```text
[ ] Next.js dashboard works
[ ] Laravel REST API works
[ ] Go analytics service works
[ ] PostgreSQL stores relational data
[ ] Docker starts the environment
[ ] Authentication works
[ ] Authorization works
[ ] Business CRUD works
[ ] Analytics work
[ ] At least one SQL optimization is documented
[ ] Laravel tests pass
[ ] Go tests pass
[ ] Frontend tests pass
[ ] One end-to-end flow passes
[ ] README explains architecture
[ ] Database design is documented
[ ] API is documented
[ ] Project starts from a clean Docker build
[ ] Five-minute interview demo is prepared
```

---

## Day Files

- `day-1-foundation.md`
- `day-2-laravel-postgresql.md`
- `day-3-nextjs.md`
- `day-4-go-analytics.md`
- `day-5-integration-performance.md`
- `day-6-security-testing.md`
- `day-7-portfolio-interview.md`
