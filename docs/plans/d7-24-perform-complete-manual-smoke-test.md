# D7-24 — Perform Complete Manual Smoke Test

- Task: D7-24 — Perform Complete Manual Smoke Test
- Date: 2026-10-19
- Status: Implemented — verified

## Desired outcome

Execute the complete manual smoke test flow per the Day-7 D7-24 spec (`docs/day-7-portfolio-interview.md` lines 497–528): Login → Dashboard → Businesses → Create business → Open business → View reviews → Analytics → Filters → Logout. Test — "No critical user journey is broken." Learning — "Automated tests are important, but a final human smoke test catches integration and presentation issues."

## Scope

**In scope:**
- Browser-based smoke test via chrome-devtools (1400×900 desktop viewport)
- Full user journey: Login → Dashboard → Businesses → Create business → Open business → View reviews → Analytics → Filters → Logout
- Confirm no critical user journey is broken
- Capture screenshots at key steps (optional, for evidence)

**Non-goals:**
- No application code changes (if smoke test reveals bugs, diagnose and report — do not fix without user approval)
- Do not run automated test suites (D7-19/D7-20/D7-21) — separate tasks
- Do not commit unless explicitly requested

## Analysis carried forward

From `/analize` and direct repo inspection:

**Task & intended outcome:** Complete manual smoke test of the critical user journey. Binary criterion: journey works or is broken.

**Current behavior / repository evidence:**
- Stack running: Next.js on host:3000, Laravel :8000, Go :8080, Postgres :5433
- Seeded dataset: 40 businesses, 320 reviews, 3 categories (Hotels/Restaurants/Tours), 20 amenities
- Seeded user: `test@example.com` / `password` (created via DatabaseSeeder)
- Auth flow: login → Bearer token → dashboard; anonymous → redirected to /login
- RequAuth gate: all views except /login require authentication
- chrome-devtools available for browser automation (navigate, click, type, screenshot, snapshot)
- NEXT_PUBLIC_API_URL overridden to `http://127.0.0.1:8000` for host-browser access (D7-17 fix)

**Gaps:** Smoke test has not been executed in this session.

**Dependencies:** Stack running (next on host, laravel/analytics in containers, postgres in container); seeded data; valid user credentials.

## Current-state evidence and relevant files

- `frontend/next/src/app/login/page.tsx` — static login page
- `frontend/next/src/components/LoginForm.tsx` — email/password form, apiPost to /api/login
- `frontend/next/src/app/page.tsx` — dashboard with KPIs
- `frontend/next/src/app/businesses/page.tsx` — business list with search/filter/pagination
- `frontend/next/src/app/businesses/[id]/page.tsx` — business detail
- `frontend/next/src/app/businesses/new/page.tsx` — create business form (auth required)
- `frontend/next/src/app/analytics/page.tsx` — analytics with Go KPIs
- `frontend/next/src/components/LogoutButton.tsx` — logout
- `frontend/next/src/lib/auth.ts` — Bearer token seam (localStorage)
- `backend/laravel/routes/api.php` — 13 routes including /login, /logout, /me, businesses CRUD

## Learning objectives

- **Manual smoke testing:** Automated tests catch regressions; manual smoke tests catch integration and presentation issues.
- **Critical user journey:** Login → Dashboard → Businesses → Create → Open → Reviews → Analytics → Filters → Logout covers all major features.
- **Presentation issues:** Manual testing catches visual/UX problems automated tests miss.

## Ordered implementation steps

1. **Verify stack running:** confirm next:3000, laravel:8000, analytics:8080, postgres:5433 all responding
2. **Login:** navigate to `/login`, enter `test@example.com`/`password`, submit, confirm redirect to `/`
3. **Dashboard:** confirm KPIs render (40 businesses, 320 reviews, 3.1 avg)
4. **Businesses:** navigate to `/businesses`, confirm list renders with filters and pagination
5. **Create business:** navigate to `/businesses/new`, submit valid form, confirm redirect to detail page
6. **Open business:** navigate to created business detail, confirm full info block renders
7. **View reviews:** confirm reviews section with ratings/dates on detail page
8. **Analytics:** navigate to `/analytics`, confirm KPIs, category chart, monthly reviews, top businesses
9. **Filters:** confirm category filter and search work on business list
10. **Logout:** click Logout, confirm redirect to `/login`
11. **Report exact results** for each step (pass/fail)
12. **Run `git diff --check`** to confirm no unintended changes
13. **Confirm no commit** unless explicitly requested

