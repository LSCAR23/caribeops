# D7-31 — Star rating UX, collapsible review form, map-based location picker

**Status:** Implemented — verified

User request: "use a star UX for the rating selection and do not show the comment form directly — add a button that shows the form when it gets clicked — and change the new business form: use a map UX to select the latitude and longitude instead of using just inputs."

## Analysis carried forward

### Evidence (gathered 2026-10-20)

1. **Review form** (`frontend/next/src/components/ReviewForm.tsx`, uncommitted D7-30 work, currently on disk and wired up): rating is a `<select>` (`review-rating`, options 1–5 "stars") at lines 78–94; the form is **always visible**, mounted on the business detail page (`app/businesses/[id]/page.tsx` line 135, directly under `<SectionHeading>Reviews (n)</SectionHeading>` at line 134). Fields Rating/Title/Comment all required; `SubmitStatus` union (`idle|pending|sent|error`), pending guard + `pointer-events-none opacity-70` wrapper, `apiPost<ApiItemResponse<Review>>` → clear fields → `role="status"` → `router.refresh()`.
2. **ReviewForm tests** (`__tests__/ReviewForm.test.tsx`, 4 tests): all keyed to `getByLabelText("Rating")` (select semantics) and an initially visible form → both UX changes break all 4 tests; they must be rewritten, not patched around.
3. **New business form**: `BusinessForm.tsx` (uncontrolled, `FormData`-based, validated by pure `lib/validate-business.ts`) is used **only** by `NewBusinessForm.tsx`, mounted at `/businesses/new`. Latitude/longitude are two visible `type="number"` inputs (lines 140–175). **No edit form exists** → the change is safely scoped to business creation; the API payload shape (`latitude`/`longitude` as numbers) stays identical.
4. **No BusinessForm/BusinessLocationPicker test exists**; the frontend suite currently has 9 test files in `src/components/__tests__/` (baseline count re-measured at implement start because D7-30 files are uncommitted user work that must be preserved untouched except the two components this task modifies).
5. **Dependencies**: `frontend/next/package.json` has only next 16.4.0 / react 19.3.0 / react-dom 19.3.0 + tailwind/testing toolchain. **No map library.** User explicitly approved adding `leaflet` + `react-leaflet` (+ `@types/leaflet`) for this task.
6. **Compatibility facts** (verified): react-leaflet v5.0.0 requires `react ^19` (project: 19.3.0 ✓) and peers `leaflet ^1.9` (react-leaflet CHANGELOG + npm registry, checked 2026-10-20). react-leaflet docs: "Leaflet makes direct calls to the DOM … not compatible with server-side rendering" → must load with `ssr: false`. The bundled Next 16.4 docs (`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`, lines 66–94) confirm `next/dynamic` + `{ ssr: false }` works **inside Client Components** (it is rejected in Server Components) — `BusinessForm` is already `"use client"`.
7. **A11y/design conventions**: `lib/ui.ts` exports `focusRing`, `buttonClassName`, `inputClassName`, `labelClassName`, `errorClassName`; every interactive element uses the shared focus ring.
8. **Authorization wrinkle for the live spot-check**: the seeded demo user `test@example.com` has `role: viewer` → `POST /api/businesses` returns 403 (BusinessPolicy; confirmed live in D7-24). Creating a business end-to-end in the spot-check requires temporarily promoting the demo user in the **dev** database (documented, optional) or settling for payload inspection + 403-as-authorization-proof.

### Decisions (user-confirmed or evidence-forced; surfaced for the reviewer)

