# CaribeOps — Database Design

The relational design below is derived from the 10 Laravel migrations in
`backend/laravel/database/migrations/` (source of truth). The diagram matches
the actual migrations — this document is a map, not the territory.

## 1. ER diagram

```text
                 categories                    businesses                    reviews
             ┌─────────────┐             ┌──────────────┐             ┌───────────┐
             │ id (uuid PK)│────────────<│ category_id  │────────────>│ business_id│
             │ name        │      1:N    │ (FK→cats)    │      1:N    │ (FK→biz)   │
             │ slug (UQ)   │             │ id (uuid PK) │             │ id (uuid PK)│
             │ created_at  │             │ name         │             │ rating int │
             │ updated_at  │             │ description  │             │ title      │
             └─────────────┘             │ type         │             │ content    │
                                         │ address      │             │ review_date│
                                         │ latitude     │             │ created_at │
                                         │ longitude    │             │ updated_at │
                                         │ website?     │             └───────────┘
                                         │ phone        │
                                         │ user_id (FK→ │
                                         │   users,     │
                                         │   nullable)  │
                                         │ created_at   │
                                         │ updated_at   │
                                         └──────────────┘
                                                  ▲
                                                  │
                                                  │ 1:N (user owns businesses)
                                                  │
                                         ┌─────────────┐
                                         │    users    │
                                         │ id (bigserial│
                                         │  PK)        │
                                         │ name        │
                                         │ email (UQ)  │
                                         │ password    │
                                         │ role        │ (default 'viewer')
                                         │ …timestamps │
                                         └─────────────┘

                 business_amenities (N:N pivot)
             ┌─────────────────────────┐
             │ business_id (FK→biz)    │────────────┐
             │ amenity_id (FK→amen)    │────────────┘
             │ UNIQUE(business_id,     │
             │  amenity_id)            │
             └─────────────────────────┘
                    ▲
                    │
             ┌─────────────┐
             │  amenities│
             │ id (uuid PK)│
             │ name        │
             │ slug (UQ)   │
             └─────────────┘

Authentication scaffolding (Laravel/Sanctum, not part of the domain model):
  personal_access_tokens (id PK, token UQ 64, tokenable morphs, expires_at indexed)
  sessions (id PK, user_id nullable indexed, last_activity indexed)
  password_reset_tokens (email PK, token)
```

## 2. Relationships

| Relationship | Cardinality | Implementation |
|--------------|-------------|----------------|
| Category → Business | 1 : N | `businesses.category_id` FK → `categories.id`, `onDelete cascade` |
| Business → Review | 1 : N | `reviews.business_id` FK → `businesses.id`, `onDelete cascade` |
| Business ⇄ Amenity | N : N | pivot `business_amenities`: `business_id` FK → `businesses.id` (cascade), `amenity_id` FK → `amenities.id` (cascade), composite `UNIQUE(business_id, amenity_id)` |
| User → Business | 1 : N | `businesses.user_id` nullable FK → `users.id`, `nullOnDelete` (D6-10) |

## 3. Constraints

