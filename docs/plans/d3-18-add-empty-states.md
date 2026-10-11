# Plan — D3-18: Add Empty States

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-18 — Add Empty States
- **Plan path:** `docs/plans/d3-18-add-empty-states.md`

## Desired outcome

Zero-result queries render clear, calm messages: "No businesses found." on the list, "No reviews found." on review-less details, "No analytics available." (+ kept Day-4 note) on `/analytics`. No blank holes, no error styling, no behavior change for non-empty data.

## Scope

### In scope

1. New tracked `src/components/EmptyState.tsx`: presentational `({message}: {message: string})` paragraph in the repo's zinc vocabulary (same classes as `ReviewList`'s empty branch).
2. `BusinessList.tsx`: early return `<EmptyState message="No businesses found." />` on `businesses.length === 0`; list rendering otherwise byte-identical.
3. `ReviewList.tsx`: one-line copy alignment `"No reviews yet."` → `"No reviews found."`; branch logic untouched.
4. `analytics/page.tsx`: render `<EmptyState message="No analytics available." />` above the kept Day-4 note line (copy-only, Day-4-safe).
5. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus three forced-empty UI proofs (below).

### Non-goals

- No loading/error-state changes (D3-08/09 own them — empty branch must not catch failures; `apiGet` still throws through); no filters/pagination UI; no KPI-zero handling (0s are values, not emptiness); no Laravel changes; no dependencies.

## Analysis carried forward

D3-18 (`docs/day-3-nextjs.md:356-373`) needs three empty messages, proven by forced-empty responses. Evidence: list path renders a blank `<ul>` on zero rows; reviews branch exists with off-roadmap copy; analytics stub already communicates unavailability; no shared component; tree clean; slug free.

## Current-state evidence and relevant files

- `src/components/BusinessList.tsx:15-48` — empty-branch host; `ReviewList.tsx:3-10` — copy-alignment host; `src/app/analytics/page.tsx:1-12` — message host.
- New (tracked): `src/components/EmptyState.tsx` — sole new file.
- Reuse, no other edits: zinc text classes, `Business`/`Review` types.
- References: `docs/day-3-nextjs.md:356-373`.

## Learning objectives and just-in-time concepts

- The third UI state: loading (pending), error (failed), empty (succeeded with zero rows) — each renders deliberately; an empty `<ul>` is an accidental fourth state (blank confusion).
- Read-only forcing: `?page=999` yields the real empty envelope through the real code path — proof without fixtures or destruction.

## Ordered implementation steps

1. Confirm clean tree; re-read the three host files (read-only).
2. Create `EmptyState.tsx` per Scope (no `dist/docs` read needed — pure presentational JSX, no Next APIs; `frontend/next/AGENTS.md` rule is vacuous here, noted explicitly).
3. Edit the three hosts per Scope (branch + copy + message; nothing else).
4. From `frontend/next` (Laravel serving): `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only D3-18-file issues.
5. Forced-empty proofs (chrome-devtools available; production Next on non-`:3000` port, `npx next` directly):
   a. Businesses: temporarily point the list fetch at `/api/businesses?page=999`, rebuild, snapshot `/businesses` showing "No businesses found.", then **revert the URL and rebuild** — final tree must not contain the hack.
   b. Reviews: POST a probe business (no reviews) via API, snapshot its detail page showing "No reviews found.", `DELETE` the probe (204) and confirm counts restored.
   c. Analytics: snapshot `/analytics` showing "No analytics available." (static — no forcing needed).
   Close pages, stop proof server.
6. `git diff --check` + `git status --short` — expect one new + three small edited files; grep final tree for `page=999` to prove the hack is gone.

## Tests and verification commands

From `frontend/next` (+ repo root for git):

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the three UI proofs (snapshots quoted in the outcome). Expected: all checks clean; each message observed through its real rendering path; temp hack fully reverted (grep-clean); probe created + deleted with counts restored. No checks run in planning; these are expectations, not claims. If Laravel/PG is down, UI proofs report blocked, not faked; tsc/lint still gate.

## Risks, dependencies, unresolved questions

- Temp-hack residue (`page=999`): mitigated by the mandatory grep + final rebuild; the outcome must quote the grep result.
- Probe-write risk: single POST + DELETE with count assertions before/after (D3-15/16 pattern); never touch seeded rows.
- No open questions.

## Plan check

- Verified paths (list mapping lines, reviews branch lines, analytics stub lines, no existing empty component, clean tree, free slug) by reads; no code edited.
- Challenged putting the branch in `page.tsx` instead of `BusinessList`: rejected — the list component owns list rendering (D3-07 split); the page stays a fetch shell.
- Challenged a richer illustrated empty state (icon/CTA): rejected — unrequested scope; message-only matches the roadmap test.
- Challenged rebuilding `ReviewList`'s branch around the shared component: rejected — keep D3-12's shipped branch intact, copy-align only (smallest diff).
- Challenged leaving analytics untouched: rejected — the roadmap explicitly names the message; a copy-only line honors it without touching Day-4 scope.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-18 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-18-add-empty-states.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/components/EmptyState.tsx` — new presentational `({message})` paragraph in the repo zinc vocabulary; documented as zero-rows-only (failures keep the D3-09 path).
- `frontend/next/src/components/BusinessList.tsx` — early return `<EmptyState message="No businesses found." />` on empty; list rendering otherwise untouched.
- `frontend/next/src/components/ReviewList.tsx` — one-line copy alignment `"No reviews yet."` → `"No reviews found."`; branch logic untouched.
- `frontend/next/src/app/analytics/page.tsx` — renders `<EmptyState message="No analytics available." />` above the kept Day-4 note; Day-4-safe.
- All other files untouched (no loading/error changes, no Laravel changes).

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0, re-run after final rebuild); `npm run lint` passed (exit 0); `npm run build` passed twice (Next 16.4.0 Turbopack; route table unchanged) — once with the temporary `?page=999` forcing edit, once after its revert. Three forced-empty UI proofs self-driven via chrome-devtools against production Next on `127.0.0.1:3101` + compose `:8000`: (a) `/businesses` with temp `?page=999` fetch showed "Showing 0 of 40 businesses" + "No businesses found." through the real code path; (b) created probe business `D3-18-Probe-1011` (POST → 201, no reviews) whose detail page showed "No reviews found." under "Reviews (0)"; (c) `/analytics` showed "No analytics available." above the kept Day-4 note. Probe deleted via `DELETE` → 204 with count restored 41→40. Temp hack reverted immediately after proof (a) and proven gone via `grep page=999 src` (no matches) + final rebuild + `git status` showing only the planned files. `git diff --check` clean (exit 0; LF notices only). Proof pages closed, `:3101` stopped (port confirmed free). No seeded-row writes or deletes (probe only), no migrations, no dependencies; nothing committed.
