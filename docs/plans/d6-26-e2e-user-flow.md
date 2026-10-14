# D6-26 — Add One End-to-End User Flow

**Task:** D6-26 — Add One End-to-End User Flow
**Date:** 2026-10-14
**Status:** `Implemented — verified`
**Plan path (to materialize at implement):** `docs/plans/d6-26-e2e-user-flow.md`

> Note: orchestrated in a Plan-mode session blocked from writing `docs/plans/`, so this checked inline deliverable is materialized verbatim before implementation (no scope change), following the D6-08…D6-25 precedent in `MEMORY.md`.

**Desired outcome:** `npm run test:e2e` runs Login → dashboard → businesses → business details green against the dev environment.
**Scope:** `@playwright/test` devDep + `playwright.config.ts` (chromium, env `baseURL`, no `webServer`) + `e2e/auth-flow.spec.ts` (4 expects, env credentials) + `test:e2e` script + documented one-liner account provisioning.
**Non-goals:** No writes in the flow, no seeded e2e user in seeders, no firefox/webkit, no CI wiring (D6-27), no commit.

## Analysis carried forward

Zero e2e harness exists. The flow was proven manually 4× via browser tooling (D6-12…15): login form shape, `/` redirect, business list, `/businesses/:uuid` detail. Reads after login mutate nothing. No register endpoint exists, so the account comes from the environment (tinker one-liner), never hardcoded.

## Current-state evidence

- `frontend/next/package.json` — scripts `dev/build/start/lint/test`, no e2e (verified D6-25)
- `frontend/next/src/app/login/page.tsx` + `LoginForm.tsx`, `Navigation.tsx` with Login link (verified D6-12/15)

## Learning objectives and just-in-time concepts

Browser e2e proves services + UI layers together; `baseURL` per env; role/text selectors shared with unit tests.

## Ordered implementation steps

1. `npm i -D @playwright/test` (record version) + `npx playwright install chromium` (deps flag only if the OS demands).
2. `playwright.config.ts`: `testDir ./e2e`, chromium project, `baseURL` from `E2E_BASE_URL` (default `http://127.0.0.1:3101`), `retries 0`, `*.spec.ts` only. Rationale: env-explicit like the D6-12…15 manual runs, no hidden servers.
3. `e2e/auth-flow.spec.ts`: `/login` fill + submit → URL `/` → Businesses nav → list shows a name → first business → detail heading + reviews section; credentials from `E2E_EMAIL`/`E2E_PASSWORD` with an explicit fail when missing. Rationale: the spec's four steps, read-only.
4. Provision once via tinker (viewer suffices — reads only); `npm run test:e2e` green; `tsc` + `lint` on new files; `git diff --check` clean.

## Tests and verification commands, plus expected results

- Spec 4/4 green; repeatable `test:e2e` (feeds D6-27).

## Risks, dependencies, and unresolved questions

- Dev stack (`serve :8000` + `dev :3101`, seeded PG) must be up — documented, not automated.
- Chromium binary is a one-time download outside `node_modules` churn.

## Plan check

- Read-only flow needs no data cleanup; env credentials keep secrets out of the repo; single spec is the spec minimum; slug free; `git` clean.
- Scope preserved; no app code touched in this stage.

## Reminder

Implementation is not authorized until the user reviews this checked plan and explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `package.json` (`test:e2e: playwright test`) + `package-lock.json` (`@playwright/test@1.64.1`) + new `playwright.config.ts` (chromium, env `baseURL`, no `webServer`) + new `e2e/auth-flow.spec.ts` (login → `/` → businesses → detail, env creds, read-only) + `.gitignore` (`/test-results/`, `/playwright-report/`); plan file materialized at this path verbatim from the checked inline deliverable — no scope change. Chromium headless-shell downloaded once (no `--with-deps` needed).

**Verification (exact commands/results — the spec's test):**
- `npx playwright test` (stack `serve :8000` + `dev :3101`, seeded PG, `E2E_*` env) → **1 passed (7.6s)**: login, dashboard heading, businesses list, first-business detail with `Reviews (n)` heading. Server log confirms the API trail (`/api/login` → `/api/dashboard/summary` → `/api/businesses` → detail + reviews).
- `npx tsc --noEmit` → exit 0; `npx eslint playwright.config.ts e2e/auth-flow.spec.ts` → exit 0.
- E2E account `e2e@example.com` (viewer, reads-only flow) provisioned once via tinker `firstOrCreate` and KEPT as documented env fixture (repeatable runs; no seeder touched per non-goals). Provisioning one-liner recorded here for D6-27: `php artisan tinker --execute "App\Models\User::firstOrCreate(['email' => 'e2e@example.com'], ['name' => 'E2E', 'password' => '…', 'role' => 'viewer']);"` with `E2E_EMAIL`/`E2E_PASSWORD` exported at run time.
- `git diff --check` clean; `git status --short` → package files + config + e2e dir + gitignore (+ plan file); `test-results/` removed and ignored.
