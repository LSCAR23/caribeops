# D5-08 — Create Analytics Database User

**Task:** D5-08 — Create Analytics Database User
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-07
> precedent recorded in `MEMORY.md`.

**Desired outcome:** A login role `analytics` exists with a documented password,
on the live DB and reproducibly on fresh volumes; the D5-08 test (role can
connect) passes.

**Scope:** New init script + compose wiring (env, volume mount) + root example doc
+ one-time live apply of the same file + connect proof. Grants explicitly excluded
(D5-09); Go keeps the superuser URL (D5-10).

**Non-goals:** No `GRANT`s, no Go/Laravel code or env changes, no Laravel
migration, no fresh-volume rebuild (seeded volume must survive), no commit.

## Analysis carried forward

Only `caribeops` (superuser) can log in today; both services share it; no initdb
infrastructure; PG16 default `CONNECT`-to-`PUBLIC` means login-only suffices for
the connect test; `git` clean at `6727ad4`.

## Current-state evidence

- Role audit transcript (15 rows, 1 login role) — see analysis
- `docker-compose.yml:4-23` (postgres block, data-only volume), `:78` (Go
  superuser URL), `:37` (Laravel superuser)
- Root `.env.example:1-7` (four `POSTGRES_*` vars — the new var joins them)
- `docs/day-5-integration-performance.md:145-193` (D5-08/09/10 trilogy scope
  boundaries)

## Learning objectives and just-in-time concepts

Least-privilege roadmap (create → restrict → adopt across D5-08/09/10); initdb.d
fresh-only semantics and why the live DB needs an explicit apply; idempotent role
DDL; quote-safe secret passing via psql `:'var'`.

## Ordered implementation steps

1. Create `docker/postgres-init/01-analytics-role.sh` (POSIX `#!/bin/sh`,
   `set -eu`): idempotent `DO` block (create `analytics` iff missing from
   `pg_roles`) + `ALTER ROLE analytics WITH LOGIN PASSWORD :'pwd'` via
   `psql -v "pwd=$ANALYTICS_DB_PASSWORD" -d "$POSTGRES_DB"`. Rationale: `.sh`
   (not `.sql`) so the password arrives via environment, never baked into a file;
   `:'var'` keeps special characters safe; `ALTER` converges the password on
   re-runs. (New `docker/` folder = infra home; its creation is approved by your
   `/implement` of this plan.)
2. Compose `postgres` service: add
   `ANALYTICS_DB_PASSWORD: ${ANALYTICS_DB_PASSWORD:-<local-dev-default>}` to
   `environment`, mount `./docker/postgres-init:/docker-entrypoint-initdb.d:ro`
   alongside `postgres_data`. Rationale: entrypoint scripts inherit service env;
   `:ro` matches least-privilege handling of the script itself.
3. Root `.env.example`: document `ANALYTICS_DB_PASSWORD` beside the `POSTGRES_*`
   block (placeholder/empty value — never a real secret; keeps the D5-07
   "examples match runtime inputs" invariant true).
4. `docker compose config --quiet` → exit 0 (validates env + mount).
5. Apply to the live DB (init scripts never run on the existing volume):
   `docker exec caribeops-postgres-1 /docker-entrypoint-initdb.d/01-analytics-role.sh` —
   after `up -d` mounts it. Rationale: one file, two paths (fresh volumes via
   entrypoint, live volume via explicit exec) — no drift between them.
