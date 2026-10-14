# D6-27 — Create One-Command Test Execution

**Task:** D6-27 — Create One-Command Test Execution
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-27-one-command-tests.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-26 precedent in `MEMORY.md`.

**Desired outcome:** `make test` runs the Laravel, Go, and vitest suites; `make test-e2e` runs the Playwright flow with documented prereqs; `make smoke` keeps the Day-1 curl checks.
**Scope:** Root `Makefile` (`test`, `test-e2e`, `smoke`, `help`) + real runs of the orchestrated suites.
**Non-goals:** No CI wiring, no suite changes, no `webServer` in e2e, no commit.

## Analysis carried forward

Root `Makefile` exists but `test` is curl smoke checks only — the spec is unmet. Four real suites live in three dirs (artisan 63, go 6 pkgs, vitest 9, playwright 1 with stack+account prereqs). `make` is absent on this Windows host (verified at implement) — the file still serves CI/Linux; recipes verified by running their exact commands directly.

## Current-state evidence

- Root `Makefile:1-31` — `test` = 3 curls (verified in Plan stage)
- `backend/laravel`, `analytics/go`, `frontend/next` suite commands (verified D6-18/23/25/26)

## Learning objectives and just-in-time concepts

One-command orchestration with fail-fast recipes; fast default (`test`) vs prereq-gated (`test-e2e`); preserving Day-1 behavior under a new name (`smoke`).

## Ordered implementation steps

1. `Makefile`: `test` = artisan + go + vitest chained with `&&`; `test-e2e` echoes prereqs then `npm run test:e2e`; `smoke` = current curl block verbatim; `help` updated. Rationale: spec's `test` name for suites, Day-1 preserved.
2. Run each `test` recipe command directly (make binary absent on host) to full green.
3. `test-e2e` only if stack already up (else recorded not-run; D6-26 proved it green).
4. `git diff --check` clean; outcome with per-suite times.

## Tests and verification commands, plus expected results

- `make test` equivalent green end to end; `smoke` preserved verbatim.

## Risks, dependencies, and unresolved questions

- `make` missing on the Windows host — recorded; file targets CI/Linux shells.
- Laravel suite needs testing PG; Go runs no-DB skips by default.

## Plan check

- `test` name honors the spec example; `smoke` breaks no Day-1 habit; e2e separation matches its prereqs; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** root `Makefile` (`test` = artisan + go + vitest chained; `test-e2e` with prereq echo; `smoke` = Day-1 curl block verbatim; `help` updated) + `frontend/next/vitest.config.ts` (`exclude e2e/**` — see finding); plan file materialized at this path verbatim from the checked inline deliverable — no scope change beyond the one-line exclusion the green run required.

**Finding during verification:** `npm test` picked up the Playwright spec (`*.spec.ts` matches vitest default include) → 9/9 tests passed but 1 file failed. Fixed with `exclude: ["e2e/**"]` in vitest config — each runner owns its directory. Re-run clean.

**Verification (exact commands/results — the spec's test):**
- `make` binary absent on this Windows host (recorded) — ran each `test` recipe command directly:
  - `php artisan test --compact` (backend/laravel) → **63/63, 506 assertions**
  - `go test -count=1 ./...` no-DB (analytics/go) → **6/6 packages ok** (live skips)
  - `npm test` (frontend/next) → **4 files, 9/9 green**
- `npx tsc --noEmit` → exit 0. `test-e2e` not re-run (stack down; green 1/1 at D6-26, untouched since). `smoke` content moved verbatim (endpoints proven live D6-12…17).
- `git diff --check` clean; `git status --short` → Makefile + vitest config (+ plan file).
