# D7-29 — Navbar: hide the Login link while authenticated + reset the stuck "Logging out…" state

Task name: "fix navbar Login link visibility + stuck logout pending state"

Date: 2026-10-20
Status: Implemented — verified

## Desired outcome

1. **Truthful nav.** While a token exists, the header renders `Dashboard / Businesses / Analytics / Logout` — the `Login` link is absent. Anonymous, it renders `Dashboard / Businesses / Analytics / Login` (unchanged from today). The swap happens post-hydration (the server render still includes `Login`, matching the existing island pattern, so there is no hydration mismatch).
2. **Resettable logout state.** After logout → login, the nav shows a fresh, **enabled** `Logout` button — never the stale disabled `Logging out…` text. Clicking `Logout` still shows `Logging out…` only for the duration of the in-flight request/navigation, then the button disappears with the token.

## Scope

- `frontend/next/src/components/NavLinks.tsx` — auth-aware hiding of the `/login` link.
- `frontend/next/src/components/LogoutButton.tsx` — add the missing `pending` reset.
- New tests: `frontend/next/src/components/__tests__/NavLinks.test.tsx` and `LogoutButton.test.tsx`.
- This plan file; after implementation, `MEMORY.md` (three sections) + plan outcome.

## Explicit non-goals

- No backend (Laravel/Go) changes; no changes to `RequireAuth.tsx`, `LoginForm.tsx`, `Navigation.tsx`, `lib/auth.ts`, or `lib/api-client.ts`.
- No auth-state redesign (no event bus, no `useSyncExternalStore`, no shared `useAuthed()` hook — the repo's existing pattern is inline per-island effects; extract a hook only if a fourth consumer appears).
- No `apiPost` timeout (a hung logout request leaving `pending` stuck is pre-existing and out of scope).
- No screenshot recapture (the nav change and the already-stale D7-28 date-picker header make `docs/screenshots/*.png` slightly outdated; recapture only on request).
- No new dependencies, no commits.

## Analysis carried forward

From `/analize` ("fix navbar Login link visibility + stuck logout pending state", 2026-10-20), evidence observed in the repository:

- **Bug 1 root cause.** `NavLinks.tsx` lines 8–13: static `links` array includes `{ href: "/login", label: "Login" }`, mapped unconditionally (line 25) with no auth condition; only `LogoutButton` (line 46) is auth-aware. Live-confirmed during the D7-28 spot-check: the a11y snapshot showed `link "Login"` beside `button "Logout"` while authenticated.
- **Bug 2 root cause.** `LogoutButton.tsx`: `setPending(true)` (line 34) has **no `setPending(false)` anywhere in the file** (full read). `finally` only does `clearToken(); router.push("/login")`. The nav is a root-layout island that never remounts on client navigation (its own comment, lines 19–20). Logout hides the button via the `[pathname]` effect flipping `authed=false`, concealing the stale state; the next login re-runs the effect → `authed=true` → re-render with stale `pending=true` → disabled `Logging out…` forever.
- **Token seam.** `lib/auth.ts`: `localStorage["caribeops_token"]`, SSR-guarded `getToken/setToken/clearToken`.
- **`RequireAuth` (root layout, `layout.tsx` line 40)** bounces tokenless visitors to `/login` and authed visitors off `/login` to `/`. Therefore logout always changes `pathname` in practice, and the "authed user on `/login`" state lasts one frame — the `[pathname]` effect is a reliable reset point.
- **Login flow.** `LoginForm.tsx`: `setToken(token)` then `router.push("/")` (line 40) → pathname change → both nav islands' effects re-run.
- **No test/e2e coupling.** Grep across `frontend/next/src` + `e2e`: zero references to `Login`, `Logout`, `NavLinks`, or `LogoutButton`. The pinned contract is `getByRole("link", { name: "Businesses" })` (ui-redesign.md line 93) — always rendered. Suite at 26/26 after D7-28.
- **Historical acceptance reversed.** `docs/plans/d6-15-add-logout-button.md` line 43: "Login link stays visible when authed — accepted; gate already neutralizes it." The user's report explicitly overrides that acceptance; this task supersedes it.
- **Repo state.** User committed D7-27 + screenshots as `5f10853`. Uncommitted and preserved: D7-28 source/test/plan, `MEMORY.md` (which also carries this task's pre-implementation updates). Web runs on host (`npm run dev`, `.env.local` → `127.0.0.1:8000/8080`).

## Current-state evidence and relevant files

| File | Role |
| --- | --- |
| `frontend/next/src/components/NavLinks.tsx` | Static link array + `active`-route island; renders `LogoutButton`. Change: auth-conditional Login link. |
| `frontend/next/src/components/LogoutButton.tsx` | `authed`/`pending` state, `[pathname]` effect re-adopts token; `pending` never reset. Change: reset `pending` in that effect. |
| `frontend/next/src/app/layout.tsx` | Root layout mounts `Navigation` + `RequireAuth` — islands persist across navigations. |
| `frontend/next/src/components/RequireAuth.tsx` | Establishes the post-hydration `getToken()` effect pattern; guarantees logout changes `pathname`. |
| `frontend/next/src/components/__tests__/DateRangeSelector.test.tsx` | Mock precedent to mirror: `vi.hoisted` mutable route state, `vi.mock("next/navigation")`. |
| `frontend/next/vitest.setup.tsx` | `cleanup()` runs `afterEach` only — a second render inside one test needs an explicit `cleanup()`. |

## Learning objectives and concept explanation

1. **Post-hydration adoption.** The server has no `localStorage`, so auth-dependent UI must render its anonymous form first and adopt the token inside `useEffect` (`useState(false)` initial state = what SSR produced → no hydration mismatch). This is the established island pattern (`LogoutButton`, `RequireAuth`); `NavLinks` now applies it too.
2. **Persistent layout islands & re-sync points.** Layout islands survive client navigations — the property that *caused* bug 2 (state outliving the interaction) is the same property the fix *uses*: an effect keyed on `usePathname()` re-runs exactly when the user moves between routes, making it the natural place to re-read the token **and** clear transient UI state.
3. **Async state machines need guaranteed resets.** `pending` is `idle → pending → (terminal)` with no edge back; every `setPending(true)` must be paired with a reset on every exit path (`finally` covers "request ended"; the route-change effect covers "new context"). Same-path navigation doesn't re-run `[pathname]` effects — why `RequireAuth`'s bounce matters and why the residual edge below is unreachable.

## Ordered implementation steps

0. **Read the Next 16 guides** required by `frontend/next/AGENTS.md`: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md` and `use-router.md` (both confirmed to exist) before editing — verify no deprecation affects the hooks the two islands already use.
1. **`NavLinks.tsx` — hide `Login` when authed.**
   - Add `const [authed, setAuthed] = useState(false);` and a `useEffect` on `[pathname]` calling `setAuthed(getToken() !== null)`, with the same eslint-disable rationale comment `LogoutButton` uses (`react-hooks/set-state-in-effect -- single run per route, no cascade`).
   - Render `{links.filter((link) => authed || link.href !== "/login").map(...)}` so the other three links keep their existing `active`/`aria-current` logic untouched.
   - Update the file comment: note the auth-hiding supersedes the D6-15 acceptance.
   - *Rationale:* mirrors the existing pattern exactly; `useState(false)` keeps SSR HTML = first client render (SSR always emits `Login`; it disappears one effect later for authed users, the same flicker `LogoutButton` already has in reverse).
2. **`LogoutButton.tsx` — reset `pending` on route change.**
   - In the existing `[pathname]` effect, add `setPending(false);` next to `setAuthed(...)`; extend the comment ("re-adopt the token and reset transient request state per route").
   - Leave `finally` unchanged (`clearToken(); router.push("/login")`).
   - *Rationale:* the logout→`/login` push always changes `pathname` (RequireAuth guarantees it), so the effect fires once more and both `authed` and `pending` re-sync; resetting inside `finally` instead would flash `Logging out… → Logout` before navigation and still not fix re-login. On the next login, the `/login → /` effect renders a fresh enabled button.
3. **Tests (6 new; suite 26 → 32).** Both files mirror the `DateRangeSelector.test.tsx` mock precedent (`vi.hoisted` + `vi.mock("next/navigation")`), extended with `usePathname` (absent from that mock) and localStorage reset:
   - Shared shape: `const { push, state } = vi.hoisted(() => ({ push: vi.fn(), state: { pathname: "/" } }))`; mock returns `{ useRouter: () => ({ push }), usePathname: () => state.pathname }`; `vi.mock("@/lib/api-client")` gives an `apiPost` spy (`vi.fn()` resolving `undefined`); `beforeEach` resets `push`/`apiPost`, `state.pathname = "/"`, and `localStorage.clear()`.
   - **Keep ONE component instance per test**: destructure `rerender` and flip `state.pathname` + localStorage between `rerender(<Component />)` calls. A fresh second `render()` would remount with default `pending=false` and make the regression test pass **without the fix** — it must fail on the current code and pass after it.
   - `NavLinks.test.tsx` (3): (a) no token → all four links incl. `Login`, `queryByRole("button", { name: "Logout" })` is null; (b) token set before render → mount effect hides `Login`, the other three links present, Logout button present; (c) same instance: clear token, `rerender` with a new `state.pathname` → `Login` reappears.
   - `LogoutButton.test.tsx` (3): (a) no token → renders nothing; (b) token + click → `await waitFor(() => …)`: `apiPost` called with `/api/logout`, token cleared from localStorage, `push` called with `/login`, button disabled reading `Logging out…` (async assertions use `waitFor` because the handler awaits `apiPost`); (c) **regression** on one instance: click (pending true) → `rerender` with `state.pathname="/login"` (renders null) → set token, `rerender` with `state.pathname="/"` → renders `Logout`, `disabled` falsy.
4. **Verification** (commands below), then plan status/outcome and the three `MEMORY.md` sections. No commit.

## Tests and verification commands

Run from `frontend/next/`:

| Command | Expected result |
| --- | --- |
| `npm test` | **32/32** passed — 8 files (26 existing + 3 NavLinks + 3 LogoutButton) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 (including the two `set-state-in-effect` disables) |
| `npm run build` | exit 0, route table unchanged |
| `git diff --check` | exit 0 |
| `git status --short` | only `NavLinks.tsx`, `LogoutButton.tsx`, 2 new test files, this plan — plus the pre-existing uncommitted D7-28/MEMORY changes |

Live spot-check on the dev server (`:3000`, data stack up):

1. Anonymous `/` → redirected to `/login` by RequireAuth; header shows `Login`, no Logout.
2. Log in (`test@example.com`/`password`) → header: three nav links, **no `Login`**, enabled `Logout`.
3. Click `Logout` → lands on `/login`, header shows `Login` again.
4. Log in **again** → header shows an **enabled `Logout`** (text `Logout`, never `Logging out…`).
5. Navigate Dashboard → Businesses → Analytics → auth UI persists correctly (no `Login`, Logout enabled).

## Risks, dependencies, unresolved questions

- **Hydration mismatch** if the token were read during render — mitigated by the mandated `useState(false)` + effect pattern (existing precedent).
- **Lint rule** `react-hooks/set-state-in-effect` will flag the new effect — the same targeted disable comment as `LogoutButton` (line 22) is required for lint to pass.
- **Accepted residual edges:** (a) a logout whose push somehow lands on the current `pathname` wouldn't re-run the effect — unreachable while `RequireAuth` bounces authed users off `/login`; (b) a never-resolving logout request keeps `pending` true — pre-existing, needs timeout infrastructure (out of scope).
- **Screenshots** go slightly staler (nav lacks `Login` when authed; `analytics.png` already shows the pre-D7-28 header) — non-goal unless requested.
- **Dependencies:** running dev stack for the spot-check (currently up: Next `:3000`, Laravel `:8000`, Go `:8080`); no backend rebuilds.
- **Unresolved questions:** none — the only product decision (hide vs. keep `Login`) is answered by the user's report; no material question remains for `/check` to resolve.

## Plan check

Reviewed against the current repository (components, layout, auth seam, tests, eslint config, Next docs, git status, `MEMORY.md`) on 2026-10-20. Findings and revisions:

1. **Verified — lint rule.** `eslint.config.mjs` = `eslint-config-next/core-web-vitals` + `/typescript`, pulling `eslint-plugin-react-hooks` 7.1.1 (the source of `react-hooks/set-state-in-effect`, which `LogoutButton` line 22 already disables). The new `NavLinks` effect mirrors that exact disable comment; the `lint` script does not gate on warnings, so the directive is safe either way.
2. **Revised — regression-test instance identity (critical).** The draft's test descriptions could be read as separate `render()` calls; a fresh `render()` mounts a **new** component instance where `pending` defaults to `false`, so the bug-2 regression test would pass even on the unfixed code. Tests must keep **one instance** and switch `state.pathname` + localStorage via `rerender` — the revised step 3 spells this out and states the fail-before/pass-after requirement.
3. **Revised — exact mock shape.** `DateRangeSelector.test.tsx` mocks only `useRouter`+`useSearchParams` — no `usePathname`. The plan now specifies the full `vi.hoisted` shape with `usePathname`, the `apiPost` spy, `beforeEach` resets, and `await waitFor(...)` for the async click assertions (the handler awaits `apiPost`).
4. **Revised — AGENTS.md Step 0 added.** The frontend rules require reading the relevant `node_modules/next/dist/docs/` guide before writing code; `use-pathname.md` and `use-router.md` confirmed present → new implementation step 0.
5. **Revised — test (b) simplified.** `useEffect` runs on mount, so setting the token **before** `render()` already exercises adoption (no artificial route change needed for the hide assertion); same-instance transitions stay covered by test (c).
6. **Verified — paths, counts, coupling.** Both source files and `__tests__/` exist; grep of `src/` + `e2e/` finds zero `Login`/`Logout`/`NavLinks`/`LogoutButton` references in tests (no hidden breakage; the `Businesses` link pin is unaffected — always rendered); suite is 26/26, expectation 32/32 across 8 files; slug free (only d7-27/d7-28 plans exist); the plan includes its required `Analysis carried forward` section and was created by `/plan`.
7. **Verified — repo baseline.** Fresh `git status --short`: `MEMORY.md` + D7-28's two source files + the d7-27/d7-28/d7-29 plan files — exactly the plan's preserve-list (D7-27 was committed by the user as `5f10853`); D7-28 bookkeeping completed this session before analysis.
8. **Verified — behavior edges.** `RequireAuth` in the root layout guarantees logout always changes `pathname` (authed users are bounced off `/login`), so the `[pathname]` effect is a reliable reset point; accepted residual edges (unreachable same-path logout, pre-existing hung-request behavior) are documented as non-goals; screenshot staleness documented rather than silently recaptured.
9. **No material questions remained** for the user — the only product decision (hide the `Login` link while authed) is settled by the user's own report, which explicitly overrides the D6-15 acceptance.

No scope changes were needed; the plan above incorporates revisions 1–5.

## Authorization reminder

This plan is produced by `/orchestrator` (analize → plan → check) and **does not authorize implementation**. Implementation begins only when the user reviews the checked plan and explicitly invokes `/implement "docs/plans/d7-29-fix-navbar-login-link-and-logout-pending.md"`.

## Outcome (2026-10-20, `/implement` approved and executed)

**Implemented as planned**, with one deviation and one empirically corrected assumption. Files changed (working directory `frontend/next/` unless noted):

- `src/components/NavLinks.tsx` — added `authed` state (`useState(false)`) adopted in a `useEffect` on `[pathname]` (`setAuthed(getToken() !== null)`, with the established `react-hooks/set-state-in-effect` disable + rationale comment), and the link list now renders through `.filter((link) => !(authed && link.href === "/login"))` so `Login` disappears only while authenticated. File comment documents that D7-29 supersedes the D6-15 acceptance. *Deviation during implementation:* the first predicate written (`authed || link.href !== "/login"`) was inverted — the new NavLinks tests caught it immediately (3/3 failed showing Login dropped when anonymous); corrected to the final form.
- `src/components/LogoutButton.tsx` — the existing `[pathname]` effect now also runs `setPending(false)` (comment extended to explain the reset; `finally` untouched per plan). *Corrected assumption:* the plan/check expected a second eslint-disable for this line; the lint run proved the directive **unused** (`set-state-in-effect` flags the computed `setAuthed(...)` but not the constant `setPending(false)`), so the directive was removed and the comment records why — lint output is clean, no warnings.
- `src/components/__tests__/NavLinks.test.tsx` — new, 3 tests: anonymous shows all four links + no Logout; token present at mount hides `Login` and shows Logout; same-instance `rerender` after `clearToken()` + route change brings `Login` back. Mocks: `vi.hoisted` `{ push, state.pathname }`, `vi.mock("next/navigation")` with `useRouter`+`usePathname`, real `setToken/clearToken` from `@/lib/auth`.
- `src/components/__tests__/LogoutButton.test.tsx` — new, 3 tests: no token → renders nothing; click → `waitFor` proves `apiPost("/api/logout", {})`, token cleared, `push("/login")`, disabled `Logging out…`; **round-trip regression on ONE instance** (`rerender` across `state.pathname` flips) ends in an enabled `Logout`. The mock deliberately omits any per-file `next/link` stub (the global one in `vitest.setup.tsx` covers it).
- `docs/plans/d7-29-…md` — this file; status + outcome.

**Fail-before proof (plan check finding 2):** with `setPending(false)` temporarily removed, the regression test failed exactly at its final assertion (`getByRole("button", { name: "Logout" })` — the button re-rendered as the stale `Logging out…`), while tests (a) and (b) still passed; the fix was then restored. The test demonstrably guards the bug.

**Verification (exact commands):**

| Command | Result |
| --- | --- |
| `npm test` | **32/32 passed, 8 files** (26 existing + 3 NavLinks + 3 LogoutButton), final run on the final source |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, **zero warnings** (after removing the proven-unused directive) |
| `npm run build` | exit 0, Next.js 16.4.0 Turbopack, route table unchanged (8 routes) |
| `git diff --check` | exit 0 |
| `git status --short` | exactly `NavLinks.tsx` + `LogoutButton.tsx` (M), 2 new test files, this plan (??) — the D7-28/MEMORY work was committed by the user as `a31f7fa` during implementation and is untouched |

**Live spot-check** (dev server :3000, all 5 plan steps passed): (1) anonymous → `RequireAuth` redirected to `/login`, nav `Dashboard | Businesses | Analytics | Login`, no Logout; (2) login → nav without `Login`, Logout `disabled: false`; (3) logout → `/login`, `Login` back, Logout gone; (4) **second login → enabled `Logout` `{t:"Logout", d:false}`, never `Logging out…`**; (5) `/businesses` → `/analytics` → `/` all keep `loginLink: false` + enabled Logout. Browser page closed afterwards.

**Not done, per plan:** no commit; no backend/`RequireAuth`/`LoginForm`/auth-seam changes; no screenshots recaptured (nav + date-picker staleness documented as non-goals).