6. Connect proof (the task's test): `docker exec caribeops-postgres-1 psql -U
   analytics -d caribeops -c 'SELECT current_user;'` with the password supplied
   non-interactively → returns `analytics`. Also re-list `pg_roles` showing the
   new login row.
7. Regression: all three health-gated services still `healthy`;
   `:8000/api/businesses` and `:8080/analytics/overview` live (nothing switched
   users yet — behavior must be byte-identical to before).
8. `git diff --check` clean; `git status --short` → init script + compose + root
   example (+ new plan file). No secrets recorded anywhere.

## Tests and verification commands, plus expected results

- `SELECT current_user;` as `analytics` → `analytics` (connect works).
- `pg_roles` → new `analytics` row, `rolcanlogin=t`, `rolsuper=f`.
- Stack `healthy`, both APIs live and unchanged. `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Daemon down → no live apply/proof; report blocked (file changes still
  reviewable, but unproven).
- A future `compose down -v` rebuild runs the script automatically (fresh volume)
  — same file, same role.
- D5-09/D5-10 consume this role; nothing else may use the new password.

## Plan check

- **Revision 1:** script downgraded from `#!/bin/bash` to POSIX `#!/bin/sh` +
  `set -eu` — bash presence on the image is unverified, and POSIX works under
  either shell. Assumption removed, not added.
- **Revision 2:** password passing hardened to `psql -v pwd=…` + `PASSWORD :'pwd'`
  (client-side quoted literal, safe against quotes/special chars) instead of
  shell interpolation into SQL text. An injection footgun removed before it
  shipped.
- Challenged migration-vs-initdb: migration rejected on evidence (cluster-global
  vs DB-scoped, test-DB pollution, D2-08 chain ownership); initdb + explicit live
  apply is the official-image pattern and keeps Day-5 reproducibility.
- Challenged scope: grants/Go-switch explicitly fenced to D5-09/D5-10; `docker/`
  folder creation flagged as approved-via-`/implement` (repo prefers no new base
  folders without approval — this plan's approval is that approval).
- Verified: role-absence evidence, default-CONNECT claim bounds the test to
  login-only, slug free, `git` clean, secret-hygiene (no values in plan/memory).

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new `docker/postgres-init/01-analytics-role.sh` (idempotent
role bootstrap) + `docker-compose.yml` (postgres `ANALYTICS_DB_PASSWORD` env and
read-only initdb mount) + root `.env.example` (new var documented, empty value);
plan file materialized at this path verbatim from the checked inline deliverable
— no scope change.

**Deviations from draft (evidence-based, within scope):**
- `psql -U "$POSTGRES_USER"` added: `docker exec` runs as OS-user `root`, which
  has no DB role; the entrypoint path is unaffected (it already runs as the
  superuser).
- Final script shape changed after two failed runs taught two real psql rules:
  (1) interpolation is skipped inside dollar-quoted `DO` bodies (first failure),
  (2) `:'var'` splicing works in script input (heredoc/stdin, proved) but NOT in
  `-c` strings (proved in-container; earlier `-c` failures compounded by host
  quoting layers). Final form: shell `SELECT`-then-branch + heredoc
  `CREATE`/`ALTER` with `-v pwd=` + `:'pwd'`. Re-runs converge via `ALTER`.
- Checked-plan Revisions 1–2 (POSIX sh, `:'var'` hardening) stand; only the
  delivery vehicle for `:'var'` changed (`-c` → heredoc).

**Verification (exact commands/results):**
- `docker compose config --quiet` → exit 0; `git diff --check` clean.
- `docker compose up -d` → postgres recreated (new env/mount), data volume
  intact, `healthy`; script visible at `/docker-entrypoint-initdb.d/`.
- Explicit live apply: `/docker-entrypoint-initdb.d/01-analytics-role.sh` →
  `CREATE ROLE` + `ALTER ROLE`, exit 0; re-run → `ALTER ROLE` only, exit 0
  (idempotent).
- `pg_roles` → `analytics | f | t` (non-superuser, can-login).
- Task test: `psql -h localhost -U analytics -d caribeops -c 'SELECT
  current_user;'` (password via `PGPASSWORD`) → `analytics`.
- Regression: all health-gated services `healthy`; `:8000/api/businesses` 200
  live rows; `:8080/analytics/overview` live `40/320/3.040625` (nothing switched
  users — byte-identical behavior).
- `git status --short` → only the 3 intended paths (+ new plan file). No secrets
  in plan, memory, or repo files (password lives only in container env +
  local-dev default interpolation).
