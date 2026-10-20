# UI Redesign — CaribeOps frontend

- **Task:** ui-redesign
- **Date:** 2026-10-20
- **Status:** Checked — awaiting user approval
- **Workflow note:** Written to `C:\Users\larao\.opencode\plan\ui-redesign.md` because this session runs in Plan mode, which only permits plan files in that directory. Before invoking `/implement`, place this file at `docs/plans/ui-redesign.md` (the location required by the repository workflow); the plan content must not change when moving it.

## Desired outcome

A complete visual redesign of the working Next.js frontend using the brand direction — green `#009B4D`, mandarin yellow `#FFCC00` (accents only), ivory `#FAF5E9` background, light theme, **Fraunces serif display type paired with Geist Sans body** — with modern, premium, responsive presentation, subtle motion, and original interactive SVG charts on the analytics page, **without any behavior change**.

## Scope

1. Design foundation: brand tokens, typography, light-only theme, motion primitives (CSS only).
2. Shared UI primitives to remove class-string duplication.
3. Navigation/shell redesign (responsive, keeping e2e/a11y contracts).
4. Dashboard redesign.
5. Analytics redesign: donut/radial category chart, animated area/column monthly chart, ranked businesses with progress indicators, hover/focus tooltips — all on existing Go endpoints.
6. **DateRangeSelector rebuild** (Booking.com-style range calendar, Sunday-first, spec below) with new unit tests.
7. Remaining pages: businesses list/detail/new, login, loading/error/empty states.
8. Final verification pass.

## Explicit non-goals

- No new npm dependencies (no chart/animation/icon/component libraries).
- No changes to API clients, endpoints, query params, response types, auth, permissions, business logic, or data filtering.
- No dark mode (deferred by user decision); no rewrite of application logic.
- No backend (`backend/laravel`), Go (`analytics/go`), Docker, or database changes.
- No commits; no screenshot regeneration unless separately approved (see Risks).

## Analysis carried forward

From the `/analize` stage of this orchestration (session evidence):

