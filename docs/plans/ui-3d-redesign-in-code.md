# Plan: Rediseño 3D de la interfaz directamente en código

**Status:** Superseded 2026-10-23 — never implemented; the user pivoted to the Caribbean-night photographic theme (`login-ojo-del-caribe-ui.md` outcome + `general-caribbean-night.jpg` across all views). The partial 3D WIP started from this direction was discarded untracked (three.js scene files deleted, `three`/`@react-three/*` pruned). Kept for the record.

## Analysis carried forward

Analysis performed with `/analize` in this session (evidence re-verified against the working tree):

- **Stack (verified):** Next 16.4.0, React 19.3.0, Tailwind v4 (`@import "tailwindcss"` + `@theme`), **zero animation/3D dependencies** in `frontend/next/package.json`. Test runner: vitest + testing-library (10 suites, 46 tests, green). Playwright present but e2e needs the backend; not part of this task's verification.
- **Routes (6, all frontend-only):** `/` (dashboard), `/login`, `/analytics`, `/businesses`, `/businesses/new`, `/businesses/[id]`. 30 components in `frontend/next/src/components/`.
- **Design foundation today (`frontend/next/src/app/globals.css`):** green ramp anchored `#009B4D` (`--color-brand-*`), mandarin `#FFCC00` accents (`--color-accent-*`), `--color-ivory`/`--color-surface`/`--color-ink-*` neutrals; Fraunces (display) + Geist Sans/Mono loaded via `next/font/google` in `frontend/next/src/app/layout.tsx`; light-only theme; `anim-fade-up`/`anim-fade-in` keyframes already exist.
- **`frontend/next/src/lib/ui.ts`:** single source per pattern (`focusRing`, `buttonClassName`, `inputClassName`, `labelClassName`, `errorClassName`) — components compose these instead of duplicating strings.
- **Shell today:** sticky single-line header (`Navigation.tsx` server component + `NavLinks.tsx` client island with `usePathname` active state), `max-w-5xl` container. Constraint carried from D7-28: **links are never hidden at any breakpoint** (wrapping row, no hamburger) so keyboard users and Playwright role selectors always reach them; `NavLinks.test.tsx` guards this.
- **Login today:** centered `Card` in `max-w-lg` (`app/login/page.tsx`), no scene. `LoginForm.tsx` holds the real auth logic; **`LoginForm` has no dedicated test** (the 10 suites cover SectionFallback, SearchInput, ReviewForm, NavLinks, LogoutButton, LoadingSkeleton, KpiCard, DateRangeSelector, BusinessList, BusinessForm) — its behavior is verified by browser preview.
- **Shell/test contract (verified during check):** `NavLinks.tsx` renders the four links (`nav[aria-label="Primary"]`), the **auth-aware Login-link hiding (D7-29)** and **`LogoutButton` inside itself** — `NavLinks.test.tsx` renders `NavLinks` alone and asserts all of it, so the logout control must stay inside `NavLinks` (positioned as the sidebar footer via layout, not moved out).
- **Type usages (verified):** `font-display` has 5 component usages (Navigation brand, CategoryChart SVG text, DateRangeSelector h3, KpiCard value, TopBusinesses rank) plus the `--font-display` token in `globals.css:51` → keep the token, remap its value. **No `font-mono` usage exists in components** (only `globals.css:52`) → `Geist_Mono` can be dropped safely; the `--font-mono` token keeps a generic fallback.
- **`backdrop-blur` today:** a single usage (`Navigation.tsx:11` header) → the new shell's two surfaces are the only blur allowed.
- **Server-page invariants (verified in the 4 server views):** every data view uses `await connection()` + `export const instant = false` (build independence from backends), a skip-link + `id="main-content"` on the dashboard, and `PageContainer` renders the page's **single `<main>` landmark** (max-w-5xl centered). Restyling must not touch data fetching, `instant`, the landmark structure, or add a second `<main>`; the sidebar offset must be applied via container padding (`PageContainer.tsx` joins M2).
- **Git (verified):** clean except uncommitted tooling/plan files of the Figma task (`opencode.json`, `skills-lock.json`, `.agents/skills/*`, `.taste-skill/`, `docs/plans/figma-3d-redesign-all-views.md`) — preserved, untouched by this plan.
- **Requested behavior (user decisions this session):** implement directly in the app code, Figma set aside (also frozen by the Starter-plan MCP limit). The approved gate #1 art direction transfers to code: turquoise Caribbean accent-ladder anchored `#0E8F8C`, DM Sans, 3 depth planes, motion with "breach" entrances, sidebar 230 + topbar 64 shell, and the Playa Negra scene behind the login (palms with animated fronds + sunken barge with a tree). Hard requirement: **fast, modern 3D — the most optimized existing approach; a slow interface is a defect.** Scope decision: **single plan with ordered milestones** (user chose this), gates presented per view via browser preview inside one `/implement`.
- **Gap vs. current code:** (1) palette/type swap; (2) new shell (sidebar+topbar) replacing the top header; (3) a complete motion system (only fade-up exists); (4) login full-bleed with layered 3D scene; (5) per-view restyling with depth planes, parallax and ambient loops on all 6 views.
- **Key risk (analysis):** existing tests assert behavior (roles, labels, link visibility) → restyling must preserve DOM semantics; the shell change touches every authenticated view; `backdrop-blur` currently used in `Navigation` is a paint cost that must stay minimal/localized.

