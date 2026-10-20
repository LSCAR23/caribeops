# CaribeOps — Five-Minute Interview Demo Script

**Total time budget: 4:40 (20-second buffer inside the 5:00 limit)**

Rehearse until the complete walkthrough fits comfortably inside five minutes. Numbers below use the seeded demo dataset: **40 businesses, 320 reviews, 3.1 average rating, 3 categories (Hotels/Restaurants/Tours), 20 amenities**. Demo login: `test@example.com` / `password`.

---

## Segment 1 — Problem (≈20s)

**Show:** Title slide / empty screen
**Say:** "CaribeOps manages Caribbean tourism businesses — hotels, restaurants, and tour operators. Owners need live listings, customer reviews and ratings, and analytics trends. I built one coherent platform across Next.js, Laravel, Go, and PostgreSQL to demonstrate full-stack product thinking."
**Evidence:** App title "CaribeOps | Tourism Operations & Analytics"
**Screenshot:** `docs/screenshots/dashboard.png` (hero section)

---

## Segment 2 — Architecture (≈30s)

**Show:** `docs/images/architecture.svg`
**Say:** "Next.js handles the dashboard, routing, forms, and API consumption — no business logic, no database access. Laravel owns the core REST API, Sanctum authentication, authorization, and validation. Go is isolated as a read-heavy analytics service — SELECT-only, no writes. PostgreSQL stores the relational domain. Docker Compose wraps all four services on a single `backend` network with healthchecks."
**Evidence:** Component diagram in `docs/images/architecture.svg`
**Screenshot:** `docs/images/architecture.svg`

---

## Segment 3 — Login (≈25s)

**Show:** Browser at `http://127.0.0.1:3000/login`
**Say:** "Anonymous visitors are redirected to `/login`. I sign in as `test@example.com` / `password` — a seeded demo user with the viewer role. Laravel issues a Bearer token via Sanctum; the client attaches it automatically on every API call."
**Evidence:** Login form, then redirect to `/` with Logout button visible
**Screenshot:** `docs/screenshots/login.png`

---

## Segment 4 — Business management (≈35s)

**Show:** `http://127.0.0.1:3000/businesses`
**Say:** "The business directory lists all 40 businesses with search, category filter (Hotels/Restaurants/Tours), and pagination — 15 of 40 on page 1 of 3. Clicking into a business shows the owner, amenities, description, type, phone, and all 8 reviews with ratings and dates."
**Evidence:** "Showing 15 of 40 businesses", category filter combobox, Reviews (8) heading
**Screenshot:** `docs/screenshots/business-list.png`

---

## Segment 5 — Analytics (≈30s)

**Show:** `http://127.0.0.1:3000/analytics`
**Say:** "Go serves read-only aggregate KPIs: 40 businesses, 320 reviews, 3.0 average rating. The category chart shows 14 Restaurants / 13 Hotels / 13 Tours, reviews by month trends, and a top-10 businesses ranking — all computed in PostgreSQL and shipped as single numbers, not raw rows."
**Evidence:** Aggregate KPIs card, category bar chart, monthly chart, top-10 list
**Screenshot:** `docs/screenshots/analytics.png`

---

## Segment 6 — Database (≈25s)

**Show:** `docs/database.md` ER diagram
**Say:** "Seven tables: users, categories, businesses, amenities, business_amenities, reviews, personal_access_tokens. Category 1→N Business, Business 1→N Review, Business N→N Amenity, User 1→N Business. Ratings enforce a PostgreSQL CHECK constraint from 1 through 5."
**Evidence:** ER diagram in `docs/database.md`
**Screenshot:** none (document reference)

---

## Segment 7 — Docker (≈25s)

**Show:** `docker compose ps` output
**Say:** "One command starts everything: `docker compose up --build`. Four services — PostgreSQL, Laravel, Go analytics, Next.js — on a single `backend` network with service-name addressing (`laravel:8000`, `analytics:8080`, `postgres:5432`). Every service has a healthcheck; Laravel waits for PostgreSQL to be healthy before starting."
**Evidence:** `docker compose ps` showing all services `Up (healthy)`
**Screenshot:** none (terminal output)

