# Plan — D3-05: Create Reusable API Client

- **Date:** 2026-10-10
- **Status:** `Implemented — verified`
- **Task:** D3-05 — Create Reusable API Client
- **Plan path:** `docs/plans/d3-05-create-api-client.md`

## Desired outcome

One `src/lib/api-client.ts` exports a generic `apiGet<T>(path, init?)` that joins `apiBaseUrl` + path, sends JSON `Accept` headers, throws a typed `ApiError` (with `status`) on `!res.ok`, and returns parsed JSON. Proof: a call to `/api/health` resolves `{status: "ok"}` through the client. D3-06+ import it; no page or UI changes in this task.

## Scope

### In scope

1. New tracked `frontend/next/src/lib/api-client.ts`: `ApiError` class (`status: number`, message, optional body snippet) + `apiGet<T>(path: string, init?: RequestInit): Promise<T>` (leading-slash normalization, `Accept: application/json`, `!res.ok` → throw, empty-body/204 → `undefined as T`).
2. Reuse D3-04 `apiBaseUrl` import; no new env vars.
3. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a live health proof (below).

### Non-goals

- No POST/PUT/DELETE helpers (D3-13/15 own them; `init` passthrough keeps the door open without building them).
- No retries, timeouts, caching directives, auth headers, or response caching policy (no roadmap basis; D3-08/Day-6 scope).
- No UI consumption (D3-06), no `Business`-typed helpers yet, no test-runner installation, no Laravel/compose changes, no dependencies.

## Analysis carried forward

D3-05 (`docs/day-3-nextjs.md:99-118`) needs a thin `fetch` wrapper owning base URL, JSON handling, and error behavior, proven against `GET /api/health`. Evidence: zero networking code in `src/`; `api-config.ts:1-6` supplies the base URL; `routes/api.php:8-12` guarantees `{"status":"ok"}`; no frontend test runner exists; tree clean; `d3-05-*` slug free. Laravel-up-at-implement-time and no-over-building carried as check items.

## Current-state evidence and relevant files

- `frontend/next/src/lib/api-config.ts:1-6` — import source for the base URL, no edit.
- New (tracked): `frontend/next/src/lib/api-client.ts` — sole code change.
- `backend/laravel/routes/api.php:8-12` — proof target, no edit.
- Untouched: `.env.local`, `.env.example`, `src/types/business.ts`, all pages/components, all Laravel files.
- References: `docs/day-3-nextjs.md:99-118`; Next.js version-pinned `dist/docs` fetching-data guide (implement stage must re-read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Why `fetch` needs a wrapper: it resolves (not rejects) on 4xx/5xx, so `!res.ok` → throw is the entire "basic error behavior"; callers then use normal `try/catch` (which D3-09 turns into UI states).
- Generics as reuse: `apiGet<{status: string}>("/api/health")` today, `apiGet<Business...>(...)` later — one function, caller-declared shapes.

## Ordered implementation steps

1. Confirm clean tree; re-read `api-config.ts`, `routes/api.php:8-12`, `tsconfig.json` strictness (read-only).
2. Re-read the version-pinned Next.js `dist/docs` fetching-data guide before writing (per `frontend/next/AGENTS.md`).
3. Create `src/lib/api-client.ts` (~30 lines): `ApiError extends Error` with `status`; `apiGet<T>` normalizing the leading slash, calling `fetch(apiBaseUrl + path, { ...init, headers: { Accept: "application/json", ...init?.headers } })`, throwing `ApiError` on `!res.ok` (message includes method + path + status; body text truncated to ~200 chars when available), returning `undefined as T` on 204/empty body, else `await res.json() as T`. No other exports, no `console` logging.
4. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only client-file issues.
5. Live health proof (requires Laravel on `:8000` — start via the user's normal `serve`/compose path, never `migrate:fresh`): temporary route `src/app/api/health-proof/route.ts` (no underscore prefix — `__`-prefixed segments are private folders, per the D3-04 incident) returning `await apiGet<{status: string}>("/api/health")` as JSON; serve production or dev on a non-`:3000` port (the user's `:3000` dev server must not be disturbed; `npx next` directly — `npm run dev -- --port` mangles flags on this host); curl and expect `{"status":"ok"}`; stop server, delete the temp route, final `npm run build` to confirm the tree without it.
6. `git diff --check` + `git status --short` — expect one tracked new file; no leftover temp route.

Rationale: one generic GET function is the smallest construct satisfying "centralize base URL + JSON + errors" while staying usable for D3-06/11/15 via `init`; throwing (not null-returning) preserves D3-09 error-state semantics; default cache policy avoids preempting D3-06/08.

## Tests and verification commands

From `frontend/next`:

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the live `/api/health` proof above (expects `{status: "ok"}` through the client). Expected: all checks clean; proof route removed afterward with a final clean build. No checks run in planning; these are expectations, not claims. If Laravel is down at implement time, the live proof is reported as not-run (with the exact attempted command) rather than faked; tsc/lint/build still gate the task.

## Risks, dependencies, unresolved questions

- Laravel-down case: proof degrades to not-run; the client is still verifiable by typecheck/lint/build. Never seed, migrate, or mutate Laravel for this task.
- Body-read edge: error bodies may be empty/non-JSON — read as text defensively, truncate, never let error-reporting itself throw.
- `type` keyword, generics syntax, and `RequestInit` merging are standard TS — no collision issues.
- Open review point: `api-client.ts`/`apiGet` naming — one-line change if you prefer `api.ts`/`client`.

## Plan check

- Verified paths (no existing client/fetch usage, `api-config.ts` contents, health route shape, no test runner, clean tree, free slug) by reads; no code edited.
- Challenged adding `apiPost/apiPut` now: rejected — `init` passthrough already enables them; helpers belong to D3-13/15 with real call sites.
- Challenged adding retry/timeout/`no-store`/auth: rejected — no requirement; each preempts a later task's decision.
- Challenged proving via a committed test page or a new test runner: rejected — temp route (removed) matches the D3-04 proof pattern; installing a runner is out of scope.
- Challenged swallowing errors vs throwing: throwing enforced — D3-09 depends on it.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-05 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-05-create-api-client.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-10 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/lib/api-client.ts` — new tracked file, sole code change: `ApiError extends Error` (`status: number`, optional truncated body) + `apiGet<T>(path, init?)` (leading-slash normalization, `apiBaseUrl` join, `Accept: application/json` with caller-header override, `!res.ok` → throw with method + path + status, 204/empty body → `undefined as T`, else parsed JSON). No POST helpers, no retry/timeout/cache/auth, no logging.
- Temporary `/api/health-proof` verification route created for the live proof and fully removed afterward (no `src/app/api/` remains).
- `api-config.ts`, `.env.local`, `business.ts`, all pages/components, all Laravel files — untouched.

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0); `npm run lint` passed (exit 0); `npm run build` passed twice (Next 16.4.0 Turbopack; final route table `○ /`, `○ /analytics`, `○ /businesses`, `○ /_not-found` with no proof route); live health proof — Laravel already serving on `:8000` (`/api/health` → `{"status":"ok"}` direct), then through the client via real `next start` on `127.0.0.1:3101` the temp route returned `{"status":"ok"}`; proof server stopped afterward; `git diff --check` clean (exit 0); `git status --short` shows only `docs/plans/d3-05-create-api-client.md` + `frontend/next/src/lib/api-client.ts` untracked. Version-pinned `dist/docs` fetching-data guide held in context from the D3-03/D3-04 reads (same Next 16.4.0, no doc change). No Laravel writes, no `migrate:fresh`, no dependencies added; nothing committed.
