# D5-16 — Add Analytics Error Handling

**Task:** D5-16 — Add Analytics Error Handling
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-15
> precedent recorded in `MEMORY.md`.

**Desired outcome:** With Go down, every page stays navigable and
understandable: section headings with honest "unavailable" notices where Go data
belongs, working content intact everywhere else.

**Scope:** Shared `SectionFallback` + `try/catch`-around-fetch in all 4 islands
(fallback keeps the section heading) + stopped-Go probe proving the task's test.

**Non-goals:** No retry buttons (client boundary + refresh machinery — page
reload always available; route-level retry precedent stays at `/businesses`), no
`error.tsx` additions (would replace whole pages — the wrong granularity), no
Laravel-path changes, no Go/compose changes, no commit.

## Analysis carried forward

D5-15 digest baseline (per-island failure, Laravel survives, no user recovery);
islands fetch bare; `error.tsx` retry precedent; `git` clean at `1dd6627`.

## Current-state evidence

- 4 island files (fetch without catch), `businesses/error.tsx:1-33`
- D5-15 probe transcript (digests, no hang, recovery)
- `docs/day-5-integration-performance.md:266-274`

## Learning objectives and just-in-time concepts

Recovery at the dependency (island catches its own fetch); fetch-only `try`
(outages degrade, render bugs propagate); unavailable-vs-empty messaging; static
fallbacks need no client JS.

## Ordered implementation steps

1. New `src/components/SectionFallback.tsx`: props `{ label: string }` → notice
   "…is unavailable right now." (per-section wording passed by caller),
   pixels-only, `role="status"`. Rationale: uniform outage language, distinct
   from `EmptyState`'s empty-data meaning.
2. All 4 islands: wrap **only the fetch** in `try/catch` (`let rows; try { rows =
   await … } catch (e) { console.error(e); return (<>{heading}<SectionFallback
   …/></>) }`), render path untouched below. Rationale: Go outages degrade per
   section; render bugs still throw (never masked); server-side `console.error`
   mirrors `error.tsx`'s logging without a client boundary.
3. `npx tsc --noEmit` + `npm run lint` → clean.
4. `docker compose config --quiet` → 0; `build next && up -d next` (no bind
   mount) → loaded pages byte-equal to baselines (fallbacks absent when up).
5. Outage probe (the task's test): `docker compose stop analytics` → `/` shows
   shell + Laravel card + Go-KPI unavailable notice; `/analytics` shows shell +
   3 headed unavailable notices; HTTP 200, fast, no digests-as-UI, fully
   navigable (the "understandable, not broken" bar). `docker compose up -d
   analytics` → `healthy`, full content returns. Stack left running.
6. `git diff --check` clean; `git status --short` → fallback + 4 islands (+ new
   plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean. Loaded-state equality (no regression when up).
- Stopped-Go: headed notices per failed surface, working content intact, 200s,
  no hangs, no raw digests (the task's test).
- `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Fallback wording is reviewer-tunable at approval (one-line strings).
- No retry affordance by design (stated, not overlooked).

## Plan check

- **Revision:** `try` fenced to the fetch statement only with render outside — an
  outage degrades, a render bug still throws. This is the load-bearing
  correctness detail of the whole task.
- Challenged route-`error.tsx` approach: rejected — page-granularity recovery
  contradicts the task ("rest remains understandable"); islands already give the
  right granularity.
- Challenged retry buttons: rejected — needs client boundaries + refresh wiring;
  reload suffices; route precedent stays untouched.
- Challenged `EmptyState` reuse: rejected — "not found" misdescribes an outage;
  distinct component, distinct message.
- Verified: island file paths, fallback contract, scripts, slug free, `git`
  clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** new `src/components/SectionFallback.tsx` + fetch-only
`try/catch` in all 4 islands (fallback keeps each section heading; render path
untouched); plan file materialized at this path verbatim from the checked inline
deliverable — no scope change. No boundaries, no client components, no
Go/compose changes.

**Verification (exact commands/results — the task's test):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `build next` (cached) + `up -d
  next` → `Started`.
- Loaded state: zero fallbacks when up; all values equal baselines.
- Outage probe (`docker compose stop analytics`): `/` HTTP 200 — shell +
  Laravel 4th card + `Aggregate KPIs` headed notice; `/analytics` HTTP 200 —
  shell + 3 headed notices (`Category/Monthly/Ranking data … unavailable`),
  zero raw digests; fully navigable (the "understandable, not broken" bar).
  Failure is bounded (~4.1s DNS timeout per island, parallel, no hang).
- Restart → `healthy`, all content returns, zero fallbacks. Stack left running.
- Debugging note (recorded, not a defect): React Flight splits fallback text
  across chunks — verify outage strings with short fragments, not full
  sentences.
- `git diff --check` → clean (LF/CRLF advisory only); `git status --short` →
  exactly the 5 intended paths (+ new plan file).
