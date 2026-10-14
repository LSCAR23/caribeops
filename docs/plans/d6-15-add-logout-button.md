# D6-15 — Add Logout Button

**Task:** D6-15 — Add Logout Button
**Date:** 2026-10-14
**Status:** `Checked — awaiting user approval`
**Plan path (to materialize at implement):** `docs/plans/d6-15-add-logout-button.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-14 precedent in `MEMORY.md`.

**Desired outcome:** Clicking Logout revokes the server token, clears the client token, and lands on `/login` — a predictable auth lifecycle.
**Scope:** New `src/components/LogoutButton.tsx` (`"use client"` token-gated island: `apiPost('/api/logout')` in `try`, `clearToken()` + `push('/login')` in `finally`, pending state) mounted in `Navigation` + browser task test.
**Non-goals:** No hiding of the Login link, no extra protection (D6-14 done), no backend changes, no component tests (D6-25), no new dependencies, no commit.

## Analysis carried forward

Backend `POST /api/logout` is proven (D6-03: `auth:sanctum` → deletes `currentAccessToken()` → 204; revoked reuse → 401; 4 backend cases). The frontend had no visible way out: `Navigation` is a server component with 4 fixed links, the token lives client-side, and `lib/auth.ts` already exposes `getToken()`/`clearToken()`. `apiPost` resolves 204-empty to `undefined`, so no client change is needed for the call itself.

## Current-state evidence

- `backend/laravel/routes/api.php:30-34` (D6-03) — logout contract 204 / 401-reuse
- `frontend/next/src/components/Navigation.tsx` (D6-12/14) — server nav, fixed `links`, renders client children fine (`RequireAuth` precedent)
- `frontend/next/src/lib/auth.ts` (D6-13) — `getToken()`/`clearToken()` ready
- `frontend/next/src/lib/api-client.ts` (D6-13) — Bearer auto-attached, so the call is authenticated with no extra wiring

## Learning objectives and just-in-time concepts

Best-effort revocation + guaranteed local cleanup (`try/finally`): even with a dead token the client always ends tokenless on `/login`. Token-gated rendering (null without token) keeps the server-rendered nav honest without making it client.

## Ordered implementation steps

1. `src/components/LogoutButton.tsx`: `"use client"` island; `authed` state from `getToken()` on mount (re-checked on click); null when anonymous; click → pending, `try { await apiPost('/api/logout', {}) } finally { clearToken(); router.push('/login') }`. Rationale: predictable lifecycle even with an expired token.
2. `Navigation.tsx`: render `<LogoutButton />` inside `<nav>`. Rationale: visible on every page with one line; nav stays server.
3. `npx tsc --noEmit` + scoped `npx eslint`; `git diff --check`.
4. Browser task test (`serve :8000` + `dev :3101`, temp admin user + tokens removed after): login → Logout visible; click → `/login` + null token; old token reused via API → 401 (real revocation); anonymous sees no button.

## Tests and verification commands, plus expected results

- Type/lint zero errors; logout → `/login` tokenless; stale token 401; anonymous clean; exactly 3 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- `push` (not `replace`) leaves the authed page in history, but back-navigation re-hits the gate → `/login` anyway.
- Login link stays visible when authed — accepted; gate already neutralizes it.

## Plan check

- Confirmed 204-empty handling, `finally` coverage for dead tokens, server-nav + client-child precedent, and scope against D6-14/15 split; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.
