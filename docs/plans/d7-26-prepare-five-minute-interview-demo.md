# D7-26 — Prepare the Five-Minute Interview Demo

- Task: D7-26 — Prepare the Five-Minute Interview Demo
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Create a demo script document (`docs/demo.md`) that scripts the complete 9-segment 5-minute interview walkthrough per `docs/day-7-portfolio-interview.md` (lines 549–571): Problem → Architecture → Login → Business management → Analytics → Database → Docker → SQL optimization → Why Laravel + Go + Next.js. Test: complete walkthrough fits comfortably inside five minutes. Learning: communicating engineering decisions matters as much as the code itself.

## Scope

**In scope:**
- Create `docs/demo.md` — a timed demo script with per-segment cues (target ~33 seconds per segment across 9 segments)
- Each segment: what to show, what to say, expected on-screen evidence, screenshot/figure references
- Draw on existing assets: `docs/images/architecture.svg` (D7-18), `docs/screenshots/` (D7-17), talking points in `docs/day-7-portfolio-interview.md` (lines 576–623), Final Definition of Done (lines 631–648)
- Include a quick-reference checklist mapping each segment to evidence and talking points
- Include the exact startup commands needed to run the demo from a clean state

**Non-goals:**
- No application code changes (demo script is documentation only)
- No changes to `docs/day-7-portfolio-interview.md` talking points (they already exist; reference them, don't rewrite)
- No new screenshots or diagrams (reuse D7-17/D7-18 assets)
- No test changes (all suites already pass: Laravel 71/71 + 535 assertions, Go 6 packages, Frontend 12 tests)
- No commit unless explicitly requested

## Analysis carried forward

From `/analize` of "D7-26 — Prepare the Five-Minute Interview Demo":

**Task & intended outcome:** One consolidated demo script document that sequences all 9 segments into a timed 5-minute narrative with speaking cues and evidence references.

**Current behavior / repository evidence:**
- **All 13 Definition-of-Done items checked** in `docs/README.md` (lines 187–207)
- **Tag `v1.0.0`** on commit `19026cc` covering D7-13 through D7-25
- **Screenshots** (D7-17): `docs/screenshots/{login,dashboard,business-list,business-detail,analytics}.png` (5 PNGs, 1400×900)
- **Architecture diagram** (D7-18): `docs/images/architecture.svg` (5.9 KB GitHub-safe SVG)
- **Interview talking points** exist in `docs/day-7-portfolio-interview.md` lines 576–623 (Why Laravel/Go/Next.js/PostgreSQL/Docker, Why separate Go from Laravel, Strong End-to-End Story)
- **Stack:** Next.js host:3000, Laravel:8000, Go:8080, PostgreSQL:5433 — all healthy, seeded (40 businesses, 320 reviews, 3 categories, user `test@example.com`/`password`)
- **Tests:** all pass (Laravel 71/71, Go 6 packages, Frontend 12 tests)

**Gaps:** No consolidated demo script/walkthrough document exists that sequences all 9 segments into a timed 5-minute narrative.

**Dependencies:** All D7-13 through D7-25 complete; stack running; seeded data verified.

## Current-state evidence and relevant files

- `docs/day-7-portfolio-interview.md` — D7-26 spec (lines 549–571) + talking points (lines 576–623) + Final DoD (lines 631–648)
- `docs/demo.md` — does not exist yet (deliverable)
- `docs/images/architecture.svg` — D7-18 diagram (D2 segment)
- `docs/screenshots/{login,dashboard,business-list,business-detail,analytics}.png` — D7-17 screenshots (D3/D4/D5 segments)
- `docs/api.md` — D7-16 API reference (D3/D4/D5 segments)
- `docs/database.md` — D7-10 ER diagram (D6 segment)
- `docs/performance.md` — D7-12 SQL optimization (D8 segment)
- `docs/setup.md` — D7-13 stack startup (D7 segment)
- `docs/README.md` — project overview + Final DoD
- `backend/laravel/routes/api.php` — 13 endpoints (D3/D4/D5 segments)
- `docs/day-1-foundation.md` through `day-6-security-testing.md` — day-by-day narrative support

## Learning objectives

- **Demo as communication:** The interview demo explains *why* decisions were made — architecture boundaries, tech choices, trade-offs — not just *what* the code does.
- **Time-boxing:** 5 minutes across 9 segments ≈ 33 seconds each; requires explicit per-segment time budgets and cues so the demo doesn't overrun.
- **Demo continuity:** The walkthrough should flow problem → solution → proof, using the same seeded dataset throughout so numbers (40 businesses / 320 reviews / 3.1 avg rating) are consistent across segments.
- **Just-in-time concept — rehearsal discipline:** The "Test" says practice until the walkthrough fits in 5 minutes; the script should include timing cues so the presenter can self-correct during rehearsal.

## Ordered implementation steps

1. **Author `docs/demo.md`** — one document containing:
   - Opening line + total time budget (5:00)
   - 9 segments, each with: target time, what to show (screen), what to say (talking points), expected evidence, screenshot/figure reference
   - Segment 1 Problem (≈30s): the problem Caribbean tourism ops faces; why a demo is needed
   - Segment 2 Architecture (≈35s): show `docs/images/architecture.svg`; explain Next.js → Laravel/Go → PostgreSQL; Docker boundary
   - Segment 3 Login (≈35s): `test@example.com` / `password`; Bearer token; redirect to dashboard
   - Segment 4 Business management (≈45s): list (40 businesses, filters, pagination), detail page (owner, amenities, 8 reviews); mention create/owner policies
   - Segment 5 Analytics (≈40s): KPIs 40/320/3.1, category chart 14/13/13, monthly reviews, top-10
   - Segment 6 Database (≈35s): ER diagram `docs/database.md`; users/categories/businesses/amenities/reviews; relationships; 1–5 rating constraint
   - Segment 7 Docker (≈35s): `docker compose up --build`; 4 services, healthchecks, service-name addressing; clean rebuild
   - Segment 8 SQL optimization (≈40s): `docs/performance.md`; TopBusinesses 0.251→0.282 ms honest flat line; `reviews_business_id_index`; EXPLAIN analysis
   - Segment 9 Why Laravel + Go + Next.js (≈55s): Laravel = business domain/auth/CRUD; Go = read-heavy analytics; Next.js = UI; PostgreSQL = relational; why separate Go from Laravel
   - Closing line + final DoD recap (≈20s)
   - Quick-reference checklist: segment → evidence → talking point → screenshot
   - Startup commands: `docker compose up --build`, `php artisan migrate:fresh --seed`, `npm run dev` with `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
2. **Verify** — check all screenshot/figure references exist; check `git diff --check`; verify total time budget ≈ 5:00
3. **Update plan status** to `Implemented — verified`; update `MEMORY.md` three sections
4. **Confirm no commit** unless explicitly requested

## Tests and verification commands, plus expected results

1. **Existence check:** `Test-Path "docs/demo.md"` → True
2. **Reference check:** every screenshot referenced in `docs/demo.md` exists in `docs/screenshots/`; `docs/images/architecture.svg` exists; `docs/database.md` exists; `docs/performance.md` exists
3. **Time budget check:** sum of segment targets ≈ 5:00 (300 seconds); document this total in the script
4. **Hygiene:** `git diff --check` → exit 0 (clean); `git status --short` shows only `docs/demo.md` new + plan file + MEMORY.md modified
5. **No automated test suite applies** (documentation task; Laravel/Go/vitest untouched)

## Risks, dependencies, and unresolved questions

- **Risk: demo overruns 5 minutes** — mitigated by explicit per-segment time targets and a running-total cue in the script
- **Risk: stack not running during demo** — mitigated by including exact startup commands in the script (`docker compose up --build`, `migrate:fresh --seed`, `npm run dev` with env vars)
- **Risk: seeded data changed** — mitigated by pinning expected numbers (40 businesses / 320 reviews / 3.1 avg rating) from the current seed
- **Dependency: stack must be running and seeded** — documented as a prerequisite
- **Dependency: screenshots/diagram must exist** — confirmed present (D7-17/D7-18)
- **Unresolved:** none — format (doc file), scope (documentation only), and sources (existing talking points/assets) are all decided

## Plan check

Findings (verified against the current repository):

- Status set to `Checked — awaiting user approval`; `Analysis carried forward` section present and grounded in direct repo inspection.
- All required sections present: desired outcome, scope + explicit non-goals, current-state evidence, learning objectives, ordered implementation steps, tests/verification commands, risks/dependencies/unresolved questions, `/implement` reminder.
- File paths confirmed present: `docs/images/architecture.svg`, all 5 `docs/screenshots/*.png`, `docs/api.md`, `docs/database.md`, `docs/performance.md`, `docs/setup.md`, `docs/README.md`, `docs/day-7-portfolio-interview.md`, `backend/laravel/routes/api.php`.
- All segment time targets verified to sum correctly: 30+35+35+45+40+35+35+40+55+20 = 370s (6:10). **Finding:** this exceeds the 5-minute (300s) test criterion by 70 seconds. The implementer must adjust per-segment targets during implementation so the total is ≤ 300 seconds. Verification step #3 already covers this ("sum of segment targets ≈ 5:00").
- Plan's verification commands are correct: existence check, reference check, time budget check, `git diff --check`.
- Scope is appropriate: documentation-only, `docs/demo.md` new file, no code changes.
- No evidence-based scope changes required beyond the time-budget adjustment noted above.

Changes made during check: status → `Checked — awaiting user approval`; added this `Plan check` section with time-budget finding.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary:

**Created `docs/demo.md`** — a timed demo script document that scripts the complete 9-segment interview walkthrough:

| Segment | Target | Content |
|---------|--------|---------|
| 1 Problem | ≈20s | Caribbean tourism ops problem; why a demo |
| 2 Architecture | ≈30s | Next.js → Laravel/Go → PostgreSQL; Docker boundary; `docs/images/architecture.svg` |
| 3 Login | ≈25s | `test@example.com` / `password`; Bearer token; redirect to `/` |
| 4 Business management | ≈35s | 40 businesses, filters, pagination; detail page with owner/amenities/8 reviews |
| 5 Analytics | ≈30s | KPIs 40/320/3.0; category chart 14/13/13; monthly reviews; top-10 |
| 6 Database | ≈25s | 7 tables; ER diagram; 1–5 rating CHECK constraint |
| 7 Docker | ≈25s | `docker compose up --build`; 4 services; healthchecks; service names |
| 8 SQL optimization | ≈30s | TopBusinesses 0.251→0.282 ms; `reviews_business_id_index`; EXPLAIN |
| 9 Why Laravel + Go + Next.js | ≈40s | Laravel=business/auth/CRUD; Go=read-only analytics; Next.js=UI; PostgreSQL=relational |
| Closing + DoD recap | ≈20s | All 13 Definition-of-Done checkpoints green |

**Total time budget: 280s (4:40)** — under the 5:00 (300s) test criterion with a 20-second buffer.

**Verification:**
- `Test-Path "docs/demo.md"` → True (file exists)
- Reference check: all 5 screenshots in `docs/screenshots/` exist; `docs/images/architecture.svg`, `docs/database.md`, `docs/performance.md`, `docs/api.md`, `docs/setup.md` all exist
- Time budget: 280s (4:40) ≤ 300s (5:00) ✅
- `git diff --check` → exit 0 (clean)
- `git status --short` → only `docs/demo.md` (new) + plan file + MEMORY.md modified; no application code touched

**No commit made** (not requested).

## Reminder

This plan is now `Implemented — verified`. All Day-7 tasks (D7-13 through D7-26) are complete. No further `/implement` needed for this task.
