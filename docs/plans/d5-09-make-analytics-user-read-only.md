# D5-09 — Make Analytics User Read-Only

**Task:** D5-09 — Make Analytics User Read-Only
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-08
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `analytics` can `SELECT` exactly the Go-read tables and is
denied all writes; the 4-statement spec matrix passes as the role.

**Scope:** New `02-analytics-grants.sql` (schema USAGE + 3-table SELECT +
default-privileges) + live apply of the same file + as-role matrix proof +
superuser regression.

**Non-goals:** No Go user switch (D5-10), no sequence grants (Go never calls
`nextval`), no framework-table grants, no revoke theater (nothing to revoke), no
commit.

## Analysis carried forward

Zero grants today (SELECT fails); 3-table Go-read set (`businesses`,
`categories`, `reviews`); initdb numbered-file pattern ready; `git` clean at
`be6913f`.

## Current-state evidence

- D5-08 commit `be6913f` + `docker/postgres-init/01-analytics-role.sh` + `:ro`
  mount
- 14-table catalog (5 domain + 9 framework); Go query→table mapping from D4 query
  tasks
- `docs/day-5-integration-performance.md:161-193`

## Learning objectives and just-in-time concepts

Least privilege at the resource boundary; schema-USAGE vs table-SELECT layers;
default privileges as future-proofing; denied-writes-write-nothing +
transaction-wrapped probes as safe negative testing.

## Ordered implementation steps

1. Derive the grant set from evidence, not memory: grep `FROM`/`JOIN` in
   `analytics/go/internal/repository/postgres.go` (expect `businesses`,
   `categories`, `reviews`) and check `SELECT tablename, tableowner FROM
   pg_tables WHERE schemaname='public'`. Grant exactly the grep set; `FOR ROLE`
   in step 2 uses the observed owner (expect `caribeops`).
2. Create `docker/postgres-init/02-analytics-grants.sql`: `GRANT USAGE ON SCHEMA
   public TO analytics;` + `GRANT SELECT ON businesses, categories, reviews TO
   analytics;` + `ALTER DEFAULT PRIVILEGES FOR ROLE <owner> IN SCHEMA public
   GRANT SELECT ON TABLES TO analytics;`. Rationale: pure SQL (no secrets, no
   `.sh` needed); plain `GRANT` is idempotent; alphabetical order guarantees
   role-exists-first on fresh volumes; default-privileges cover future
   migration-created tables.
3. `docker compose config --quiet` (unchanged compose, sanity) → exit 0.
4. Live apply (existing volume never runs initdb): `docker exec -i
   caribeops-postgres-1 psql -U caribeops -d caribeops <
   docker/postgres-init/02-analytics-grants.sql` (host file → container stdin;
   mount-independent). Rationale: same file both paths, no drift.
5. Spec matrix as the role (password via `PGPASSWORD`, TCP): `SELECT count(*)
   FROM businesses;` → `40`; `BEGIN; INSERT INTO categories(name,slug)
   VALUES('probe','probe'); ROLLBACK;` → `42501`; `BEGIN; UPDATE businesses SET
   name=name WHERE false; ROLLBACK;` → `42501`; `BEGIN; DELETE FROM reviews WHERE
   false; ROLLBACK;` → `42501`. Rationale: `BEGIN…ROLLBACK` makes even an
   unexpectedly-permitted write a no-op (zero-row `WHERE false` on UPDATE/DELETE
   doubles this); `42501` is the expected denial code.
6. Regression (superuser paths untouched): stack `healthy`;
   `:8000/api/businesses` 200; `:8080/analytics/overview` live values (Go still
   on superuser URL — must be byte-identical to before).
7. `git diff --check` clean; `git status --short` → only the new grants file (+
   new plan file).

## Tests and verification commands, plus expected results

- Matrix: `40` / `42501` / `42501` / `42501`, zero rows written (row counts
  re-checked equal).
- `has_table_privilege('analytics','businesses','SELECT')` → true; `…'INSERT'` →
  false (belt-and-braces catalog read).
- Regression green. `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Daemon down → file reviewable but unproven; report blocked.
- If grep reveals a 4th Go-read table, grant it and record (rule covers, no
  re-plan).

## Plan check

- **Revision 1:** write probes wrapped in `BEGIN…ROLLBACK` (+ zero-row WHERE on
  UPDATE/DELETE) — a grant bug must never become a data write during its own
  test.
- **Revision 2:** live apply via host-file stdin redirect instead of relying on
  the container mount — one fewer dependency, same file.
- **Revision 3:** `FOR ROLE` owner fenced to the observed `tableowner` (expect
  `caribeops`) rather than assumed.
- Challenged alternatives (per-table REVOKEs, sequence grants, framework-table
  SELECT, migration delivery): all rejected on evidence — nothing to revoke, no
  `nextval` in Go, Go never reads framework tables, cluster objects don't belong
  in DB-scoped migrations.
- Verified: role-exists evidence, file path/order, slug free, `git` clean, matrix
  safety argument (denial precedes execution).

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new `docker/postgres-init/02-analytics-grants.sql` only
(schema USAGE + SELECT on `businesses, categories, reviews` + default
privileges); plan file materialized at this path verbatim from the checked
inline deliverable — no scope change.

**Verification (exact commands/results — the spec matrix, as `analytics` over
TCP+password):**
- Grant set derived from evidence: grep of `FROM`/`JOIN` in
  `internal/repository/postgres.go` → exactly `businesses`, `reviews`,
  `categories`; `pg_tables` → all 14 tables owned by `caribeops` (`FOR ROLE`
  confirmed, not assumed).
- `docker compose config --quiet` → exit 0.
- Live apply (stdin redirect): `GRANT`/`GRANT`/`ALTER DEFAULT PRIVILEGES`, exit
  0; re-appliable (plain GRANTs are idempotent).
- `SELECT count(*) FROM businesses;` → `40`.
- `BEGIN; INSERT INTO categories(name,slug) VALUES('probe','probe'); ROLLBACK;`
  → denied; verbose proof `ERROR: 42501: permission denied for table
  categories`.
- `UPDATE businesses SET name=name WHERE false` → denied;
  `DELETE FROM reviews WHERE false` → denied (both in `BEGIN…ROLLBACK`, zero-row
  WHERE).
- Zero writes: `businesses` still `40`, `slug='probe'` count `0`.
- Catalog cross-check: `has_table_privilege` → SELECT `t`, INSERT/UPDATE/DELETE
  `f`, ungranted `amenities` SELECT `f`.
- Regression: all health-gated services `healthy`; `:8000/api/businesses` 200
  live rows; `:8080/analytics/overview` live `40/320/3.040625` (Go still on the
  superuser URL — byte-identical behavior, switch is D5-10).
- `git diff --check` → clean; `git status --short` → only the new grants file (+
  new plan file). No secrets in plan, memory, or repo files.