| # | Decision | Rationale |
|---|---|---|
| D1 | Map = **Leaflet + react-leaflet v5** with OpenStreetMap tiles. | User picked it explicitly (over the no-dependency alternatives); React 19 peer requirement satisfied. |
| D2 | **Map only** for coordinates; the two number inputs are removed and replaced by hidden synced fields. | User picked "Map only, inputs hidden"; `FormData.get("latitude"/"longitude")` contract and `validateBusinessForm` stay untouched. |
| D3 | Star rating = `role="radiogroup"` of 5 radio-semantics star buttons (★/☆), roving `tabindex` + ←/→ keys, `aria-label` "1 star"…"5 stars", selected value in state as `number` (0 = none). | APG radiogroup is the correct pattern for a single-choice rating; buttons render trivially in jsdom unlike a canvas/svg widget. |
| D4 | Form reveal = a toggle button ("Write a review") with `aria-expanded` + `aria-controls`; the form is **not rendered** while closed; after a successful post the form collapses again. | Task requirement; collapse-on-success closes the loop (comment lands on top of the refreshed list, viewport declutters). Reversible. |
| D5 | Map component (`BusinessLocationPicker.tsx`) is loaded via `next/dynamic` with `ssr: false` + a small loading placeholder. | Leaflet touches `window` at import time; confirmed as the required pattern in the bundled Next docs. |
| D6 | Marker uses a Leaflet `DivIcon` (styled pin), not the default image icon. | The default icon's asset paths break under bundlers — the classic react-leaflet pitfall; a `DivIcon` needs no image files. |
| D7 | Initial map view: Puerto Viejo de Talamanca, Costa Rica (≈9.65, −82.75), zoom 12; hint text "Click the map to choose the location"; coordinates written back as `toFixed(6)` strings. | Project region (all seeded businesses are Caribbean Costa Rica); 6 decimals ≈ 0.1 m precision, well within the backend's numeric precision. |
| D8 | No backend, validation-lib, or API changes at all. | The payload and validation contract are unchanged; the visible-error copy ("Latitude is required.") keeps working, rendered under the map. |

### Non-goals

- No backend/Go/docs changes; no `validate-business.ts` changes; no edit-business flow; no review list/detail changes; no search changes; no e2e (Playwright) changes; no screenshot recapture; no map geocoding/search box, no reverse geocoding, no drag-only mode (click-to-place, marker draggable is an optional stretch noted in risks).
- The uncommitted D7-29/D7-30 files (`NavLinks`, `LogoutButton`, `SearchInput` + tests, backend review route, `docs/api.md`…) are **user work in progress** — untouched except `ReviewForm.tsx` + its test, which this task modifies by design.

### Concepts (what this task teaches)

- APG radiogroup pattern: roles, `aria-checked`, roving tabindex, arrow-key handling — and why a `<select>` replacement needs semantics, not just bigger pixels.
- Progressive disclosure: hiding a form behind `aria-expanded` vs always-on forms; state ownership (open/closed) in the island.
- Leaflet vs react-leaflet: declarative wrappers over an imperative map library; `MapContainer` immutability; `useMapEvents` for click capture.
- SSR boundaries in Next: why Leaflet must be client-only (`next/dynamic` `ssr: false` inside a Client Component) and how that differs from normal client components.
- Keeping an uncontrolled form's `FormData` contract while making one field controlled (hidden synced inputs).

## Plan

### Part A — star rating + collapsible form (ReviewForm)

**A1. Rewrite rating input as stars** in `ReviewForm.tsx` (replaces lines 74–95):
- State: `const [rating, setRating] = useState(0)` (0 = not chosen; replaces the string state).
- Render a `<div role="radiogroup" aria-label="Rating">` containing 5 `<button type="button" role="radio" aria-checked={score === rating} aria-label={`${score} ${score === 1 ? "star" : "stars"}`} tabIndex={score === (rating || 1) ? 0 : -1} …>` showing ★ when `score <= rating` else ☆ (text glyphs, `text-2xl`, gold when filled via a Tailwind amber class, `buttonClassName("ghost")` base + `focusRing`), `onClick={() => setRating(score)}`, `onKeyDown` handling ArrowRight/ArrowUp (+1), ArrowLeft/ArrowDown (−1) with clamping 1–5 and focus move to the new radio.
- Keep the visible "Rating" label as a fieldset-style heading above the group (no `htmlFor` — radios carry their own names).
- Submit guard: `rating === 0 || title/content blank` → `role="alert"` "Please select a rating and fill in all fields." (copy updated to mention the rating; no request sent).
- Payload unchanged: `rating: Number(rating)` becomes `rating` (already a number).