## Objective

Implement the approved 3D art direction across the whole frontend using a **compositor-only CSS 3D approach** (zero new runtime dependencies), organized as ordered milestones: foundation first, then one view per milestone with a user gate (browser preview) before continuing.

## Non-goals

- ~~No new npm dependencies / no WebGL~~ — **superseded mid-implement by the user's explicit gate #2 iteration 2**: immersive WebGL is now in scope (three + @react-three/fiber + @react-three/drei + @react-three/postprocessing), lazy-loaded, with the performance guardrails in the Technical approach.
- No backend/Laravel changes; no data or copy changes (existing real copy and data stay verbatim).
- No dark mode for the data views (light-only directive in `globals.css`); the login hero uses the dusk marea backdrop by design.
- No commits unless the user explicitly asks (house rule); at each gate the user may request committing the milestone.

## Technical approach (the optimized path)

1. **Token swap keeping token names.** Only the *values* of `--color-brand-*`, `--color-accent-*`, `--color-ivory`, `--color-surface`, `--color-ink-*` change in `globals.css`. The 30 components keep compiling untouched; per-view restyling then works on layers, not on plumbing. Proposed palette (editable at gates — colors live only in tokens, one line each):
   - Brand turquoise ladder: 50 `#eaf6f5` · 100 `#cdeae8` · 200 `#9ad5d2` · 300 `#66bfb9` · 400 `#2ea39e` · **500 `#0e8f8c`** · 600 `#0b7573` · 700 `#095c5b` · 800 `#074746` · 900 `#053534`.
   - Accent sun-coral (accents only, as mandarin was): 100 `#ffe9e0` · 300 `#ffb08c` · 400 `#ff7a45` · 500 `#f26032` · 600 `#d44d24`.
   - Neutrals: keep names `ivory` (now "foam", cool white `#f4f8f7`), `surface` `#ffffff`, `ink-*` warm-to-deep sand/teal-black (e.g. 100 `#e7edec` … 500 `#5c6b69` … 900 `#10201e`).
   - Error color: `red-600` usage in `ui.ts` stays as-is.
