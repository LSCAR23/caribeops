# D5-11 — Connect Next.js Dashboard to Go Overview

**Task:** D5-11 — Connect Next.js Dashboard to Go Overview
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-10
> precedent recorded in `MEMORY.md`.

**Desired outcome:** The three aggregate KPI cards render Go-computed values;
browser values match `GET /analytics/overview`.

**Scope:** Analytics fetch path (config + client + type, mirroring the Laravel
trio's conventions) + `page.tsx` hybrid wiring (Go 3, Laravel 1) + compose
analytics-URL var (the deferred D5-06 item, now with its first consumer).

**Non-goals:** No dropping of the "New (7 days)" card (product regression by
smuggling); no new Go queries (service scope closed since D4); no per-metric
error/loading states (D5-15/16 own them — Go-down surfaces via the existing
boundary, same as Laravel-down today); no `/analytics` subpage work (D5-12+); no
commit.

## Analysis carried forward

Laravel 4-card summary vs Go flat 3-metric overview; no Go fetch path; no test
runner (tsc+lint+browser); `git` clean at `feefbcc`.

## Current-state evidence

- `src/app/page.tsx:1-43`, `src/types/dashboard.ts:1-8`,
  `src/lib/api-client.ts:21-48`, `src/lib/api-config.ts:1-6`,
  `src/components/KpiCard.tsx`
- `frontend/next/.env.example:8`, compose `next.environment` (no analytics var
  yet)
- Go overview shape/live values (`40/320/3.040625`); `package.json:5-10` scripts
- `docs/day-5-integration-performance.md:198-215`

## Learning objectives and just-in-time concepts

Metric ownership across services; the adapter at the boundary (flat Go keys →
card values, same `formatRating` path); env-per-target without code branches;
parallel server fetches (`Promise.all` — one slow service doesn't serialize the
other).

## Ordered implementation steps

1. New `src/types/analytics.ts`: `AnalyticsOverview { businesses: number;
   reviews: number; average_rating: number }` (document: flat Go shape,
   never-null average via `COALESCE`).
2. New `src/lib/analytics-config.ts`: `analyticsBaseUrl` from
   `NEXT_PUBLIC_ANALYTICS_URL ?? "http://localhost:8080"`, trailing-slash strip
   — line-for-line the `api-config` convention. Rationale: identical pattern,
   host-dev fallback, no new concepts.
3. New `src/lib/analytics-client.ts`: `analyticsGet<T>` mirroring `apiGet`
   (Accept header, `!ok` → same `ApiError`, empty-body guard). Rationale: same
   error-boundary contract; lives apart from `api-client.ts` whose contract is
   documented as the Laravel API.
4. `page.tsx`: `Promise.all` the Go overview + existing Laravel summary; map
   `businesses/reviews/average_rating` into the three cards (same `formatRating`
   call); 4th card keeps `summary.new_businesses`. `DashboardSummary` type and
   Laravel fetch stay untouched. Rationale: minimal diff, both services visible,
   no UI surface change.
5. Compose `next.environment` += `NEXT_PUBLIC_ANALYTICS_URL:
   http://analytics:8080` (+ D3-10-style comment). Rationale: in-container DNS
   name; host dev covered by fallback (`.env.local` untouched — a
   developer-local file).
6. `npx tsc --noEmit` + `npm run lint` in `frontend/next` → clean.
7. `docker compose config --quiet` → 0; `up -d next` (env change; dev server
   picks it up) → dashboard `:3000/` shows `40 / 320 / <formatted 3.040625>`
   with 4th card from Laravel; bodies cross-checked against
   `:8080/analytics/overview` JSON.
8. `git diff --check` clean; `git status --short` → 4 frontend files + compose (+
   new plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean (no test runner exists).
- Browser values equal Go JSON (the task's test); 4th card unchanged; boundary
  behavior unchanged on Go-down (spot-check optional via stopped analytics —
  informational, stack left running).
- `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Daemon/Go down → dashboard errors via boundary (same as Laravel-down today);
  D5-15/16 refine this.
- `NEXT_PUBLIC_` inlining only matters at build time; this stack runs `dev` (no
  build) — consistent with the existing pattern.

## Plan check

- Challenged Go-only vs hybrid: Go-only forces dropping a card or adding a Go
  query (service scope closed since D4, UI regression by smuggling) — hybrid is
  the minimal faithful reading; flagged for reviewer, not silent.
- Challenged putting the Go fetch in `api-client.ts`: rejected — that module's
  contract is the Laravel API; a sibling module keeps the service boundary
  visible in code.
- Challenged narrowing `DashboardSummary`/dropping the Laravel fetch: rejected —
  minimal diff, endpoint unchanged, type stays truthful.
- Challenged `.env.local` edit: rejected — developer-local gitignored file;
  fallback covers host dev.
- Verified: all file paths, Go shape/keys, fallback pattern, scripts for
  tsc/lint, slug free, `git` clean, no secrets (URLs only).

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new `src/types/analytics.ts`, `src/lib/analytics-config.ts`,
`src/lib/analytics-client.ts` + `src/app/page.tsx` hybrid wiring +
`docker-compose.yml` (`NEXT_PUBLIC_ANALYTICS_URL: http://analytics:8080`); plan
file materialized at this path verbatim from the checked inline deliverable — no
scope change. No Go/Laravel changes.

**Deviation / key finding (within scope):** the compose `next` service was
serving a stale image (container copy of `page.tsx` dated Oct 9; no bind mount),
so the first live probe rendered a header-only page. Fixed per the D5-02
contract: `docker compose build next && up -d` (npm-ci layer cached, fast).
Pre-existing `/businesses` probes were unaffected. Lesson recorded: compose
`next` edits require an image rebuild to take effect.

**Verification (exact commands/results — the task's test):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `up -d next` → recreated, `Started`.
- Dashboard `:3000/` cards: `40 / 320 / 3.0 / 40` — first three from Go
  (`:8080/analytics/overview` → `40/320/3.040625`; `3.0` is `toFixed(1)` via the
  shared `formatRating`), fourth (`New (7 days) = 40`, all seeded within 7 days)
  still from Laravel. Browser values match Go results.
- `git diff --check` → clean (LF/CRLF notice is the repo-wide advisory, not an
  error); `git status --short` → exactly the 5 intended paths (+ new plan
  file).
