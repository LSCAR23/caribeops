# D6-14 — Protect Dashboard Routes

**Task:** D6-14 — Protect Dashboard Routes
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-14-protect-dashboard-routes.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-13 precedent in `MEMORY.md`.

**Desired outcome:** Unauthenticated users cannot access protected pages: anonymous on any page other than `/login` lands on `/login`; authenticated users on `/login` land on `/`.
**Scope:** New `src/components/RequireAuth.tsx` (`"use client"` gate: `getToken()` + `usePathname` + `router.replace`, renders null) mounted once in `RootLayout` + browser task test.
**Non-goals:** No `returnTo` preservation, no nav changes, no logout UI (D6-15), no backend changes, no component tests (D6-25), no new dependencies, no commit.

## Analysis carried forward

The app was 100% public in the browser: `/`, `/businesses`, `/businesses/new`, `/businesses/[id]`, `/analytics`, `/login` with no guard (D6-12/13 added only the page, the token, and the post-login redirect). `RootLayout` is a server component and the token lives in `localStorage` (client-only), so the server cannot protect — the gate must be an optimistic client check, which is exactly the roadmap learning ("improves UX, but server-side authorization remains authoritative", already enforced via sanctum + policy). One layout-mounted gate covers present and future routes with no per-route list to maintain.

## Current-state evidence

- `frontend/next/src/app/layout.tsx:21-32` — server `RootLayout` rendering `<Navigation />` + `{children}`
- `frontend/next/src/lib/auth.ts` (D6-13) — `window`-guarded `getToken()`
- `frontend/next/src/components/LoginForm.tsx` (D6-13) — success redirects to `/`; nothing redirects anonymous users to `/login`

## Learning objectives and just-in-time concepts

Optimistic client gate: `usePathname` + `router.replace` in a null-rendering island mounted once in the layout. `replace` keeps history clean; a brief flash of protected content is accepted because real security lives in the API.

## Ordered implementation steps

1. `src/components/RequireAuth.tsx`: `"use client"` island; on mount and route change, if `!getToken()` and `pathname !== '/login'` → `replace('/login')`; if `getToken()` and `pathname === '/login'` → `replace('/')`; renders null. Rationale: single control point, no route list.
2. `layout.tsx`: render `<RequireAuth />` alongside `Navigation`. Rationale: total present-and-future coverage in one line; layout stays a server component.
3. `npx tsc --noEmit` + scoped `npx eslint`; `git diff --check`.
4. Browser task test (`serve :8000` + `dev :3101`, isolated tokenless context): `/`, `/businesses/new`, `/analytics` → `/login`; valid login → `/`; reloaded `/login` while authenticated → `/`; invalid login stays on `/login` with the generic error (D6-12 regression).

## Tests and verification commands, plus expected results

- Type/lint zero errors; anonymous always ends on `/login`; authenticated never sees `/login`; exactly 3 paths changed (+ plan file).

## Risks, dependencies, and unresolved questions

- Brief protected-content flash before the client redirect — accepted per the roadmap learning.
- No `returnTo` query — deliberate; D6-13 redirects fixed to `/`.
- `src/app/api/*` are route handlers, not pages — the gate does not interfere.

## Plan check

- Confirmed a server layout may render a client child without becoming client; `usePathname` requires `"use client"` (included); `replace` keeps history clean; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** new `frontend/next/src/components/RequireAuth.tsx` (`"use client"` optimistic gate: tokenless non-`/login` → `replace('/login')`, authed `/login` → `replace('/')`, renders null) + `frontend/next/src/app/layout.tsx` (mounts `<RequireAuth />`; stays a server component); plan file materialized at this path verbatim from the checked inline deliverable — no scope change.

**Verification (exact commands/results — the spec's test):**
- `npx tsc --noEmit` → exit 0; scoped `npx eslint` on 2 files → exit 0.
- Browser task test (`serve :8000` + `dev :3101`, isolated tokenless context, temp admin user removed after with count back to 0): `/`, `/businesses/new`, `/analytics` → all land on `/login`; valid login → `/`; reloaded `/login` while authenticated → `/`; wrong password in fresh context → stays on `/login` with the exact generic alert and null token.
- Server log shows all navigated pages HTTP 200 (gate is client-side by design; Go `ECONNREFUSED` fallbacks in the log are the down analytics container, unrelated).
- `git diff --check` clean; `git status --short` → layout edit + gate island (+ plan file).