**A2. Collapse the form behind a button** (same file):
- `const [open, setOpen] = useState(false)`.
- Always render the toggle: `<button aria-expanded={open} aria-controls="review-form">` labeled "Write a review" when closed, "Hide review form" when open, styled `buttonClassName("secondary")`.
- Structure (check-corrected): a wrapper `<div id="review-form">` is **always rendered** (so `aria-controls` never dangles) and contains only `{open ? <form>…</form> : null}`. The error/success `<p role="alert">`/`<p role="status">` paragraphs stay **outside** the collapsible region — otherwise the "Comment posted." confirmation would disappear the instant the form collapses on success.
- Clicking the toggle to open also resets `setStatus({ state: "idle" })` so a stale "sent"/error message from a previous submission doesn't greet the user.
- On success (inside the existing try, after `setStatus({state:"sent"})` + `router.refresh()`): `setOpen(false)` and `setRating(0)` — the confirmation line remains visible below the now-collapsed toggle.
- After opening, move focus to the first star (ref on the roving-focus radio, `useEffect(() => { if (open) starRef.current?.focus() }, [open])` — DOM focus only, no setState, so no `set-state-in-effect` lint issue; guard so initial mount doesn't steal focus on page load).

**A3. Update `__tests__/ReviewForm.test.tsx`** (rewrite; keep the `vi.hoisted` + `vi.mock` router/api-client scaffolding):
1. Toggle: initially **no** form fields; toggle has `aria-expanded="false"`; click → fields appear and toggle reads `true`; second click hides them.
2. Stars: clicking "4 stars" marks it `aria-checked="true"` and the other four false.
3. Empty-guard: open the form, fill title/comment, submit without a star → alert copy + `apiPost` not called.
4. Happy path: pick 3 stars, fill fields (padded whitespace), submit → `apiPost` called once with `{ rating: 3, title: "Great place", content: "Loved it" }`, `role="status"` "Comment posted.", `refresh()` called once, fields cleared, **form collapsed again** (`aria-expanded="false"`).
5. API rejection → `role="alert"` request copy, `refresh` not called, form still open.

### Part B — map picker for the new business form

**B1. Dependencies** (user-approved exception to the no-new-deps convention): from `frontend/next/` run `npm install leaflet@^1.9.4 react-leaflet@^5.0.0` and `npm install -D @types/leaflet@^1.9.15`; record exact resolved versions in the outcome.

**B2. New `src/components/BusinessLocationPicker.tsx`** (`"use client"`), props `{ latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void }`:
- `import "leaflet/dist/leaflet.css"` at module top (App Router allows component-level global CSS imports).
- `MapContainer` centered `[9.65, -82.75]`, `zoom={12}`, `scrollWheelZoom={false}` (a form-embedded map must not hijack page scroll; drag-pan and zoom controls still work); `TileLayer` `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with `attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'` (OSM usage-policy attribution; Leaflet's default attribution control displays it).
- Inner `<MapClickHandler />` component using `useMapEvents({ click: (e) => onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6)) })`.
- When both coords are set: a `Marker` with `eventHandlers={{ dragend: … }}` writing the dragged position back through `onChange`, icon = `L.divIcon` (small styled pin `div`, no image assets).
- A visible hint line above the map ("Click the map to choose the location — selected: 9.654321, −82.751234 / not set yet"), `role="status"` for the selected-value line so screen readers announce picks.

**B3. `BusinessForm.tsx` changes** (surgical):
- Add `const [location, setLocation] = useState({ latitude: "", longitude: "" })`.
- Delete the visible latitude/longitude grid (lines 140–175) and replace with a labeled block "Location" (legend/label + hint) containing:
  - `<input type="hidden" name="latitude" value={location.latitude} readOnly />` and the longitude twin — hidden inputs still participate in `FormData`, so `handleSubmit`, `FIELDS`, and `validateBusinessForm` are **unchanged**; `readOnly` silences React's controlled-input-without-onChange warning (valid on `type="hidden"`).
  - The picker via `next/dynamic`: `const BusinessLocationPicker = dynamic(() => import("./BusinessLocationPicker"), { ssr: false, loading: () => <MapPlaceholder /> })` where `MapPlaceholder` is a same-file skeleton div (`h-72 rounded-xl border …` + "Loading map…" text, `aria-busy`).
  - `<FieldError message={errors.latitude} />` + `<FieldError message={errors.longitude} />` below the map (validation copy unchanged, D8).
