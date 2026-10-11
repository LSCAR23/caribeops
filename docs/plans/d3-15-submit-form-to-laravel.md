# Plan — D3-15: Submit Form to Laravel

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-15 — Submit Form to Laravel
- **Plan path:** `docs/plans/d3-15-submit-form-to-laravel.md`

## Desired outcome

Valid form data POSTs to `/api/businesses` and creates a row in PostgreSQL. The form shows pending (disabled button), success (confirmation + created name + link to `/businesses`), and failure (generic `role="alert"` message) states. Client validation still gates (no request on invalid input, per D3-14); any Laravel 422 surfaces as failure.

## Scope

### In scope

1. `api-client.ts`: add `apiPost<T>(path, body: unknown, init?)` mirroring `apiGet` (leading-slash normalization, `Accept` + `Content-Type: application/json`, `JSON.stringify(body)`, `!ok` → `ApiError` with POST-correct message, 204/empty → `undefined as T`). Shared tiny internal core with `apiGet` only if it stays readable — otherwise deliberate duplication of ~15 lines (matches existing file style).
2. New tracked `src/components/NewBusinessForm.tsx` (`"use client"`): renders `<BusinessForm categories onValid={submit}>`; `submit` maps string values → payload (`category_id` as-is UUID string, `latitude`/`longitude` via `Number()`, blank `website` → `null`), calls `apiPost<ApiItemResponse<Business>>("/api/businesses", payload)` with pending guard against double-submit, renders success/failure states.
3. `new/page.tsx`: swap `<BusinessForm>` → `<NewBusinessForm>` (categories prop passes through). Only lines 2/24 change.
4. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a live browser-submit probe (below).

### Non-goals

- No redirect/`router.refresh` after creation (D3-16); no 422-per-field mapping (generic failure only); no PUT helpers; no form redesign; no Laravel/CORS/config changes unless the probe forces a return to `/check`; no dependencies.

## Analysis carried forward

D3-15 (`docs/day-3-nextjs.md:299-313`) wires the validated form to `POST /api/businesses`; test is a created PG row. Evidence: `onValid` seam exists but unwired; `apiGet`-only client; POST route returns 201 `{data}` (fits `ApiItemResponse<Business>`); UUID string ids; no `cors.php`; tree clean; slug free. CORS-with-fallback and D3-16 boundary carried as check items.

## Current-state evidence and relevant files

