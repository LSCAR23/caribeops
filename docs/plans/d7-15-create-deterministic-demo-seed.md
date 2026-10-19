# D7-15 — Create Deterministic Demo Seed

- Task: D7-15 — Create Deterministic Demo Seed
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Create a predictable seed dataset for interviews per the Day-7 D7-15 spec (`docs/day-7-portfolio-interview.md` lines 333-345): "Create a predictable seed dataset for interviews." Test: "Repeated resets produce broadly consistent counts and relationships." Learning: "A deterministic demo makes an interview presentation more reliable."

Scope per user decision: **Option B** — code + docs. Make the seeders/factories produce deterministic **values** (not just counts) by seeding PHP's RNG with a fixed value and assigning categories deterministically, then document the dataset. Builds on D7-14 (`docs/database-reset.md`) reset procedure.

## Scope

**In scope:**
- Modify `backend/laravel/database/seeders/BusinessDataSeeder.php`:
  - Seed PHP's RNG with fixed values (`mt_srand(2026); srand(2026);`) at the start of `run()` so Faker's `fake()` calls (which use PHP's `mt_rand`/`rand` internally) produce repeatable names, descriptions, addresses, ratings, dates, etc.
  - Assign categories deterministically (round-robin through Hotels/Restaurants/Tours) for the 37 factory-created businesses instead of `inRandomOrder()` (SQL random, not seedable). The 3 named businesses already use `->for($category)`.
- Create `docs/deterministic-demo-seed.md` documenting:
  - The fixed RNG seed (2026) and what it controls
  - Expected deterministic dataset (3 categories, 20 amenities, 40 businesses, 320 reviews; relationships; sample business names/types/ratings)
  - How to verify repeated resets produce consistent counts and relationships (`docker compose down -v` + `migrate:fresh --seed` from `docs/database-reset.md`, then row-count + relationship checks)
- Run `php -l` and `vendor/bin/pint --dirty --format agent` on changed PHP files (Laravel rules)
- Verify `git diff --check` clean

**Non-goals:**
- No changes to `CategorySeeder` or `AmenitySeeder` (already deterministic via `firstOrCreate` by unique slug).
- No changes to `UserFactory`, `BusinessFactory`, `ReviewFactory` definitions (changes are contained in the seeder via Faker seed + `->for()` category assignment; factory `inRandomOrder()` is overridden by `->for()`).
- No new factories or seeders.
- No test additions (existing suite doesn't assert on random values — confirmed via grep).
- No application behavior changes outside seeding.

## Analysis carried forward

From `/analize` of "D7-15 — Create Deterministic Demo Seed" and direct repo inspection:

**Task & intended outcome:** Create a predictable seed dataset for interviews (D7-15 spec). Test: repeated resets produce broadly consistent counts and relationships. Option B (code + docs) per user decision.

**Current behavior / repository evidence:**
- Work tree clean on `master`; no user changes to preserve. No existing `d7-15` plan.
- `backend/laravel/composer.json`: `fakerphp/faker: ^1.23` in require-dev. Faker available.
- `CategorySeeder`: 3 categories (Hotels/Restaurants/Tours) via `firstOrCreate` by unique slug — idempotent, deterministic values.
- `AmenitySeeder`: 20 amenities via `firstOrCreate` by unique slug — idempotent, deterministic values.
- `BusinessDataSeeder`: 3 named businesses (Boutique hotel/CafǸ/Snorkeling tour via `->for($category)` + `->state(['type' => $type])`) + 37 factory businesses × 8 reviews = 320 reviews. Counts deterministic; **values random** via `fake()`. Category for factory businesses uses `inRandomOrder()` (SQL random — not Faker-seedable).
- `DatabaseSeeder`: 1 fixed user ('Test User', 'test@example.com') + calls all three seeders; uses `WithoutModelEvents`.
- `BusinessFactory`: uses `fake()` (name, description, address, website, phone) + `inRandomOrder()` for category + `randomElement()` for type.
- `ReviewFactory`: uses `fake()` (rating 1-5, title, content, review_date).
- `UserFactory`: uses `fake()` (name, email) — but DatabaseSeeder passes fixed name/email, so user is already deterministic.
- Grep of `tests/`: **zero** uses of `fake()`, `Faker`, `numberBetween`, `randomElement`, `unique()`, `->name()`, `->company()` — existing tests don't assert on random values, so deterministic changes won't break them.
- `docs/database-reset.md` (D7-14): documents `docker compose down -v` + `migrate:fresh --seed --database=pgsql --no-interaction`, expected counts 3/20/40/320, destructive warning. D7-15 builds on this.
- `phpunit.xml` uses SQLite `:memory:`; domain migrations use PG-specific constraints — reset targets `pgsql` (documented in D7-14).

**Gaps:** No Faker seed, no deterministic category assignment, no documentation of expected values. D7-15 fills this.

**Risks/unknowns:**
- Risk: `inRandomOrder()` is SQL random, not affected by Faker seed — mitigated by using `->for($category)` with round-robin assignment for all 40 businesses in the seeder.
- Risk: `mt_srand`/`srand` are global state — mitigated by scoping to `BusinessDataSeeder::run()` (seeder runs once at end of `migrate:fresh --seed`, isolated from other code).
- Risk: ReviewFactory's `'business_id' => Business::factory()` nested factory — existing verified behavior (40 businesses confirmed), not changed here.
- Unresolved: none after Option B decision.

## Current-state evidence and relevant files

- `backend/laravel/database/seeders/BusinessDataSeeder.php` — file to modify (PHP RNG seed + deterministic categories).
- `backend/laravel/database/seeders/CategorySeeder.php` — already deterministic (reference only).
- `backend/laravel/database/seeders/AmenitySeeder.php` — already deterministic (reference only).
- `backend/laravel/database/seeders/DatabaseSeeder.php` — seeder order (reference only).
- `backend/laravel/database/factories/BusinessFactory.php` — uses `fake()` + `inRandomOrder()` (reference only; overridden by `->for()` in seeder).
- `backend/laravel/database/factories/ReviewFactory.php` — uses `fake()` (reference only; seeded via PHP RNG).
- `backend/laravel/database/factories/UserFactory.php` — uses `fake()` (reference only; fixed data passed in DatabaseSeeder).
- `backend/laravel/composer.json` — `fakerphp/faker: ^1.23` dev dependency.
- `backend/laravel/tests/` — 22 test files; grep confirmed zero `fake()`/`Faker` usage.
- `docs/database-reset.md` — D7-14 reset flow (D7-15 builds on this).
- `docs/day-7-portfolio-interview.md` — D7-15 spec (lines 333-345).
- `.gitignore`, `Makefile` (no test command changes needed).

## Learning objectives

- Deterministic demo data = same **counts AND same values** across resets, so an interview demo is reliable.
- Laravel factories use `fake()` which relies on PHP's global RNG (`mt_rand`/`rand`); calling `mt_srand($seed); srand($seed);` at the start of the seeder makes factory-generated values repeatable across resets.
- `inRandomOrder()` is SQL-level randomness (PostgreSQL `RANDOM()`), not Faker — must be handled separately (use `->for()` with deterministic category assignment).
- `firstOrCreate` keyed on unique slugs makes reference seeders repeat-safe without Faker seeding.

## Ordered implementation steps

1. Modify `BusinessDataSeeder::run()`:
   a. At the start of `run()`, seed PHP's RNG: `mt_srand(2026); srand(2026);` so all subsequent `fake()` calls are deterministic.
   b. Replace `Business::factory()->count(37)->create()` with a loop creating 37 businesses, each `->for($category)` with round-robin category assignment through the 3 seeded categories (deterministic; replaces `inRandomOrder()` which is SQL random).
   c. Keep the 3 named businesses unchanged (already deterministic via `->for($category)` + `->state(['type' => $type])`).
   d. No new imports needed (`mt_srand`/`srand` are PHP built-ins).
2. Create `docs/deterministic-demo-seed.md` documenting the fixed seed, expected values, relationships, and reset+verify procedure (reusing `docs/database-reset.md` commands).
3. Run `php -l backend/laravel/database/seeders/BusinessDataSeeder.php` (syntax check).
4. Run `vendor/bin/pint --dirty --format agent` on the changed seeder (Laravel Pint rule).
5. Verify `git diff --check` clean; documentation-only + one seeder change.

## Tests and verification commands, plus expected results

- `php -l backend/laravel/database/seeders/BusinessDataSeeder.php` → no syntax errors.
- `vendor/bin/pint --dirty --format agent` → formatting clean (or auto-fixed).
- `git diff --check` clean.
- `docs/deterministic-demo-seed.md` exists with: fixed RNG seed (2026), expected dataset (3/20/40/320), deterministic relationships, reset+verify procedure reusing D7-14 commands.
- Full `migrate:fresh --seed` flow NOT executed here (no live dev PostgreSQL confirmed, consistent with D7-14 verification limit); commands statically confirmed against repo.

## Risks, dependencies, and unresolved questions

- Risk: `mt_srand`/`srand` are global state — mitigated by scoping to `BusinessDataSeeder::run()` (runs once at end of `migrate:fresh --seed`, isolated from other code).
- Risk: `inRandomOrder()` (SQL random) bypasses PHP RNG seed — mitigated by `->for($category)` round-robin for all factory businesses.
- Dependency: D7-14 `docs/database-reset.md` (implemented) provides the reset flow D7-15's verification reuses.
- Unresolved: none — Option B scope confirmed by user.

## Plan check

Findings (all verified against the current repository):

- Plan location: `docs/plans/d7-15-create-deterministic-demo-seed.md` created; no existing `d7-15` plan to conflict with.
- `Analysis carried forward` section present and grounded in direct repo inspection.
- All referenced files confirmed present: `BusinessDataSeeder.php`, `CategorySeeder.php`, `AmenitySeeder.php`, `DatabaseSeeder.php`, `BusinessFactory.php`, `ReviewFactory.php`, `UserFactory.php`, `composer.json`, `docs/database-reset.md`, `docs/day-7-portfolio-interview.md`.
- PHP 8.4.26 CLI available for `php -l` syntax check; `vendor/bin/pint` exists for Pint formatting.
- `fakerphp/faker: ^1.23` confirmed in `composer.json` require-dev.
- Grep of `backend/laravel/tests/` confirmed **zero** uses of `fake()`, `Faker`, `numberBetween`, `randomElement`, `unique()`, `->name()`, `->company()` — existing tests won't break from deterministic seeding.
- **Correction during check:** FakerPHP `Factory::create()` accepts only a locale, not a seed — the plan was corrected to seed PHP's global RNG via `mt_srand(2026); srand(2026);` at the start of `BusinessDataSeeder::run()`, which is the correct way to make Faker's `mt_rand`/`rand`-based output deterministic.
- `inRandomOrder()` confirmed as SQL-level randomness (PostgreSQL `RANDOM()`), not affected by PHP RNG seed — mitigated by `->for($category)` round-robin assignment.
- Expected dataset counts (3 categories, 20 amenities, 40 businesses, 320 reviews) grounded in seeder code and MEMORY.md.

Changes made during check: corrected the Faker-seeding mechanism from an invalid `Factory::create($locale, $seed)` to `mt_srand`/`srand`; status advanced to `Checked — awaiting user approval`.

Verification limits: the full `migrate:fresh --seed` flow was NOT executed here (no live dev PostgreSQL run confirmed in this environment, consistent with D7-14's verification limit); every command/path was statically confirmed against repo files instead. One PHP file + one doc file changed; no tests, factories, or other seeders touched.

## Implementation outcome

- Implemented D7-15 — Create Deterministic Demo Seed:
  - Modified `backend/laravel/database/seeders/BusinessDataSeeder.php`:
    - Added `mt_srand(2026); srand(2026);` at the start of `run()` so Faker's `fake()` calls (PHP `mt_rand`/`rand`-based) produce repeatable names, descriptions, addresses, ratings, dates, etc.
    - Replaced `Business::factory()->count(37)->create()` (which used `inRandomOrder()` — SQL `RANDOM()`, not seedable) with a loop of 37 `Business::factory()->for($category)` calls using round-robin category assignment through the 3 seeded categories (14/13/13 split).
    - The 3 named businesses (Boutique hotel/Café/Snorkeling tour) unchanged — already deterministic via `->for($category)` + `->state(['type' => $type])`.
    - No new imports (`mt_srand`/`srand` are PHP built-ins); `CategorySeeder`, `AmenitySeeder`, and all factory definitions unchanged.
  - Created `docs/deterministic-demo-seed.md`: fixed RNG seed (2026), expected dataset (3 categories / 20 amenities / 40 businesses / 320 reviews; ratings 1–5), deterministic relationships, reset+verify procedure reusing D7-14 (`docs/database-reset.md`) commands, verification checklist, related docs links.
- Verification: `php -l backend/laravel/database/seeders/BusinessDataSeeder.php` → no syntax errors; `php vendor/bin/pint --dirty --format agent` → passed; `git diff --check` clean (exit 0); `git status --short` shows `docs/database-reset.md` (pre-existing, D7-14), `docs/deterministic-demo-seed.md` (new), `docs/plans/d7-15-create-deterministic-demo-seed.md` (new), and `backend/laravel/database/seeders/BusinessDataSeeder.php` (modified). Full `migrate:fresh --seed` flow NOT executed here (no live dev PostgreSQL run confirmed in this environment); every command/path statically confirmed against repo files instead. No test changes needed — grep confirmed zero `fake()`/`Faker` usage in `tests/`.
- No commit made.