- Pass `onChange={(latitude, longitude) => setLocation({ latitude, longitude })}`.

**B4. New `src/components/__tests__/BusinessForm.test.tsx`** (~4 tests; mock the picker so jsdom never loads Leaflet). Concrete mock strategy (check-corrected to a single approach): `vi.mock("next/dynamic", …)` returning a tiny async shim — `default: (loader) => { const [C, setC] = useState(null); useEffect(() => { loader().then((m) => setC(() => m.default)); }, []); return C ? <C {...props} /> : null; }` (accept props via a rest param) — plus `vi.mock("../BusinessLocationPicker", () => ({ default: (props) => <button onClick={() => props.onChange("9.650000", "-82.750000")}>pick</button> }))`. This keeps `BusinessForm`'s real `dynamic()` call site intact while jsdom receives a synchronous-enough stub. House `vi.mock` style (`vi.hoisted` where needed).
1. Renders all existing visible fields + the "Location" block; **no** visible latitude/longitude number inputs.
2. Clicking the stub picker sets the hidden inputs' values.
3. Submit with every field filled + location picked → `onValid` receives the full record including `latitude: "9.650000"`, `longitude: "-82.750000"` (proves the FormData contract survived).
4. Submit without picking a location → `errors.latitude`/`errors.longitude` alerts render under the map block, `onValid` not called.

**B5. Verification (all from `frontend/next/`):** `npm test` (expect every suite green; total = current baseline −4 +5 review tests +4 business tests), `npx tsc --noEmit`, `npm run lint` (0 warnings), `npm run build` (8-route table unchanged; Leaflet excluded from the server bundle thanks to `ssr:false`), `git diff --check`. No backend suite needed (zero backend changes) — but note the backend baseline was 71/71 as of today if a regression question arises.

**B6. Live spot-check (chrome-devtools, stack on :3000/:8000; `npm run dev` with the documented env vars if down):**
1. Business detail: form hidden behind "Write a review"; open → stars keyboard/click work → post → success, collapse, comment on top, count increments.
2. `/businesses/new`: map renders (tiles load), click sets marker + hint line; fill the rest; submit. Demo user is `viewer` → expect **403** (authorization working, payload still verifiable in the network request: numeric lat/lng present). Optional, flagged: promote `test@example.com` to `admin` in the dev DB via `php artisan tinker` to complete the 201 create end-to-end, then note it (reversible; dev-only).

### Stage 3 — memory (after implement)

Update `MEMORY.md` (three sections; exact commands/results; new dependencies recorded) and flip this plan to `Implemented — verified`.

### Files touched (expected)

| File | Change |
|---|---|
| `frontend/next/src/components/ReviewForm.tsx` | stars + reveal toggle + collapse-on-success |
| `frontend/next/src/components/__tests__/ReviewForm.test.tsx` | rewrite (~5 tests) |
| `frontend/next/src/components/BusinessLocationPicker.tsx` | new |
| `frontend/next/src/components/BusinessForm.tsx` | hidden synced lat/lng + dynamic picker |
| `frontend/next/src/components/__tests__/BusinessForm.test.tsx` | new (~4 tests) |
| `frontend/next/package.json` + `package-lock.json` | +leaflet, +react-leaflet, +@types/leaflet |
| `MEMORY.md`, this plan file | workflow artifacts |

### Risks and unresolved questions

- **OSM tiles need internet** in the dev browser; offline → gray map (hint text still works). Accepted.
- **react-leaflet in jsdom**: direct rendering is unsupported (no ResizeObserver/canvas) → all component tests mock the picker; the real map is verified only live (B6). Accepted trade-off, stated honestly.
- **`next/dynamic` + vitest**: `dynamic()` in tests may return the module directly (Next runtime not present) — the B4 mock of the picker module itself sidesteps this; if lint/tsc flag the top-level `dynamic` call, the documented fallback is a `React.lazy`-free direct import wrapped in the same conditional render.
- **`npm run build` size**: Leaflet (~140 KB gz) joins the client bundle of `/businesses/new` only (code-split by `next/dynamic`). Watch the build output; no action unless the build fails.
- **User's uncommitted work**: D7-30's plan file says "Not implemented" but the implementation exists uncommitted on disk; this task builds **on top of it** and must not revert it. `git status` deltas before/after are the guard.
- Marker drag is included (D6/D2 drop point) but can be dropped during check if the reviewer finds it scope creep.

