# D5-21 — Add the Performance Index as a Migration

**Task:** D5-21 — Add the Performance Index as a Migration
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-20
> precedent recorded in `MEMORY.md`.

**Desired outcome:** A migration creates `reviews_business_id_index`, proven on
a from-scratch database and tolerated on the live one.

**Scope:** `make:migration` scaffold + raw-SQL body + scratch-DB chain proof +
dev no-op tolerance proof + Pint/lint.

**Non-goals:** No `Schema::index()` (can't express `IF NOT EXISTS`), no dev
`migrate:fresh` (would wipe seeded data for a test), no seed run on scratch
(index needs no data), no commit.

## Analysis carried forward

Live-only index; 9-migration chain; same-name + tolerance constraints; `git`
clean at `4a468ae`.

## Current-state evidence

- Live `pg_indexes` (D5-19 outcome), `database/migrations/` (9 files, latest
  `…224223_*`)
- D5-19/20 handoff constraints; `docs/day-5-integration-performance.md:361-373`

## Learning objectives and just-in-time concepts

Performance-as-evolution; idempotent DDL; scaffold-then-hand-write; disposable
worlds for destructive tests.

## Ordered implementation steps

1. `php artisan make:migration add_reviews_business_id_index --no-interaction`
   (Boost rule: `make:` scaffolds; timestamp auto-sorts last). Rationale:
   framework naming/location conventions for free.
2. Body: `up()` → `DB::statement('CREATE INDEX IF NOT EXISTS
   reviews_business_id_index ON reviews (business_id)')`; `down()` →
   `DB::statement('DROP INDEX IF EXISTS reviews_business_id_index')`. Rationale:
   raw SQL is the *only* way to express existence-tolerance (Schema builder
   can't); symmetric version-proof down path. Then `php -l` + `vendor/bin/pint
   --dirty --format agent` (Boost rules for new PHP).
3. Scratch world: `CREATE DATABASE caribeops_indexcheck` (superuser via exec) →
   `DB_DATABASE=caribeops_indexcheck php artisan migrate` (full chain on empty
   DB) → `migrate:status` shows the new migration applied → `pg_indexes` shows
   the index. Rationale: the spec's "from scratch" test where wiping costs
   nothing (dev volume never at risk; no `--seed` — index needs no rows).
4. Tolerance + rollback on scratch: `migrate:rollback --step=1` → index gone,
   status reverted; re-`migrate` → back (down/up paths proven); then dev-DB
   `php artisan migrate` → applies as a **no-op** (pre-existing index skipped,
   status recorded — no perpetually-pending migration, and the live tolerance
   constraint proven where it matters). `DROP DATABASE caribeops_indexcheck` to
   leave no residue.
5. Regression: endpoint values + counts `40|320` (dev data untouched throughout
   — verify, don't assume).
6. `git diff --check` clean; `git status --short` → only the new migration (+
   new plan file).

## Tests and verification commands, plus expected results

- `migrate:status` (scratch + dev) shows the migration applied; `pg_indexes`
  shows the index from scratch.
- Rollback/re-migrate round-trip green; scratch DB dropped; dev data
  byte-identical.
- `php -l` + Pint clean; `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- If scratch `migrate` fails mid-chain (pre-existing chain issue — D2-08's
  territory), stop and report: do not "fix" the chain inside this task.
- Daemon/artisan down → report blocked.

## Plan check

- **Revision:** added `migrate:status` assertions on both worlds — applied-status
  is part of "the index appears" proof, not just catalog presence.
- Challenged `Schema::index()` vs raw: raw wins by necessity (no `IF NOT
  EXISTS` in the builder; tolerance is a recorded cross-task constraint).
- Challenged dev-`migrate:fresh` as the test: rejected — wiping 40/320 seeded
  rows to prove a testable-elsewhere claim; scratch DB satisfies the spec's
  rebuild semantics without the blast radius.
- Challenged `--seed` on scratch: rejected — index DDL needs schema, not rows.
- Verified: chain contents/order, spec lines, slug free, `git` clean, Boost
  command rules (`make:`, `--no-interaction`, Pint), no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new
`backend/laravel/database/migrations/2026_10_13_042916_add_reviews_business_id_index.php`
(raw `IF NOT EXISTS`/`IF EXISTS` body); plan file materialized at this path
verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results):**
- `php artisan make:migration add_reviews_business_id_index --no-interaction`
  → scaffold created (timestamp auto-sorted last).
- `php -l` → no errors; `vendor/bin/pint --dirty --format agent` → passed.
- Scratch world (`caribeops_indexcheck`, created/dropped around the test): full
  10-migration chain `DONE` on the empty DB (the spec's from-scratch test);
  `migrate:status` all `[1] Ran` incl. the new migration; `pg_indexes` shows
  `reviews_business_id_index` (the index appears).
- Round-trip: `migrate:rollback --step=1` → `DONE`, index count `0`, status
  reverted; re-`migrate` → `DONE`, count `1` (down/up paths proven).
- Dev tolerance: `php artisan migrate` → new migration `DONE` as a no-op
  (pre-existing live index skipped); `migrate:status` shows it `[2] Ran` (no
  perpetually-pending migration). Scratch DB dropped — no residue.
- Regression: `:8000/api/businesses` 200 live rows; counts `40|320` (dev data
  byte-identical throughout).
- `git diff --check` clean; `git status --short` → only the new migration (+
  new plan file).
