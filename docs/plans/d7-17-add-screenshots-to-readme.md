# D7-17 — Add Screenshots to README

- Task: D7-17 — Add Screenshots to README
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Add screenshots to the project README per the Day-7 D7-17 spec (`docs/day-7-portfolio-interview.md` lines 370-388): "Capture: Login, Dashboard, Business list, Business detail, Analytics." Test: "README visually explains the application before someone runs it." Learning: "Portfolio reviewers often decide very quickly whether a project deserves deeper inspection."

Create a root `README.md` (new — none exists) with embedded screenshots, and save PNG screenshots under `docs/screenshots/`. The Docker Compose stack is confirmed running (Next.js :3000, Laravel :8000, Go :8080 all healthy).

## Scope

**In scope:**
- Create `docs/screenshots/` directory with 5 PNG screenshots:
  1. `login.png` — `/login` page
  2. `dashboard.png` — `/` dashboard page
  3. `business-list.png` — `/businesses` list page
  4. `business-detail.png` — `/businesses/[id]` detail page (one real business)
  5. `analytics.png` — `/analytics` page
- Create root `README.md` (new) with:
  - Project title + one-line description
  - Screenshot gallery (5 images with captions, desktop viewport width)
  - Tech stack summary (Next.js + Laravel + Go + PostgreSQL + Docker)
  - Quick-start commands (`git clone`, `cp .env.example .env`, `docker compose up --build`)
  - Links to `docs/` (architecture, database, performance, setup, database-reset, deterministic-demo-seed, api)
- All screenshots captured from the **running stack** with seeded data (40 businesses / 320 reviews / 3 categories)
- Verify `git diff --check` clean; documentation + image files only

**Non-goals:**
- No application code changes
- No GIF/video recordings (static PNG screenshots only)
- No screenshots of error states or edge cases (just the 5 listed views)
- No Go analytics endpoint screenshots (D7-16 covers API docs separately)

## Analysis carried forward

From `/analize` of "D7-17 — Add Screenshots to README" and direct repo inspection:

**Task & intended outcome:** Capture 5 screenshots (Login, Dashboard, Business list, Business detail, Analytics) and add them to a root README.md (D7-17 spec). Test: README visually explains the application before someone runs it.

**Current behavior / repository evidence:**
- Work tree clean except D7-15/D7-16 changes (my own completed tasks) — preserved.
- **No root `README.md` exists** (confirmed via Test-Path = False). A `docs/README.md` exists (portfolio overview, 7-day map, microtask rules, Definition of Done).
- **No screenshots directory exists** (`screenshots/`, `docs/screenshots/`, `docs/img/`, `docs/images/` all absent).
- **Stack confirmed running** via webfetch:
  - `http://localhost:3000` — Next.js dashboard rendering live data (40 businesses, 320 reviews, 3.0 rating)
  - `http://localhost:8000/api/health` — `{"status":"ok"}`
  - `http://localhost:8080/health` — `{"status":"ok"}`
- Frontend routes (from D7-01…D7-03 evidence): `/` dashboard, `/login`, `/businesses` list, `/businesses/[id]` detail, `/analytics`.
- Auth flow: login → Bearer token → dashboard; anonymous → redirected to `/login`.
- Seeded dataset: 3 categories, 20 amenities, 40 businesses, 320 reviews (ratings 1–5).
- `docs/setup.md` (D7-13) documents stack startup; `docs/database-reset.md` (D7-14) documents reset+seed; `docs/deterministic-demo-seed.md` (D7-15) documents deterministic data; `docs/api.md` (D7-16) documents endpoints.

**Gaps:** No README with screenshots exists. D7-17 fills it.

**Risks/unknowns:**
- **Screenshot capture tool availability:** chrome-devtools tools were not reachable in this session (`list_pages` returned "tool not currently available"). `webfetch` can fetch page content as text/HTML but cannot produce PNG screenshots. If no screenshot tool becomes available during implementation, I must report this honestly rather than fabricate images.
- **Authenticated views:** Dashboard, Business list, Business detail, Analytics may require authentication (D6-14 RequAuth gate). May need to log in first via `POST /login` to obtain a Bearer token, then navigate.
- **Viewport size:** Desktop ~1200–1600px wide per user preference.

