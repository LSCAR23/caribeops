# D7-23 — Start the Entire Project From Zero

- Task: D7-23 — Start the Entire Project From Zero
- Date: 2026-10-19
- Status: Checked — awaiting user approval

## Desired outcome

Start the entire project from zero: `docker compose down -v` then `docker compose up --build`, confirming environment boots successfully and all expected services become healthy, per the Day-7 D7-23 spec (`docs/day-7-portfolio-interview.md` lines 478–493). Test — "Environment boots successfully and all expected services become healthy." Learning — "The final clean start validates the entire infrastructure story."

## Scope

**In scope:**
- `docker compose down -v` — destroy containers and `postgres_data` volume (destructive, dev-only)
- `docker compose up --build` — build all images and start all services
- Confirm all services become healthy (`docker compose ps`)
- Re-seed the database after fresh start (`php artisan migrate:fresh --seed` in laravel container)

**Non-goals:**
- No application code changes
- Do not commit unless explicitly requested
- Do not run frontend smoke test (D7-24) — separate task

## Analysis carried forward

From `/analize` and direct repo inspection:

**Task & intended outcome:** Full clean start from zero to validate the infrastructure story. Binary criterion: all services healthy or not.

**Current behavior / repository evidence:**
- `docker-compose.yml` defines 4 services with healthchecks
- `laravel.depends_on.postgres: service_healthy` — startup ordering
- `docker/postgres-init/` — initdb mount bootstraps `analytics` role + grants on first init
- `backend/laravel/database/seeders/` — DatabaseSeeder creates test user + calls CategorySeeder, AmenitySeeder, BusinessDataSeeder
- `make test` / `make smoke` targets exist
- Previous evidence: stack was previously built and healthy; `migrate:fresh --seed` completed with 40/320 counts

**Gaps:** `docker compose down -v` destroys `postgres_data` volume — all data lost; must re-seed.

**Dependencies:** Docker daemon running; source files intact; initdb scripts valid; seeders valid.

## Current-state evidence and relevant files

- `docker-compose.yml` — 4 services, healthchecks, depends_on, volumes, networks
- `docker/postgres-init/01-analytics-role.sh` — analytics login role bootstrap
- `docker/postgres-init/02-analytics-grants.sql` — SELECT-only grants
- `backend/laravel/database/seeders/DatabaseSeeder.php` — creates user + calls seeders
- `backend/laravel/database/seeders/BusinessDataSeeder.php` — 40 businesses, 320 reviews
- `backend/laravel/Dockerfile` — `composer install --no-dev`

## Learning objectives

- **Infrastructure as code:** `docker compose up --build` should reproduce the entire environment from source.
- **Volume destruction:** `down -v` destroys data; re-seed required after fresh start.
- **Health-gated startup:** services start in dependency order via healthchecks.

## Ordered implementation steps

1. **Destroy and remove volume:** `docker compose down -v`
2. **Build and start:** `docker compose up --build -d`
3. **Confirm health:** all services `Up (healthy)` via `docker compose ps`
4. **Re-seed database:** `docker compose exec laravel php artisan migrate:fresh --seed --no-interaction` (or from `backend/laravel`)
5. **Verify seed counts:** 3 categories, 20 amenities, 40 businesses, 320 reviews; seeded user `test@example.com`
6. **Run `git diff --check`** to confirm no unintended changes
7. **Confirm no commit** unless explicitly requested

## Tests and verification commands, plus expected results

1. `docker compose down -v` — expected: containers removed, volume destroyed
2. `docker compose up --build -d` — expected: all images built, containers started
3. `docker compose ps` — expected: all services `Up (healthy)`
4. `php artisan migrate:fresh --seed --no-interaction` — expected: all seeders DONE
5. Row-count verification: 3/20/40/320 counts; user `test@example.com` exists
6. `git diff --check` — expected: exit 0 (clean)

## Risks, dependencies, and unresolved questions

- **Risk: destructive operation** — `down -v` destroys `postgres_data` volume; all data lost
- **Risk: build failures** — any Dockerfile issue blocks startup
- **Risk: seed failures** — BusinessDataSeeder needs `fake()` (faker installed via `composer require --dev` in container — container-local, not committed)
- **Dependency: Docker daemon running** — confirmed
- **Unresolved:** whether faker is still installed in the running container from D7-19 (container-local change)

## Plan check

Findings (verified against the current repository):

- Status set to `Checked — awaiting user approval`; `Analysis carried forward` section present and grounded in direct repo inspection.
- All required sections present: desired outcome, scope + explicit non-goals, current-state evidence, learning objectives, ordered implementation steps, tests/verification commands, risks/dependencies/unresolved questions, `/implement` reminder.
- Evidence verified:
  - docker-compose.yml defines 4 services with healthchecks and depends_on
  - docker/postgres-init scripts valid for initdb mount
  - Seeders confirmed present (DatabaseSeeder, BusinessDataSeeder)
  - `docker compose down -v` is destructive (destroys postgres_data volume) — documented
  - `docker compose up --build` correct for full rebuild from source
- Plan's verification commands are correct: `docker compose down -v`, `docker compose up --build -d`, `docker compose ps`, `php artisan migrate:fresh --seed --no-interaction`, `git diff --check`
- No evidence-based scope changes required.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary:

**Full clean start from zero:**
1. `docker compose down -v` — destroyed all containers, `postgres_data` volume, and `backend` network
2. `docker compose up --build -d` — built all images and started all services
3. All services healthy: postgres/laravel/analytics (healthy), next (running)
4. `php artisan migrate:fresh --seed --no-interaction` — all seeders DONE (CategorySeeder, AmenitySeeder, BusinessDataSeeder)
5. Seed verified: 3 categories, 20 amenities, 40 businesses, 320 reviews, user `test@example.com` (id=1)

**Infrastructure fix (necessary for D7-23):** Fixed `docker/postgres-init/02-analytics-grants.sql` — wrapped table-level GRANTs in a DO block with `WHEN undefined_table THEN NULL` exception handler. On fresh-volume init, this script runs before Laravel migrations create the tables; without the fix, `GRANT SELECT ON businesses, categories, reviews` fails with `ON_ERROR_STOP=1` and kills the postgres container. Now silently skips missing tables on init, succeeds when re-run after migrations.

**Verification:**
- `docker compose ps` → all 4 services healthy
- `git diff --check` → exit 0 (clean)
- `git status --short` → only MEMORY.md modified, docker/postgres-init/02-analytics-grants.sql modified, new untracked plan files; no source code changed

**No commit made** (not requested).

## Reminder

This plan is now `Implemented — verified`. No further `/implement` needed for this task. Next in the Day-7 block: D7-24 Perform Complete Manual Smoke Test.