- **Stack:** Next.js 16.4.0, React 19.3.0, App Router, `cacheComponents: true` + `partialPrefetching`, Turbopack with `@tailwindcss/turbopack`. Dynamic pages use `export const instant = false` + `await connection()`; `force-dynamic` does not build under `cacheComponents`.
- **Styling:** Tailwind v4 CSS-first (`@import "tailwindcss"`, `@theme inline` in `src/app/globals.css`). No component/icon/animation/chart libraries; only `next`, `react`, `react-dom` at runtime.
- **Routes:** `/` (dashboard), `/login`, `/businesses` (+`loading.tsx`/`error.tsx`), `/businesses/new`, `/businesses/[id]`, `/analytics`. Root `layout.tsx` mounts `RequireAuth` + `Navigation` (server components; client islands: `RequireAuth`, `LogoutButton`, `LoginForm`, `BusinessForm`/`NewBusinessForm`, `SearchInput`, `CategoryFilter`, `DateRangeSelector`).
- **Charts/data:** hand-rolled CSS bar charts (`CategoryChart`, `MonthlyChart`), ranked list (`TopBusinesses`), KPI cards (`KpiCard` + `GoKpiSection`). Data: Go `NEXT_PUBLIC_ANALYTICS_URL` endpoints (`/analytics/overview`, `/analytics/businesses-by-category`, `/analytics/reviews-by-month`, `/analytics/top-businesses`, all with `?from=&to=`) and Laravel `/api/dashboard/summary`.
- **Design inconsistencies:** palette is `teal`/`zinc` (brand colors absent); `body { font-family: Arial }` defeats the loaded Geist font variables; **113 lines with `dark:` utilities across 26 files** (grep-verified) + `colorScheme: "light dark"`; heading scale drift (dashboard `text-4xl/6xl` vs `text-3xl` elsewhere); duplicated container class `mx-auto w-full max-w-5xl px-6 py-12` in 7 files; duplicated input/label/button class strings in `LoginForm`/`BusinessForm`/`SearchInput`/`CategoryFilter`; non-responsive nav; KPI skeleton renders 3 cards in a 4-column grid.
- **DateRangeSelector defects:** weekday header is Monday-first while `getDay()` padding is Sunday-based (grid misalignment); `toISOString().slice(0,10)` applied to local dates can shift the selected day; `classes` variable computed then re-inlined (pre-existing lint warning, `DateRangeSelector.tsx:195`).
- **Next.js 16 docs read** (`frontend/next/node_modules/next/dist/docs/`): CSS guide confirms current Tailwind v4 setup; fonts guide confirms variables must reach elements (our `body` Arial rule blocks them); `instant.md` confirms `instant = false` is the correct per-page opt-out (dev-only validation; do not move it to the root layout, which would disable static-shell validation app-wide); `view-transitions.md` confirms React 19.3 `<ViewTransition>` works in App Router with **no configuration or dependency** — usable for meaningful route motion with graceful degradation.
- **Baseline checks run this session:** `npm run lint` → 0 errors / 1 warning (unused `classes`); `npx tsc --noEmit --incremental false` → clean; `npm test` → 5 files, 12/12 pass; `npm run build` → success (routes: `/` ƒ, `/_not-found` ○, `/analytics` ƒ, `/businesses` ◐, `/businesses/[id]` ◐ + dynamic, `/businesses/new` ◐, `/login` ○). `npm run test:e2e` **not run** (requires live stack + `E2E_EMAIL`/`E2E_PASSWORD`).
- **Test contracts that must keep passing unchanged:** vitest pins in `src/components/__tests__/` (KpiCard labels/values; BusinessList link names, `Rating: 3.0`, `No ratings yet`, `No businesses found.`; `SectionFallback` `role="status"`; SearchInput `Search businesses` label, `Clear search` link + href); Playwright `e2e/auth-flow.spec.ts` (`Email`/`Password` labels, `Log in` button, `Tourism Operations & Analytics` heading, `Businesses` link reachable in nav, `listitem → link` on the list, business-name heading, `Reviews (\d+)` heading).
- **User changes to preserve:** 15 modified frontend files + modified `MEMORY.md`/screenshots (uncommitted accessibility pass: focus rings, skip link, `autoComplete`, `colorScheme`), untracked `.agents/`, `skills-lock.json`. All phases build **on top of** these; nothing is reverted.
- **Fixed decisions from the user:** light ivory theme (dark later); custom SVG charts with no dependencies; donut/radial categories, animated area/column monthly, ranked progress indicators; Booking-style calendar spec; preserve URL `?from=YYYY-MM-DD&to=YYYY-MM-DD`; fix local-date/timezone handling without changing date semantics; preserve a11y contracts and tests. **Font (revised decision):** display face = **Fraunces** (Google serif closest to the user's Moling reference, loaded via `next/font/google`, no dependency) used for headings/brand/KPI values/chart titles; **body/UI stays Geist Sans** (serif headings + sans body pairing).

## Current-state evidence and relevant files

Files to change (grouped by phase; new files marked ✨):

| Phase | Files |
|---|---|
| 1 Foundation | ✨ none (edit `src/app/globals.css`, `src/app/layout.tsx`) |
| 2 Primitives | ✨ `src/components/Button.tsx`, ✨ `src/components/Card.tsx`, ✨ `src/components/PageContainer.tsx`, ✨ `src/components/SectionHeading.tsx`, ✨ `src/components/Field.tsx` (+ ✨ `src/lib/ui.ts` class helpers) |
| 3 Shell | `src/components/Navigation.tsx`, `src/app/layout.tsx` |
| 4 Dashboard | `src/app/page.tsx`, `src/components/KpiCard.tsx`, `src/components/GoKpiSection.tsx`, `src/components/LoadingSkeleton.tsx` |
| 5 Analytics | `src/app/analytics/page.tsx`, `src/components/CategorySection.tsx`, `src/components/CategoryChart.tsx` (→ donut), `src/components/MonthlySection.tsx`, `src/components/MonthlyChart.tsx` (→ area/column), `src/components/TopSection.tsx`, `src/components/TopBusinesses.tsx`, `src/components/SectionFallback.tsx`, `src/components/EmptyState.tsx` |
| 6 Date picker | `src/components/DateRangeSelector.tsx` (rebuild), ✨ `src/components/__tests__/DateRangeSelector.test.tsx` |
| 7 Pages | `src/app/login/page.tsx`, `src/app/businesses/page.tsx`, `src/app/businesses/new/page.tsx`, `src/app/businesses/[id]/page.tsx`, `src/app/businesses/loading.tsx`, `src/app/businesses/error.tsx`, `src/components/LoginForm.tsx`, `src/components/BusinessForm.tsx`, `src/components/NewBusinessForm.tsx`, `src/components/BusinessList.tsx`, `src/components/ReviewList.tsx`, `src/components/SearchInput.tsx`, `src/components/CategoryFilter.tsx`, ✨ optional `src/app/not-found.tsx` |

**Functionally unchanged (styling-only touch allowed):** `RequireAuth.tsx`, `LogoutButton.tsx` (logic), all of `src/lib/` (`auth.ts`, `api-client.ts`, `analytics-client.ts`, `validate-business.ts`, configs), `src/types/*`, section-island fetch/try-catch semantics (`GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`), `TopBusinesses` ordering (never sorts), `instant = false` + `connection()` markers, `formatRating` export from `BusinessList.tsx` (imported by 3 modules — keep the export, even if relocated with import updates), form submit state machines and generic login error text.

## Learning objectives and just-in-time concepts

1. **Tailwind v4 tokens:** `@theme` blocks expose design tokens as utilities (`--color-brand-500` → `bg-brand-500`); one edit re-themes the app.
2. **Server/client boundary:** pages and section islands are server components — motion and interactivity live in CSS or client islands (`"use client"`), never in server render logic.
3. **Calendar accessibility:** day grids are button grids with roving tabindex, arrow-key navigation, `aria-label` per date (`"June 5, 2026"`), `aria-selected`, and a live-region hint.
4. **Hand-built SVG charts:** scale data to a viewBox, keep `role="img"` + `<title>`/aria-labels, animate with CSS `@keyframes` gated by `prefers-reduced-motion`.
5. **View Transitions:** React 19.3 `<ViewTransition>` for navigation motion without dependencies (browser-support-dependent; app stays functional without it).

## Ordered implementation steps

### Phase 0 — Ground rules (no code changes)
Already executed during analysis; re-run before Phase 1: confirm Next 16 docs read, re-run baseline (`npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`), record results.
**Acceptance:** baseline green; no source edits.

### Phase 1 — Design foundation (`globals.css`, `layout.tsx`)
1. Define tokens in `@theme`: brand green ramp (`#009B4D` base + light/dark shades for hover/press), mandarin `#FFCC00`, ivory `#FAF5E9` (page background), ink neutrals (text/borders derived from a warm-neutral scale), radius + shadow scale.
2. **Type system (user decision: Fraunces + pairing).** Load **Fraunces** (modern elegant serif — the free `next/font/google` stand-in for the Moling reference) as the display face: headings, brand wordmark, KPI values, chart titles — applied via a `--font-display` CSS variable exposed in `@theme`. Keep **Geist Sans** (already loaded, zero dependencies) for body, nav, forms, labels, chart axis/tooltip text and small UI — `--font-sans`. Small tracking-wide uppercase labels (as in the reference image) stay sans. Verify Fraunces axis options against the installed `next/dist/docs/01-app/03-api-reference/02-components/font.md` during implementation; request only the subsets/weights actually used.
3. Apply ivory background + ink text at base layer; **remove `body { font-family: Arial }`** so the font variables actually reach the page; drop Geist Mono unless a surface needs tabular figures (Fraunces/Geist numerals cover most cases).
4. Light-only theme: remove the `prefers-color-scheme: dark` block, remove/replace the `colorScheme: "light dark"` inline style with light, and plan removal of `dark:` utilities as each file is redesigned (they would otherwise half-activate for OS-dark users against an ivory page).
5. Add motion primitives: `@keyframes` (fade-up, shimmer, bar-grow, count) + utility classes, all wrapped so `prefers-reduced-motion: reduce` disables them (`motion-safe:`/media query).
6. Keep `@import "tailwindcss"` and the Turbopack CSS rule untouched.
**Files:** `src/app/globals.css`, `src/app/layout.tsx` (metadata `themeColor`/styles only; `RequireAuth`/`Navigation` mounts unchanged).
**Acceptance:** tokens usable as `bg-brand-500`, `text-ink-*`, `bg-ivory`; **Fraunces visibly renders on headings/brand and Geist Sans on body text** (Arial rule gone); no `dark:`-dependent regressions in Phase 1 scope; lint/tsc/test/build green.

### Phase 2 — Shared primitives (new files only, then adopted)
Create flat `Button`, `Card`, `PageContainer`, `SectionHeading`, `Field` (label+input+error) components and `src/lib/ui.ts` helpers, following existing flat `src/components/` convention.
**Rationale:** eliminates the duplicated class strings before pages are redesigned, so every later phase composes the same vocabulary (no rework, no duplicate components).
**Acceptance:** new components only; no behavior change; existing tests untouched and passing.

### Phase 3 — Navigation / shell (`Navigation.tsx`, `layout.tsx`)
Branded header: logo/wordmark in green, ivory-tinted surface, active-route indicator, focus-visible rings preserved, responsive layout that **keeps all nav links in the DOM at every breakpoint** (wrapping/scrollable row — no hamburger that removes links from the accessibility tree, which would break the Playwright `getByRole("link", { name: "Businesses" })` pin). `LogoutButton` mounted exactly as today.
**Acceptance:** all 4 links + Logout reachable by keyboard and by role at 360px and 1400px widths; e2e selectors unaffected; lint/test/build green.

### Phase 4 — Dashboard (`app/page.tsx`, `KpiCard`, `GoKpiSection`, `LoadingSkeleton`)
Card grid on ivory, green accents with one mandarin highlight, unified heading scale, fixed skeleton count (4 cards in the 4-col grid), optional subtle count-up (CSS/JS-free preferred; skip if it risks server/client mismatch).
**Acceptance:** `KpiCard` test pins still pass; skip-link and heading pins intact; `GoKpiSection` fetch logic byte-identical; build green.

### Phase 5 — Analytics charts (`analytics/page.tsx`, `Category*`, `Monthly*`, `Top*`, `SectionFallback`, `EmptyState`)
1. `CategoryChart` → **custom SVG donut/radial** (green ramp segments, mandarin accent on the highlighted/leading slice, center total, hover/focus segment → tooltip with name + count + share %, `role="img"` + aria-label; keyboard-focusable segments).
2. `MonthlyChart` → **animated SVG area/column chart** (columns + soft area gradient, minimal grid lines (≤4 horizontal), month labels readable, hover/focus tooltip showing month + count, CSS grow-in animation `motion-safe`).
3. `TopBusinesses` → ranked rows with **progress indicators** (rating-scaled bars in green), still never re-sorted; links unchanged.
4. Section headings/cards: well-spaced cards, strong typography; keep `SectionFallback` `role="status"` semantics and `EmptyState` messages.
**Data:** same four Go endpoints, same `?from&to` props threading; no fetch changes.
**Acceptance:** each chart renders with aria labels; tooltips reachable by mouse **and** keyboard focus; reduced-motion disables grow animations; existing tests + build green; visual hierarchy matches spec (cards, typography, labels, minimal grid).

### Phase 6 — DateRangeSelector rebuild (specific task; Booking.com-style)
**Behavioral spec (acceptance criteria):**
1. Single calendar, two-click range selection: 1st click sets `from`; 2nd click sets `to`; both-picked → next click starts a new range at that date.
2. Complete period highlighted: in-range days = soft green background; endpoints = solid green (`bg-brand-500`, white text), visually distinct from in-range days; mandarin used only for small accents (e.g., today's dot or the "Custom" badge).
3. Clicking a date **earlier than the current start** predictably becomes the new start date (range resets); clicking the same date as start clears to a single-day range (`from = to = that day`) — documented in a hint.
4. **Sunday-first grid**: header `SUN … SAT` and leading-cell padding both from Sunday-based `getDay()` (fixes the current misalignment).
5. Month navigation: previous/next buttons with disabled state at bounds (optional bounds = ±5 years), visible `Month YYYY` heading.
6. Clear button (removes `?from`/`?to`, returns to `/analytics`), quick filters **7d/30d/90d preserved**, empty-state hint when no range selected ("Select a start date…").
7. Timezone-safe dates: build `YYYY-MM-DD` from local `getFullYear()/getMonth()/getDate()` components (no `toISOString()` on local dates) — same intended semantics (local calendar days), URLs remain `?from=YYYY-MM-DD&to=YYYY-MM-DD`.
8. Keyboard: `Tab` reaches the grid; arrow keys move day focus (Left/Right ±1 day, Up/Down ±7), `Home`/`End` week bounds, `PageUp`/`PageDown` change month, `Enter`/`Space` select; visible `focus-visible` ring on every control; `aria-label` per day including full date; `aria-pressed`/`aria-selected` state; polite live region announcing selection/hint.
9. Reduced motion honored; responsive (grid scales down, min tap target 40px, usable at 360px).
10. URL contract preserved: pushes `/analytics?from=…&to=…` via `router.push` exactly as today; server sections keep receiving `from`/`to` props.
**Tests:** new `src/components/__tests__/DateRangeSelector.test.tsx` covering: first click sets start; second click sets end with range highlight; earlier-than-start click becomes new start; Sunday-first header/padding alignment; clear resets; preset buttons produce correct `from`/`to`; local-date formatting has no UTC shift.
**Acceptance:** criteria 1–10 verifiable manually or in tests; existing suite + build green; lint warning at line 195 resolved by the rebuild.

### Phase 7 — Remaining pages (list, detail, new, login, states)
Businesses list (search/filter/pagination row restyled, links/URL logic untouched), detail page (card-based info block, amenities as chips, rating display; keep `Reviews (N)` heading), new-business form + login form (visual redesign only via `Field`/`Button`; keep validation seam, state machines, `role="alert"`/`role="status"`, generic error text), restyle `loading.tsx`/`error.tsx` skeletons to the new language; optional `not-found.tsx`.
**Acceptance:** all form/validation/auth behavior identical; full unit suite + build green; e2e green when stack available.

### Phase 8 — Final verification
Full command matrix (below), manual 6-route pass at 360px/768px/1400px, keyboard-only pass, reduced-motion pass, `git status` review confirming no unexpected files, MEMORY update deferred to `/implement` stage.

## Tests and verification commands

From `frontend/next/`:

| Command | Expected result |
|---|---|
| `npm run lint` | 0 errors (baseline warning at `DateRangeSelector.tsx:195` cleared by Phase 6) |
| `npx tsc --noEmit --incremental false` | clean |
| `npm test` | 12/12 baseline passing **plus** new DateRangeSelector tests |
| `npm run build` | succeeds; same route classification (○ ◐ ƒ) |
| `npm run test:e2e` | passes — `playwright.config.ts` boots Laravel `:8000` and `next dev :3101` on demand (`reuseExistingServer`); prerequisites: seeded PostgreSQL running (Docker) + `E2E_EMAIL`/`E2E_PASSWORD` env; Go analytics **not** started by the config and not used by `e2e/auth-flow.spec.ts`. **Not run in this session's baseline** |

Repo root: `make test` (Laravel + Go + vitest) before final handoff; `git diff --check` clean.

Per phase: run lint + tsc + `npm test` + `npm run build` after each phase lands.

## Risks, dependencies, and unresolved questions

1. **Plan location:** Plan mode restricts writing to the opencode plan dir; must be copied to `docs/plans/ui-redesign.md` before `/implement` (workflow requirement).
2. **E2E not baseline-verified** in this session — first e2e run happens with a live stack; any failure must be triaged before proceeding past Phase 3 (nav) and Phase 7 (forms).
3. **Uncommitted user changes** (15 files a11y pass + screenshots): phases edit these same files; nothing is reverted or committed without approval.
4. **Dark utilities:** plan strips `dark:` as files are redesigned (light-only decision); any file skipped would render inconsistently for OS-dark users — Phase 7 sweeps for stragglers (`grep dark:` must return 0 at the end, except deliberate exceptions).
5. **`formatRating` export:** must remain importable from its module; if relocated, update all 3 importers + tests in the same commit-sized step.
6. **Screenshot regeneration** (`docs/screenshots/*.png`): currently carrying user edits — regenerate only with explicit approval, as part of Phase 8 optional step.
7. **Reference images absent:** the Booking.com-style calendar and "previously selected" analytics hierarchy references are not in the repo/conversation; Phase 5/6 build to the written spec — if images are supplied at review time, minor visual refinements may follow (no scope change).
8. **No new dependencies** — any requirement that seems to need a library must be re-solved with SVG/CSS.

## Authorization reminder

Implementation is **not** authorized. This plan requires `/check` to set status `Checked — awaiting user approval`; only the user's explicit `/implement "docs/plans/ui-redesign.md"` invocation authorizes application changes.

## Plan check

Performed against the current repository (stage 3 of the `/orchestrator` procedure). Findings and revisions:

1. **File paths validated.** All "edit" targets exist (verified via source listing); all five new primitive names (`Button`, `Card`, `PageContainer`, `SectionHeading`, `Field`, plus `src/lib/ui.ts`) are collision-free against the 24 existing `src/components/` files.
2. **`formatRating` contract confirmed by grep:** exported from `BusinessList.tsx`, imported by exactly 3 modules (`GoKpiSection.tsx`, `TopBusinesses.tsx`, `app/businesses/[id]/page.tsx`). The plan's keep-or-update-together rule stands.
3. **Dark-mode removal scope quantified:** 113 `dark:`-containing lines across 26 files (figure corrected in the analysis section). The Phase 8 `grep` gate is therefore concrete and achievable; the sweep covers every listed file.
4. **E2E prerequisites corrected** per `playwright.config.ts`: the config itself starts `php artisan serve :8000` and `next dev :3101` (no Go service); required externally are seeded PostgreSQL and `E2E_EMAIL`/`E2E_PASSWORD` (`E2E_BASE_URL` optional). Verification table updated.
5. **Baseline claims re-verified as actual runs:** lint (0 errors / 1 pre-existing warning at `DateRangeSelector.tsx:195` — comes from the user's uncommitted diff and is removed by the Phase 6 rebuild), `tsc` clean, vitest 12/12, `next build` success with route classification recorded. E2E honestly marked not-run.
6. **Uncommitted user work (15 files) reconciled with scope:** every phase edits files already carrying the accessibility pass; the plan preserves its substance (focus-visible rings, skip link, `autoComplete`, `role` attributes) — Phase 1 replaces only `colorScheme: "light dark"` with `light`, consistent with the user's light-theme decision, and Phase 6 rebuilds the calendar while keeping the focus-ring behavior the user added.
7. **Scope challenge:** no backend/Go/Docker/database files appear anywhere in the change tables; no new dependencies; test files are only *added*, never modified. Commands match `package.json` scripts and the Makefile.
8. **Date-picker acceptance criteria** are individually testable (click-sequence state, Sunday-first alignment, local-date formatting, keyboard map) and mapped to a new vitest file, following the existing `__tests__` + router-stub precedent from `SearchInput.test.tsx`.
9. **Unresolved question assessed and closed:** the Booking/analytics reference images are absent from the repo and conversation; the written spec is sufficiently detailed to plan and implement (no blocking question for the user). If images surface at review, only visual micro-adjustments follow — no scope change.
10. **Plan location deviation recorded:** Plan mode restricted this file to `C:\Users\larao\.opencode\plan\ui-redesign.md`; the file must be placed at `docs/plans/ui-redesign.md` (identical content) before `/implement`, as the workflow requires.

**Changes applied during check:** status → `Checked — awaiting user approval`; `dark:` count corrected (113/26); e2e prerequisites made precise; findings 1–10 recorded.

**Revision after user review (font decision):** at the user's request the type direction changed — Phase 1 step 2 now defines the type system as **Fraunces display serif (headings/brand/KPI/chart titles) + Geist Sans body**, chosen from `next/font/google` (zero new dependencies) as the closest free equivalent of the Moling reference image; "Fixed decisions" and Phase 1 acceptance criteria updated accordingly. Fraunces axis/weight configuration must be confirmed against the installed font API docs during implementation.

No material decision requiring the user was identified beyond the already-supplied design decisions; the plan is ready for review.
