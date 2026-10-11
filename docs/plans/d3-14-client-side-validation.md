# Plan — D3-14: Add Client-Side Validation (gate only)

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-14 — Add Client-Side Validation
- **Plan path:** `docs/plans/d3-14-client-side-validation.md`

## Desired outcome

Submitting the business form with invalid input shows inline per-field
errors and sends no network request; valid input calls an `onValid` seam
D3-15 will wire to the real POST. Server rules stay authoritative.

## Scope

### In scope

1. New pure `src/lib/validate-business.ts`: `validateBusinessForm(values)`
   mirroring `StoreBusinessRequest` (required, 255/120/32 bounds, lat/lng
   ranges + numeric, website optional-but-URL, category required) returning
   a field→message map (empty = valid). Zero dependencies.
2. `BusinessForm.tsx` → `'use client'`: `onSubmit` preventDefault +
   `FormData` → validate → inline `role="alert"` errors; valid path calls
   optional `onValid(values)` prop (default no-op).
3. Throwaway node proof script (compiled with repo `tsc`, run, deleted)
   asserting invalid payloads yield errors and a valid payload yields none.

### Non-goals

- No POST/network code (D3-15); no schema library (no new deps);
  no server changes; no success UI; no nav/route changes.

## Analysis carried forward

D3-14 gates submit on the client; D3-15 sends. Evidence: uncontrolled
server form with native attrs only, unwired GET-reloading submit; contract
known; no frontend runner, so the pure validator + node script is the
provable seam; tree clean, slug free.

## Current-state evidence and relevant files

- Edited: `BusinessForm.tsx:1-152` (client conversion + errors).
- New: `src/lib/validate-business.ts`.
- Untouched: `new/page.tsx` (passes no `onValid` yet),
  `StoreBusinessRequest.php` (authority), api-client, segment fallbacks.
- References: `docs/day-3-nextjs.md:283-295`; version-pinned `dist/docs`
  `02-guides/forms.md` validation section (read before writing).

## Learning objectives and just-in-time concepts

- `'use client'` boundary: only the form becomes interactive; the page
  stays a data-fetching Server Component.
- Pure validators: framework-free functions are unit-provable anywhere —
  the same shape check runs pre-submit that Laravel re-runs authoritatively.
- `onValid` seam: D3-14 owns the gate, D3-15 owns the wire; neither task
  churns the other's code.

## Ordered implementation steps

1. Confirm clean tree; re-read form + request rules (read-only).
2. Create `validate-business.ts` (pure, typed, no imports).
3. Convert `BusinessForm`: `'use client'`, error state, submit handler,
   inline errors, `onValid` prop (default no-op); keep markup/styles.
4. Verify: throwaway `tsc`-compiled node asserts (invalid→errors incl.
   bad-url/out-of-range/blank-required; valid→{}; script deleted after);
   `npx tsc --noEmit`, `npm run lint`, `npm run build`;
   live `:3101` markup proof (error structure present);
   `git diff --check`.
   Rationale: hand-rolled avoids a dependency approval for logic mirroring
   nine rules; node script proves gating without browser tooling.

## Tests and verification commands

```powershell
# throwaway, from frontend/next (then deleted)
npx tsc <scratch> --outDir <tmp> --module nodenext ...; node <tmp>/assert.js
# standard
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: script asserts green then removed; all checks clean; diff =
1 new module + form conversion. No checks run in planning.

## Risks, dependencies, unresolved questions

- Client rules can drift from server rules — mitigated by 1:1 mirroring
  + naming; server stays authoritative (D2-31 suite untouched).
- No browser here: submit-click behavior itself isn't clickable-proven;
  the gate logic is, plus markup structure.
- No open questions; zod avoided deliberately (dependency approval).

## Plan check

- Verified form markup, contract rules, no-runner constraint, clean tree,
  free slug; no code edited.
- Challenged zod: rejected — new dependency for nine mirrored rules;
  flagged for review.
- Challenged controlled inputs: rejected — uncontrolled + FormData is less
  churn on the D3-13 markup.
- Challenged proving via browser: impossible here — node-script seam
  accepted as the honest substitute.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-14-client-side-validation.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation. Note: the plan file already existed at `/implement` time (written during `/orchestrator` under the earlier build-mode session), so no verbatim materialization was needed.

Files:

- `frontend/next/src/lib/validate-business.ts` — new pure validator mirroring `StoreBusinessRequest` (required, 255/120/32 bounds, lat/lng numeric + ranges, website optional-but-http(s)-URL, category required); zero imports.
- `frontend/next/src/components/BusinessForm.tsx` — converted to `'use client'`: submit preventDefault + `FormData` → validate → inline `role="alert"` errors; valid path calls optional `onValid(values)` prop (default no-op for D3-15); markup/styles/attributes preserved, plus `noValidate` so native bubbles don't preempt the JS errors.

Verification (exact commands): throwaway `tsc`-compiled node script — 18/18 asserts green (blank-required ×8, optional-website, bad-url, lat 91/lng -181/non-numeric, 256/121/33-char bounds, gate simulation), script + out dir deleted after; `npx tsc --noEmit` clean (exit 0); `npm run lint` clean; `npm run build` passed (Next 16.4.0); live `:3101` markup proof — all fields, live categories, `noValidate=""` on the form; `git diff --check` clean. Temp `.env.local` override restored with final rebuild. Both proof servers stopped. Nothing committed. Honest limitation: submit-click behavior isn't clickable-proven here (no browser) — the gate logic is, plus markup structure.
Note: `:8000`/`:3000` Docker images predate this task — rebuild both before relying on container endpoints for the validated form.
