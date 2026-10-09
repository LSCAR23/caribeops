# Day 2 — Laravel Core API and PostgreSQL Domain

## Objective

Build the first complete business-domain slice: categories, businesses, amenities, reviews, seed data, CRUD endpoints, and Laravel feature tests.

---

## Learning Outcomes

You should finish the day understanding:

- PostgreSQL relational modeling.
- Laravel migrations.
- Eloquent models and relationships.
- Factories and seeders.
- Request validation.
- API Resources.
- CRUD endpoint design.
- HTTP status codes.
- Laravel feature testing.

---

# Database Design

## D2-01 — Design the Business Entity

### What to do

Document the business entity design, including PostgreSQL-compatible types and requiredness, before writing a migration. See [Business Entity Design](business-entity-design.md).

The broad category (Hotel, Restaurant, Tour) is related through the category foreign key planned for D2-03. `type` is the more specific business kind (for example, Boutique hotel, Hostel, Café, or Snorkeling tour).

Only `website` is optional among user-provided business attributes; IDs and timestamps are system-managed.

### Learning

A database model should represent domain needs first, not implementation convenience. Review the design document before creating the businesses migration in D2-03.

---

## D2-02 — Create Categories Migration

### What to do

Create a categories table.

Suggested columns:

```text
id
name
slug
created_at
updated_at
```

### Test

Run the migration and inspect the table.

### Learning

Migrations make schema changes reproducible.

---

## D2-03 — Create Businesses Migration

### What to do

Create the businesses table and a foreign key to categories.

### Test

Create a category and business manually. Attempt to reference a nonexistent category.

Expected: PostgreSQL rejects the invalid foreign key.

### Learning

Database constraints enforce integrity independently of application code.

---

## D2-04 — Create Amenities Migration

### What to do

Create:

```text
amenities
```

Suggested fields:

```text
id
name
slug
created_at
updated_at
```

### Test

Migration executes and table exists.

### Learning

Reusable reference entities avoid storing the same text repeatedly across business records.

---

## D2-05 — Create Business-Amenities Pivot Migration

### What to do

Create a many-to-many pivot table:

```text
business_id
amenity_id
```

Add foreign keys and a uniqueness constraint across both IDs.

### Test

Try to insert the same business/amenity combination twice.

Expected: duplicate relationship is rejected.

### Learning

Many-to-many relationships are represented by a join table.

---

## D2-06 — Create Reviews Migration

### What to do

Create:

```text
reviews
```

Suggested fields:

```text
id
business_id
rating
title
content
review_date
created_at
updated_at
```

### Test

Try to create a review for a nonexistent business.

Expected: foreign key failure.

### Learning

Child records should be tied to valid parent records.

---

## D2-07 — Add Database Constraints

### What to do

Add meaningful constraints such as:

- rating between 1 and 5
- required business name
- required category
- appropriate uniqueness rules

### Test

Attempt invalid inserts directly in PostgreSQL.

### Learning

Validation belongs both in the application layer and, where appropriate, the database layer.

---

## D2-08 — Test the Complete Migration Chain

### What to do

Reset the database and recreate it only from migrations.

### Test

```bash
php artisan migrate:fresh
```

### Learning

A clean migration chain means your project does not depend on undocumented manual database changes.

---

# Models and Relationships

## D2-09 — Create Category Model

### Test

Retrieve categories through Eloquent.

### Learning

Understand the relationship between database tables and Eloquent models.

---

## D2-10 — Create Business Model

### What to do

Define fillable/guarded behavior and the category relationship.

### Test

Load a business and access its category.

### Learning

Eloquent turns rows and relationships into application-level objects.

---

## D2-11 — Create Amenity Model

### Test

Load an amenity and its associated businesses.

### Learning

Reference entities can be shared by multiple businesses.

---

## D2-12 — Create Review Model

### Test

Load a review and its parent business.

### Learning

Laravel relationship methods should mirror the database model.

---

## D2-13 — Define Business → Amenities

### Test

Attach an amenity to a business and retrieve it through Eloquent.

### Learning

Practice `belongsToMany` and pivot tables.

---

## D2-14 — Define Business → Reviews

### Test

Create multiple reviews and retrieve them from the business.

