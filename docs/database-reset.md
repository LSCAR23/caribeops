# Database Reset — Rebuild CaribeOps from Migrations + Seeders

Documented procedure to destroy and rebuild the CaribeOps development database
and its seed data without manual undocumented steps, per Day-7 task D7-14.

```text
php artisan migrate:fresh --seed --database=pgsql --no-interaction
```

Run from `backend/laravel` against a **disposable local database**. The command
drops all tables, re-runs every migration, then re-seeds reference + demo data.

## ⚠️ Destructive — development only

`migrate:fresh` drops **all tables and all data** from the configured database
before rebuilding it. Never run this against:

- a production database
- a shared/staging database
- any database containing data that must be kept

This warning is carried verbatim from `docs/day-2-laravel-postgresql.md` (D2-08 /
seeder section). If you are unsure which database is configured, check
`backend/laravel/.env` (`DB_DATABASE`, `DB_HOST`, `DB_PORT`) first rather than
guessing.

## Prerequisites

- The Compose stack is stopped (or at least PostgreSQL is reachable).
- You are at the repository root.

## Full reset flow

From the repository root:

```bash
# 1. Stop the stack (keeps the postgres_data volume)
docker compose down

# 2. Destroy the database volume so PostgreSQL starts from a blank disk
docker compose down -v

# 3. Restart PostgreSQL alone so Laravel can connect to a fresh, empty database
docker compose up -d postgres

# 4. From backend/laravel, drop all tables, run every migration, then seed
cd backend/laravel
php artisan migrate:fresh --seed --database=pgsql --no-interaction

# 5. Start the remaining services so the full stack is live again
cd ..
docker compose up -d --build
```

Step 2 is what makes this a true "destroy and rebuild": it removes
`postgres_data`, so PostgreSQL recreates its data directory on next startup and
no old rows survive. If you skip step 2, `migrate:fresh` still drops and
recreates tables, but the volume retains any files outside PostgreSQL's data
directory.

## Why this order matters

`DatabaseSeeder` runs seeders in this sequence:

1. one sample `User` (fixed email `test@example.com`)
2. `CategorySeeder` — Hotels, Restaurants, Tours (3 rows)
3. `AmenitySeeder` — 20 tourism amenities
4. `BusinessDataSeeder` — 40 businesses, 8 reviews each (320 reviews), with random amenity attachments

`BusinessDataSeeder` reads categories and amenities before creating businesses,
so categories and amenities must exist first — they do, because of the ordering
above. It also rejects runs when either reference table is empty, which would
fail on a truly empty schema if the seeder order were ever changed.

## Idempotence and re-seeding

Not all seeders are equally safe to re-run:

| Seeder | Idempotent? | Behavior on re-run |
|--------|-------------|--------------------|
| `CategorySeeder` | Yes | `firstOrCreate` keyed on unique `slug`; no duplicates |
| `AmenitySeeder` | Yes | `firstOrCreate` keyed on unique `slug`; no duplicates |
| `BusinessDataSeeder` | **No** | `factory()->create()` inserts **new** businesses and reviews every run |

Because `BusinessDataSeeder` is not idempotent, a naive re-seed without dropping
first produces duplicate businesses and reviews. Always pair a re-seed with
`migrate:fresh` (which drops tables first) — as shown in the full flow above —
to get a clean dataset rather than accumulated duplicates.

If you only need to re-seed reference data without touching businesses or
reviews, you can run a focused seeder directly against the existing schema:

```bash
cd backend/laravel
php artisan db:seed --class=CategorySeeder --database=pgsql --no-interaction
php artisan db:seed --class=AmenitySeeder --database=pgsql --no-interaction
```

Never run `BusinessDataSeeder` directly on an existing schema unless you intend
to add another 40 businesses and 320 reviews on top of what is already there.

## Expected dataset after reset

Once `migrate:fresh --seed` completes, the development database should contain:

| Table | Expected rows |
|-------|--------------:|
| `categories` | 3 (Hotels, Restaurants, Tours) |
| `amenities` | 20 |
| `businesses` | 40 |
| `reviews` | 320 (8 per business; ratings 1–5) |

You can confirm with read-only SQL against the running container:

```bash
docker compose exec -T postgres psql -U caribeops -d caribeops -c \
  "SELECT 'categories' AS t, count(*) FROM categories UNION ALL
   SELECT 'amenities', count(*) FROM amenities UNION ALL
   SELECT 'businesses', count(*) FROM businesses UNION ALL
   SELECT 'reviews', count(*) FROM reviews;"
```

## Verification checklist (from a clean checkout)

- [ ] `docker compose down -v` removes containers and the `postgres_data` volume.
- [ ] `docker compose up -d postgres` brings PostgreSQL back to `healthy`.
- [ ] `php artisan migrate:fresh --seed --database=pgsql --no-interaction` exits 0 from `backend/laravel`.
- [ ] The row-count query above returns 3 / 20 / 40 / 320.
- [ ] `docker compose up -d --build` restores the full stack; health endpoints (`:8000/api/health`, `:8080/health`, `:3000`) return 200.

## Test database caveat

`backend/laravel/phpunit.xml` configures an in-memory SQLite test database, but
several domain migrations use PostgreSQL-only `ALTER TABLE ... ADD CONSTRAINT`
syntax, so the Laravel test suite targets SQLite while the documented reset
procedure targets PostgreSQL (`--database=pgsql`). Do not mix them: always run
the reset command above against `pgsql`, never against the test connection.

## Related documentation

- `docs/database.md` — ER diagram, relationships, constraints, indexes derived from the 10 domain migrations.
- `docs/setup.md` — D7-13 stack startup flow (`git clone` → `cp .env.example .env` → `docker compose up --build` → health checks → `make test`/`make smoke`).
- `docs/day-2-laravel-postgresql.md` — D2-08 `migrate:fresh` and the seeder section, including the destructive warning carried into this doc.
- `docs/day-7-portfolio-interview.md` — D7-14 spec and sibling D7-15 deterministic demo seed.
