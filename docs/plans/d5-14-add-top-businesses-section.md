# D5-14 — Add Top Businesses Section

**Task:** D5-14 — Add Top Businesses Section
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-13
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `/analytics` shows the Go-ranked top businesses in exact API
order with ratings and review counts.

**Scope:** `TopBusiness` type + presentational `TopBusinesses` list (rank,
linked name, formatted rating, review count) + page section with parallel fetch
(default limit).

**Non-goals:** No client-side sorting/filtering (ranking lives in SQL — the
task's core lesson), no `?limit` picker UI (default 10 suffices), no new
queries, no loading/error states beyond the boundary (D5-15/16), no Go/compose
changes, no commit.

## Analysis carried forward

Go order `AVG DESC, COUNT DESC, id ASC`, default limit 10; `BusinessList` row
idiom reusable; shared-DB UUIDs make detail links valid; `git` clean at
`7950b18`.

## Current-state evidence

- `postgres.go:143-160` (ordering + limit), `repository.go:23-29` (shape)
- `src/components/BusinessList.tsx:16-40` (row idiom + `formatRating` +
  `EmptyState`)
- `src/app/analytics/page.tsx` (two sections, `Promise.all` pattern)
- `docs/day-5-integration-performance.md:244-251`

## Learning objectives and just-in-time concepts

Rendered order vs computed rank (UI displays, SQL decides); `index + 1` as
display-only rank; link reuse across service boundaries (same shared DB).

## Ordered implementation steps

1. Extend `src/types/analytics.ts` with `TopBusiness { id: string; name: string;
   average_rating: number; review_count: number }` (document: Go order, default
   10).
2. New `src/components/TopBusinesses.tsx`: props `{ rows: TopBusiness[] }`;
   `<ol>` with rank (`index + 1`), name linked to `/businesses/{id}`
   (BusinessList convention, IDs are shared-DB UUIDs), `formatRating` average +
   review count; `EmptyState` on empty (BusinessList convention). No sorting, no
   filtering — order rendered exactly as received. Rationale: ranking logic stays
   in SQL; UI only presents.
3. `page.tsx`: add the top-businesses fetch to `Promise.all`, append "Top
   businesses" section (no hardcoded count in the heading — robust if Go's
   default ever changes).
4. `npx tsc --noEmit` + `npm run lint` → clean.
5. `docker compose config --quiet` → 0; `build next && up -d next` (no bind
   mount) → `:3000/analytics` name sequence equals Go JSON name sequence
   exactly, with matching ratings/counts (the task's test).
6. `git diff --check` clean; `git status --short` → type + component + page (+
   new plan file).

## Tests and verification commands, plus expected results

- `tsc` + `lint` clean. Rendered order == API order element-for-element; values
  match (the task's test).
- `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Go down → boundary (D5-15/16 refine). Empty set → `EmptyState`, consistent with
  `BusinessList`.

## Plan check

- **Revision 1:** heading carries no hardcoded count ("Top businesses", not "Top
  10") — static text must not lie if Go's default limit ever changes.
- **Revision 2:** empty state specified (`EmptyState`, BusinessList convention)
  instead of leaving the empty case undefined.
- Challenged name-links: kept (shared-DB UUIDs resolve; BusinessList
  convention) — flagged for reviewer, one-line difference.
- Challenged client sorting/filtering: explicitly forbidden in the component
  contract — the task's core lesson encoded as a rule.
- Verified: ordering SQL, shape/tags, row idiom, file paths (no clashes),
  scripts, slug free, `git` clean, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `src/types/analytics.ts` extended (`TopBusiness`) + new
`src/components/TopBusinesses.tsx` + `src/app/analytics/page.tsx` (third fetch
+ section); plan file materialized at this path verbatim from the checked inline
deliverable — no scope change. No Go/compose changes.

**Verification (exact commands/results — the task's test):**
- `npx tsc --noEmit` → exit 0; `npm run lint` → exit 0 (no test runner exists).
- `docker compose config --quiet` → exit 0; `build next` (cached) + `up -d
  next` → `Started`.
- Go JSON: 10 rows (`Bartoletti…` → `Rippin and Sons`, `4.375/8` top).
  Browser `:3000/analytics`: identical 10-name sequence in order; ratings
  `4.4/4.1/…` via shared `formatRating` (`4.375`→`4.4`); counts `8`; names link
  to `/businesses/{uuid}`; rank numerals `1–10`. UI ordering matches the Go API
  element-for-element.
- `git diff --check` → clean (LF/CRLF advisory only); `git status --short` →
  exactly the 3 intended paths (+ new plan file).