2. **Type:** replace Fraunces + Geist with **DM Sans** (single family, `next/font/google`, `subsets: ["latin"]`, `display: "swap"`), exposing `--font-sans` and `--font-display` (same family, different weight/tracking treatment for display). `Geist_Mono` is removed if (only if) no `font-mono` usage exists (verify by grep during M1). Per `frontend/next/AGENTS.md`: read the relevant guides under `frontend/next/node_modules/next/dist/docs/01-app/` (fonts, layout, link) **before** editing `layout.tsx`.
3. **Motion system, CSS-only** (new section in `globals.css`):
   - Entrance "breach": `.anim-breach` = opacity + `translate3d`/`rotateX` settle, **420ms `cubic-bezier(.23,1,.32,1)`**; stagger utilities `.stagger-1…6` (60–90ms delays).
   - Depth planes: `.plane-far/.plane-mid/.plane-near` (subtle `translateZ`/scale + shadow tier) under a `perspective` wrapper class; **only `transform`/`opacity` animate** — never `top/left/width/box-shadow` (repaint rule).
   - Ambient loops: `sway` (palm fronds), `drift` (waves/haze) keyframes; gated by an IntersectionObserver that toggles `animation-play-state` (off-screen = paused, GPU rests).
   - Parallax: tiny client hook `useParallax` (`frontend/next/src/lib/useParallax.ts`) writing `--mx/--my` CSS variables on `pointermove`, **throttled with rAF; no React state per frame**.
   - `prefers-reduced-motion: reduce` → all of the above collapse to a plain fade (one media block).
   - `will-change` used sparingly (only on actively animated scene layers), `backdrop-blur` restricted to the two shell surfaces.
4. **Shell:** restructure `Navigation.tsx` (server) + `NavLinks.tsx` (client) into **fixed sidebar 230px** (brand, nav links with `usePathname` active state, logout) + **topbar 64px** (page title area, search slot, user). Component names `Navigation`/`NavLinks` are preserved (test selectors + `layout.tsx` imports keep working). The D7-28 "links never hidden" constraint is preserved: on narrow viewports the sidebar collapses into a wrapping topbar row — no hamburger, no hidden links.
5. **Login hero (`Marea`)** — *gate #2 iteration (user decision): the illustrated Playa Negra scene was built, reviewed in the browser and replaced by the original Figma design, the abstract "marea" (tide) hero.* New `frontend/next/src/components/MareaScene.tsx` (client): layered gradient depths (foam → turquoise → deep teal) + three soft foam bands drifting at different speeds, pointer parallax via `useParallax`, warm coral horizon glow (accent-only); form `Card` floats on the near plane with `.anim-breach`. `LoginForm.tsx` logic untouched (tests stay green); `app/(auth)/login/page.tsx` is full-bleed (no `PageContainer`).
6. **Per-view restyle:** each view reuses the shell + motion primitives: near-plane content cards with lift (`transform` + shadow-layer opacity on hover), far-plane ambient gradient wash, staggered section entrances, updated surfaces (translucent panels, soft 1px borders). **DOM structure, roles, headings and copy stay semantically identical** so existing tests and Playwright selectors keep passing.

## Milestones

Each milestone is one small increment with its own verification; gates present a browser preview to the user (desktop 1440×900 + mobile 390×844 via chrome-devtools MCP against `npm run dev`). No milestone starts before the previous gate is approved (or the change is requested on the same milestone).

### M1 — Foundation: tokens, type, motion system
Files: `frontend/next/src/app/globals.css`, `frontend/next/src/app/layout.tsx`, `frontend/next/src/lib/useParallax.ts` (new), `frontend/next/src/lib/ui.ts` (only if a focus-ring color token needs remapping).

Steps:
1. Read `frontend/next/node_modules/next/dist/docs/01-app/` guides for fonts/layout (AGENTS.md rule) and grep the codebase for `font-mono`/`font-display`/`text-brand-`/`bg-accent-` usages to catalog what the swap touches.
2. Swap palette + font tokens in `globals.css` (names kept, values per Technical approach); add the motion section (breach, stagger, planes, ambient keyframes, reduced-motion block).
3. Replace `Fraunces`/`Geist`/`Geist_Mono` in `layout.tsx` with DM Sans; update the `--font-*` CSS variables accordingly.
4. Add `useParallax` hook (rAF-throttled CSS-var writer, server-safe guards).

