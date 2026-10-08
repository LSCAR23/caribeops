# Day 5 — Integration, Docker and PostgreSQL Performance

## Objective

Package the applications properly, connect the frontend to both backend services, establish safer database access for analytics, and document a real SQL optimization.

---

## Learning Outcomes

You should understand:

- Dockerfiles.
- Multi-stage Go builds.
- Service-to-service networking.
- Database roles and permissions.
- Read-only database access.
- Analytics integration.
- PostgreSQL `EXPLAIN`.
- Index selection based on query behavior.
- Measuring before/after performance.

---

# Docker Images

## D5-01 — Create Laravel Dockerfile

### What to do

Create a reproducible image for Laravel.

Include:

- PHP runtime
- required extensions
- Composer dependencies
- application source
- appropriate startup command

### Test

```bash
docker build ...
```

The image should build successfully.

### Learning

A Dockerfile describes how an application becomes a runnable artifact.

---

## D5-02 — Create Next.js Dockerfile

### What to do

Build the frontend into a container.

### Test

Container starts and renders the application.

### Learning

Frontend applications also need reproducible runtime/build environments.

---

## D5-03 — Create Go Multi-Stage Dockerfile

### What to do

Use one stage to compile Go and another lightweight stage to run the resulting binary.

### Test

Build and run the image.

### Learning

Multi-stage builds can separate build dependencies from runtime artifacts.

---

## D5-04 — Add Laravel Health Check

### Test

Docker can determine whether Laravel is available.

### Learning

Health checks make service status visible to orchestration and developers.

---

## D5-05 — Add Go Health Check

### Test

Container becomes healthy only when the health endpoint works.

### Learning

Service readiness is part of container orchestration design.

---

## D5-06 — Use Compose Service Names

### What to do

Make all internal connections use Docker service names.

### Test

The project works even when host IP addresses change.

### Learning

Containerized services should communicate through stable service discovery rather than machine-specific addresses.

---

## D5-07 — Complete `.env.example`

### What to do

Document every required environment variable for every service.

### Test

Compare the example files against actual runtime configuration.

### Learning

Configuration drift is a common source of “works on my machine” problems.

---

# PostgreSQL Permissions

## D5-08 — Create Analytics Database User

### What to do

Create a dedicated PostgreSQL role for Go analytics.

### Test

The role can connect.

### Learning

Different services do not necessarily need identical database permissions.

---

## D5-09 — Make Analytics User Read-Only

### What to do

Grant only the required read access.

### Test

Verify:

```text
SELECT works
INSERT fails
UPDATE fails
DELETE fails
```

### Learning

Least privilege reduces the impact of application bugs or compromised credentials.

---

## D5-10 — Use Read-Only User in Go

### Test

Go analytics still work correctly.

### Learning

Security is most useful when it is implemented at the actual resource boundary, not only assumed in application code.

---

# Service Integration

## D5-11 — Connect Next.js Dashboard to Go Overview

### What to do

Replace temporary KPI logic with:

```text
GET /analytics/overview
```

### Test

Browser values match Go results.

### Learning

The frontend now demonstrates the value of the separate analytics service.

---

## D5-12 — Add Businesses-by-Category Chart

### Test

Chart values match Go's endpoint.

### Learning

Visualization is a consumer of analytics data, not the source of the calculation.

---

## D5-13 — Add Reviews-by-Month Chart

### Test

Chart values match SQL results.

### Learning

Time-series data can be represented in a form that is useful to a business user.

---

## D5-14 — Add Top Businesses Section

### Test

UI ordering matches the Go API.

### Learning

Keep ranking logic on the backend so the definition of the metric is consistent for all clients.

---

## D5-15 — Add Analytics Loading States

### Test

Disable Go temporarily and verify analytics-specific loading/error behavior.

### Learning

A dashboard may depend on multiple services. Each dependency should fail predictably.

---

## D5-16 — Add Analytics Error Handling

### Test

Stop the Go service and confirm the rest of the dashboard remains understandable rather than appearing completely broken.

### Learning

Partial failure is common in distributed systems, even in small projects.

---

# PostgreSQL Performance

## D5-17 — Identify a Candidate Slow Query

### What to do

Choose one analytics query operating on the seeded dataset.

### Test

Measure execution and inspect its query plan.

### Learning

Optimization should start from evidence rather than guesswork.

---

## D5-18 — Run `EXPLAIN`

### What to do

Inspect the execution plan.

Look for:

- sequential scans
- expensive sorts
- large row counts
- joins that process more rows than expected

### Test

Save the relevant plan in `docs/performance.md`.

### Learning

`EXPLAIN` shows how PostgreSQL plans to execute a query.

---

## D5-19 — Add a Targeted Index

### What to do

Choose an index based on the actual filter, join, grouping, or ordering pattern.

### Test

Run the query plan again.

### Learning

Indexes should be designed for workload patterns, not added blindly to every column.

---

## D5-20 — Compare Before and After

### What to do

Measure the same query before and after the index.

Document:

```text
query
before
index
after
observations
```

### Test

The comparison is reproducible using the same dataset and query.

### Learning

A performance claim is stronger when supported by measurable evidence.

---

## D5-21 — Add the Performance Index as a Migration

### What to do

Create a Laravel migration for the chosen index.

### Test

Rebuild the database from scratch and verify the index appears.

### Learning

Performance changes belong in source-controlled schema evolution.

---

## D5-22 — Commit Day 5

```text
feat: integrate analytics service and optimize database queries
```

## Day 5 Checkpoint

```text
Next.js → Laravel ✅
Next.js → Go      ✅
Go → PostgreSQL   ✅
Laravel → PostgreSQL ✅
Read-only analytics role ✅
Docker images ✅
Performance evidence ✅
```