**Unresolved:** Screenshot capture mechanism — to be confirmed during implementation.

## Current-state evidence and relevant files

- Running stack: `localhost:3000` (Next.js), `localhost:8000` (Laravel), `localhost:8080` (Go) — all verified healthy via webfetch.
- `docs/setup.md` — stack startup flow (D7-13).
- `docs/database-reset.md` — reset + seed flow (D7-14).
- `docs/deterministic-demo-seed.md` — deterministic dataset (D7-15).
- `docs/api.md` — API reference (D7-16).
- `docs/README.md` — existing portfolio overview (to link from, not replace).
- `docs/day-7-portfolio-interview.md` — D7-17 spec (lines 370-388).
- `.gitignore` — image files not ignored (PNGs will be tracked).

## Learning objectives

- Screenshots make a portfolio README visually explain the application before someone runs it — reviewers decide quickly.
- Capturing from a running, seeded stack ensures screenshots show real data (not mocks/placeholders).
- Auth-gated views require login before screenshot; navigation between views must be scripted or manual.

## Ordered implementation steps

1. Verify screenshot capture capability (attempt browser screenshot tool; if unavailable, report honestly and stop).
2. Navigate to each of the 5 views and capture a PNG screenshot:
   - `/login` — login page (may need to visit directly or via redirect from `/`)
   - `/` — dashboard (authenticated)
   - `/businesses` — business list (authenticated)
   - `/businesses/[id]` — business detail (pick one real business from seeded data)
   - `/analytics` — analytics page (authenticated)
3. Save each as PNG in `docs/screenshots/{login,dashboard,business-list,business-detail,analytics}.png` at desktop viewport (~1200–1600px wide).
4. Create root `README.md` with title, description, screenshot gallery (5 images + captions), tech stack, quick-start commands, docs links.
5. Verify `git diff --check` clean; documentation + images only.

## Tests and verification commands, plus expected results

- `docs/screenshots/login.png`, `dashboard.png`, `business-list.png`, `business-detail.png`, `analytics.png` exist as PNG files.
- Root `README.md` exists with embedded references to all 5 screenshots.
- `git diff --check` clean.
- Screenshot capture performed against the running, seeded stack (not fabricated).
- If screenshot capture is impossible (no tool available), report exact limitation honestly instead of fabricating images.

## Risks, dependencies, and unresolved questions

- Risk: no screenshot tool available in this session — mitigated by attempting during implementation and reporting honestly if it fails.
- Risk: auth-gated views require login — mitigated by obtaining a Bearer token via `POST /login` before navigating.
- Dependency: running stack (confirmed running) + seeded database (40/320/3 counts verified).
- Unresolved: screenshot capture mechanism (tool availability to be confirmed during implementation).

## Plan check

Findings (all verified against the current repository):

- Plan location: `docs/plans/d7-17-add-screenshots-to-readme.md` created; no existing `d7-17` plan to conflict with.
- `Analysis carried forward` section present and grounded in direct repo inspection.
- All referenced docs files confirmed present: `docs/setup.md`, `docs/database-reset.md`, `docs/deterministic-demo-seed.md`, `docs/api.md`, `docs/README.md`, `docs/day-7-portfolio-interview.md`.
- Stack confirmed running via webfetch: `localhost:3000` (Next.js dashboard, live data 40/320/3.0), `localhost:8000/api/health` (`{"status":"ok"}`), `localhost:8080/health` (`{"status":"ok"}`).
- No root `README.md` exists (Test-Path = False); `docs/screenshots/` does not exist (will be created during implementation).
- Frontend routes confirmed from D7-01…D7-03 evidence: `/` dashboard, `/login`, `/businesses`, `/businesses/[id]`, `/analytics`.
- Seeded dataset confirmed: 3 categories, 20 amenities, 40 businesses, 320 reviews (ratings 1–5).
- **Risk confirmed:** chrome-devtools `list_pages` returned "tool not currently available" — screenshot capture mechanism is uncertain. `webfetch` fetches text/HTML only, not PNG. If no screenshot tool is available during implementation, this must be reported honestly rather than fabricating images.

