# D6-25 — Frontend Component Tests

**Task:** D6-25 — Frontend Component Tests
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-25-frontend-component-tests.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-24 precedent in `MEMORY.md`.

**Desired outcome:** `npm test` green with component tests for at least business list, KPI cards, loading state, and error state — no browser needed.
**Scope:** Test devDeps + `vitest.config.ts` + `test` script + 4 test files over existing presentational components (minimal `KpiCards` extraction only if KPIs aren't isolated) + green `tsc`/`lint`.
**Non-goals:** No fetch-island tests, no browser/playwright, no redesign, no commit.

## Analysis carried forward

Zero frontend harness exists (`package.json`: next/react/tailwind/eslint/typescript only). Presentational, props-pure candidates: `TopBusinesses` (+ `EmptyState`), `CategoryChart`/`MonthlyChart` (props + zero-guard + aria), `LoadingSkeleton`, `SectionFallback`, plus `BusinessList`/`BusinessForm`/`LoginForm`. Dashboard KPIs live in fetch islands — extraction only if no isolated card exists. Dependency approval comes via this `/implement` (Sanctum D6-01 precedent).

## Current-state evidence

- `frontend/next/package.json:5-26` — scripts `dev/build/start/lint`, no test harness (verified in Plan stage)
- `frontend/next/src/components/` — `TopBusinesses.tsx`, `MonthlyChart.tsx`, `CategoryChart.tsx`, `LoadingSkeleton.tsx`, `SectionFallback.tsx`, `BusinessList.tsx` et al (per `MEMORY.md` D5-12…16)

## Learning objectives and just-in-time concepts

Presentational unit tests (props → markup, roles/aria) with jsdom + Testing Library — the standard React answer to "not everything needs a browser".

## Ordered implementation steps

1. Inspect purity of `BusinessList`, KPI markup, `LoadingSkeleton`, `SectionFallback`/`EmptyState`; extract minimal presentational `KpiCards` only if required (move without visual change).
2. `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react` (record resolved versions).
3. `vitest.config.ts` (jsdom + jest-dom setup) + `"test": "vitest run"` script.
4. Four test files: list (names + order + empty state), KPI (values + formatting), loading (skeletons + `aria-busy`), error (`role="status"` copy).
5. `npm test` green; `tsc` + `lint` green; `git diff --check` clean.

## Tests and verification commands, plus expected results

- 4+ component tests green; repeatable `npm test` (feeds D6-27 one-command).

## Risks, dependencies, and unresolved questions

- New devDeps are the point of the task; `/implement` is their approval.
- `vitest run` (no-watch) suits CI/D6-27.

## Plan check

- Standard React 19 stack; jsdom honors the no-browser learning; conditional extraction avoids needless refactor; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `package.json` (`test: vitest run`) + `package-lock.json` (devDeps: `vitest@3.2.4`, `jsdom@26.1.0`, `@testing-library/react@16.3.1`, `@testing-library/jest-dom@6.9.1`, `@vitejs/plugin-react@4.7.0`) + new `vitest.config.ts` (jsdom, `@` alias, setup file) + new `vitest.setup.tsx` (jest-dom matchers, global `next/link` stub, explicit `afterEach(cleanup)`) + 4 new test files under `src/components/__tests__/` (BusinessList 3, KpiCard 2, LoadingSkeleton 3, SectionFallback 1); plan file materialized at this path verbatim from the checked inline deliverable — no scope change. No `KpiCards` extraction needed (`KpiCard` already isolated).

**Verification (exact commands/results — the spec's test):**
- `npm test` → **4 files, 9/9 green** (list names/order/links/rating/empty, KPI values, skeletons aria-busy + row counts, fallback `role=status` copy).
- `npx tsc --noEmit` → exit 0; scoped `npx eslint` on 6 files → exit 0.
- Self-caught fixes: latest vitest ERESOLVE (vite 8/@types/node 26 peers) → pinned versions above; JSX-in-`.ts` esbuild failure → setup renamed `.tsx`; cross-test `<li>` leak → explicit cleanup (no `globals`).
- `git diff --check` clean; `git status --short` → package files + config + setup + tests dir (+ plan file).
