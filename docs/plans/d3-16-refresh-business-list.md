# Plan — D3-16: Refresh Business List

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-16 — Refresh Business List
- **Plan path:** `docs/plans/d3-16-refresh-business-list.md`

## Desired outcome

After a 201 creation, the UI automatically navigates to `/businesses/[new-id]`, where the created record visibly appears (name, details, reviews section) with zero manual steps and zero database meddling. The create→see loop is closed.

## Scope

### In scope

1. `src/components/NewBusinessForm.tsx`: `useRouter` from `next/navigation`; on 201, `router.push(`/businesses/${created.data.id}`)` instead of the success state. Simplify `SubmitStatus` to idle/pending/error (drop `success`), remove the now-unreachable success JSX + unused `Link` import. Pending guard and generic failure state preserved as-is.
2. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a live redirect probe (below).

### Non-goals

- No list-page, pagination, or filtering changes; no success-screen retention (superseded by the redirect per your destination decision); no 422-mapping or form redesign; no `router.refresh`/revalidation calls (target page already renders per request); no Laravel changes; no dependencies.

## Analysis carried forward

D3-16 (`docs/day-3-nextjs.md:317-330`) closes the create→see loop; test is the new record appearing with no manual DB work. Evidence: D3-15 ends at a static success screen with a manual link; zero `useRouter` in `src/`; new rows land on the last id-ordered page so redirect-to-list would hide the row (user decision: detail page); `[id]` page renders per request with no static params, so fresh ids resolve live; 201 body carries the UUID `id`; tree clean; slug free.

## Current-state evidence and relevant files

- `src/components/NewBusinessForm.tsx:12-16,50-73` — edit host (status type, success branch).
- `src/app/businesses/[id]/page.tsx:12-20` — redirect target, verified per-request, no edit.
- `src/lib/api-client.ts` (`apiPost`), `src/app/businesses/new/page.tsx` — reuse, no edits.
- References: `docs/day-3-nextjs.md:317-330`; Next.js version-pinned `dist/docs` linking-and-navigating guide (`useRouter`) — implement stage must read before writing, per `frontend/next/AGENTS.md`.

## Learning objectives and just-in-time concepts

- Client navigation after mutation: `router.push` from `next/navigation` (App Router; `next/router` is the legacy Pages API and must not be used) performs a client-side transition to the fresh route.
- Why no refresh call is needed: the destination fetches live per request, so arrival inherently shows current server state — sync by navigation, not by cache invalidation.

## Ordered implementation steps

1. Confirm clean tree; re-read `NewBusinessForm.tsx`, `[id]/page.tsx:12-20` (read-only).
2. Read the version-pinned Next.js `dist/docs` linking-and-navigating guide before writing.
3. Edit `NewBusinessForm.tsx`: import `useRouter`, instantiate `const router = useRouter()`; on 201 replace `setStatus({success...})` with `router.push(`/businesses/${created.data.id}`)`; trim `SubmitStatus`/success JSX/unused `Link`. Nothing else changes (coercion, guard, failure path untouched).
4. From `frontend/next` (Laravel serving with seeded PG): `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only D3-16-file issues.
5. Live redirect probe (chrome-devtools available): serve production Next on a non-`:3000` port (`npx next` directly); fill + submit the form with a unique probe name; assert the browser URL becomes `/businesses/<uuid>` AND the detail page shows the probe name; assert the PG row; delete the probe via API (`DELETE` → 204) and confirm count restored; close page, stop proof server.
6. `git diff --check` + `git status --short` — expect one edited tracked file.

Rationale: redirect-to-detail is the smallest change satisfying the roadmap test given page-3 placement (your decision); `useRouter` in the existing client shell adds no new files; keeping the failure path untouched preserves D3-15 behavior; no revalidation plumbing needed since the target is per-request.

## Tests and verification commands

From `frontend/next` (+ repo root for git):

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the live redirect probe (URL + detail content + PG row + probe cleanup). Expected: all checks clean; probe visible at its detail URL then removed, counts restored. No checks run in planning; these are expectations, not claims. If Laravel/PG is down, the probe is reported blocked, not faked; tsc/lint still gate.

## Risks, dependencies, unresolved questions

- Stale-redirect risk: none — destination renders per request; even instant post-creation arrival reads the just-committed row.
- Back-button/double-submit: pending guard already covers resubmission; browser back from detail lands on the form in idle state (accepted, no extra handling).
- No open questions — destination decided by you this session.

## Plan check

- Verified paths (status type + success branch lines, `useRouter` absence, target page per-request config, UUID `id` in 201 body, clean tree, free slug) by reads; no code edited.
- Challenged redirect-to-list instead: rejected — row hides on page 3; fails the roadmap test visibly (your decision confirms).
- Challenged keeping the success screen + adding a delayed auto-redirect: rejected — timer-based navigation is janky and harder to verify; immediate push is deterministic.
- Challenged adding `router.refresh()` or revalidation: rejected — target needs no invalidation (per-request by construction).
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-16 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-16-refresh-business-list.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing. Destination decision (detail page over list/inline) was made by the user during `/analize`, carried through plan and check.

Files:

- `frontend/next/src/components/NewBusinessForm.tsx` — sole edit: `useRouter` from `next/navigation` (App Router API per version-pinned `dist/docs` redirecting guide), `router.push(`/businesses/${created.data.id}`)` on 201 replacing the success state; `SubmitStatus` trimmed to idle/pending/error; success JSX + unused `Link` removed; header comment updated; coercion, pending guard, and failure path untouched.
- All other files untouched (list/detail/client/validator/types/Laravel).

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0); `npm run lint` passed (exit 0); `npm run build` passed (Next 16.4.0 Turbopack; route table unchanged). Live redirect probe self-driven via chrome-devtools against production Next on `127.0.0.1:3101` + compose Laravel on `:8000` (40 rows, all services healthy): filled and submitted `D3-16-Probe-1011`, browser URL became `/businesses/01a12c68-f12c-7024-9089-d3a0afad6ff0`, settled detail page showed h1 `D3-16-Probe-1011` + `Hotels · 123 Probe St` + `Reviews (0)` (loading fallback observed mid-transition, as designed); PG row confirmed via detail API; probe deleted via `DELETE` → 204 with count restored to 40. `git diff --check` clean (exit 0; LF notice on the edited file only); `git status --short` shows only `M NewBusinessForm.tsx` + untracked plan. Proof page closed, `:3101` stopped (port confirmed free). No Laravel writes except the probe row (created + deleted), no dependencies; nothing committed.
