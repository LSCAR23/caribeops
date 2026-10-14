# D6-13 — Connect Login to Laravel

**Task:** D6-13 — Connect Login to Laravel
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-13-connect-login-to-laravel.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-12 precedent in `MEMORY.md`.

**Desired outcome:** A valid login transitions the user to the authenticated area (`/`). Client-side API calls carry the Bearer token automatically; an authenticated business creation returns 201 (previously 401).
**Scope:** New `src/lib/auth.ts` (token key + get/set/clear + `authHeaders()`, `window`-guarded) + `api-client` auto-attaches Bearer on the client only + `LoginForm` uses the lib and redirects to `/` on success + browser task test.
**Non-goals:** No route protection (D6-14), no logout UI (D6-15), no `/me` consumption, no `analytics-client` change (Go endpoints are public), no backend changes, no component tests (D6-25), no new dependencies, no commit.

## Analysis carried forward

D6-12 left the form without transition: `LoginForm` stores `caribeops_token` and shows success but never redirects; `apiGet`/`apiPost` send no auth header, so `NewBusinessForm` still 401s when logged out (the D6-05-known gap D6-13 closes). `init` pass-through with header spread means explicit headers still win. Server components have no `window`, so auto-attach cannot leak tokens into server fetches (consistent with public GETs). Storage adopts `localStorage` (D6-12 provisional → confirmed); HttpOnly-cookie XSS hardening would need backend work — out of scope.

## Current-state evidence

- `frontend/next/src/components/LoginForm.tsx` (D6-12) — idle/pending/error/success, `apiPost<{ token: string }>('/api/login')`, direct `localStorage.setItem`, no `router`
- `frontend/next/src/lib/api-client.ts:21-84` — header merge `{ Accept..., ...init?.headers }`, no auth
- `frontend/next/src/components/NewBusinessForm.tsx:36-49` — bare `apiPost('/api/businesses', payload)`
- `backend/laravel/routes/api.php` (D6-02/05) — login 200 `{token}` / 422 uniform; writes `auth:sanctum`

## Learning objectives and just-in-time concepts

Bearer consumption at the client layer: one guarded helper plus one merge point means every island automatically speaks the auth contract without per-call wiring, while server rendering stays anonymous. Redirect-on-success is the visible "transition to the authenticated area".

## Ordered implementation steps

1. `src/lib/auth.ts`: `TOKEN_KEY = 'caribeops_token'`, `getToken()/setToken()/clearToken()` guarded by `typeof window === 'undefined'`, `authHeaders(): Record<string, string>` (empty without token). Rationale: single ownership of the mechanism D6-12 left provisional.
2. `api-client.ts`: merge `...authHeaders()` into `apiGet`/`apiPost` headers before `...init?.headers`. Rationale: central adoption; explicit per-call headers still override; server-side calls unchanged (no `window`).
3. `LoginForm`: `setToken(result.token)` via lib; on success `router.push('/')` (keep success state as fallback). Rationale: the spec's transition; `useRouter` already the project's navigation idiom.
4. `npx tsc --noEmit` + scoped `npx eslint`; `git diff --check`.
5. Browser task test (`artisan serve :8000` + `next dev :3101`, temp admin user created/deleted): login → lands on `/`; `/businesses/new` submit → 201 + detail page (was 401); invalid credentials still show the generic error; reload keeps the session usable for writes.

## Tests and verification commands, plus expected results

- Type/lint zero errors; login redirects to dashboard; authenticated creation 201; invalid still generic error; exactly 4 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- `apiPost('/api/login')` will attach a stale token if one exists; the route is public so the header is ignored — accepted.
- `localStorage` XSS-readability accepted per backend Bearer design; revisit only with backend cookie support.
- No `tsc` npm script — invoke `npx tsc --noEmit` directly (D6-12 precedent).

## Plan check

- Confirmed `lib/auth.ts` path free, header-merge order preserves explicit overrides, no-`window` server safety, public Go client untouched, redirect target matches Dashboard nav; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `frontend/next/src/lib/auth.ts` (token key + `window`-guarded get/set/clear + `authHeaders()`) + `frontend/next/src/lib/api-client.ts` (`...authHeaders()` merged before `...init?.headers` in `apiGet`/`apiPost`; explicit headers still win; server calls unaffected) + `frontend/next/src/components/LoginForm.tsx` (`setToken` via lib, success → `router.push('/')`); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `npx tsc --noEmit` → exit 0 (one self-caught `?? null` fix on optional-chained `getItem` before final green); scoped `npx eslint` on 3 files → exit 0.
- Browser task test (`serve :8000` + `dev :3101`, temp admin user + tokens/business removed after, counts back to 0): valid login → redirected to `/` with 50-char token; `/businesses/new` submit → detail page `businesses/01a13bec-…` (201, was 401) with `biz_owner=4 creator=4` in dev DB; wrong password in fresh context → stays on `/login`, exact generic alert, token null.
- Dashboard rendered with Laravel card live (Go KPIs showed the designed per-section fallback — analytics container down, unrelated).
- `git diff --check` clean; `git status --short` → auth lib + client + form edits (+ plan file).
