# D7-28 — Date picker: preset highlight requires ending today + month/year selects for fast navigation

Task name: "make active date preset require ending today and make it possible to navigate backward by year and by month in the datepicker; currently, if I'm viewing October 2026 and want to see 2023, I have to go back using the arrows, which is very inconvenient."

Date: 2026-10-20
Status: Implemented — verified

## Desired outcome

1. **Preset highlight is truthful.** On `/analytics`, a `Last 7/30/90 days` pill is highlighted (`aria-pressed="true"`, brand styling) only when the URL range **ends today** *and* its inclusive span equals that preset's length. A custom range that merely spans 30 days (e.g. May 1 → May 30) lights **no** preset; clicking a preset still highlights it (presets always end today).
2. **Fast month/year navigation.** The calendar header keeps the `‹ ›` month arrows and replaces the plain month heading with two native `<select>` controls — month name and year — so Oct 2026 → Jan 2023 is two interactions instead of ~45 arrow clicks. Year options cover the existing ±5-year window (2021–2031 for today), widened only if the URL's focus month already sits outside it.

## Scope

- `frontend/next/src/components/DateRangeSelector.tsx` — end-today predicate; header month/year selects.
- `frontend/next/src/components/__tests__/DateRangeSelector.test.tsx` — new tests for both behaviors.

## Non-goals

- No backend (Go/Laravel) changes; no URL parameter changes; preset **click** behavior unchanged.
- No widening of the `‹ ›` ±5-year bounds; no new dependencies; no commits.
- The `Custom range` / `Hide custom` disclosure-highlight semantics stay as-is (it marks the open panel, not the range).
- No other components or pages; all uncommitted D7-27 work (seeder, docs, screenshots, MEMORY.md, `frontend/next/scripts/`) preserved untouched.

## Analysis carried forward

(from `/analize` in this conversation; all evidence read from the repository, not memory)

- **Preset highlight bug:** `DateRangeSelector.tsx:91–98` derives `activePreset` purely from the URL span: `diffDays = round((to − from)/day) + 1`, matched against `[7, 30, 90]`. There is no `to === today` check, so any custom range of the matching length lights the pill — this is *derived state* (the component comment, lines 6–11, documents the intentional URL-as-source-of-truth design: shareable, reload-safe, back-button-safe). The fix adds a predicate, it does not change the derivation model.
- **Navigation gap:** header `‹ ›` buttons step ±1 month (lines 325–345); keyboard `PageUp`/`PageDown` also step ±1 month (lines 304–306); month bounds are ±5 years around today (lines 258–263 → Jan 2021–Dec 2031 for 2026, so 2023 is reachable — only slowly). **No year step exists anywhere in the component.**
- **Plumbing:** `app/analytics/page.tsx` renders `<DateRangeSelector />` once (line 38) in a never-prerendered server page (`instant = false`); `router.push('/analytics?from=…&to=…')` re-renders it and threads `from`/`to` to the four Go-backed islands as props. Only the display month (`focusMonth` state) changes with the selects — **no refetch happens until a day is clicked**, and no backend work is needed.
- **Tests:** `DateRangeSelector.test.tsx` has exactly **10** tests using the mocked-router pattern (`vi.hoisted` push + `state.params` for `useSearchParams`). **No existing test asserts preset highlighting**, so the rule change breaks nothing; no test covers navigation-by-year.
- **Tooling/stack (verified in `package.json`):** Next **16.4.0**, React 19.3.0; `npm test` (vitest run), `npm run lint` (eslint), `npm run build`; type-check via `npx tsc --noEmit`. `frontend/next/AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` before writing code.
- **Instructions:** `.ai/rules` does not exist; no Laravel/Go files are in scope, so Laravel rules/skills do not apply. Only two files in the repo import `DateRangeSelector` (the analytics page and its test).
- **Git state:** uncommitted D7-27 work present (listed in Non-goals) — must survive this task untouched.
- **User decision (asked and answered during `/analize`):** year navigation = **month + year dropdown selects** (chosen over year-jump buttons or a heading-grid popup), keeping the existing `‹ ›` arrows.