| Table | Constraint | Type | Source |
|-------|------------|------|--------|
| `categories` | `id` PK | UUID primary key | `2026_10_09_212027_create_categories_table.php` |
| `categories` | `slug` unique | unique | `2026_10_09_212027_create_categories_table.php` |
| `businesses` | `id` PK | UUID primary key | `2026_10_09_213759_create_businesses_table.php` |
| `businesses` | `category_id` FK → `categories.id` | foreign key, cascade on delete | `2026_10_09_213759_create_businesses_table.php` |
| `businesses` | latitude BETWEEN -90 AND 90 | CHECK | `2026_10_09_213759_create_businesses_table.php` |
| `businesses` | longitude BETWEEN -180 AND 180 | CHECK | `2026_10_09_213759_create_businesses_table.php` |
| `amenities` | `id` PK | UUID primary key | `2026_10_09_220642_create_amenities_table.php` |
| `amenities` | `slug` unique | unique | `2026_10_09_220642_create_amenities_table.php` |
| `business_amenities` | `business_id` FK → `businesses.id` | FK, cascade on delete | `2026_10_09_222207_create_business_amenities_table.php` |
| `business_amenities` | `amenity_id` FK → `amenities.id` | FK, cascade on delete | `2026_10_09_222207_create_business_amenities_table.php` |
| `business_amenities` | `(business_id, amenity_id)` unique | composite unique | `2026_10_09_222207_create_business_amenities_table.php` |
| `reviews` | `id` PK | UUID primary key | `2026_10_09_223250_create_reviews_table.php` |
| `reviews` | `business_id` FK → `businesses.id` | FK, cascade on delete | `2026_10_09_223250_create_reviews_table.php` |
| `reviews` | `rating` BETWEEN 1 AND 5 | CHECK | `2026_10_09_224223_add_rating_range_check_to_reviews_table.php` |
| `users` | `email` unique | unique | `0001_01_01_000000_create_users_table.php` |
| `users` | `role` default `'viewer'` | column default | `2026_10_13_173601_add_role_to_users_table.php` |
| `businesses` | `user_id` nullable FK → `users.id` | FK, nullOnDelete | `2026_10_14_190449_add_user_id_to_businesses_table.php` |
| `personal_access_tokens` | `token` unique (64) | unique | `2026_10_13_181728_create_personal_access_tokens_table.php` |
| `personal_access_tokens` | `expires_at` | index | `2026_10_13_181728_create_personal_access_tokens_table.php` |
| `sessions` | `user_id` nullable | index | `0001_01_01_000000_create_users_table.php` |
| `sessions` | `last_activity` | index | `0001_01_01_000000_create_users_table.php` |

## 4. Indexes

| Index | Table | Columns | Purpose | Source |
|-------|-------|---------|---------|--------|
| PK indexes | all domain tables | `id` | primary key lookups | migration `create_*_table.php` |
| `reviews_business_id_index` | `reviews` | `business_id` | accelerates the `INNER JOIN … ON r.business_id = b.id` in Go `TopBusinesses` and the Laravel business detail/eager-load queries; the only manually added performance index | `2026_10_13_042916_add_reviews_business_id_index.php` (idempotent `IF NOT EXISTS`, D5-19 / D5-21) |
| implicit FK indexes | `businesses`, `reviews`, `business_amenities` | FK columns | PostgreSQL auto-indexes FKs where beneficial | Laravel migrations |

Read-only access: the dedicated `analytics` PostgreSQL role has `SELECT`-only grants on the three Go-read tables (`businesses`, `categories`, `reviews`) plus default privileges for future tables — see `docker/postgres-init/01-analytics-role.sh` and `02-analytics-grants.sql` (D5-08/D5-09). The optimization story for `reviews(business_id)` is told in `docs/performance.md` (D7-12).

## 5. Migration source of truth (in order)

1. `0001_01_01_000000_create_users_table.php` — `users`, `password_reset_tokens`, `sessions`
2. `2026_10_09_212027_create_categories_table.php` — `categories`
3. `2026_10_09_213759_create_businesses_table.php` — `businesses` (+ latitude/longitude CHECKs)
4. `2026_10_09_220642_create_amenities_table.php` — `amenities`
5. `2026_10_09_222207_create_business_amenities_table.php` — `business_amenities` pivot
6. `2026_10_09_223250_create_reviews_table.php` — `reviews`
7. `2026_10_09_224223_add_rating_range_check_to_reviews_table.php` — `reviews.rating` CHECK
8. `2026_10_13_181728_create_personal_access_tokens_table.php` — Sanctum tokens
9. `2026_10_13_173601_add_role_to_users_table.php` — `users.role` (D6-08)
10. `2026_10_14_190449_add_user_id_to_businesses_table.php` — `businesses.user_id` (D6-10)
11. `2026_10_13_042916_add_reviews_business_id_index.php` — `reviews(business_id)` index (D5-19 / D5-21)
