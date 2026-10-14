# D6-12 — Create Login Page

**Task:** D6-12 — Create Login Page
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-12-create-login-page.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-11 precedent in `MEMORY.md`.

**Desired outcome:** `/login` renders an email+password form; invalid credentials produce a visible generic error without leaking details; valid credentials persist the token and show a success state (no redirect — D6-13).
**Scope:** `src/app/login/page.tsx` (static server page, no fetch) + `src/components/LoginForm.tsx` (client island: idle/pending/error/success, `apiPost('/api/login')`, 422 → generic message, 200 → `localStorage` + success) + Login link in `Navigation`.
**Non-goals:** No redirect after login (D6-13), no route protection (D6-14), no logout UI (D6-15), no backend error-body rendering, no component tests (D6-25), no new dependencies, no commit.

## Analysis carried forward

No `/login` route existed (`src/app/` holds `analytics/`, `api/`, `businesses/`, `page.tsx`). Reused patterns verified against source: server page + client island (`new/page.tsx` + `NewBusinessForm.tsx` with `idle/pending/error` states and `<p role="alert">`), `apiPost<T>` (base-URL join, JSON, `!ok → ApiError(status)`), `apiBaseUrl` from `NEXT_PUBLIC_API_URL` (browser-reachable default `http://localhost:8000`), backend `POST /api/login` returning 200 `{token}` or uniform 422 (no enumeration oracle — safe to answer all failures with one generic line). Token persistence (localStorage vs cookie) stays a D6-13 decision; D6-12 stores under `caribeops_token` provisionally and D6-13 adopts or revises it.

## Current-state evidence

- `frontend/next/src/app/` — `analytics/`, `api/`, `businesses/`, `favicon.ico`, `globals.css`, `layout.tsx`, `page.tsx` (no `login/`)
- `frontend/next/src/components/NewBusinessForm.tsx:1-65` — `"use client"` island, `SubmitStatus` union, pending guard, `apiPost`, `router.push` on 201, generic `<p role="alert">` on error
- `frontend/next/src/lib/api-client.ts:55-84` — `apiPost` contract used as-is
- `frontend/next/src/lib/api-config.ts:1-6` — `NEXT_PUBLIC_API_URL` convention
- `frontend/next/src/components/Navigation.tsx:1-33` — `links` array (`/`, `/businesses`, `/analytics`), no Login entry
- `backend/laravel/routes/api.php:16-28` (D6-02) — login contract 200 `{token}` / 422 uniform
- `frontend/next/AGENTS.md` + `node_modules/next/dist/docs/01-app/02-guides/authentication.md` — guide read; project keeps client-fetch (no Server Actions), matching existing islands

## Learning objectives and just-in-time concepts

Failure UX without disclosure: one generic "Invalid email or password." line for every server rejection (the backend deliberately makes unknown-email and wrong-password identical, so the UI must not re-split them by rendering bodies or statuses). Submit-state machine (`idle → pending → error|success`) prevents double submits and gives screen readers the `role="alert"` signal, exactly as `NewBusinessForm` does.

## Ordered implementation steps

1. Read the applicable Next guide in `node_modules/next/dist/docs/` (done at plan: `01-app/02-guides/authentication.md`; project keeps client-fetch islands, no Server Actions).
2. `src/components/LoginForm.tsx`: `"use client"` island with email/password `useState`, `SubmitStatus` (`idle|pending|error|success`), pending guard, `apiPost<{ token: string }>('/api/login', { email, password })`; `catch` → generic error state (never render `ApiError.body`); success → `localStorage.setItem('caribeops_token', token)` (comment-marked provisional for D6-13) + success notice. Rationale: mirrors `NewBusinessForm` seam; token handoff unblocks D6-13.
3. `src/app/login/page.tsx`: static server page (title + description + `<LoginForm />`), no `connection()`, no data fetch. Rationale: nothing server-rendered is needed; build stays Laravel-independent.
4. `Navigation.tsx`: append `{ href: '/login', label: 'Login' }` to `links`. Rationale: discoverability for the spec's manual task test; one line, existing style.
5. `npx tsc --noEmit` + `npm run lint` in `frontend/next`; `git diff --check`.
6. Task test with dev server + Laravel up: wrong password → visible error, no token stored; valid credentials → success + token present; reload resets to idle. Rebuilt `next` image only if verifying inside compose (no bind mount — D5-11 rule).

## Tests and verification commands, plus expected results

- Type/lint zero errors; invalid login shows the generic alert and stores nothing; valid login shows success and stores the token; exactly 3 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- `localStorage` mechanism is D6-13-revisable; key `caribeops_token` documented in code for that handoff.
- Dev-browser API target relies on `NEXT_PUBLIC_API_URL` (localhost default); compose-internal `laravel:8000` is not browser-resolvable — same constraint `NewBusinessForm` already lives with.
- No `tsc` npm script exists (`dev/build/start/lint` only) — invoke `npx tsc --noEmit` directly.

## Plan check

- Confirmed free `login/` route, island pattern, `apiPost`/`api-config` contracts, uniform-422 backend, and `Navigation` shape against source; redirect/storage-boundary split against D6-13/D6-14 scope; slug free; `git` clean.
- Revision vs draft: fixed static (fetch-free) page, generic-copy-never-body rule, provisional-storage marking, compose-rebuild note.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `frontend/next/src/components/LoginForm.tsx` (`"use client"` island, idle/pending/error/success, `apiPost('/api/login')`, generic `role="alert"` error, success persists `caribeops_token` to `localStorage`) + new `frontend/next/src/app/login/page.tsx` (static server page, no fetch) + `frontend/next/src/components/Navigation.tsx` (Login link appended); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `npx tsc --noEmit` in `frontend/next` → exit 0.
- `npx eslint` on the 3 touched files → exit 0 (`npm run lint` bare takes no file args; first invocation passed `--max-warnings 0` by mistake and failed on pattern parsing, not on code — rerun scoped was clean).
- Browser task test (`artisan serve :8000` + `next dev :3101`, temp `d6-12-probe@example.com` user, removed after): wrong password → `role=alert` shows exactly `Invalid email or password.`, `localStorage` token null; valid credentials → `Logged in successfully.`, token length 50. Servers stopped after (kill by port PID); probe user + tokens deleted (count back to 0).
- `git diff --check` clean; `git status --short` → nav edit + login page + form island (+ plan file).
