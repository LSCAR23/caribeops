# Day 3 — Next.js Dashboard and Laravel Integration

## Objective

Turn the backend into a usable web application by connecting Next.js to the Laravel API.

At the end of the day, a user should be able to open the application, browse businesses, view a business, create a business, and filter the list by category.

---

## Learning Outcomes

You should understand:

- Next.js App Router.
- TypeScript interfaces/types for API data.
- Server/client responsibilities at a practical level.
- API clients with `fetch`.
- Loading and error states.
- Dynamic routes.
- Forms and validation.
- Reusable UI components.
- Basic dashboard architecture.

---

## D3-01 — Create Dashboard Layout

### What to do

Create a basic layout with:

- sidebar
- header
- main content area

### Test

Navigate between pages and confirm the layout remains consistent.

### Learning

Layouts are shared UI boundaries in the Next.js App Router.

---

## D3-02 — Create Navigation

Add links to:

```text
Dashboard
Businesses
Analytics
```

### Test

Every link navigates to an implemented route.

### Learning

Navigation should be based on application features rather than individual components.

---

## D3-03 — Define Business Type

### What to do

Create a TypeScript type/interface matching the Laravel business response.

### Test

Run TypeScript compilation/build successfully.

### Learning

Typed API responses reduce accidental mismatches between frontend and backend.

---

## D3-04 — Configure API Base URL

### What to do

Add an environment variable for the Laravel API base URL.

### Test

Change the value in a development environment and verify the API target changes.

### Learning

The frontend should not hardcode environment-specific URLs.

---

## D3-05 — Create Reusable API Client

### What to do

Create a small wrapper around `fetch`.

It should centralize:

- base URL
- JSON handling
- basic error behavior

### Test

Use it to call Laravel's `/api/health` endpoint.

### Learning

A small API abstraction prevents networking logic from being repeated across components.

---

## D3-06 — Connect Business List Page

### What to do

Create:

```text
/businesses
```

Fetch from:

```text
GET /api/businesses
```

### Test

Real records from PostgreSQL appear in Next.js.

### Learning

This is your first full frontend → backend → database vertical slice.

---

## D3-07 — Create Business List Component

### What to do

Display:

```text
name
category
address
rating
```

### Test

Every returned business is rendered.

### Learning

Separate data-fetching concerns from presentational UI when practical.

---

## D3-08 — Add Loading State

### What to do

Display a loading indicator while businesses are being fetched.

### Test

Throttle the request or add development delay and verify the state appears.

### Learning

Async applications need explicit loading states to avoid confusing blank screens.

---

## D3-09 — Add Error State

### What to do

Handle API failures with a clear user-facing message.

### Test

Stop Laravel and load the page.

### Learning

External calls can fail. The UI should handle failure as a normal application state.

---

## D3-10 — Create Business Details Route

Create:

```text
/businesses/[id]
```

### Test

Clicking a business navigates to the expected URL.

### Learning

Dynamic routes map URLs to domain resource identifiers.

---

## D3-11 — Fetch Business Details

Call:

```text
GET /api/businesses/{id}
```

### Test

The correct business appears for different IDs.

### Learning

Dynamic pages should derive their resource data from route parameters.

---

## D3-12 — Display Reviews

### What to do

Show:

- rating
- title
- content
- date

### Test

Reviews match the selected business.

### Learning

Nested resources can be represented directly or through dedicated API endpoints depending on the design.

---

## D3-13 — Create Business Form

Add fields:

```text
name
description
category
type
address
website
phone
```

### Test

Form renders and fields accept input.

### Learning

Forms are a bridge between user input and validated backend operations.

---

## D3-14 — Add Client-Side Validation

### What to do

Validate required fields before sending the request.

### Test

Invalid input does not trigger a network request.

### Learning

Client validation improves UX but does not replace server validation.

---

## D3-15 — Submit Form to Laravel

Call:

```text
POST /api/businesses
```

### Test

Valid submission creates a record in PostgreSQL.

### Learning

The frontend should rely on Laravel for authoritative business rules.

---

## D3-16 — Refresh Business List

### What to do

After successful creation, refresh or update the business list.

### Test

New business appears without manually changing the database.

### Learning

UI state needs to stay synchronized with server state.

---

## D3-17 — Create KPI Cards

Show initial metrics such as:

```text
Total businesses
Total reviews
Average rating
New businesses
```

For this day, the values may come from Laravel or a temporary endpoint.

### Test

Values originate from real database data.

### Learning

A dashboard converts API data into decision-oriented information.

---

## D3-18 — Add Empty States

Create clear messages for:

```text
No businesses found
No reviews found
No analytics available
```

### Test

Force empty API responses and inspect the UI.

### Learning

Empty states are different from errors. A valid zero-result query should not look broken.

---

## D3-19 — Add Category Filtering

### What to do

Add category filtering to the business list.

### Test

Select each category and confirm the visible businesses match the selected category.

### Learning

Filtering is a practical introduction to query parameters and client-side state.

---

## D3-20 — Commit Day 3

```text
feat: build Next.js dashboard and business management UI
```

## Day 3 Checkpoint

You should now have:

```text
Browser
   ↓
Next.js
   ↓
Laravel
   ↓
PostgreSQL
```

A user can view and create businesses through the UI.
