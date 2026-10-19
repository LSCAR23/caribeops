# Deterministic Demo Seed — Predictable Interview Dataset

CaribeOps' development seed dataset is deterministic: repeated database resets
produce the same counts **and** the same values, so an interview demo is
reliable from reset to reset. Documented per Day-7 task D7-15.

## How determinism is achieved

| Source of randomness | How it is made deterministic |
|----------------------|------------------------------|
| Reference data (categories, amenities) | `firstOrCreate` keyed on the unique `slug` — repeat-safe without seeding |
| Factory values (names, descriptions, ratings, dates) | PHP's global RNG seeded with `mt_srand(2026); srand(2026);` at the start of `BusinessDataSeeder::run()` — Faker uses `mt_rand`/`rand` internally |
| Business → category assignment | Round-robin through Hotels / Restaurants / Tours (replaces `inRandomOrder()`, which is SQL `RANDOM()` and not seedable) |

The change is contained in `backend/laravel/database/seeders/BusinessDataSeeder.php`:
- `mt_srand(2026); srand(2026);` at the start of `run()`.
- The 37 factory-created businesses are created in a loop, each `->for($category)` with round-robin category assignment through the 3 seeded categories (deterministic). The 3 named businesses keep their explicit `->for($category)` + `->state(['type' => $type])`.
- `CategorySeeder`, `AmenitySeeder`, and all factory definitions are unchanged.

## Expected dataset after every reset

| Table | Expected rows | Notes |
|-------|--------------:|-------|
| `categories` | 3 | Hotels (`hotels`), Restaurants (`restaurants`), Tours (`tours`) |
| `amenities` | 20 | Wi-Fi, Parking, Pool, …, Eco Friendly (unique slugs) |
| `businesses` | 40 | 3 named + 37 factory, split round-robin across the 3 categories (14/13/13) |
| `reviews` | 320 | 8 per business; ratings 1–5 |
| `users` | 1 | Fixed sample user (`test@example.com`) |

Business → category split: the 3 named businesses are Boutique hotel (Hotels), Café (Restaurants), Snorkeling tour (Tours); the 37 factory businesses round-robin through Hotels / Restaurants / Tours, giving 14 / 13 / 13 respectively.

Relationships are stable: every business has a category, 1–4 amenities attached, and exactly 8 reviews with ratings 1–5.

## Reset and verify procedure

Reuse the D7-14 reset flow from `docs/database-reset.md`, then verify counts and relationships:

```bash
# 1. Stop the stack and destroy the database volume
docker compose down -v

# 2. Restart PostgreSQL on a blank disk
docker compose up -d postgres

# 3. From backend/laravel, drop all tables, run every migration, then seed
cd backend/laravel
php artisan migrate:fresh --seed --database=pgsql --no-interaction

# 4. Restart the remaining services
cd ..
docker compose up -d --build

# 5. Verify counts from the running container
docker compose exec -T postgres psql -U caribeops -d caribeops -c \
  "SELECT 'categories' AS t, count(*) FROM categories UNION ALL
   SELECT 'amenities', count(*) FROM amenities UNION ALL
   SELECT 'businesses', count(*) FROM businesses UNION ALL
   SELECT 'reviews', count(*) FROM reviews;"
```

Expected output:

```
       t        | count
---------------+-------
 categories    |     3
 amenities     |    20
 businesses    |    40
 reviews       |   320
```

To confirm determinism across repeated resets, run the full flow twice and compare the row-count output plus spot-check business names, types, and ratings — they should be identical.

## Verification checklist

- [ ] `php -l backend/laravel/database/seeders/BusinessDataSeeder.php` → no syntax errors.
- [ ] `vendor/bin/pint --dirty --format agent` → formatting clean (from `backend/laravel`).
- [ ] Full reset flow above exits 0 and returns counts 3 / 20 / 40 / 320.
- [ ] Two consecutive resets produce identical counts and spot-checked values.
- [ ] `git diff --check` clean.

## Related documentation

- `docs/database-reset.md` — D7-14: complete destroy → rebuild → seed flow (destructive dev-only warning included).
- `docs/database.md` — ER diagram, relationships, constraints, indexes.
- `docs/setup.md` — D7-13: clean-checkout → running-stack flow.