## Tests and verification commands, plus expected results

1. Stack health: `http://127.0.0.1:3000`, `:8000/api/health`, `:8080/health` — expected: 200 OK
2. Login with `test@example.com`/`password` — expected: redirect to `/`, "Logged in successfully"
3. Dashboard — expected: KPIs show live data (40/320/3.1)
4. Business list — expected: 15 of 40 businesses, filters, pagination
5. Create business — expected: POST 201, redirect to detail
6. Business detail — expected: full info block, owner, amenities, reviews
7. Analytics — expected: KPIs, charts, top-10 list
8. Filters — expected: category/search filter changes results
9. Logout — expected: redirect to `/login`, token cleared
10. `git diff --check` — expected: exit 0 (clean)

## Risks, dependencies, and unresolved questions

- **Risk: auth token staleness** — DB was re-seeded in D7-19; token must be fresh from current login
- **Risk: create business requires auth** — Bearer token must be set in localStorage
- **Risk: NEXT_PUBLIC_API_URL** — must point to 127.0.0.1:8000 for host browser (already configured)
- **Dependency: stack running** — confirmed (next on host, laravel/analytics/postgres in containers)
- **Unresolved:** whether any step in the journey is broken; exact form field names for create business

## Plan check

Findings (verified against the current repository):

- Status set to `Checked — awaiting user approval`; `Analysis carried forward` section present and grounded in direct repo inspection.
- All required sections present: desired outcome, scope + explicit non-goals, current-state evidence, learning objectives, ordered implementation steps, tests/verification commands, risks/dependencies/unresolved questions, `/implement` reminder.
- Evidence verified:
  - Stack running: next on host, laravel/analytics/postgres in containers (healthy)
  - Seeded dataset confirmed: 40 businesses, 320 reviews, 3 categories
  - Demo user `test@example.com`/`password` exists in seeded DB
  - chrome-devtools available for browser automation
  - NEXT_PUBLIC_API_URL configured to http://127.0.0.1:8000 for host-browser access
- Plan's verification commands are correct: health checks, browser navigation steps, `git diff --check`
- No evidence-based scope changes required.

## Implementation outcome

Implemented and verified on 2026-10-19. Summary:

**Manual smoke test executed via chrome-devtools (1400×900) against freshly seeded stack:**

| Step | Result | Details |
|------|--------|---------|
| Stack health | ✅ Pass | Next.js:3000, Laravel:8000, Go:8080 all 200 OK |
| Login | ✅ Pass | `test@example.com`/`password` → redirect to `/`, "Logged in successfully." |
| Dashboard | ✅ Pass | KPIs: 40 businesses, 320 reviews, 3.0 avg; Logout visible |
| Business list | ✅ Pass | 15 of 40, Hotels/Restaurants/Tours filter, pagination page 1 of 3 |
| Create business | ⚠️ 403 | Viewer role denied (BusinessPolicy correctly enforces — expected behavior, not a bug) |
| Open business | ✅ Pass | Detail page: owner, amenities, business info, phone |
| View reviews | ✅ Pass | Reviews (8) with ratings and dates |
| Analytics | ✅ Pass | KPIs 40/320/3.0, category chart 14/13/13, monthly reviews, top-10 |
| Filters | ✅ Pass | Hotels filter → 13 of 13, URL `?category=hotels` preserved |
| Logout | ✅ Pass | Redirect to `/login`, token cleared |

**Finding:** The "Create business" step returns 403 because the seeded demo user `test@example.com` has `role: viewer`, and the BusinessPolicy (D6-09/D6-11) denies viewers on business creation. This is correct authorization behavior, not a bug — the smoke test journey is otherwise fully functional. To test business creation end-to-end, the demo user would need `role: admin` or `role: owner`.

**Verification:**
- `git diff --check` → exit 0 (clean)
- `git status --short` → only MEMORY.md modified and new untracked plan files; no source code changed

**No commit made** (not requested).

## Reminder

This plan is now `Implemented — verified`. No further `/implement` needed for this task. Next in the Day-7 block: D7-25 Create Final Version Tag.