## Plan check

**Verdict: ✅ implementable as revised.** Run 2026-10-20, read-only — no application code touched.

Re-verified against the codebase:
- **Line anchors re-confirmed**: `ReviewForm.tsx` select block at lines 78–94 and always-visible form; `BusinessForm.tsx` lat/lng grid at lines 140–175 (uncontrolled, `FormData`-collected); detail-page mount at `app/businesses/[id]/page.tsx` lines 134–135; no `BusinessForm` test file exists (9 test files total in `src/components/__tests__/`); `BusinessForm` is the **only** consumer of the lat/lng inputs (grep: `NewBusinessForm` + `validate-business` type refs only) → removal is safe.
- **Compatibility**: react-leaflet v5.0.0 peer-depends on React ^19 (project 19.3.0) and `leaflet ^1.9` (CHANGELOG + npm registry, checked today); react-leaflet docs confirm SSR-incompatible → `ssr:false` required, and the bundled Next 16.4 `lazy-loading.md` (lines 66–94) confirms `next/dynamic` + `ssr:false` is legal inside Client Components (`BusinessForm` is `"use client"` ✓).
- **Plan-mode path constraint**: per this session's Plan-mode restriction the plan is staged at `C:\Users\larao\.opencode\plan\d7-31-…md`; copying it to `docs/plans/d7-31-…md` verbatim (with this check section) is the first bookkeeping step of `/implement` — same precedent as D7-28/D7-30.

Findings addressed by this revision:
1. **Success message vs collapse (bug)**: the draft collapsed the form *and* the status paragraphs — "Comment posted." would have flashed and vanished. Fixed: only the `<form>` is collapsible inside an always-rendered `#review-form` wrapper; alert/status paragraphs live outside it.
2. **Controlled hidden inputs**: React warns on `value` without `onChange` even for `type="hidden"` → added `readOnly` to both hidden fields.
3. **Wheel-scroll hijack**: an in-form map with `scrollWheelZoom` on swallows page scroll → set to `false` (drag-pan + zoom buttons remain).
4. **Stale status on reopen**: opening the form now resets status to `idle`.
5. **Test mock ambiguity**: B4 named two alternative mock strategies → replaced with one concrete shim (`next/dynamic` async loader shim + picker module mock).
6. **`aria-controls` dangling**: wrapper `#review-form` is now always rendered.
7. **CSS import vs `tsc`**: `import "leaflet/dist/leaflet.css"` inside the picker — if `npx tsc --noEmit` cannot resolve the `.css` module, the one-line fallback is a `src/types/leaflet-css.d.ts` (`declare module "*.css";`). Contingency only; not pre-created.

Open items deliberately left to implementation (recorded, not blocking):
- Exact `next/dynamic` behavior under vitest is covered by the B4 shim; if lint flags the top-level `dynamic()` call in `BusinessForm`, a justified `eslint-disable-next-line` per the D7-29/D7-30 precedent is acceptable, with 0-warning lint as the gate.
- B6's optional demo-user promotion (`php artisan tinker`, dev DB only) will be asked for interactively at spot-check time, never done silently.
- Marker drag can be trimmed at implement time if it proves fiddly; click-to-place is the contractual behavior.

Git hygiene: the planned edits touch only `ReviewForm.tsx` + its test (this task rewrites both by design) and the new/edited business-form files; the uncommitted D7-29/D7-30 user work is preserved and `git status` deltas are the guard.

## Outcome

**Implemented — verified** (2026-10-20/21). All plan parts landed with one small deviation and one infrastructure side-finding.

### Files changed

