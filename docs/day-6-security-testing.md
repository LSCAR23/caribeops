# Day 6 — Authentication, Authorization, Validation and Automated Testing

## Objective

Upgrade the application from a prototype to a small production-style system.

By the end of the day, users should be able to authenticate, have different roles, and be restricted from actions they should not perform.

---

## Learning Outcomes

You should understand:

- API authentication.
- Token/session concepts.
- Authorization vs authentication.
- Role-based access control.
- Ownership checks.
- CORS.
- Rate limiting.
- Automated integration tests.
- End-to-end testing.

---

# Authentication

## D6-01 — Add Laravel API Authentication

### What to do

Choose a Laravel-supported API authentication approach appropriate for the project, such as Sanctum.

### Test

Authentication configuration initializes without errors.

### Learning

Authentication answers: “Who are you?”

---

## D6-02 — Create Login Endpoint

```text
POST /api/login
```

### Test

Valid credentials authenticate; invalid credentials are rejected.

### Learning

Never treat authentication success as simply “the user exists.” Credentials must be verified.

---

## D6-03 — Create Logout Endpoint

```text
POST /api/logout
```

### Test

After logout, the previous authenticated context is invalid.

### Learning

Logout is part of the lifecycle of an authenticated session/token.

---

## D6-04 — Create Current User Endpoint

```text
GET /api/me
```

### Test

Authenticated request returns the current user.

### Learning

A dedicated user endpoint gives the frontend a reliable source for current identity and role information.

---

## D6-05 — Protect Business Creation

### Test

Anonymous request is rejected.

### Learning

Authentication requirements should be explicit per protected resource.

---

## D6-06 — Protect Business Modification

### Test

Anonymous update is rejected.

### Learning

Different operations can have different permission requirements.

---

## D6-07 — Protect Business Deletion

### Test

Anonymous delete is rejected.

### Learning

Destructive operations need strong authorization checks.

---

# Roles

## D6-08 — Add User Roles

Use:

```text
admin
owner
viewer
```

### Test

Create users in each role and persist the role correctly.

### Learning

Authentication identifies users; authorization determines what they may do.

---

## D6-09 — Add Authorization Policies/Middleware

### Test

Viewer cannot execute admin-only operations.

### Learning

Authorization logic should be centralized and testable rather than scattered across controllers.

---

## D6-10 — Add Business Ownership

Associate businesses with their owner.

### Test

Business records correctly identify their owner.

### Learning

Ownership creates a useful real-world authorization rule beyond simple roles.

---

## D6-11 — Prevent Cross-Owner Modification

### Test

Owner A cannot update or delete Owner B's business.

### Learning

Real authorization often combines role and resource ownership.

---

# Frontend Authentication

## D6-12 — Create Login Page

### Test

Invalid credentials produce a visible error.

### Learning

Authentication UX should make failures understandable without exposing sensitive details.

---

## D6-13 — Connect Login to Laravel

### Test

Valid login transitions the user to the authenticated area.

### Learning

The frontend consumes the authentication contract rather than implementing its own credential logic.

---

## D6-14 — Protect Dashboard Routes

### Test

Unauthenticated users cannot access protected pages.

### Learning

Frontend route protection improves UX, but server-side authorization remains authoritative.

---

## D6-15 — Add Logout Button

### Test

Logout invalidates auth state and returns the user to login.

### Learning

Authentication state needs a predictable lifecycle in the frontend.

---

# Validation and Security

## D6-16 — Review All Write Endpoint Validation

Audit:

```text
POST
PUT/PATCH
DELETE
```

### Test

Every write endpoint has defined validation or authorization behavior.

### Learning

Security review should be systematic rather than based on memory.

---

## D6-17 — Configure CORS

### What to do

Allow only the frontend origins required for the environment.

### Test

Expected frontend requests succeed and unexpected origins are not unnecessarily permitted.

### Learning

Cross-origin access is part of API exposure and should be configured deliberately.

---

## D6-18 — Add Rate Limiting

Protect at least authentication and appropriate public endpoints.

### Test

Repeated requests eventually receive rate-limit behavior.

### Learning

Rate limits reduce abuse and accidental request floods.

---

## D6-19 — Audit Secrets

Check for:

- database passwords
- tokens
- API keys
- secret environment values

### Test

Search the repository and Git history where practical.

### Learning

Secret management is part of deployment readiness, not just cleanup.

---

# Automated Tests

## D6-20 — Laravel Health Test

### Test

Health endpoint returns expected status and payload.

### Learning

Start with deterministic tests for service availability.

---

## D6-21 — Laravel CRUD Tests

Test:

```text
GET businesses
POST business
PUT business
DELETE business
```

### Test

Run the suite and verify database state where appropriate.

### Learning

CRUD behavior should remain stable while other parts of the system evolve.

---

## D6-22 — Authorization Tests

Test:

```text
admin allowed
owner allowed for owned resource
owner denied for another owner's resource
viewer denied for write operation
```

### Learning

Authorization bugs can be more serious than ordinary functional bugs, so make permissions executable through tests.

---

## D6-23 — Go Repository Tests

### Test

Repository behavior is covered with predictable test data or a suitable test database strategy.

### Learning

Data-access code can be tested independently of HTTP.

---

## D6-24 — Go Handler Tests

Test:

- successful response
- validation failure
- internal error

### Learning

Handlers translate service outcomes into HTTP behavior.

---

## D6-25 — Frontend Component Tests

Test at least:

```text
Business list
KPI cards
Loading state
Error state
```

### Learning

Not every frontend behavior needs a full browser test.

---

## D6-26 — Add One End-to-End User Flow

Automate:

```text
Login
 ↓
Open dashboard
 ↓
Open businesses
 ↓
Open business details
```

### Test

Run the flow against the intended development environment.

### Learning

End-to-end tests verify that multiple services and UI layers work together.

---

## D6-27 — Create One-Command Test Execution

For example:

```bash
make test
```

### Test

One command runs all relevant test suites or clearly orchestrates them.

### Learning

Fast feedback encourages frequent testing.

---

## D6-28 — Commit Day 6

```text
feat: add authentication authorization and automated tests
```

## Day 6 Checkpoint

```text
Authentication ✅
Authorization  ✅
CRUD           ✅
Analytics      ✅
Docker         ✅
Automated tests✅
```