---

## Segment 8 — SQL optimization (≈30s)

**Show:** `docs/performance.md`
**Say:** "The TopBusinesses query was the slowest at 0.251 ms median — a hash join over the unindexed `reviews.business_id` foreign key. Adding `reviews_business_id_index` produced an honest flat line: 0.251 ms → 0.282 ms. At 320 cached rows, a hash join from seq scans is genuinely optimal; the design transfers, the milliseconds don't."
**Evidence:** EXPLAIN plan text, `reviews_business_id_index` migration DDL
**Screenshot:** none (document reference)

---

## Segment 9 — Why Laravel + Go + Next.js (≈40s)

**Show:** `docs/README.md` responsibilities table
**Say:** "Laravel owns the transactional domain: REST API, Sanctum auth, policies, validation, rate limiting. Go is deliberately read-only analytics — a clear second-backend-language use case, not 'Go because it's popular.' Next.js owns UI, routing, forms, visualization, API consumption — no business rules, no DB access. PostgreSQL provides relational integrity and analytical SQL. This creates a realistic multi-service architecture without splitting every small feature into a microservice."
**Evidence:** Responsibilities table in `docs/README.md` and `docs/day-7-portfolio-interview.md` lines 577–601
**Screenshot:** none (document reference)

---

## Closing — Final Definition of Done recap (≈20s)

**Show:** `docs/README.md` Final Definition of Done
**Say:** "Every checkpoint is green: Next.js dashboard works, Laravel REST API works, Go analytics service works, PostgreSQL stores relational data, Docker starts the environment, authentication and authorization work, CRUD works, analytics work, SQL optimization is documented, all automated tests pass, README explains architecture, database design is documented, API is documented, and a clean Docker rebuild succeeds. That's CaribeOps."
**Evidence:** `docs/README.md` lines 631–648 (all ✓ checked)
**Screenshot:** none (document reference)

---

## Quick-reference checklist

| Segment | Show | Say | Evidence | Screenshot |
|---------|------|-----|----------|------------|
| 1 Problem | Title screen | Tourism ops problem | App title | `docs/screenshots/dashboard.png` |
| 2 Architecture | `docs/images/architecture.svg` | Next.js → Laravel/Go → PostgreSQL; Docker boundary | Component diagram | `docs/images/architecture.svg` |
| 3 Login | `http://127.0.0.1:3000/login` | `test@example.com` / `password`; Bearer token | Redirect to `/` | `docs/screenshots/login.png` |
| 4 Businesses | `http://127.0.0.1:3000/businesses` | 40 businesses, filters, pagination | 15 of 40, page 1 of 3 | `docs/screenshots/business-list.png` |
| 5 Analytics | `http://127.0.0.1:3000/analytics` | KPIs 40/320/3.0; category chart; top-10 | Aggregate KPIs card | `docs/screenshots/analytics.png` |
| 6 Database | `docs/database.md` | 7 tables; 1→5 rating CHECK constraint | ER diagram | none |
| 7 Docker | `docker compose ps` | 4 services, healthchecks, service names | All `Up (healthy)` | none |
| 8 SQL optimization | `docs/performance.md` | TopBusinesses 0.251→0.282 ms; index added | EXPLAIN plan | none |
| 9 Why stack | `docs/README.md` responsibilities table | Laravel/Go/Next.js/PostgreSQL roles | Responsibilities table | none |
| Closing | `docs/README.md` Final DoD | All 13 checkpoints green | Final Definition of Done | none |

---

## Startup commands (clean state)

```bash
# From repository root:
docker compose down -v          # fresh volume (destroys postgres_data)
docker compose up --build -d    # build all images, start all services
# Wait for all services healthy:
docker compose ps
# From repository root:
php artisan migrate:fresh --seed --no-interaction   # from backend/laravel
# From frontend/next:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 NEXT_PUBLIC_ANALYTICS_URL=http://127.0.0.1:8080 npm run dev
```

Open `http://127.0.0.1:3000` and sign in with `test@example.com` / `password`.