| File | Change |
|---|---|
| `frontend/next/src/components/ReviewForm.tsx` | Rating `<select>` → 5-star radiogroup (`role=radiogroup`/`radio`, `aria-checked`, roving tabindex, ←/→/↑/↓ keys, ★/☆ glyphs, focus-to-first-star on open); form hidden behind "Write a review"/"Hide review form" toggle (`aria-expanded` + always-rendered `#review-form` wrapper); status reset on reopen; collapse-on-success with the "Comment posted." line outside the collapsible region; empty-guard copy → "Please select a rating and fill in all fields." |
| `frontend/next/src/components/__tests__/ReviewForm.test.tsx` | Rewritten, 6 tests (disclosure, radiogroup checked-state, no-star guard, happy path w/ collapse + refresh, rejection keeps form open, stale-status reset) |
| `frontend/next/src/components/BusinessLocationPicker.tsx` | **New** — react-leaflet `MapContainer` (Puerto Viejo center 9.65/−82.75, zoom 12, `scrollWheelZoom={false}`), OSM `TileLayer` with attribution, `useMapEvents` click → `toFixed(6)` strings, draggable `L.divIcon` pin (no image assets), live hint line with `role="status"`-worthy text |
| `frontend/next/src/components/BusinessForm.tsx` | Visible lat/lng number inputs removed; `next/dynamic` + `ssr: false` picker with `aria-busy` loading placeholder; two `readOnly` hidden synced inputs keep the `FormData` contract; `FieldError`s kept under the map; `location` state added |
| `frontend/next/src/components/__tests__/BusinessForm.test.tsx` | **New**, 4 tests (picker instead of number inputs, hidden-field wiring, `onValid` receives picked coordinates, location-required errors) — mocks `next/dynamic` (async-loader shim) + the picker module |
| `frontend/next/package.json` + `package-lock.json` | +`leaflet@^1.9.4`, +`react-leaflet@^5.0.0`, +`@types/leaflet@^1.9.22` (user-approved dependency exception) |
| `docs/plans/d7-31-…md`, `MEMORY.md` | workflow artifacts |

### Verification (exact commands, run from `frontend/next/`)