Verification: `npm test` (46/46), `npx tsc --noEmit`, `npm run build`, `git diff --check`. No gate (infrastructure).

### M2 — Shell + Login with the Playa Negra scene (gate #2)
Files: `frontend/next/src/components/Navigation.tsx`, `NavLinks.tsx`, `frontend/next/src/components/PageContainer.tsx`, `frontend/next/src/components/MareaScene.tsx` (new; replaces the discarded `PlayaNegraScene` per the gate #2 iteration), `frontend/next/src/app/(auth)/login/page.tsx`, `frontend/next/src/components/LoginForm.tsx` (classes only, zero logic).

Steps:
1. Before editing navigation/layout code, read the Next 16 docs on `link`/navigation/layout under `node_modules/next/dist/docs/01-app/`.
2. Rebuild `Navigation` as sidebar+topbar (server shell; `NavLinks` stays the client island). Preserve the full `NavLinks` contract: same link names/hrefs/roles, `nav[aria-label="Primary"]`, the D7-29 auth-aware Login-link hiding, and `LogoutButton` **rendered inside `NavLinks`** — restyled as the sidebar footer via layout (`flex-col` + `mt-auto`), not moved out (that would break `NavLinks.test.tsx`). The never-hidden constraint holds: on narrow viewports the sidebar collapses into a wrapping topbar row — no hamburger.
3. Adjust `PageContainer` for the fixed sidebar (horizontal padding on `lg+`; keep the single `<main>` landmark and `id` pass-through).
4. **Route groups:** move the five authenticated routes into `app/(app)/` (new `(app)/layout.tsx` renders `Navigation`) and `login` into `app/(auth)/` so the login stays full-bleed with no shell and no post-hydration flash. URLs are unchanged; discovered during implementation because a server layout cannot know the pathname — recorded here as the checked mechanism for the shell split.
5. Build `MareaScene` (gradient depths + drifting foam bands + parallax, reduced-motion static) and wire it behind the login form on the near plane.
6. Restyle `LoginForm` classes (buttonClassName/inputClassName already updated by M1) and the login page into full-bleed layout; touch nothing in the auth logic.
7. Verify `NavLinks.test.tsx`/`LogoutButton.test.tsx`/`BusinessForm.test.tsx` still pass; fix selector-sensitive fallout by adjusting classes only.

Verification: full suite + `tsc` + `build`; browser preview of `/login` (scene layers, parallax, reduced-motion emulation) and one authenticated view for the shell → **present gate #2**.

### M3 — Dashboard `/` (gate #3)
Files: `frontend/next/src/app/page.tsx`, `KpiCard.tsx`, `GoKpiSection.tsx`, `MonthlySection.tsx`/`MonthlyChart.tsx`, `CategorySection.tsx`/`CategoryChart.tsx`, `TopSection.tsx`/`TopBusinesses.tsx`, `ReviewList.tsx`, `LoadingSkeleton.tsx`, `EmptyState.tsx`, `SectionHeading.tsx`, `Card.tsx`.

Steps: apply depth planes + staggered breach entrances; KPI cards on near plane with hover lift (transform + shadow layer); ambient gradient wash on the far plane; restyle charts' palette via tokens only (chart colors reference token variables); skeletons/empty states adopt the new surfaces.

Verification: full suite + `tsc` + `build`; dashboard preview (loading + populated states if backend up; otherwise static structure) → **present gate #3**.

### M4 — Businesses `/businesses` (gate #4)
Files: `frontend/next/src/app/businesses/page.tsx`, `BusinessList.tsx`, `SearchInput.tsx`, `CategoryFilter.tsx`, plus shared card/list surfaces.

Steps: list rows as near-plane cards with breach stagger on results (search-as-you-type still instant — animate with `transition-transform/opacity` only, never re-mount on keystroke); filters restyled; keep `SearchInput.test.tsx`/`BusinessList.test.tsx` green.

Verification: full suite + `tsc` + `build`; preview → **present gate #4**.

### M5 — New business `/businesses/new` (gate #5)
Files: `frontend/next/src/app/businesses/new/page.tsx`, `BusinessForm.tsx`/`NewBusinessForm.tsx`, `Field.tsx`, `BusinessLocationPicker.tsx` (leaflet map restyle via CSS only — no leaflet code changes).

Steps: form sections on the near plane with staggered entrance; focus rings keep `focusRing`; map container inherits new surface/rounding tokens.

Verification: full suite + `tsc` + `build`; preview → **present gate #5**.

### M6 — Business detail `/businesses/[id]` (gate #6)
Files: `frontend/next/src/app/businesses/[id]/page.tsx`, `ReviewForm.tsx`, `ReviewList.tsx`, `BusinessLocationPicker.tsx`, related sections.

Steps: detail hero as mid/near plane composition; collapsible review form (D7-31 behavior) keeps its collapse animation semantics but uses motion tokens; reviews stagger in.

Verification: full suite + `tsc` + `build`; preview → **present gate #6**.

### M7 — Analytics `/analytics` (gate #7)
Files: `frontend/next/src/app/analytics/page.tsx`, `DateRangeSelector.tsx`, chart/section components shared with the dashboard.

Steps: analytics-specific layout with the strongest depth composition (far-plane ambient data wash); range selector segments restyled; charts palette-consistent.

Verification: full suite + `tsc` + `build`; preview → **present gate #7**.

### M8 — Final sweep + memory
Steps:
1. Sweep all views for: reduced-motion correctness (emulate `prefers-reduced-motion`), keyboard focus visibility, hover states, empty/loading/error states, `will-change` hygiene, no `backdrop-blur` outside the shell.
2. Run the full verification battery one last time; confirm zero new dependencies (`git diff frontend/next/package.json` empty).
3. Update `MEMORY.md` (three sections) with actual files, outcome and exact verification results.
4. Update this plan's status with the implementation outcome; offer per-milestone or single commit on the user's explicit request.

## Verification summary

Per milestone: `cd frontend/next && npm test && npx tsc --noEmit && npm run build` plus `git diff --check` at repo root. Visual gates via `npm run dev` + chrome-devtools screenshots (1440×900 and 390×844). Reduced-motion verified via emulation in M8. Backend is not required (frontend-only; login is a static page). If a suite goes red because of a class-only restyle, fix by preserving the tested role/label, never by deleting the test.

## Plan check

Checklist performed with `/check` against the working tree (no code modified):

- **Paths exist and belong to the plan:** the 6 routes and every listed component were confirmed on disk (`src/app/**/page.tsx`, 30 components, 10 suites in `__tests__/`). `frontend/next/AGENTS.md` exists and its "read local Next docs before writing code" rule is wired into M1/M2 steps.
- **Assumptions grounded:** token names (`brand-*`, `accent-*`, `ivory`, `surface`, `ink-*`) confirmed in `globals.css` `@theme` and consumed across components/`ui.ts` → the keep-names/value-swap strategy holds. `font-display` usages catalogued (5 + token); `font-mono` unused. `backdrop-blur` single usage confirmed. Server-page invariants (`connection()`, `instant = false`, single `<main>`) confirmed in all four server views.
- **Corrections applied during check:**
  1. `LoginForm` is **not** covered by tests (analysis overstated this) → verification relies on preview; wording fixed.
  2. "Move logout out of `NavLinks`" would break `NavLinks.test.tsx` (it renders `NavLinks` alone and asserts the Logout button) → logout stays inside `NavLinks`, positioned as the sidebar footer via layout.
  3. `PageContainer.tsx` was missing from M2 (the sidebar offset needs it) → added.
- **Scope clear and non-overlapping:** M1 infrastructure → M2 shell+login → M3–M7 one view each → M8 sweep; shared components are restyled only in the milestone that owns their primary view, and later milestones reuse the tokens/primitives.
- **Behavior and acceptance criteria clear:** per gate = browser preview approved by the user; per milestone = `npm test` (46/46), `npx tsc --noEmit`, `npm run build`, `git diff --check`; final = zero dependency changes, reduced-motion emulation pass, `MEMORY.md` updated.
- **Repository instructions followed:** root `AGENTS.md` (orchestrator workflow, plan in `docs/plans/` with these sections, `MEMORY.md` read, user changes preserved); `frontend/next/AGENTS.md` (local docs first); house rules (no commits without explicit request; present nothing unverified as done).
- **Dependencies/structure justified:** zero new dependencies by design (compositor-only CSS 3D); no backend changes; no file relocations beyond the one new file (`PlayaNegraScene.tsx`) plus `useParallax.ts`.
- **No regressions expected:** semantic DOM freeze (roles/labels/headings/copy unchanged); test-guarded behaviors (NavLinks auth contract, SearchInput debounce, ReviewForm collapse, BusinessForm flow) are explicitly preserved; `instant`/`connection()` lines untouched.
- **Implementation sequence understood, no ambiguity needing user decisions remains.** Palette values are proposals editable at any gate (single-line token edits).

## Risks and mitigations

- **Behavioral tests vs. restyling:** mitigation — semantic DOM freeze (same roles, labels, headings, copy); tests run per milestone.
- **Shell change rippling across 5 views:** mitigation — M2 lands the shell once; M3–M7 only restyle content inside it.
- **Paint cost regressions (blur/shadow/animated layout):** mitigation — explicit rules in the motion section; M8 hygiene sweep.
- **Next 16 breaking changes (AGENTS.md warning):** mitigation — mandatory local-docs read before touching `layout.tsx`/navigation/link code.
- **Palette churn after gates:** mitigation — colors live only in `@theme` tokens; a gate change is a one-line edit.
- **Work stays uncommitted during implementation** (house rule); rollback = the user requests milestone commits at gates, or reverts the working tree per-file.

## Material questions answered

- **Scope:** single plan, ordered milestones with per-view gates (user decision this session).
- **Dependencies:** none added — CSS/compositor approach mandated by the "fast, not slow" requirement.
- **Playa Negra scene → marea hero (gate #2 iteration):** the illustrated scene (palms + sunken barge) was implemented, previewed, and replaced by the user's choice of the original Figma design — the abstract tide hero (CSS/SVG gradients + drifting foam bands, parallax, reduced-motion static). No WebGL in either version.
- **Gate #2 iteration 2 (user-directed scope revision):** after previewing the marea, the user raised the ambition to reference-grade WebGL (3DVERSE/Curated.Media-style iridescent glass). Decisions: **immersive 3D across the whole app**, hero object = **iridescent glass wave**, backdrop = **dusk marea**. Guardrails (honoring the standing "fast, not slow" requirement): `three` + `@react-three/fiber` + `drei` + `postprocessing` lazy chunks — the login hero chunk loads only on `/login`; the authenticated shell hosts one small ambient wave canvas (no transmission material, DPR capped 1, no bloom) docked out of the content's way with `pointer-events-none`; data views keep the CSS 3D treatment; `prefers-reduced-motion` renders a single static frame; canvases pause when off-screen/hidden. Light theme stays for the data views (legibility); dusk applies to the login hero.

## Learning notes

- Tailwind v4 `@theme` token mechanics and the "keep names, swap values" decoupling strategy.
- Compositor-only animation discipline (`transform`/`opacity`), `cubic-bezier(.23,1,.32,1)` breach curve, stagger via delays.
- rAF-throttled CSS-variable parallax without React re-renders.
- IntersectionObserver-driven `animation-play-state` for ambient loops.
- `prefers-reduced-motion` as a single-block fallback.
- Next 16 local-docs-first workflow (AGENTS.md rule of this repo).

## Rollback plan

Milestones are independent commits once the user requests them; a regressed view reverts to its previous commit without losing the foundation (tokens/motion live in `globals.css` and are additive).