- `src/components/BusinessForm.tsx:42-62` — `onValid` seam, no edit.
- New (tracked): `src/components/NewBusinessForm.tsx` — sole new UI; edited: `src/lib/api-client.ts` (+`apiPost`), `src/app/businesses/new/page.tsx` (2-line swap).
- `src/lib/validate-business.ts`, `src/types/api.ts:14-16`, `src/types/business.ts`, `src/types/category.ts` — reuse sources, no edits.
- `backend/laravel/routes/api.php` (POST 201), `docs/day-3-nextjs.md:299-330` (D3-15 + D3-16 boundary).
- References: Next.js version-pinned `dist/docs` forms guide (implement stage must read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- POST client shape: method + JSON content-type + stringified body, same `!ok` → throw contract as GET so D3-09-style handling transfers.
- String→payload mapping at the boundary: `FormData` yields strings; the submit layer (not the validator, not the API client) owns type coercion and blank→`null`.
- Authoritative server: even post-D3-14, 422 stays a live possibility and is rendered as failure, never swallowed.

## Ordered implementation steps

1. Confirm clean tree; re-read `BusinessForm` seam, `api-client.ts`, `new/page.tsx`, POST route (read-only).
2. Read the version-pinned Next.js `dist/docs` forms guide before writing.
3. Add `apiPost` to `api-client.ts` per Scope; keep `ApiError` untouched.
4. Create `NewBusinessForm.tsx` per Scope (pending/success/failure states; double-submit guard; success shows created `data.name` + link to `/businesses`).
5. Swap the component in `new/page.tsx`.
6. From `frontend/next` (Laravel serving with seeded PG): `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only D3-15-file issues.
7. Live probe: start dev/prod Next on a non-`:3000` port (`npx next` directly; user's `:3000` untouched); submit the browser form with a unique probe name (e.g. `D3-15-Probe-<time>`); assert `201` path via the visible success state **and** the row in PG (read-only query); delete the probe row afterward to restore counts. First submit doubles as the CORS probe: if the browser blocks cross-origin POST, stop, report exact console/network evidence, and return the plan to `/check` for the CORS-fix decision — never silently edit Laravel config.
8. `git diff --check` + `git status --short` — expect one new + two edited tracked files.

Rationale: wrapper component preserves D3-13/14 form purity and uses the seam built for this exact moment; `apiPost` beside `apiGet` honors D3-05's deferred design; message-only success respects the D3-16 boundary; live probe through the real browser path is the only honest proof of a client submit (curl can't exercise React wiring).

## Tests and verification commands

From `frontend/next` (+ repo root for git):

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the live browser-submit probe (success state + PG row + probe cleanup). Expected: all checks clean; probe row created then removed, counts restored. No checks run in planning; these are expectations, not claims. If Laravel/PG is down, build-adjacent checks still gate but the probe is reported blocked, not faked.

## Risks, dependencies, unresolved questions

- CORS verdict unknown until the first real browser submit — handled by the step-7 rule (evidence → `/check`, no silent backend edits).
- Double-submit and empty-body/204 edges covered by guard + client behavior; non-JSON error bodies already truncated by `ApiError`.
- Review-overridable: `apiPost` vs generalized `apiRequest`; wrapper vs in-form submission logic — each a small reshape, rejected as unnecessary unless you prefer otherwise.

## Plan check

- Verified paths (seam lines, client shape, page lines, POST route, UUID ids, no `cors.php`, no test runner, clean tree, free slug) by reads; no code edited.
- Challenged putting POST logic inside `BusinessForm`: rejected — wrapper keeps D3-13/14 artifacts pristine and the diff reviewable.
- Challenged adding 422 field-error mapping: rejected — generic failure satisfies the roadmap test; mapping is unrequested scope for an edge case.
- Challenged proving via curl/scripted POST: rejected — only the browser path exercises the React wiring; scripted POST would prove the backend (already proven in D2-25), not this task.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-15 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-15-submit-form-to-laravel.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/lib/api-client.ts` — added `apiPost<T>(path, body, init?)` beside `apiGet` (method POST, `Accept` + `Content-Type: application/json`, `JSON.stringify`, `!ok` → `ApiError` with POST-correct message, 204/empty → `undefined as T`). `ApiError`/`apiGet` logic untouched (one-word comment fix only). One mid-task file rewrite to repair a bad edit that had orphaned the GET header comment — final content verified by full read; no functional difference.
- `frontend/next/src/components/NewBusinessForm.tsx` — new `"use client"` wrapper: renders `<BusinessForm onValid={submit}>`, coerces strings→payload (UUID `category_id` as-is, `Number()` lat/lng, blank website→`null`), `apiPost<ApiItemResponse<Business>>`, pending double-submit guard + dimming, success (`role="status"` + name + link) / generic failure (`role="alert"`).
- `frontend/next/src/app/businesses/new/page.tsx` — 2-line swap to `<NewBusinessForm>`; server data shell otherwise untouched.
- `BusinessForm.tsx`, validator, types, all Laravel files — untouched. `opencode.json` modification present in tree is the user's own chrome-devtools MCP change — preserved, not mine.

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0); `npm run lint` passed (exit 0); `npm run build` passed (Next 16.4.0 Turbopack; `/businesses/new` ◐ Partial Prerender). Version-pinned `dist/docs` forms guide read before writing (Server-Actions-oriented; our client-`onSubmit` path is consistent with the repo's established D3-05/D3-14 design — noted, no pattern change). Live probe driven by the agent via chrome-devtools against production Next on `127.0.0.1:3101` + compose Laravel on `:8000`: form filled (`D3-15-Probe-1011`, Hotels UUID, valid doubles, blank website), submitted, success state observed (`Business "D3-15-Probe-1011" created successfully`); PG showed total 41 with the probe row correctly mapped (UUID id, Hotels category, null website); probe deleted via `DELETE` → 204, count restored to 40. `git diff --check` clean (exit 0; LF notices only); `git status --short` shows only the 2 edited + plan + new component (+ user's `opencode.json`). Proof page closed, `:3101` stopped (port confirmed free). No Laravel writes except the probe row (created + deleted), no `migrate:fresh`, no dependencies; nothing committed.

Environment findings: (1) CORS verdict — **allowed**, no backend change needed (cross-origin `:3101`→`:8000` POST succeeded; the plan's return-to-check fallback was not triggered). (2) Pre-existing PG was down at session start (refused `:5433`); project's own `docker compose up -d postgres` started it with data intact (3 categories / 40 businesses — no reseed needed). (3) A `docker compose up -d` by the user mid-session failed on `:8000` conflict with the temp artisan serve — serve killed immediately, compose `laravel` restarted by the agent; all four services healthy. (4) User's `:3000` container bakes `NEXT_PUBLIC_API_URL=http://laravel:8000` (compose edit) into the browser bundle → `ERR_NAME_NOT_RESOLVED` on submit there; browser-resolvable value required for browser POSTs — Day-5 URL-split concern, out of scope here; proof ran on `:3101` whose bundle carries `127.0.0.1:8000` (verified by chunk grep).
