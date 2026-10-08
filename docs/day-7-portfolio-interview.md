# Day 7 — Portfolio Quality and Interview Readiness

## Objective

Stop adding major features. Make the application easy to understand, easy to run, visually convincing, and easy to explain in a technical interview.

---

## Learning Outcomes

You should finish the day able to explain:

- why each technology exists
- how requests flow through the system
- how PostgreSQL is modeled
- where authentication happens
- how Go analytics differs from Laravel business logic
- why a specific index exists
- how Docker runs the environment
- what you would improve next

---

# UI Polish

## D7-01 — Create a Professional Dashboard

### What to do

Make the dashboard immediately communicate:

- what CaribeOps is
- what data is available
- what actions the user can perform

### Test

Show the dashboard to someone unfamiliar with the project and ask what they think the application does.

### Learning

A technical portfolio still needs product clarity.

---

## D7-02 — Improve Business List UX

Add:

- search
- category filter
- pagination

### Test

Verify each control changes the displayed data correctly.

### Learning

Good UI features should map to backend query capabilities rather than relying on hardcoded data manipulation.

---

## D7-03 — Improve Business Details Page

Display:

```text
Business information
Category
Amenities
Rating
Reviews
Owner
```

### Test

All values come from live API data.

### Learning

A detail page demonstrates relationships and API composition clearly.

---

## D7-04 — Improve Analytics Dashboard

Display:

```text
Total businesses
Total reviews
Average rating
Reviews by month
Businesses by category
Top businesses
```

### Test

Every metric is sourced from a backend endpoint.

### Learning

Analytics should communicate trends and rankings, not just raw database rows.

---

## D7-05 — Add Analytics Date Range

Support selections such as:

```text
Last 7 days
Last 30 days
Last 90 days
Custom range
```

### Test

Results change when the selected range changes.

### Learning

Date filtering is a common real-world analytics requirement and a useful SQL exercise.

---

# Documentation

## D7-06 — Document Architecture

### What to do

Create `docs/architecture.md`.

Include:

- component diagram
- responsibilities
- request flow

### Test

A developer can understand the system without reading the source code.

### Learning

Architecture documentation helps you communicate technical decisions during interviews.

---

## D7-07 — Document Laravel Responsibilities

Document:

```text
business logic
CRUD
authentication
authorization
validation
```

### Test

The README explains why Laravel exists in the project.

### Learning

Technology choices should be tied to responsibilities.

---

## D7-08 — Document Go Responsibilities

Document:

```text
analytics
aggregation
read-only database access
performance-oriented queries
```

### Test

A reader can explain why Go exists without opening the Go source.

### Learning

A service boundary is easier to defend when the responsibility is clear.

---

## D7-09 — Document Next.js Responsibilities

Document:

```text
UI
routing
dashboard
forms
API consumption
```

### Test

Responsibilities are clearly separate from backend concerns.

### Learning

Frontend architecture is easier to understand when responsibilities are explicit.

---

## D7-10 — Document PostgreSQL Design

Create:

```text
docs/database.md
```

Include:

- ER diagram
- relationships
- constraints
- indexes

### Test

The documented diagram matches the actual migrations.

### Learning

Documentation is useful only when it reflects the implementation.

---

## D7-11 — Document Docker Architecture

Explain:

- containers
- services
- networking
- volumes
- environment variables

### Test

Another developer can understand how the services start and communicate.

### Learning

Infrastructure knowledge is an important part of a multi-service project.

---

## D7-12 — Document SQL Optimization

Create `docs/performance.md`.

Show:

```text
Problem
 ↓
Original query
 ↓
EXPLAIN
 ↓
Index decision
 ↓
New plan
 ↓
Result
```

### Test

The optimization can be reproduced from the documented dataset/query.

### Learning

The story of optimization matters as much as the index itself: identify, measure, change, measure again.

---

# Developer Experience

## D7-13 — Write Complete Setup Instructions

Document the clean setup flow, for example:

```bash
git clone ...
cp .env.example .env
docker compose up --build
```

Adjust commands to the actual repository.

### Test

Follow the instructions from a clean checkout.

### Learning

A portfolio project is partly a communication artifact. Setup should be straightforward.

---

## D7-14 — Create Database Reset Procedure

Document how to recreate the development database and seed data.

### Test

You can destroy and rebuild the database without manual undocumented steps.

### Learning

Reproducibility makes debugging and demonstrations safer.

---

## D7-15 — Create Deterministic Demo Seed

### What to do

Create a predictable seed dataset for interviews.

### Test

Repeated resets produce broadly consistent counts and relationships.

### Learning

A deterministic demo makes an interview presentation more reliable.

---

## D7-16 — Add API Documentation

Document important endpoints with:

- method
- URL
- authentication requirement
- request body
- response body
- error cases

### Test

A developer can call the main API endpoints using only the documentation.

### Learning

An API is a contract. Documentation makes that contract visible.

---

## D7-17 — Add Screenshots to README

Capture:

```text
Login
Dashboard
Business list
Business detail
Analytics
```

### Test

README visually explains the application before someone runs it.

### Learning

Portfolio reviewers often decide very quickly whether a project deserves deeper inspection.

---

## D7-18 — Create Architecture Diagram

Create one clean visual showing:

```text
Next.js
   │
 ┌─┴─────────┐
 ▼           ▼
Laravel      Go
 │           │
 └─────┬─────┘
       ▼
  PostgreSQL
```

Add Docker around the services.

### Test

Diagram matches actual implementation.

### Learning

A good architecture diagram is a fast explanation tool during interviews.

---

# Final Quality Pass

## D7-19 — Run Laravel Test Suite

### Test

All Laravel tests pass.

### Learning

Do not present a project whose test suite is red.

---

## D7-20 — Run Go Test Suite

```bash
go test ./...
```

### Test

All Go tests pass.

### Learning

Keep backend behavior continuously verifiable.

---

## D7-21 — Run Frontend Tests

### Test

All frontend tests pass.

### Learning

Frontend behavior deserves regression protection too.

---

## D7-22 — Rebuild Docker Images

### What to do

Perform a clean rebuild.

### Test

All services can run without relying on forgotten host-specific build artifacts.

### Learning

A reproducible build is a strong signal of engineering maturity.

---

## D7-23 — Start the Entire Project From Zero

Run the equivalent of:

```bash
docker compose down -v
docker compose up --build
```

### Test

Environment boots successfully and all expected services become healthy.

### Learning

The final clean start validates the entire infrastructure story.

---

## D7-24 — Perform Complete Manual Smoke Test

Execute:

```text
Login
 ↓
Dashboard
 ↓
Businesses
 ↓
Create business
 ↓
Open business
 ↓
View reviews
 ↓
Analytics
 ↓
Filters
 ↓
Logout
```

### Test

No critical user journey is broken.

### Learning

Automated tests are important, but a final human smoke test catches integration and presentation issues.

---

## D7-25 — Create Final Version Tag

Use a version such as:

```text
v1.0.0
```

### Test

Tag exists and points to the final commit.

### Learning

Versioning gives the portfolio project a clear milestone.

---

## D7-26 — Prepare the Five-Minute Interview Demo

### Demo sequence

```text
1. Problem
2. Architecture
3. Login
4. Business management
5. Analytics
6. Database
7. Docker
8. SQL optimization
9. Why Laravel + Go + Next.js
```

### Test

Practice until the complete walkthrough fits comfortably inside five minutes.

### Learning

A strong technical project is not enough. You need to communicate why you built it and what engineering decisions you made.

---

# Interview Talking Points

## Why Laravel?

Explain that Laravel owns the core business domain, REST API, validation, authentication, authorization, and CRUD operations.

## Why Go?

Explain that Go is isolated as a read-heavy analytics service, giving you a clear use case for a second backend language rather than using Go just because it is popular.

## Why Next.js?

Explain that Next.js provides the dashboard, routing, UI, forms, and API consumption layer.

## Why PostgreSQL?

Explain that the application needs relational integrity and analytical SQL capabilities.

## Why Docker?

Explain that Docker provides consistent local service environments and makes the multi-service project easier to start.

## Why separate Go from Laravel?

A practical answer:

> Laravel manages the main business domain and transactional API. Go handles read-heavy analytics and optimized SQL queries. This creates a clear responsibility boundary and gives the project a realistic multi-service architecture without splitting every small feature into a microservice.

## Strong End-to-End Story

Be prepared to explain:

```text
User clicks Analytics
        ↓
Next.js requests analytics
        ↓
Go receives request
        ↓
Go calls repository
        ↓
Repository executes PostgreSQL query
        ↓
PostgreSQL aggregates data
        ↓
Go returns JSON
        ↓
Next.js renders chart
```

That one flow lets you demonstrate frontend, API design, Go, SQL, PostgreSQL, Docker, architecture, and performance thinking.

---

# Final Definition of Done

```text
[✓] Next.js dashboard works
[✓] Laravel REST API works
[✓] Go analytics service works
[✓] PostgreSQL stores relational data
[✓] Docker starts the environment
[✓] Authentication works
[✓] Authorization works
[✓] CRUD works
[✓] Analytics work
[✓] At least one SQL optimization is demonstrated
[✓] Automated tests pass
[✓] README explains architecture
[✓] Database design is documented
[✓] API is documented
[✓] Clean Docker rebuild succeeds
[✓] Five-minute demo is prepared
```
