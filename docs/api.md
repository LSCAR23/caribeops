# API Reference — Laravel Core API

Reference for every endpoint in `backend/laravel/routes/api.php`. All responses are
`Content-Type: application/json`. The base URL when running through Docker Compose
is `http://localhost:8000` (Laravel service, port `127.0.0.1:8000`).

## Conventions

| Item | Convention |
|------|------------|
| Base URL | `http://localhost:8000` (Docker Compose Laravel service) |
| Content type | `application/json` for request and response bodies |
| Path parameters | `{business}` is a UUID (`whereUuid` on every `{business}` route) |
| Pagination | `GET /businesses` accepts `?page=`; responses use Laravel's `data` + `links` + `meta` envelope |
| Filtering | `?category=<slug>` and `?search=<text>` on `GET /businesses` |
| Rate limiting | `throttle:login` (10/min per email+IP) on `POST /login`; `throttle:reads` (60/min per IP) on public GETs; both return `429` with `Retry-After` |

## Authentication quick-reference

The API uses Laravel Sanctum Bearer tokens.

1. **Obtain a token:** `POST /login` with `email` + `password` → `{"token": "..."}`.
2. **Send it on protected requests:** `Authorization: Bearer <token>` header.
3. **Revoke it:** `POST /logout` (authenticated) → `204 No Content`.

Endpoints marked **auth required** return `401` without a valid Bearer token.
Write endpoints also require authorization (`can` policy) and return `403` when the
authenticated user is not allowed.

## Endpoints

### POST /login

Issue a Bearer token.

- **Auth:** none (public)
- **Rate limiter:** `throttle:login` (10/min per email+IP)
- **Request body:**
  ```json
  {
    "email": "string (required, email)",
    "password": "string (required)"
  }
  ```
  Validated by `LoginRequest`; invalid credentials or missing fields return `422`
  with a uniform message (no enumeration oracle — unknown email and wrong password
  produce the same shape).
- **Response (200):**
  ```json
  {
    "token": "string"
  }
  ```
- **Error cases:**
  - `422` — validation failed (missing or malformed `email`/`password`)
  - `429` — rate limit exceeded

### POST /logout

Revoke the current Bearer token (`currentAccessToken()->delete()`).

- **Auth:** required (Bearer token via `auth:sanctum`)
- **Rate limiter:** none
- **Request body:** none
- **Response (204):** No Content (empty body)
- **Error cases:**
  - `401` — no token or invalid/revoked token

### GET /me

Return the currently authenticated user.

