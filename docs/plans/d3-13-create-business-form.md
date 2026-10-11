# Plan — D3-13: Create Business Form (render only)

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-13 — Create Business Form
- **Plan path:** `docs/plans/d3-13-create-business-form.md`

## Desired outcome

`/businesses/new` renders a styled form with all submittable fields
(name, description, category select, type, address, latitude, longitude,
website, phone) fed by live category data. Fields accept input; nothing
submits yet (D3-15) and nothing validates client-side (D3-14).

## Scope

### In scope

1. Laravel: `CategoryResource` (id, name, slug) via `make:resource`;
   `GET /api/categories` returning the collection ordered by name;
   `CategoriesTest` (200 + 3 seeded slugs + keys).
2. Frontend: `src/types/category.ts`; `GET` categories in the new page;
   `src/app/businesses/new/page.tsx` (Server Component) + presentational
   `BusinessForm` with labeled inputs (names matching the API contract),
   category `<select>` from live data, latitude/longitude number inputs,
   unwired submit button.
3. "New business" link on the list page to reach the form.

### Non-goals

- No submit handler/network request (D3-15); no client validation (D3-14);
  no success/error UI (D3-09 segment boundary covers failures later);
  no nav-bar entry; no new segment loading/error files (inherited);
  no other Laravel changes; no dependencies.

## Analysis carried forward

D3-13 needs a render-only form; D3-14/15 own validation/submission.
Evidence: no form/route/endpoint; static `new` beats `[id]`; no categories
source (user chose endpoint over hardcode); backend requires lat/lng the
spec omits (included as flagged extension); tree clean, slug free.

## Current-state evidence and relevant files

- New: `CategoryResource.php`, `CategoriesTest.php`, `category.ts`,
  `businesses/new/page.tsx`, `BusinessForm.tsx`; edited: `routes/api.php`,
  `businesses/page.tsx` (link only).
- Untouched: `StoreBusinessRequest.php` (contract source),
  `BusinessList.tsx`, `[id]` page, segment fallbacks, seeders.
- References: `docs/day-3-nextjs.md:259-296`; version-pinned
  `node_modules/next/dist/docs/` forms guide (implement reads before writing,
  per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Server-rendered forms: HTML inputs accept input natively — interactivity
  (D3-14) and submission (D3-15) layer on later without rewriting fields.
- FK selects: constrained choices come from a dedicated endpoint, never
  hardcoded UUIDs; input `name`s mirror API keys for future `FormData`.

## Ordered implementation steps

1. Confirm clean-enough tree; re-read request rules + seeder slugs (read-only).
2. Read the version-pinned forms guide before writing.
3. Laravel: `make:resource CategoryResource`; route
   `CategoryResource::collection(Category::orderBy('name')->get())`;
   `make:test CategoriesTest` (seed → 200, slugs fragment, keys).
4. Frontend: `category.ts` type; `new/page.tsx` fetches
   `ApiCollectionResponse<Category>`; `BusinessForm` with all 9 inputs +
   select + submit button; list-page "New business" link.
5. Verify: `pint --dirty`, `php artisan test --compact`,
   `npx tsc --noEmit`, `npm run lint`, `npm run build`;
   live proof on `:3101`: form HTML contains all field names + the 3
   category options; type into fields (assert via markup, no JS needed);
   `git diff --check`.
   Rationale: endpoint over hardcode keeps UUIDs live; server-rendered
   form satisfies the render-only test with zero JS churn risk.

## Tests and verification commands

```powershell
# from backend/laravel
vendor/bin/pint --dirty --format agent
php artisan test --compact
# from frontend/next
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: suite green incl. new test; all checks clean; diff = resource +
route + test + type + page + form + list link. No checks run in planning.

## Risks, dependencies, unresolved questions

- Latitude/longitude inputs exceed the spec's 7 fields — required because
  the backend rejects submissions without them; flagged here for review.
- Unwired submit button does nothing yet — explicit non-goal, D3-15 wires it.
- Category select depends on seeded slugs (hotels/restaurants/tours).
- No open questions; category-source answer recorded above.

## Plan check

- Verified no form/route/endpoint, `[id]` non-conflict, request contract,
  clean tree, free slug; no code edited.
- Challenged hardcoding categories: rejected per your answer — endpoint it is.
- Challenged Client Component now: rejected — render test needs no JS;
  D3-14 converts without field churn.
- Challenged omitting lat/lng per spec: rejected — form would be
  DOA in D3-15; included and flagged.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-13-create-business-form.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation. Note: the plan file already existed at `/implement` time (written during `/orchestrator` under the earlier build-mode session), so no verbatim materialization was needed.

Files:

- `backend/laravel/app/Http/Resources/CategoryResource.php` — new via `php artisan make:resource` (id, name, slug).
- `backend/laravel/routes/api.php` — new `GET /api/categories` (`CategoryResource::collection(Category::orderBy('name')->get())`).
- `backend/laravel/tests/Feature/CategoriesTest.php` — new via `php artisan make:test` (stub replaced): 200, 3 rows, name order, keys, slug fragments.
- `frontend/next/src/types/category.ts` — new `Category` interface (string ids).
- `frontend/next/src/app/businesses/new/page.tsx` — new Server Component (`await connection()` + `export const instant = false`, fetches `ApiCollectionResponse<Category>`).
- `frontend/next/src/components/BusinessForm.tsx` — new presentational form: 9 labeled inputs (names mirror the API contract), live category `<select>`, lat/lng number inputs with API bounds, unwired submit button.
- `frontend/next/src/app/businesses/page.tsx` — "New business" link only.

Verification (exact commands): `vendor/bin/pint --dirty --format agent` passed; `php artisan test --compact` green (14 tests / 284 assertions, incl. 1 new); `npx tsc --noEmit` clean (exit 0); `npm run lint` clean; `npm run build` passed (Next 16.4.0; `/businesses/new` is `◐ Partial Prerender`, Laravel-independent); live proof on production `:3101` vs fresh local `:8001` — form HTML contains all 9 field names, submit button, all 3 live category options, and the list page links to `/businesses/new`; `git diff --check` clean. Temp `.env.local` override restored with final rebuild. Both proof servers stopped. Nothing committed.
Note: `:8000`/`:3000` Docker images predate this task — rebuild both before relying on container endpoints for the form/categories.
