# D7-27 — Create a realistic, high-volume database seeder

Status: Implemented — verified (approved in-session with one amendment: the documented workflow must clean the whole database first, then fill it with the massive seeder. Implemented, validated, and demo environment seeded; see Implementation outcome).

## Analysis carried forward

- Schema (10 app migrations): `categories`/`amenities` (unique `slug`), `businesses` (uuid PK, `category_id` FK, `user_id` nullable FK nullOnDelete, required `name`/`description`/`type(120)`/`address`/`phone(32)`, lat/long CHECKs, NOT NULL timestamps, **no unique constraint on name**), `reviews` (uuid PK, `business_id` FK, rating CHECK 1–5, required `title`/`content`, `review_date` DATE), `business_amenities` (unique pair). No schema change needed: hostel/cabin/tour-operator variety maps onto the 3 existing categories via the free-form `type` field.
- Existing seeders: `CategorySeeder`/`AmenitySeeder` idempotent `firstOrCreate` (3 categories, 20 amenities); `BusinessDataSeeder` deterministic (`mt_srand(2026)`), 40 businesses / 320 reviews, counts pinned in `docs/deterministic-demo-seed.md` and README — must stay intact. `DatabaseSeeder` chains user + those three.
- Consumers: Go analytics date-filters `businesses.created_at` and `reviews.review_date` (inclusive `::date`); `ReviewsByMonth` omits zero months; `TopBusinesses` ranks rated businesses only. Laravel `/dashboard/summary` counts `created_at >= now()-7d`, so a few businesses must open within the last 7 days.
- Run environment: host PHP 8.4 against Docker Postgres `127.0.0.1:5433` is the proven seeding path (Laravel container image is `--no-dev`, faker missing there). Pint required for PHP changes; `php artisan test --compact` (71 tests) guards regressions.
- Real-business verification: Wikivoyage `Puerto Viejo de Talamanca` and `Cahuita` articles (CC BY-SA, listings updated through Dec 2025) provide 34 verifiable businesses (name + category + town). Task forbids inventing details about real businesses, so only name/category/town are taken; phone uses the documented unassigned `+506 2000-xxxx` placeholder and coordinates are town-centre approximations, both clearly documented.
- User amendment (approved): the documented volume-seed workflow is destructive-first — `php artisan migrate:fresh` (clean everything) followed by the volume seeder (fill). Volume seeder ensures its own prerequisites (test user, categories, amenities) so the fill step is a single command. The env-gated `DatabaseSeeder` hook stays default-off.

## Plan

Files:

1. NEW `backend/laravel/database/seeders/CaribbeanVolumeSeeder.php` — env-configurable (`SEED_VOLUME_BUSINESSES=300`, `SEED_VOLUME_REVIEWS=18000`, `SEED_VOLUME_MONTHS=25`, `SEED_VOLUME_OWNERS=60`, `SEED_VOLUME_REFERENCE_DATE=today`), fixed RNG seed `2026`; guarantees prerequisites (`test@example.com` user, categories, amenities); ~34 web-verified real businesses (name/category/town only) + fictional region-inspired fill across 8 towns; owner-user pool (~60, 5% businesses owner-less); backdated `created_at` opening dates (25% pre-window, 60% spread in window, 5% last-7-days); activity tiers (15% high 150–400, 35% medium 40–120, 50% low 5–30 reviews) scaled to the review target; monthly seasonality (Dec–Apr + Jul–Aug peak, Sep–Nov trough) + growth trend; quality-correlated ratings 1–5; reviews only between opening and reference date; chunked bulk inserts; amenity links 1–8 respecting the unique pair; idempotence = skip existing business names, reviews only for businesses created in this run (documented: repeat runs add nothing; use `migrate:fresh` to regenerate).
2. NEW `docs/volume-seed.md` — clean-then-fill workflow, env vars, volumes, idempotence, synthetic-data disclaimer (all reviews/activity fictional; real businesses limited to verified name/category/town).
3. TOUCH `backend/laravel/database/seeders/DatabaseSeeder.php` — call volume seeder when `SEED_VOLUME=true` (default false; demo counts unchanged).
4. TOUCH `backend/laravel/.env.example` — document the `SEED_VOLUME*` variables.