- **Auth:** required (Bearer token via `auth:sanctum`)
- **Rate limiter:** none
- **Request body:** none
- **Response (200):** the authenticated user model (JSON serialized; `password` and
  `remember_token` are hidden via the `User` model's `$hidden`).
- **Error cases:**
  - `401` — no token or invalid/revoked token

### GET /health

Service health check.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads` (60/min per IP)
- **Request body:** none
- **Response (200):**
  ```json
  {
    "status": "ok"
  }
  ```
- **Error cases:**
  - `429` — rate limit exceeded

### GET /categories

List all categories.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Request body:** none
- **Response (200):** array of category objects (`CategoryResource`):
  ```json
  [
    {
      "id": "string (uuid)",
      "name": "string",
      "slug": "string"
    }
  ]
  ```
- **Error cases:**
  - `429` — rate limit exceeded

### GET /dashboard/summary

Aggregate dashboard KPIs.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Request body:** none
- **Response (200):**
  ```json
  {
    "data": {
      "total_businesses": "integer",
      "total_reviews": "integer",
      "average_rating": "float | null",
      "new_businesses": "integer"
    }
  }
  ```
  `average_rating` is `null` when there are no reviews. `new_businesses` counts
  businesses created in the last 7 days.
- **Error cases:**
  - `429` — rate limit exceeded

### GET /businesses

Paginated business list with optional category and search filters.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Query parameters:**
  - `?category=<slug>` — filter to one category (slug matches `categories.slug`; unknown slug returns an empty page)
  - `?search=<text>` — case-insensitive `ilike` match on `businesses.name`; combined with `category` when both present
  - `?page=<integer>` — pagination page (default 1)
- **Response (200):** paginated `BusinessResource` collection:
  ```json
  {
    "data": [
      {
        "id": "string (uuid)",
        "category_id": "string (uuid)",
        "category_name": "string | null",
        "name": "string",
        "description": "string",
        "type": "string",
        "address": "string",
        "latitude": "float",
        "longitude": "float",
        "website": "string | null",
        "phone": "string",
        "average_rating": "float | null",
        "owner": { "name": "string", "email": "string" } | null,
        "amenities": ["string", "…"],
        "reviews": [ { …see /reviews… } ],
        "created_at": "string (datetime)",
        "updated_at": "string (datetime)"
      }
    ],
    "links": { … },
    "meta": { "current_page": "integer", "last_page": "integer", "per_page": "integer", "total": "integer" }
  }
  ```
  Each business's `reviews` are nested `ReviewResource` objects (see GET
  `/businesses/{business}/reviews`).
- **Error cases:**
  - `429` — rate limit exceeded

### GET /businesses/{business}

Single business with owner, amenities, and reviews.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Path parameter:** `{business}` = UUID
- **Request body:** none
- **Response (200):** a single `BusinessResource` object (same shape as one entry in
  the list above), with `user`, `amenities`, and `reviews` eager-loaded.
- **Error cases:**
  - `404` — business not found, or `{business}` is not a valid UUID
  - `429` — rate limit exceeded

### GET /businesses/{business}/amenities

List amenity names for a business.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Path parameter:** `{business}` = UUID
- **Request body:** none
- **Response (200):** array of amenity name strings:
  ```json
  [
    "Pet Friendly",
    "Snorkeling Gear"
  ]
  ```
- **Error cases:**
  - `404` — business not found, or `{business}` is not a valid UUID
  - `429` — rate limit exceeded

### GET /businesses/{business}/reviews

List reviews for a business, newest first.

- **Auth:** none (public)
- **Rate limiter:** `throttle:reads`
- **Path parameter:** `{business}` = UUID
- **Request body:** none
- **Response (200):** array of review objects (`ReviewResource`):
  ```json
  [
    {
      "id": "string (uuid)",
      "business_id": "string (uuid)",
      "rating": "integer (1-5)",
      "title": "string",
      "content": "string",
      "review_date": "string (date)",
      "created_at": "string (datetime)",
      "updated_at": "string (datetime)"
    }
  ]
  ```
- **Error cases:**
  - `404` — business not found, or `{business}` is not a valid UUID
  - `429` — rate limit exceeded

### POST /businesses

Create a new business (authenticated; creator is set automatically from the token).

- **Auth:** required (Bearer token) + `can:create` policy
- **Rate limiter:** none
- **Request body:** validated by `StoreBusinessRequest`:
  ```json
  {
    "category_id": "string (uuid, required, must exist)",
    "name": "string (required)",
    "description": "string (required)",
    "type": "string (required)",
    "address": "string (required)",
    "latitude": "float (required, -90 to 90)",
    "longitude": "float (required, -180 to 180)",
    "website": "string | null (optional)",
    "phone": "string (required)"
  }
  ```
  `user_id` is prohibited in the request — ownership is assigned to the
  authenticated user server-side.
- **Response (201):** the created `BusinessResource` object (single response, not
  wrapped in `data`).
- **Error cases:**
  - `401` — no token or invalid/revoked token
  - `403` — authenticated user is not allowed to create businesses
  - `422` — validation failed (missing field, invalid format, out-of-range coordinates, unknown category)
  - `429` — rate limit exceeded (via `throttle:reads` shared with public GETs)

### PUT /businesses/{business}

Update an existing business (authenticated; ownership enforced by policy).

- **Auth:** required (Bearer token) + `can:update` policy
- **Rate limiter:** none
- **Path parameter:** `{business}` = UUID
- **Request body:** same shape as `POST /businesses` (`StoreBusinessRequest`); all
  fields optional for update (validated when present).
- **Response (200):** the updated `BusinessResource` object.
- **Error cases:**
  - `401` — no token or invalid/revoked token
  - `403` — authenticated user is not the owner (and not an admin bypassing the policy)
  - `404` — business not found, or `{business}` is not a valid UUID
  - `422` — validation failed
  - `429` — rate limit exceeded

### DELETE /businesses/{business}

Delete a business (authenticated; ownership enforced by policy). Deletes cascade to
reviews and business-amenity pivot rows.

- **Auth:** required (Bearer token) + `can:delete` policy
- **Rate limiter:** none
- **Path parameter:** `{business}` = UUID
- **Request body:** none
- **Response (204):** No Content (empty body)
- **Error cases:**
  - `401` — no token or invalid/revoked token
  - `403` — authenticated user is not the owner (and not an admin bypassing the policy)
  - `404` — business not found, or `{business}` is not a valid UUID
  - `429` — rate limit exceeded

## Error-case catalog

| Status | Meaning | When it occurs |
|--------|---------|----------------|
| `401` | Unauthorized | Missing/invalid/revoked Bearer token on any auth-required endpoint |
| `403` | Forbidden | Authenticated user lacks policy permission on a write endpoint |
| `404` | Not Found | UUID business does not exist, or `{business}` is not a valid UUID |
| `422` | Unprocessable Entity | Validation failed (FormRequest rules: missing field, wrong format, out-of-range value, unknown relationship) |
| `429` | Too Many Requests | Rate limit exceeded (`throttle:login` or `throttle:reads`); includes `Retry-After` header |

## cURL examples

Obtain a token:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

List businesses (public):

```bash
curl "http://localhost:8000/api/businesses?category=hotels&page=1"
```

Get one business (public):

```bash
curl "http://localhost:8000/api/businesses/<uuid>"
```

Create a business (authenticated):

```bash
curl -X POST http://localhost:8000/api/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"category_id":"<uuid>","name":"…","description":"…",…}'
```

Revoke a token:

```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer <token>"
```

## Related documentation

- `docs/setup.md` — D7-13: clean-checkout → running-stack flow (clone → `cp .env.example .env` → `docker compose up --build` → health checks → `make test`/`make smoke`).
- `docs/database-reset.md` — D7-14: destroy → rebuild → seed the development database (`docker compose down -v` + `migrate:fresh --seed`).
- `docs/database.md` — D7-10: ER diagram, relationships, constraints, indexes derived from the migrations.
- `docs/deterministic-demo-seed.md` — D7-15: predictable interview dataset (fixed RNG seed; expected counts 3/20/40/320).
- `backend/laravel/routes/api.php` — authoritative route definitions.
