# D7-03 — Improve Business Details Page

- Task: D7-03 — Improve Business Details Page
- Date: 2026-10-17
- Status: Implemented — verified
- Scope decisions (from user): amenities endpoint added in D7-03; owner shown in detail

## Desired outcome

`/businesses/{id}` communicates, all from live API data:
- Business information: name, category, address, description, type, website, phone
- Amenities (names)
- Rating (average)
- Reviews (list)
- Owner (name)

Every value traces to a live endpoint — no hardcoded data.

## Scope

Backend (Laravel):
- Add `GET /api/businesses/{business}/amenities` returning amenity names for the business (mirrors the existing `/reviews` endpoint pattern).
- Update `BusinessResource` to include `owner` (`name` + `email` of the related `user`), eager-loaded via `user()`.
- Update the detail route `GET /api/businesses/{business}` to eager-load `user` and `amenities`.
- New `BusinessDetailsTest.php`: 200 with all fields incl. `owner` and `amenities`, reviews present, 404 for unknown UUID, owner/amenities present when seeded.
- Existing lines in `routes/api.php` untouched except the detail route eager-loading line and the new amenities route.

Frontend (Next.js):
- `src/app/businesses/[id]/page.tsx`: display the full business info block (name, category, address, description, type, website, phone, rating), owner name, amenities list, and reviews — all from `data`/`owner`/`amenities`.
- Keep `notFound()` on 404/null, `instant = false`, `connection()` build-safe pattern.
- No new components unless needed; keep `ReviewList` reuse.
- Extend `Business` type with `owner` if the frontend consumes it directly (verify against resource shape).

## Non-goals

- No changes to `/businesses` list, search, pagination (D7-02), dashboard (D7-01), analytics, auth, or seed data.
- No amenities CRUD, no owner-based authorization UI changes (authorization stays in Laravel policies).
- No new dependencies.

## Analysis carried forward

From `/analize`: `businesses/[id]/page.tsx:14-61` already fetches business + reviews, 404s correctly, `instant=false`/`connection()` intact, `ReviewList` reused, E2E pins detail heading + `Reviews (n)`. Missing vs Day-7 spec: Amenities (no endpoint), Owner (not in `BusinessResource`), and full business info block (description/type/website/phone only partially rendered). `Business` model already has `user()` + `amenities()` relationships; `User` hides `password`; `BusinessResource` exposes neither owner nor amenities. No `AmenityResource` or amenities endpoint exists today.

## Current-state evidence and relevant files

- `backend/laravel/routes/api.php:75-77` — detail route returns `new BusinessResource($business)` without eager-loading user/amenities.
- `backend/laravel/app/Http/Resources/BusinessResource.php:17-33` — resource shape; no `owner`, no `amenities`.
- `backend/laravel/app/Models/Business.php:39-66` — `category()`, `amenities()` BelongsToMany, `user()` BelongsTo, `reviews()` HasMany all exist.
- `backend/laravel/app/Models/User.php:15-16` — `#[Hidden(['password', 'remember_token'])]`; safe to expose `name`/`email`.
- `backend/laravel/app/Models/Amenity.php:18-21` — `name`, `slug` fillable.
- `frontend/next/src/app/businesses/[id]/page.tsx` — sole frontend edit target; `ReviewList` reused.
- `frontend/next/src/types/business.ts:1-16` — `Business` type; `average_rating`, no `owner`.
- `frontend/next/src/components/ReviewList.tsx` — presentational, empty-state handled.
- `frontend/next/e2e/auth-flow.spec.ts:32-40` — regression guard (detail heading + Reviews heading).
- Laravel Boost rules apply (artisan `make:test`, Pint `--dirty`). Next.js rule: `dist/docs/` caching guide covers `connection()`/`instant=false`.

## Learning objectives

- API composition: one detail page composes business + owner + amenities + reviews from separate endpoints.
- Eager loading (`with('user','amenities')`) avoids N+1 on the detail route.
- Resource transformation: expose related-model data (`user.name`, `amenity.name`) through `BusinessResource` / new amenities endpoint without over-exposing (password hidden).
- Truthful UI: every displayed value traces to a live endpoint (Day-7 test).

## Ordered implementation steps

1. Backend test first: `php artisan make:test --phpunit BusinessDetailsTest` (RefreshDatabase + Category/Amenity seeders): seeded business with owner + amenities → `GET /api/businesses/{id}` returns 200 with `owner.name`, `amenities` names, reviews; unknown UUID → 404; no owner → owner null handled.
   Rationale: pins the new contract before the route/resource change (repo microtask habit).
2. Backend route: add `GET /api/businesses/{business}/amenities` closure returning amenity names (`$business->amenities()->get()->pluck('name')`), `whereUuid`, `throttle:reads`; update detail route to `->with('user', 'amenities')`.
   Rationale: mirrors the `/reviews` endpoint pattern (D3-12 precedent); separate endpoint keeps `BusinessResource` focused.
3. Backend resource: add `owner` to `BusinessResource` (`'owner' => $this->user ? ['name' => $this->user->name, 'email' => $this->user->email] : null`); keep `category_name` etc.
   Rationale: owner is "business information" on the detail page; eager-loaded user avoids N+1; password stays hidden via `#[Hidden]`.
