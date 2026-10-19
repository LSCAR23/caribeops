# Setup — Run CaribeOps from a Clean Checkout

These instructions take you from a clean Git clone to a running CaribeOps stack
(PostgreSQL + Laravel + Go analytics + Next.js) via Docker Compose.

```text
git clone ...
cp .env.example .env
docker compose up --build
```

The commands below are adjusted to this repository: real ports, real health
endpoints, and the one gotcha worth knowing before you reuse an existing
database volume.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and
  [Docker Compose](https://docs.docker.com/compose/install/) installed.
- A terminal (PowerShell on Windows; Bash/zsh elsewhere).

## 1. Clone the repository

```bash
git clone https://github.com/LSCAR23/caribeops.git
cd caribeops
```

The remote matches `git remote -v` in this repo. All paths below assume you are
at the repository root.

## 2. Copy the environment files

CaribeOps ships `.env.example` templates (committed) and ignores real `.env`
files via `.gitignore` — secrets never enter source control. Copy each template
to its working file:

```bash
# Root environment (PostgreSQL credentials + host port)
cp .env.example .env

# Laravel environment
cp backend/laravel/.env.example backend/laravel/.env

# Go analytics environment
cp analytics/go/.env.example analytics/go/.env
```

What the copies give you:

| File | Purpose |
|------|---------|
| `.env` | `POSTGRES_DB=caribeops`, `POSTGRES_USER=caribeops`, `POSTGRES_PASSWORD=caribeops_local`, `POSTGRES_PORT=5433`, `ANALYTICS_DB_PASSWORD=` (compose defaults to `analytics_local`) |
| `backend/laravel/.env` | Laravel app config; `DB_HOST=postgres` (Compose service name), `CACHE_STORE=file`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=file` |
| `analytics/go/.env` | Go service config; `PORT=8080`, `DATABASE_URL` using the `analytics` read-only role |

Edit any file only if you need different ports or passwords; the defaults match
`docker-compose.yml`.

## 3. Start the stack

```bash
docker compose up --build -d
```

This builds and starts four services:

| Service | Host port | Health endpoint |
|---------|-----------|-----------------|
| postgres | `127.0.0.1:5433` | `pg_isready` (container health check) |
| laravel | `127.0.0.1:8000` | `GET /api/health` |
| next | `127.0.0.1:3000` | HTTP server on `:3000` |
| analytics | `127.0.0.1:8080` | `GET /health` |

Inside Compose, services reach each other by service name on the `backend`
network (e.g. Laravel talks to `postgres:5432`, not `localhost`). Health checks
gate startup ordering: Laravel waits for PostgreSQL to become healthy before
starting.

PowerShell users can use the equivalent:

```powershell
./scripts/dev.ps1 up
```

## 4. Verify the services are healthy

From your host, curl every health endpoint:

```bash
# Laravel API
curl -fsS http://localhost:8000/api/health
echo

# Go analytics
curl -fsS http://localhost:8080/health
echo

# Next.js dashboard
curl -fsSI http://localhost:3000 | Select-Object -First 1   # PowerShell
# or: curl -fsSI http://localhost:3000 \| head -n 1          # Bash/zsh
```

Expected: HTTP 200 for all three. You can also watch container status:

```bash
docker compose ps
```

All four services should show `Up` (or `healthy` for postgres/laravel/analytics).

If a service is not healthy yet, wait a few seconds and re-curl; health checks
poll on intervals (postgres 5s, laravel 10s, analytics 10s).

## 5. Run the test suites

```bash
make test
```

This runs, in order:

1. Laravel: `cd backend/laravel && php artisan test --compact`
2. Go: `cd analytics/go && go test -count=1 ./...`
3. Frontend: `cd frontend/next && npm test` (vitest)

Each suite must exit 0. On Windows PowerShell, the equivalent is
`./test.ps1 test`.

For a quick infrastructure smoke check (no test runner needed):

```bash
make smoke
```

This curls `localhost:8000/api/health`, `localhost:8080/health`, and
`localhost:3000`. Equivalent PowerShell: `./test.ps1 smoke`.

## 6. Gotcha: reusing an existing `postgres_data` volume

The SQL files under `docker/postgres-init/` (`01-analytics-role.sh` creating
the `analytics` login role, `02-analytics-grants.sql` giving it read-only
SELECT on the tables Go reads) run automatically only when the
`postgres_data` volume is **fresh** — PostgreSQL runs initdb scripts once, on
the first startup of a new volume.

If you reuse an existing volume (e.g. you ran `docker compose up` before),
those scripts do **not** re-run, so the `analytics` role/grants may be missing
and the Go service will fail to connect. Re-apply them manually:

```bash
# Create/repair the analytics role
docker compose exec postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -v "pwd=$$ANALYTICS_DB_PASSWORD" <<EOSQL
CREATE ROLE analytics WITH LOGIN PASSWORD :'"'"'pwd'"'"';
ALTER ROLE analytics WITH LOGIN PASSWORD :'"'"'pwd'"'"';
EOSQL'

# Apply the read-only grants
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < docker/postgres-init/02-analytics-grants.sql
```

(On PowerShell, run the `psql` commands inside the container with
`docker compose exec postgres psql ...` and paste the SQL directly.)

After re-applying, restart analytics so it picks up the role:

```bash
docker compose restart analytics
```

## 7. Stop and clean up

```bash
# Stop and remove containers (keeps the postgres_data volume)
docker compose down

# Stop and remove containers plus the database volume (full reset)
docker compose down -v
```

PowerShell equivalent: `./scripts/dev.ps1 down`.

Use `down -v` when you want a completely clean database state; remember it
destroys all persisted data, and you will need to repeat step 6 to restore the
`analytics` role/grants on the next fresh volume.

## 8. Related documentation

- `docs/architecture.md` — component diagram, service responsibilities, request flows.
- `docs/database.md` — ER diagram, relationships, constraints, indexes.
- `docs/performance.md` — SQL optimization story (TopBusinesses index, EXPLAIN before/after).
- `docs/day-7-portfolio-interview.md` — Day-7 task list including this one (D7-13) and the remaining docs tasks (D7-14 seed reset, D7-16 API catalog, D7-17 screenshots).

## Verification checklist (from a clean checkout)

- [ ] `git clone https://github.com/LSCAR23/caribeops.git` succeeds.
- [ ] `cp .env.example .env` plus the two per-service copies produce working env files.
- [ ] `docker compose up --build -d` starts all four services with no build errors.
- [ ] `curl http://localhost:8000/api/health`, `:8080/health`, and `:3000` all return 200.
- [ ] `make test` (Laravel + Go + vitest) exits 0.
- [ ] `make smoke` curls all three health endpoints successfully.
- [ ] `docker compose down -v` stops and removes everything cleanly.