Expected volumes (defaults): ~300 businesses + ~60 users + ~18,000 reviews + ~1,200 amenity links over 25 months (24 full + current partial), every month populated.

Validation: clean+fill run on host; SQL checks (totals, ≥24 non-empty months, per-category/tier splits, rating range, zero orphan FKs, zero duplicate names, no review before business opening, window bounds); live Laravel `:8000` + Go `:8080` endpoint checks incl. date-range presets and one custom range; second seeder run is a no-op; `vendor/bin/pint --dirty --format agent`; `php artisan test --compact`. No schema, API, analytics-query, or UI changes; slow-query observations reported separately if any.

## Plan check

(To be completed by `/check` before implementation.)

## Implementation outcome

Delivered as planned, with three validated deviations:

1. **Activity tiers are monthly rates, not lifetime totals.** Validation of the first run exposed an end-of-window spike (2,676 reviews in the partial current month) because lifetime totals get crammed into a new business's few active months. Tiers now model reviews-per-month (high 14–30, medium 4–10, low 0.5–2.5), scaled by one global factor to the review target; volume accrues with time open. The opening month is scaled by the share of the month actually open.
2. **Idempotence required strict RNG discipline.** Skipping existing records originally consumed fewer RNG draws on re-runs, so re-runs regenerated different fictional names and duplicated data (found at 600 businesses). Fixed: every spec iteration and every user factory build consumes identical draws whether or not anything is created, and the fictional loop length depends only on `SEED_VOLUME_BUSINESSES`. Also fixed: `firstOrCreate`+factory `raw()` email-merge bug that had prevented `test@example.com` from ever being created.
3. **Real-name businesses get a neutral-high quality band (3.8–4.8).** Random quality could attribute a synthetic 2.0 rating to a real, publicly listed business — a fabricated negative claim about it.

Files delivered: NEW `backend/laravel/database/seeders/CaribbeanVolumeSeeder.php`, NEW `docs/volume-seed.md`, TOUCH `backend/laravel/database/seeders/DatabaseSeeder.php` (env-gated, default off), TOUCH `backend/laravel/.env.example` (SEED_VOLUME* docs).

Verified (2026-10-20, host PHP 8.4 vs Docker Postgres):

- Clean-then-fill run: `migrate:fresh` + volume seeder → 274 businesses (34 real + 240 fictional; 26 deterministic name draws skipped as already-seeded), 18,002 reviews, 61 users (demo + 60 owners), 1,221 amenity links, 25 populated months in the 24-month window (44 months total incl. legacy openers), seasonality (Dec–Apr/Jul–Aug peaks, Sep–Nov troughs) + growth trend, 14 businesses opened in the last 7 days, 10 zero-review businesses (NULL-path test data).
- Integrity: 0 rating-range/opening-date violations, 0 duplicate names, 0 orphan FKs, amenities 1–8 per business.
- Idempotence: second run creates 0 businesses / 0 reviews; counts unchanged.
- Live endpoints: Laravel `:8000` (health, dashboard summary, businesses list/page 15/category/search, detail, reviews, amenities, login) all 200; Go `:8080` (overview, reviews-by-month, businesses-by-category, top-businesses; no-range, presets and custom from/to) all 200. Latencies 9–58 ms — no slow queries to report.
- `vendor/bin/pint --dirty --format agent` passed; `php artisan test --compact` 71/71 tests, 535 assertions.
- Screenshots refreshed against the seeded dataset at 1400×900: `docs/screenshots/{login,dashboard,business-list,business-detail,analytics}.png`.

Pre-existing bug found during UI validation (not caused by the seeder, left unfixed — API out of scope): the `GET /api/businesses/{business}` detail route never calls `withAvg('reviews', 'rating')`, so `average_rating` is always null on the detail response and the UI badge reads "No ratings yet" even with 24 reviews (the list route does include `withAvg`, so lists show ratings correctly).
