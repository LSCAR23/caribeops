# Plan — D3-04: Configure API Base URL

- **Date:** 2026-10-10
- **Status:** `Implemented — verified`
- **Task:** D3-04 — Configure API Base URL
- **Plan path:** `docs/plans/d3-04-configure-api-base-url.md`

## Desired outcome

Dev API target comes from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`), read through one typed constant. Changing `.env.local` and restarting dev changes the resolved target. No hardcoded URLs added; D3-05 can import the constant directly.

## Scope

### In scope

1. New untracked `frontend/next/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000` (copied from `.env.example`; no trailing slash).
2. New tracked `frontend/next/src/lib/api-config.ts` exporting one constant, e.g. `export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")` — env read + fallback + slash normalization only.
3. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`, plus a restart-based value-change proof (below).

### Non-goals

- No fetch wrapper, JSON handling, or error behavior (D3-05); no list/detail UI (D3-06+); no `.env.example` rename; no `NEXT_PUBLIC_ANALYTICS_URL` changes; no compose wiring (Day-5); no Laravel changes; no dependencies.

## Analysis carried forward

D3-04 (`docs/day-3-nextjs.md:83-96`) needs an env var for the Laravel base URL so the frontend stops depending on hardcoded hosts. Evidence: `.env.example:6-8` already contracts `NEXT_PUBLIC_API_URL=http://localhost:8000`; no `.env.local` exists; nothing reads `process.env` yet; `.gitignore:34-35` keeps local env untracked; compose confirms Laravel on `:8000`; tree clean; `d3-04-*` slug free. Restart-required inlining and trailing-slash normalization carried as check items.

## Current-state evidence and relevant files

- `frontend/next/.env.example:1-8` — contract source, no edit.
- New (untracked, by design): `frontend/next/.env.local` — local value only.
- New (tracked): `frontend/next/src/lib/api-config.ts` — sole code change.
- Untouched: `next.config.ts`, `.env.example`, `docker-compose.yml`, `src/types/business.ts`, all Laravel files.
- References: `docs/day-3-nextjs.md:83-96`; Next.js version-pinned `dist/docs` environment-variables guide (implement stage must read before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- `NEXT_PUBLIC_` vs server-only vars; `.env.local` precedence and why it stays untracked; build-time inlining ⇒ restart after change; centralizing the base URL in one constant so D3-05+ never hardcode hosts.

## Ordered implementation steps

1. Confirm clean tree; re-read `.env.example`, `.gitignore` env block, `tsconfig.json` `@/*` paths (read-only).
2. Read the version-pinned Next.js `dist/docs` environment-variables guide before writing (per `frontend/next/AGENTS.md`).
3. Create `frontend/next/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8000` (document no-trailing-slash).
4. Create `src/lib/api-config.ts` with the single `apiBaseUrl` constant (fallback + trailing-slash strip, with a comment stating the convention). No fetch, no other exports.
5. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only config-file issues.
6. Value-change proof: start dev, observe resolved `apiBaseUrl` (`http://localhost:8000`); stop, set `.env.local` to `http://localhost:9999`, restart, observe `http://localhost:9999`; restore `8000`, restart. (Temporary log line for observation only, removed afterward — or DevTools inspection of the imported constant.)
7. `git diff --check` + `git status --short` — expect one tracked new file; `.env.local` intentionally absent from git output.

Rationale: reuses the established `.env.example` name (least churn); one constant is the minimal observable proof of "API target changes" without stealing D3-05; fallback keeps dev working if the var is unset; slash-strip prevents `//api` bugs downstream.

## Tests and verification commands

From `frontend/next`:

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the manual restart-based value-change proof above. Expected: all three checks clean; build route table unchanged (`/`, `/businesses`, `/analytics`); diff = 1 tracked file; `.env.local` untracked by design. No checks run in planning; these are expectations, not claims. No automated network test — D3-05 owns the first fetch.

## Risks, dependencies, unresolved questions

- Inlining gotcha: value changes need dev restart/rebuild — documented in the proof step; not a bug.
- If Laravel ever moves ports, only `.env.local` changes; the constant needs no edit.
- Variable-name override available at review: `NEXT_PUBLIC_LARAVEL_API_URL` is more explicit but orphans the existing `.env.example` + analytics naming — rejected as churn unless you prefer it (one-line change if so).

## Plan check

- Verified paths (`.env.example` entries, missing `.env.local`, gitignore env block, no existing `process.env` readers, no `src/lib/`, clean tree, free slug) by reads; no code edited.
- Challenged adding a full config module/multiple exports: rejected — one constant is the smallest verifiable increment.
- Challenged putting the reader in `src/config/` vs `src/lib/`: `src/lib/` matches Next.js docs placeholder convention (`@/lib/...`) and the likely D3-05 client home — accepted, flagged as relocatable.
- Challenged editing `.env.example` (comments/rename): rejected — contract already correct; untouched.
- Challenged verification strength: tsc/lint/build + manual restart proof is proportionate; no backend/PG interaction exists at this stage.
- Status set to `Checked — awaiting user approval`. Active user correction noted for `/implement`: `MEMORY.md` will be **replaced** with D3-04 content, not appended.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-04-configure-api-base-url.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-10 per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/.env.local` — new, untracked by design (`.gitignore` covers `.env*`): `NEXT_PUBLIC_API_URL=http://localhost:8000` with no-trailing-slash comment. Restored to `8000` after the value-change proof.
- `frontend/next/src/lib/api-config.ts` — new tracked file, sole code change: `export const apiBaseUrl: string` reading `process.env.NEXT_PUBLIC_API_URL` with `http://localhost:8000` fallback and trailing-slash strip; no fetch/JSON/error logic.
- `.env.example`, `next.config.ts`, `docker-compose.yml`, `src/types/business.ts`, all Laravel files — untouched. Temporary `/api/env-proof` verification route created for the proof and fully removed afterward (no `src/app/api/` remains).

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0; one transient failure mid-task from a stale `.next/types` artifact referencing the just-deleted temp route — resolved by the rebuild, re-run clean); `npm run lint` passed (exit 0); `npm run build` passed (Next 16.4.0 Turbopack; final route table `○ /`, `○ /analytics`, `○ /businesses`, `○ /_not-found`); value-change proof through real `next start` servers on `127.0.0.1:3101` returned `{"apiBaseUrl":"http://localhost:8000"}`, then after setting `.env.local` to `http://localhost:9999` + rebuild returned `{"apiBaseUrl":"http://localhost:9999"}`, then restored to `8000`; `git diff --check` clean (exit 0); `git status --short` shows only `docs/plans/d3-04-configure-api-base-url.md` + `frontend/next/src/lib/` untracked. Read version-pinned `dist/docs` environment-variables guide before writing, per `frontend/next/AGENTS.md`. Proof servers on `:3101` stopped after verification; the user's existing `:3000` dev server (PID 27572) was never touched. Incidents: `npm run dev -- --port` arg forwarding mangled flags on this host (use `npx next` directly); temp route first created under `__env-proof` 404'd because underscore-prefixed segments are private folders — renamed to `env-proof`. No dependencies added; nothing committed.