### Learning

Practice `hasMany` relationships.

---

# Seed Data

## D2-15 — Create Category Seeder

Insert:

```text
Hotels
Restaurants
Tours
```

### Test

Run the seeder twice and make sure you have a deliberate strategy for duplicates.

### Learning

Seeders make development data reproducible.

---

## D2-16 — Create Amenity Seeder

Insert useful tourism amenities.

Examples:

```text
Wi-Fi
Parking
Pool
Breakfast
Air Conditioning
Pet Friendly
```

### Test

No unexpected duplicates.

### Learning

Keep reference data predictable so analytics remain understandable.

---

## D2-17 — Create Business Factory

### What to do

Create realistic businesses with different categories and locations.

### Test

Factory creates valid records repeatedly.

### Learning

Factories provide repeatable test/development data.

---

## D2-18 — Create Review Factory

### What to do

Generate realistic ratings from 1 to 5.

### Test

Factory-generated records satisfy the database constraints.

### Learning

Good synthetic data should exercise multiple states instead of producing identical rows.

---

## D2-19 — Create Complete Database Seeder

Generate approximately:

```text
3 categories
15–30 amenities
30–50 businesses
300+ reviews
```

### Test

One command rebuilds a useful development database.

### Learning

Enough data is important when practicing pagination and query performance.

---

# Laravel API

## D2-20 — Create Business List Route

```text
GET /api/businesses
```

### Test

HTTP 200 with JSON response.

### Learning

Separate API routes from web page routes.

---

## D2-21 — Add Pagination

### What to do

Paginate the business listing.

### Test

Request different pages and verify metadata.

### Learning

Pagination avoids returning the entire dataset in one response.

---

## D2-22 — Create Business Detail Endpoint

```text
GET /api/businesses/{id}
```

### Test

Valid ID returns one business.

### Learning

Resource endpoints usually map naturally to domain identifiers.

---

## D2-23 — Handle Unknown Business

### Test

Request a nonexistent ID.

Expected: HTTP 404.

### Learning

Predictable error semantics are part of API design.

---

## D2-24 — Create Business Request Validation

### What to do

Validate required fields and formats.

### Test

Send invalid payloads.

Expected: HTTP 422 with useful validation information.

### Learning

Request validation protects business logic from malformed input.

---

## D2-25 — Create Business Endpoint

```text
POST /api/businesses
```

### Test

Valid request creates exactly one database record.

### Learning

A CRUD API should have clear mapping between HTTP actions and domain operations.

---

## D2-26 — Create Update Endpoint

```text
PUT /api/businesses/{id}
```

### Test

Existing business changes in PostgreSQL and the response reflects the update.

### Learning

Updates should validate both the target resource and the submitted values.

---

## D2-27 — Create Delete Endpoint

```text
DELETE /api/businesses/{id}
```

### Test

Business is deleted or soft-deleted according to the design.

### Learning

Deletion policy is a domain decision; explain it in documentation.

---

## D2-28 — Add API Resources

### What to do

Use Laravel API Resources to define intentional response shapes.

### Test

Response no longer depends directly on internal model serialization choices.

### Learning

API contracts should be stable and explicit.

---

# Automated Tests

## D2-29 — Business List Feature Test

### Test

Verify:

- HTTP 200
- JSON structure
- pagination exists
- expected seeded records appear

### Learning

Feature tests validate behavior from the HTTP boundary.

---

## D2-30 — Business Creation Feature Test

### Test

Send a valid request and assert:

- HTTP success
- database record exists

### Learning

Test both the API response and persistent state.

---

## D2-31 — Validation Feature Test

### Test

Send missing/invalid fields and verify HTTP 422.

### Learning

Automated tests prevent regressions in validation rules.

---

## D2-32 — 404 Feature Test

### Test

Verify nonexistent business returns HTTP 404.

### Learning

Error behavior should be tested just like successful behavior.

---

## D2-33 — Commit Day 2

```text
feat: implement tourism business domain and core API
```

## Day 2 Checkpoint

```text
PostgreSQL schema  ✅
Eloquent models    ✅
Relationships       ✅
Seed data           ✅
CRUD API            ✅
Feature tests       ✅
```