| Check | Result |
|---|---|
| `npx vitest run src/components/__tests__/ReviewForm.test.tsx` | **6/6 passed** |
| `npx vitest run src/components/__tests__/BusinessForm.test.tsx` | **4/4 passed** (after fixing a `React is not defined` in the test shim — named `useState`/`useEffect` imports instead of the namespace) |
| `npm test` | **46/46 passed, 10 files** (was 36/36 in 9 files) |
| `npx tsc --noEmit` | exit 0 (no `*.css` declaration fallback needed) |
| `npm run lint` | exit 0, **0 warnings** (no eslint-disable needed; the D7-30 contingency didn't trigger) |
| `npm run build` | exit 0; route table unchanged (9 rows incl. `/_not-found`) |
| `git diff --check` | exit 0 |

### Live spot-check (chrome-devtools, :3000 + rebuilt :8000)

1. **Detail page**: form collapsed behind "Write a review" (`aria-expanded=false`, no fields in DOM); open → radiogroup present, **focus landed on the first star**; clicked "4 stars" → `checked`; filled + posted → **"Comment posted." status, form auto-collapsed, comment on top of the (24→25) list**. Re-open showed no stale status.
2. **First post failed with the request-error message** → traced to the running `caribeops-laravel-1` image being **7 h stale** (baked before the user's uncommitted D7-30 backend work; no bind mounts → `POST .../reviews` 405'd). `docker compose up -d --build laravel` redeployed the current working tree; POST then returned 201. (Infrastructure side-finding, not a D7-31 defect; the user's uncommitted D7-30 backend files are now live in the container.)
3. **`/businesses/new`**: map rendered with Leaflet + OSM attribution; clicks updated the picked coordinate (9.649154 → 9.622753 → 9.612428); empty-category submit showed only "Category is required." (**no lat/lng errors** → hidden fields populated); after selecting Hotels and (with user approval) temporarily promoting `test@example.com` to `admin` via tinker, submit returned **201 + redirect** to the new business's detail page; DB showed `latitude: 9.6124280, longitude: -82.7987840` (exact map pick, persisted). Reverting as promised: role back to `viewer`, the spot-check business and all probe reviews deleted (incl. 3 API-probe reviews), DB counts verified clean. `viewer`→POST `/api/businesses` = **403** (BusinessPolicy, pre-existing D7-24 behavior, payload-shape-proven by unit tests).
4. Browser console: **0 errors/warnings** across the session.

### Deviations from the plan

- **Test-shim fix (B4)**: the concrete `next/dynamic` shim needed module-scope `useState`/`useEffect` imports (the automatic JSX runtime provides no `React` namespace) — the plan's mock strategy otherwise followed verbatim.
- **Marker drag**: kept as planned and works (dragend → `onChange`); not separately live-exercised (click-to-place is the verified contractual behavior).

### Not done / follow-ups

- No commit made (not requested). The uncommitted D7-29/D7-30 user work is untouched beyond `ReviewForm.tsx` + its test (which this task rewrites by design).
- `docs/api.md`/backend untouched (D8); e2e Playwright specs not extended (non-goal); README screenshots not recaptured (non-goal).
- The live spot-check review "D7-31 spot-check review" was also deleted in the cleanup — the dev DB is back to its pre-spot-check state.

## Post-implementation fix (2026-10-21) — map container reuse on remount

User reported after the initial D7-31 landing: "if I go to new business and then return and then go again to new business I got this error" — `TypeError: Cannot read properties of undefined (reading 'appendChild')` and `Error: Map container is being reused by another instance`, thrown from `BusinessLocationPicker.tsx` and caught by the `BusinessesError` boundary (which blanked the whole `/businesses/new` page).

**Root cause (confirmed from source, not guessed).** react-leaflet v5's `MapContainer` creates the Leaflet map inside a *ref callback* and destroys it in a `useEffect` cleanup (`node_modules/react-leaflet/lib/MapContainer.js`, `mapRef` + the `context?.map.remove()` effect). Leaflet stamps each container DOM node with `_leaflet_id` in `Map._initContainer` and `remove()` throws "Map container is being reused by another instance" when `this._containerId !== this._container._leaflet_id` (`node_modules/leaflet/dist/leaflet-src.js:3859`). With `cacheComponents: true`, Next's client-side navigation can **reconnect** an existing fiber (the stack showed `reconnectPassiveEffects` / `doubleInvokeEffectsOnFiber`) instead of mounting fresh, so the same container `<div>` is re-attached; the old map's `_leaflet_id` is still stamped on the node when the ref callback builds a new map → the foreign-id collision → the two throws (the tile layer's "appendChild of undefined" is the knock-on effect of the torn-down map). Reproduced in-browser: navigate `/businesses/new` → `/businesses` → back = crash; a full page reload did *not* crash (fresh module each time).

**Fix.** `BusinessLocationPicker.tsx`: key the `MapContainer` with a per-mount id (`useState(() => \`map-${…random…}\`)`), forcing a brand-new container div on every mount so each map gets a clean node and cleanup can't collide. One-line behavioural change + a `useState` import + an explanatory comment; no prop/contract change.

**Also investigated (no defect found):** the user's "leave a comment in a business I just create → 404". Not reproducible against the current (rebuilt) container — the review POST returned **201** both over HTTP (`Invoke-RestMethod`) and in-browser, including after the crash→recover→create→comment sequence; `network requests` showed 0×404. `route:list --method=POST` confirms `POST api/businesses/{business}/reviews` is registered and there is **no stale route cache** (`bootstrap/cache/` has only `packages.php`/`services.php`). The 404 was a stale-container artifact from before the D7-31 `docker compose up -d --build laravel` (same class as the earlier 405 side-finding), not an ongoing bug.

**Verification after the fix (from `frontend/next/`):**

| Check | Result |
|---|---|
| Browser repro (3 + 4 away/back client-side round-trips) | **0 console errors/warnings**; map renders, click-to-pick still sets coordinates (9.650169, −82.750053) after remount |
| `npm test` | **46/46 passed, 10 files** |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npm run build` | exit 0, route table unchanged |

**Dev DB hygiene:** the 3 businesses + reviews created during the 404/map repro were deleted; `test@example.com` reverted to `viewer` (verified). No commit made.