## Current-state evidence and relevant files

| File | Evidence |
| --- | --- |
| `frontend/next/src/components/DateRangeSelector.tsx` | `activePreset` lines 91–98 (span-only match); preset buttons render lines 163–180; header with `‹ ›` + `<h3>` heading lines 324–346; `±5y` bounds lines 258–263; keyboard map lines 277–320; `focusMonth` state lines 84–86, 219–221 |
| `frontend/next/src/components/__tests__/DateRangeSelector.test.tsx` | 10 tests, mocked `next/navigation`, `state.params` sets URL before render; `fireEvent` usage precedent |
| `frontend/next/src/app/analytics/page.tsx` | line 38 mounts the selector; lines 26–32 read `searchParams` once per request |
| `frontend/next/package.json` | scripts: `dev`/`build`/`lint`/`test`/`test:e2e`; Next 16.4.0 |

## Learning objectives (just-in-time concepts)

- **Derived vs. recorded UI state** — why the highlight is recomputed from the URL instead of tracking "which button I clicked", and how to extend a derived predicate (span **and** end-today) without losing shareable links.
- **Controlled native form controls inside a custom ARIA calendar** — native `<select>` keyboard behavior (arrow/Home/End on focus) comes for free and does not conflict with the roving-tabindex day-grid key map, because they are different focusable elements; each control needs its own accessible name (`aria-label`).
- **Calendar-month arithmetic** — selects, like the arrows, always build `new Date(year, month, 1)` so day-overflow (Jan 31 + 1 month) can never occur; day strings keep using the DST-safe `formatLocalDate`.
- **Testing URL-driven components** — `router.push` is mocked, so tests assert the *push*, and state-dependent UI is tested by setting `state.params` directly rather than simulating navigation.

## Ordered implementation steps

0. **Prerequisite (AGENTS.md):** read the relevant guides in `node_modules/next/dist/docs/` for client components / `useSearchParams` / `useRouter` to confirm Next 16.4 introduces nothing that affects the hooks already in use.
1. **Preset predicate** (`activePreset`, lines 91–98): before the span math add
   `if (toParam !== formatLocalDate(new Date())) return null;`
   then keep the existing inclusive-span match.
   *Rationale:* exact string comparison against local today — same format the presets push, so no parse/round-trip drift; `from`-only or `to`-only URLs already return `null`.