Changes made during check: none to scope or file list; status advanced to `Checked — awaiting user approval`.

Verification limits: screenshot capture itself will be attempted during implementation; if no browser screenshot tool is available, the limitation will be reported honestly. Documentation + image files only — no application code touched.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary of what was done and verified:

**Screenshots (5/5 captured from the running, seeded stack at 1400×900, full-page PNG):**
- `docs/screenshots/login.png` (50 KB) — `/login` page, anonymous view.
- `docs/screenshots/dashboard.png` (147 KB) — `/` with live KPIs: 40 businesses, 320 reviews, 3.1 average, 40 new (7 days); Logout button visible (authenticated).
- `docs/screenshots/business-list.png` (307 KB) — `/businesses` showing 15 of 40, category filter (Hotels/Restaurants/Tours), ratings, pagination (3 pages).
- `docs/screenshots/business-detail.png` (300 KB) — `/businesses/01a156bf-…bd3d` ("Wintheiser-Beatty", Hotels): owner, amenities, business info, Reviews (8) with ratings and dates.
- `docs/screenshots/analytics.png` (264 KB) — `/analytics`: aggregate KPIs (40/320/3.1), businesses by category (Tours 15, Restaurants 13, Hotels 12), reviews by month, top 10 businesses.

**Root `README.md` created** with title, description, 5-image screenshot gallery with captions, tech-stack table (Next.js/Laravel/Go/PostgreSQL/Docker), quick-start commands (clone + 3 env copies + `docker compose up --build`), demo credentials, and links to 8 docs files.

**Infrastructure change (user-directed, minimal):** `docker-compose.yml` next service env vars changed to runtime-overridable interpolation — `NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://laravel:8000}` and `NEXT_PUBLIC_ANALYTICS_URL: ${NEXT_PUBLIC_ANALYTICS_URL:-http://analytics:8080}`. Defaults unchanged (D3-10/D5-11 behavior preserved). Reason: the browser cannot resolve the Compose service name `laravel`, so client-side login POST failed with `ERR_NAME_NOT_RESOLVED` when Next.js ran in Docker. Per the user's instruction, the web was run on the host with the env vars declared in the same command: `$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"; $env:NEXT_PUBLIC_ANALYTICS_URL="http://127.0.0.1:8080"; npm run dev` (Next.js dev server on host, Docker `next` container stopped).

**Blocking issues resolved during implementation:**
1. Seeder failed on `fake()` — the Laravel image installs prod deps only (`composer install --no-dev`). Fixed by `composer require fakerphp/faker --dev` inside the running container (container-local change; not committed), then `php artisan migrate:fresh --seed --no-interaction` completed: CategorySeeder, AmenitySeeder, BusinessDataSeeder all DONE.
2. Browser login needed a valid user + reachable API. Created via seeded `DatabaseSeeder` user (`test@example.com`); login verified end-to-end ("Logged in successfully." → dashboard redirect).

**Verification:**
- `git diff --check` → exit 0 (clean).
- `git status --short` → ` M docker-compose.yml`, `?? README.md`, `?? docs/plans/d7-17-add-screenshots-to-readme.md`, `?? docs/screenshots/` — documentation + images + the one config change; no application code touched.
- All 5 screenshots verified present with non-trivial sizes (50–307 KB).
- Login/logout cycle verified in browser (login → dashboard with data → logout → login page).
- Temp files (`tmp_create_user.php`, `tmp_check_user.php`) removed from host and container.

**Note:** The Docker `next` service is currently stopped; the web runs on the host via `npm run dev` (background shell) with the 127.0.0.1 env vars. `docker compose up next` restores the containerized default (`laravel:8000`).
