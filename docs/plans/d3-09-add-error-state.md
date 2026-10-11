# Plan — D3-09: Add Error State

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-09 — Add Error State
- **Plan path:** `docs/plans/d3-09-add-error-state.md`

## Desired outcome

With Laravel unreachable or erroring, `/businesses` renders a clear,
page-styled message ("Something went wrong loading businesses") with a
"Try again" retry button, instead of Next's default error page. Healthy
renders are unchanged.

## Scope

### In scope

1. New `src/app/businesses/error.tsx`: Client Component boundary fallback
   (`'use client'`, `{error, reset}` props), same `max-w-5xl` container and
   zinc/dark styles, generic message + retry button calling `reset()`.
2. Failure proof with Laravel stopped/unreachable, then healthy-render
   re-proof.

### Non-goals

- No try/catch in `page.tsx`; no changes to `apiGet`/`ApiError`, loading
  fallback, list component, or types; no per-status branching copy beyond one
  generic message (status-specific text is speculative — `ApiError.status`
  stays available for later); no `global-error.tsx`; no Laravel changes;
  no dependencies.

## Analysis carried forward

D3-09 (`docs/day-3-nextjs.md:186-199`) needs a user-facing failure message,
proven with Laravel stopped. Evidence: page has no error handling — `apiGet`
throws `ApiError`/connection errors straight to Next's default page;
`ApiError.status` was designed for D3-09 branching; no `error.*` exists while
`loading.tsx` sets the sibling pattern; tree clean, slug free. No open
material question; try/catch alternative kept as review-overridable.

## Current-state evidence and relevant files

- New: `src/app/businesses/error.tsx` — sole UI addition.
- Untouched: `src/app/businesses/page.tsx:15-17` (throw host),
  `src/lib/api-client.ts:3-41` (`ApiError` contract),
  `src/app/businesses/loading.tsx` (sibling pattern).
- References: `docs/day-3-nextjs.md:186-199`; version-pinned
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`
  (implement must read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Error boundaries: `error.tsx` isolates the failing segment — Navigation and
  layout stay interactive while only `/businesses` shows the fallback.
- `reset()`: re-renders the segment, retrying the fetch without a full page
  reload; the boundary separates recovery mechanics from fetch code.

## Ordered implementation steps

1. Confirm clean tree; re-read page, api-client, loading fallback (read-only).
2. Read the version-pinned `error` file-convention reference before writing.
3. Create `src/app/businesses/error.tsx`: `'use client'`;
   `export default function BusinessesError({ error, reset }: { error: Error; reset: () => void })`;
   container + heading ("Businesses"), one generic message line, `reset()`
   "Try again" button. Log `error` via `console.error` (or `useEffect`) for
   diagnostics; never render `error.message`/body.
4. Proof (production `next start` on non-`:3000` port, Laravel stopped or env
   pointed at a dead port): curl `/businesses` HTML contains the message and
   retry label, and not business content; restart Laravel (fresh `:8001`
   serve), reload via `reset`/navigation and assert the normal list returns.
5. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`
   (Laravel-independent, `/businesses` stays `◐ Partial Prerender`);
   repo-root `git diff --check` + `git status --short` — expect one new file.
   Rationale: file convention is the smallest answer, mirrors `loading.tsx`,
   and keeps fetch code free of UI-state bookkeeping.

## Tests and verification commands

```powershell
# from frontend/next (+ repo root for git)
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the stopped-Laravel HTML proof and healthy re-proof above. Expected: all
checks clean; diff = 1 new file. No checks run in planning.

## Risks, dependencies, unresolved questions

- `error.tsx` must be a Client Component with the exact boundary signature —
  else build/dev validation fails.
- `reset()` retries the same fetch; if Laravel is still down the fallback
  correctly reappears (not a bug — re-proof covers the healthy path).
- Message stays generic across `ApiError` vs connection-refused causes.
- No open questions.

## Plan check

- Verified paths (no error files, throw host, ApiError contract, sibling
  loading pattern, clean tree, free slug) by reads/glob; no code edited.
- Challenged inline try/catch in page: rejected for now — loses `reset()`
  retry and breaks the loading/error file-convention symmetry; one-step
  change later if preferred.
- Challenged per-status messages: rejected — speculative copy; generic
  message covers the roadmap test.
- Challenged `global-error.tsx`: rejected — segment scope is the task.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-09-add-error-state.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned, with one documented mechanism deviation
(see below). Note: the plan file did not exist at `/implement` time (prior
Plan-mode session was blocked from writing `docs/plans/`), so it was first
materialized verbatim from the checked inline deliverable before implementing
(same as D3-06/07/08).

Files:

- `frontend/next/src/app/businesses/error.tsx` — new: Client Component
  boundary fallback (`'use client'`, page-matching container/styles, generic
  message + `retry()` "Try again" button, `console.error` diagnostics, never
  renders error details). Sole application change.

Deviation (loud, not silent): the plan specified the `reset()` prop, but the
version-pinned `dist/docs` `error` reference (Next 16.4.0) states the `retry()`
prop became stable in v16.3.0 and should be used instead — implemented with
`retry()`, same recovery semantics (re-fetch + re-render the segment).

Verification (exact commands, all from `frontend/next` unless noted):
`npx tsc --noEmit` clean (exit 0); `npm run lint` clean;
`npm run build` passed (Next 16.4.0; `/businesses` stays `◐ Partial Prerender`,
Laravel-independent); `git diff --check` clean;
`git status --short` shows 1 new component + 1 new plan file only.
Version-pinned `error` reference read before writing. No Laravel changes,
no dependencies. Nothing committed.

Live failure proof (production `next start` on `:3101`, API pointed at dead
`127.0.0.1:8999`): server logs show `TypeError: fetch failed`
(ECONNREFUSED, digest `948219211`); streamed payload wires the boundary
(`"error":"$20"`, `_reactRetry` runtime) with the loading shell and zero
business content — no default 500 page, no crash. Honest limitation: the
`error.tsx` fallback paints client-side after hydration in this PPR streaming
architecture, so its text cannot be captured via curl (no browser tooling in
this environment); the boundary catch + retry wiring is proven server-side,
the final paint is not. Healthy re-proof (env restored to `:8000`, rebuilt):
full list renders (`Kilback Ltd`, `Hotels`, `Rating:`, `Showing`), no error UI.
Temp `.env.local` override restored. Proof server stopped.

Environment finding (not caused by this task): Docker Laravel on `:8000` is
currently LIVE (`/api/health` 200, `/api/businesses` 200 with 40 businesses,
`Kilback Ltd` first) — contradicting MEMORY's stale-`:8000` note, so the dead
port `:8999` was used for the failure proof instead. Day-5 rebuild note in
MEMORY may be outdated.