2. **Header selects** (lines 324–346): keep the `<h3>` wrapper (preserves the month heading's structure; its name still reflects the displayed month/year), replace the heading's formatted text with two controlled selects:
   - `aria-label="Month"` — 12 options from a static `MONTH_NAMES` (`January`…`December`, matching the `en-US` `Intl` style already used), `value = focusMonth.getMonth()`, `onChange → onFocusMonthChange(new Date(year, value, 1))`.
   - `aria-label="Year"` — options from `min(nowYear − 5, focusYear)` to `max(nowYear + 5, focusYear)` (union keeps URL-driven out-of-bounds focus months representable; for in-bounds use this is exactly 11 options, 2021–2031), `value = focusYear`, `onChange → onFocusMonthChange(new Date(value, month, 1))`.
   - Styling per the file's existing tokens (h-10, `border-ink-200`, `bg-surface`, `focus-visible:ring-brand-500`, `rounded-*`), labels in `font-semibold text-ink-900` so the header reads like the old heading.
   - `‹ ›` arrows, their disabled logic, and the grid's `aria-label="{Month Year} days"` stay unchanged.
3. **Docs-in-code:** update the file-header comment (lines 13–24) with the two behavior changes (D7-28 note).
4. **Tests** (4 new cases, deterministic against the real clock — same pattern as the existing preset test, no fake timers):
   - `it` negative: `state.params` = 30-day span **ending yesterday** (`from = today − 30`, `to = today − 1`) → all three preset buttons `aria-pressed="false"`.
   - `it` positive: 30-day span **ending today** (`from = today − 29`, `to = today`) → "Last 30 days" `aria-pressed="true"`, the other two `"false"`.
   - `it` selects jump: with `state.params = "from=2026-05-05"`, `fireEvent.change` year → `2023` then month → `January` → grid group becomes `January 2023 days` (and day 1 button label confirms).
   - `it` option sets: **open the picker first** (click `Custom range` — `CalendarPicker` only exists when open), then Year select has exactly 11 options from `nowYear − 5` … `nowYear + 5` where `nowYear = new Date().getFullYear()` is computed **inside the test** (never hard-coded), and Month select has the 12 months in order; second render with `state.params = "from=2015-01-15"` → year `2015` is present and selected (out-of-bounds union).
   Expected totals: **14 tests (10 existing + 4 new)**.
   Note: controlled `<select>` values are passed as strings (`String(focusMonth.getMonth())`, `String(focusYear)`) so option matching never relies on numeric DOM coercion.
5. **Verification run** (below), fixing failures in small increments; then the live browser spot-check.

## Tests and verification commands (expected results)

Run from `frontend/next/`:

| Command | Expected |
| --- | --- |
| `npm test` | 14/14 pass, 0 failures (10 pre-existing unchanged) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | passes; route table unchanged |
| `git diff --check` | clean |
| `git status --short` | only `DateRangeSelector.tsx` + its test newly changed; D7-27 entries untouched |

Live spot-check (dev server already on `:3000`): (a) custom range ending yesterday → no pill lit, `Custom range` still open/active; (b) click `Last 30 days` → pill lit, URL `?from=…&to=today`; (c) open picker, jump year to 2023 + month, grid re-renders — and confirm the Go sections only refetch after a day is clicked (selects change the *view*, not the range).

## Risks, dependencies, unresolved questions

- Native `<select>` rendering differs slightly per OS/browser (default caret) — accepted for keyboard/aria accessibility; consistent Tailwind tokens keep it visually close.
- Out-of-bounds `focusMonth` (hand-edited old `?from=`) is handled by the year-option union — defensive only; no in-app path creates it.
- Midnight rollover during a test run is the pre-existing accepted pattern (both new preset tests compute "today" inside the test, identical to the component).
- Dependency note: none beyond the running dev server; no backend rebuilds (Go/Laravel untouched).
- **No unresolved material questions** (the navigation-pattern decision was asked and answered).

## Plan check

Reviewed against the current repository (component, tests, analytics page, package.json, git status, MEMORY.md) on 2026-10-20. Findings and revisions:

1. **Revised — picker must be open to assert the selects.** The draft's option-set test implied rendering the header with no URL params, but `CalendarPicker` (and therefore the new selects) renders only while `custom` is true (component line 215). Test now opens the picker via the `Custom range` click (existing test-1 precedent).
2. **Revised — no hard-coded years.** The `2021…2031` assertion would rot after 2026; the expected year window is now derived from `new Date().getFullYear()` inside the test.
3. **Revised — controlled select values as strings** (`String(month)`, `String(year)`) to keep React 19 option matching unambiguous.
4. **Verified — scope and paths.** Only `DateRangeSelector.tsx` and its test change; both paths, every command, and the `frontend/next/` working directory confirmed against the repo; only the analytics page imports the component; no existing test asserts preset highlighting or heading text (10/10 remain applicable); `.ai/rules` absent; no Laravel/Go surface; uncommitted D7-27 work untouched.
5. **Verified — behavioral edge cases.** `from`-only/`to`-only URLs → no preset (already handled); `from > to` → negative span → no match; single-day today → span 1 → no preset (no 1-day preset exists); out-of-bounds `focusMonth` from hand-edited URLs → year-option union; selects change only the display month (no refetch until a day is clicked, so no backend impact); preset clicks always end today, so the new rule never un-highlights a pill the user just clicked.
6. **Verified — verification plan strength.** `npm test` (expected 14), `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, `git status` diff inventory, plus a live browser spot-check with concrete expected observations — matching the repo's D7-05 precedent. No e2e run required (consistent with prior component-change tasks).
7. **Deviation recorded — plan file location.** The plan skill expects `docs/plans/`, but the active Plan-mode restriction allows plan files only in `C:\Users\larao\.opencode\plan` (where `d7-26`-era plans also staged before materialization). The plan is written there; **first bookkeeping step after `/implement` approval is to copy it to `docs/plans/d7-28-date-picker-preset-today-and-month-year-selects.md`** so the workflow's `docs/plans/` requirement holds for the implementation record. No content changes.
8. **No material questions remained** needing the user (navigation-pattern decision was asked and answered during `/analize`: month + year dropdown selects).

No scope changes were needed; the plan above incorporates revisions 1–3.

## Authorization

This plan was produced by `/orchestrator` (analize → plan → check) and **does not authorize implementation**. Implementation begins only when the user reviews the checked plan and explicitly invokes `/implement "<plan path>"`.

## Outcome (2026-10-20, `/implement` approved and executed)

**Implemented as planned.** Files changed (working directory `frontend/next/` unless noted):

- `src/components/DateRangeSelector.tsx` — `activePreset` now returns a match only when `toParam === formatLocalDate(new Date())` *and* the inclusive span equals the preset length (new early-return guard + updated comment). Module-level `MONTH_NAMES` constant added next to `WEEKDAY_HEADERS`. In `CalendarPicker`, year options are computed as the ±5-year window around the current year, unioned with the URL focus year (`minYear`/`maxYear`/`yearOptions`), and the plain `<h3>` heading text was replaced by two native `<select>`s (`aria-label="Month"` with 12 options keyed by index; `aria-label="Year"` with the computed options; controlled string values; `onChange` → `onFocusMonthChange`, so only the view changes — the URL refetch still happens on day click). `‹ ›` arrows, ±5-year bounds, grid, keyboard map, and the live region are unchanged; the grid keeps `monthHeading` for its accessible name. File-header comment documents the D7-28 behavior.
- `src/components/__tests__/DateRangeSelector.test.tsx` — 4 new tests (10 → 14): (1) a 30-day span ending yesterday lights no pill; (2) the same span ending today lights only `Last 30 days`; (3) year 2023 then month January jump the grid (`January 2023 days`, day `January 1, 2023` rendered) with no URL change; (4) option sets equal `nowYear ± 5` (11 options) and 12 months, plus a second render (explicit `cleanup()` between renders, since `vitest.setup.tsx` cleans up only `afterEach`) asserting an out-of-bounds `?from=2015-01-15` widens the year window to include 2015.
- `docs/plans/d7-28-...md` (repo root working dir) — this file copied from the plan-mode staging path as the first bookkeeping step, then updated with this outcome.

**Verification (exact commands, from `frontend/next/`):**

| Command | Result |
| --- | --- |
| `npm test` | 26/26 passed (6 files) — `DateRangeSelector.test.tsx` 14/14 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 (eslint) |
| `npm run build` | exit 0, Next.js 16.4.0 Turbopack, route table unchanged |
| `git diff --check` | exit 0 (pre-existing LF→CRLF warnings only) |
| `git status` | exactly the two source files + the plan copy changed/added, on top of the preserved uncommitted D7-27 work |

**Live spot-check** (dev server on :3000, logged in, `/analytics` against the volume dataset):

1. `?from=2026-09-20&to=2026-10-19` (30 inclusive days ending **yesterday**) → all three pills `aria-pressed="false"`; sections rendered without error.
2. Click `Last 30 days` → pill `aria-pressed="true"` (others false) and URL `?from=2026-09-21&to=2026-10-20` (ends today); KPIs refetched.
3. Picker header shows Month (January–December) and Year (2021–2031) selects plus the `‹ ›` arrows. Filling Year → 2023 and Month → January moved the grid to `January 2023 days` **with the URL unchanged** (no refetch); clicking `January 5, 2023` then changed the URL to `?from=2023-01-05` and the live region announced the new selection (this is what triggers the refetch). Browser page closed afterwards.

**Not done, per plan:** no commit made; no backend, e2e, screenshot, or docs-body changes; the pre-existing `GET /api/businesses/{business}` `withAvg` gap in `backend/laravel/routes/api.php` remains out of scope.