4. Narrow backend verification: `php -l`, Pint `--dirty`, `BusinessDetailsTest` green, full suite green.
5. Frontend type: extend `Business` with `owner?: { name: string; email: string } | null` (verify resource shape first).
6. Frontend `page.tsx`: render name, category/address, description/type/website/phone block, rating, owner name, amenities list (comma-separated or simple list), reviews via `ReviewList`; preserve `notFound()`, `connection()`, `instant=false`.
   Rationale: single server component, all data fetched in parallel where possible, no client state bugs.
7. Frontend verification: `tsc --noEmit`, `lint`, `vitest` (existing 9/9 + any new), `build` (no backend at build), `git diff --check`.
8. Browser proof (`serve :8000` + `dev :3101`, seeded PG): detail shows owner + amenities + reviews, unknown UUID → 404 page, default view unchanged (E2E still 1/1).

## Tests and verification commands, plus expected results

- `php artisan test --compact tests/Feature/BusinessDetailsTest.php` → new file green.
- Full suite `php artisan test --compact` → 67/67 + new = all green.
- `vendor/bin/pint --dirty --format agent` → clean; `php -l` on touched PHP → clean.
- `npx tsc --noEmit` (frontend/next) → exit 0; `npm run lint` → exit 0; `npm test` → 9/9 existing green.
- `npm run build` → exit 0, `/businesses/[id]` stays dynamic (no backend at build).
- `git diff --check` clean; `git status` shows only intended app paths (+ plan file); D7-01/D7-02 files untouched.
- Browser proof: owner name visible, amenities listed, reviews listed, unknown UUID → 404.

## Risks, dependencies, and unresolved questions

- Risk: eager-loading `amenities` on every detail call adds a query; acceptable for this scale (D2-19 seeded data, ~20 amenities per business max).
- Edge: business with no owner (null `user_id`) → `owner: null` in resource, frontend shows "—" or omits; business with no amenities → empty list.
- Dependency: none new; rate limiter `reads` covers detail fetches.
- Unresolved: whether to expose `owner.email` or only `name` — lean to name only for privacy (email is PII); decide at implement if reviewer prefers name-only.
- Note: D7-01/D7-02 uncommitted work (`page.tsx`, `MEMORY.md`, plan files) exists; D7-03 must not touch those files.

## Plan check

- Confirmed against repo: detail route `api.php:75-77` (`whereUuid` + `throttle:reads`), `BusinessResource` shape (no owner/amenities yet), `Business` relationships `user()`/`amenities()`/`category()`, `User #[Hidden]` password, `Amenity` name/slug, `AmenitySeeder`, all frontend paths incl. `ReviewList` empty-state and E2E guard (detail heading + `Reviews (n)`).
- Finding: repo list filter now uses `?category=<slug>` (commit `4ed7482`) instead of `?category_id`, but D7-03 only touches the detail route + new amenities endpoint — no conflict, scope preserved.
- Finding: `owner.email` exposure recorded as unresolved privacy decision (lean name-only, PII); to be decided at implement time.
- Changes: status → `Checked — awaiting user approval`; date → `2026-10-17`. No scope change; no app code edited.

## Reminder

Implementation is not authorized until the user checks the plan and invokes `/implement "docs/plans/d7-03-improve-business-details-page.md"` with this plan path.

## Implementation outcome

- Backend (Laravel):
  - `routes/api.php`: detail route now `->with('user', 'amenities')`; new `GET /api/businesses/{business}/amenities` returns amenity names (pluck 'name'), `whereUuid` + `throttle:reads`.
  - `BusinessResource.php`: added `owner` (`['name' => $this->user->name, 'email' => $this->user->email]` or null), `amenities` (`$this->amenities?->pluck('name')`), `reviews` (`ReviewResource::collection($this->whenLoaded('reviews'))`). Existing lines untouched.
  - `BusinessDetailsTest.php`: new via `make:test` — 4 tests (match with owner+amenities+reviews, reviews present, unknown UUID 404, no owner → null owner).
- Frontend (Next.js):
  - `types/business.ts`: `Business` extended with `owner?: {name, email} | null`, `amenities?: string[]`, `reviews?: Review[]`.
  - `app/businesses/[id]/page.tsx`: single fetch to detail endpoint (composes business+owner+amenities+reviews); renders name, category/address, owner name, rating, amenities list, full business info block (description, type, website, phone), reviews via `ReviewList`; preserves `notFound()`, `connection()`, `instant=false`.
- Verification:
  - `php -l` clean ×2; Pint `--dirty` passed (fixed unused import in api.php).
  - Laravel narrow: `BusinessDetailsTest` **4/4 green, 14 assertions**.
  - Full Laravel suite **71/71 green, 535 assertions** (baseline 67/67 + 4 new).
  - `npx tsc --noEmit` exit 0; `npm run lint` exit 0; `npm test` **5 files 12/12**; `npm run build` exit 0 (`/businesses/[id]` ◐ partial, no backend at build).
  - `git diff --check` clean; `git status` shows only intended app paths (+ plan file); D7-01/D7-02 files untouched.
  - Browser proof (`dev :3101` + rebuilt compose `laravel`): detail shows amenities ("Pet Friendly, Snorkeling Gear"), full business info block, 8 reviews with ratings/dates; owner omitted when null (correct).
- Notes: compose `laravel` serves baked image — required `docker compose build laravel && up -d` before UI reflected changes (D5-11/D7-02 precedent). No commit made.