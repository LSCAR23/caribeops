# Day 4 — Go Analytics Service

## Objective

Build an independent Go service that reads PostgreSQL and exposes analytics through a REST API.

The main lesson is service separation: Laravel owns the business domain, while Go owns read-heavy analytics operations.

---

## Learning Outcomes

You should understand:

- Go modules.
- Structs.
- Interfaces.
- Error handling.
- HTTP handlers.
- Context.
- PostgreSQL access from Go.
- Repository/service/handler separation.
- Basic table aggregation with PostgreSQL.
- Testing Go application behavior.

---

## Target Structure

```text
analytics/go/
├── cmd/
├── internal/
│   ├── config/
│   ├── handler/
│   ├── repository/
│   └── service/
├── tests/
├── go.mod
└── ...
```

---

## D4-01 — Define Go Project Structure

### What to do

Create the folders and package boundaries.

### Test

```bash
go test ./...
```

should still compile.

### Learning

Package boundaries can make a service easier to reason about as it grows.

---

## D4-02 — Create Configuration Package

### What to do

Read configuration such as:

```text
DATABASE_URL
PORT
```

from environment variables.

### Test

Start the application without a required variable and verify it fails with a useful message.

### Learning

Configuration belongs outside the code so the same binary can run in different environments.

---

## D4-03 — Create PostgreSQL Connection

### What to do

Add a PostgreSQL driver and establish a connection pool.

### Test

Start Go and execute a basic `SELECT 1` or equivalent connectivity check.

### Learning

Connection pooling avoids creating a new database connection for every request.

---

## D4-04 — Implement `/health`

### What to do

Return HTTP 200 for a healthy service.

### Test

Request the endpoint directly.

### Learning

A health endpoint is useful for Docker and monitoring.

---

## D4-05 — Define Analytics Repository Interface

### What to do

Define methods representing required analytics queries without putting SQL in handlers.

### Test

Application compiles.

### Learning

Interfaces can decouple business/service logic from database implementation details.

---

## D4-06 — Implement Business Count Query

### What to do

Implement a repository method using `COUNT(*)`.

### Test

Compare the Go result with a direct PostgreSQL query.

### Learning

Use SQL intentionally. Analytics often belongs close to the database because aggregation can be efficient there.

---

## D4-07 — Implement Review Count Query

### Test

Go result equals the PostgreSQL result.

### Learning

A reliable analytics service starts with small deterministic queries.

---

## D4-08 — Implement Average Rating Query

Use the appropriate PostgreSQL aggregate.

### Test

Compare Go output with a manually calculated database result.

### Learning

Understand aggregate functions and handling of numeric precision.

---

## D4-09 — Create Overview Service

Return a structure such as:

```json
{
  "businesses": 42,
  "reviews": 350,
  "average_rating": 4.2
}
```

### Test

The service combines the repository results correctly.

### Learning

Services coordinate operations and implement application behavior above the repository layer.

---

## D4-10 — Create Overview Endpoint

```text
GET /analytics/overview
```

### Test

HTTP 200 and correct JSON.

### Learning

Keep HTTP-specific concerns in the handler layer.

---

## D4-11 — Create Businesses-by-Category Query

Use:

```sql
GROUP BY
```

### Test

Results match manual SQL.

### Learning

`GROUP BY` is foundational for analytics and reporting queries.

---

## D4-12 — Create Reviews-by-Month Query

### What to do

Group reviews by month using PostgreSQL date/time functions.

### Test

Verify a sample month manually.

### Learning

Time-series reporting often requires transforming raw timestamps into reporting periods.

---

## D4-13 — Create Top Businesses Query

### What to do

Define a ranking metric. For example:

- average rating
- review volume
- a combined score

Start with one simple metric.

### Test

Returned records appear in the correct order.

### Learning

Analytics needs an explicitly defined metric. “Top” should not be ambiguous.

---

## D4-14 — Create Analytics Endpoints

Create:

```text
GET /analytics/businesses-by-category
GET /analytics/reviews-by-month
GET /analytics/top-businesses
```

### Test

Each endpoint works independently.

### Learning

Separate analytics concepts into focused endpoints instead of creating one giant response.

---

## D4-15 — Add Query Parameters

Support useful parameters such as:

```text
?limit=10
?category=hotel
?from=2026-01-01
?to=2026-10-01
```

### Test

Change parameters and verify the result changes accordingly.

### Learning

APIs should allow clients to request the slice of data they actually need.

---

## D4-16 — Add SQL Error Handling

### What to do

Map repository/database failures to controlled service behavior.

### Test

Temporarily make the database unavailable.

Expected: controlled error response without leaking internal database details.

### Learning

Infrastructure failures should not become accidental implementation leaks in API responses.

---

## D4-17 — Add Go Service Tests

Test at least:

- overview calculation
- category aggregation
- top-business ordering

### Test

```bash
go test ./...
```

### Learning

Test business behavior without requiring every test to be an end-to-end test.

---

## D4-18 — Commit Day 4

```text
feat: implement Go analytics service
```

## Day 4 Checkpoint

```text
Next.js
  ├── Laravel
  │     └── PostgreSQL
  │
  └── Go
        └── PostgreSQL
```

At this point, you have a genuine multi-service portfolio architecture rather than isolated technology demos.
