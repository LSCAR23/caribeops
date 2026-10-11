# Plan — D3-12: Display Reviews (incl. D3-11 detail fetch)

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-12 — Display Reviews
- **Plan path:** `docs/plans/d3-12-display-reviews.md`

## Desired outcome

`/businesses/{uuid}` shows the business (name + category/address/rating,
closing the unimplemented D3-11) plus its reviews (rating/title/content/date
each), fetched from a dedicated `GET /api/businesses/{business}/reviews`
endpoint. Unknown UUIDs render Next's 404 via `notFound()`.

## Scope

### In scope

1. Laravel: new `ReviewResource` (id, business_id, rating, title, content,
   review_date, created_at, updated_at); new
   `GET /api/businesses/{business}/reviews` returning
   `ReviewResource::collection($business->reviews()->orderByDesc('review_date')->get())`
   with `whereUuid('business')`; new `BusinessReviewsTest` (200 + structure
   + count + business match; unknown-uuid 404; garbage 404).
2. Frontend: new `src/types/review.ts`; `ApiCollectionResponse<T>` envelope
   (`{data: T[]}`) in `api.ts`; rewrite `[id]/page.tsx` to fetch business +
   reviews in parallel (`Promise.all`), `notFound()` on `ApiError` 404 or
   missing data; new presentational `ReviewList` (rating/title/content/date).
3. Verification incl. live proof (two businesses show their own reviews;
   unknown uuid → 404 page; list page unchanged).

### Non-goals

- No embedding reviews in `BusinessResource`; no review pagination/filtering;
  no custom `not-found.js`; no new segment loading/error files (inherited);
  no review creation endpoints (Day 4+); no Laravel changes beyond the above;
  no dependencies.

## Analysis carried forward

D3-12 needs per-business reviews; D3-11's fetch was never implemented
(D3-10 placeholder stands; "D3-11" commit = UUID migration). User decisions:
fold D3-11 into D3-12, then dedicated endpoint over embedding (correction
recorded). Evidence: no reviews route/resource; detail GET exists with
`whereUuid`; `ApiItemResponse` awaits use; segment fallbacks cover `[id]`;
8 seeded reviews/business; slug free.

## Current-state evidence and relevant files

- Edited: `routes/api.php` (new route, D2-22 detail host),
  `[id]/page.tsx:1-25` (fetch host).
- New: `ReviewResource.php`, `BusinessReviewsTest.php`, `review.ts`,
  `ReviewList.tsx`; edited: `api.ts` (envelope).
- Untouched: `BusinessResource.php`, list page, `BusinessList.tsx`,
  segment `loading.tsx`/`error.tsx`, factories/seeders.
- References: `docs/day-3-nextjs.md:220-255`; version-pinned
  `node_modules/next/dist/docs/` dynamic-routes + `notFound` references
  (implement reads before writing, per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Dedicated nested endpoints: `/reviews` under the business keeps list
  payloads lean and gives reviews an independent contract/test target.
- Implicit binding as scope: `{business}` resolves-or-404s, so reviews can
  never leak across businesses.
- Parallel fetch + `notFound()`: independent requests go out together;
  unknown ids become a proper 404 state, not an empty page.

## Ordered implementation steps

1. Confirm clean-enough tree; re-read detail route, Review model, seeder,
   api-client (read-only); confirm `ReviewResource`/`whereUuid` conventions.
2. Laravel: `php artisan make:Resource ReviewResource --no-interaction`
   (or hand-write mirroring `BusinessResource`); add the reviews route
   after the detail route with `whereUuid`.
3. Add `BusinessReviewsTest` (seed → pick business → assert 8 shaped rows
   + business_id match; dead uuid + garbage → 404).
4. Frontend: `review.ts`, `ApiCollectionResponse`, `ReviewList`,
   rewrite `[id]/page.tsx` (parallel fetch, `notFound()` on 404).
5. Verify: `pint --dirty`, `php artisan test --compact`,
   `npx tsc --noEmit`, `npm run lint`, `npm run build` (Laravel-independent);
   live proof on `:3101` vs healthy API: two detail pages show distinct
   correct review sets, unknown uuid → 404, list page byte-unchanged in
   behavior; `git diff --check`.
   Rationale: dedicated endpoint keeps the D3-12 test ("reviews match the
   business") directly assertable; parallel fetch avoids waterfalls;
   `notFound()` closes D3-11's missing unknown-id story.

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
route + test + 2 types/envelope + page rewrite + ReviewList. No checks run
in planning. Fresh-DB work only on disposable/dev DBs.

## Risks, dependencies, unresolved questions

- Review order fixed as `review_date` desc (deterministic; documented).
- `reviews_avg_rating` stays list-only; detail shows per-review ratings.
- Review content is seeded Faker text — proof asserts match-by-business_id,
  not fixed strings.
- No open questions; both user scope answers recorded above.

## Plan check

- Verified no reviews route/resource, placeholder detail page, existing
  detail GET + `whereUuid`, envelope readiness, inherited fallbacks, free
  slug; no code edited.
- Challenged embedding reviews in `BusinessResource`: rejected per your
  corrected answer — dedicated endpoint it is.
- Challenged doing D3-11 separately first: rejected per your answer — folded,
  with `notFound()` closing its unknown-id gap.
- Challenged review pagination/custom 404 page: rejected — out of scope.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-12-display-reviews.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned (folded D3-11 detail fetch + dedicated
reviews endpoint, per your scope answers); no scope deviation. Note: the plan
file did not exist at `/implement` time (prior Plan-mode session was blocked
from writing `docs/plans/`), so it was first materialized verbatim from the
checked inline deliverable before implementing.

Files:

- `backend/laravel/app/Http/Resources/ReviewResource.php` — new via
  `php artisan make:Resource` (id, business_id, rating, title, content,
  review_date, timestamps).
- `backend/laravel/routes/api.php` — new
  `GET /api/businesses/{business}/reviews`
  (`ReviewResource::collection($business->reviews()->orderByDesc('review_date')->get())`,
  `whereUuid`); D2-22 detail route reused unchanged for the D3-11 fetch.
- `backend/laravel/tests/Feature/BusinessReviewsTest.php` — new via
  `php artisan make:test` (replaced stub): shaped 2-row scoped collection
  with cross-business exclusion, unknown-uuid 404, garbage 404.
- `frontend/next/src/types/review.ts` — new `Review` interface (string ids).
- `frontend/next/src/types/api.ts` — new `ApiCollectionResponse<T>`.
- `frontend/next/src/components/ReviewList.tsx` — new presentational list
  (title, rating · date, content; `No reviews yet.` empty state).
- `frontend/next/src/components/BusinessList.tsx` — `formatRating` exported
  for reuse (sole touch).
- `frontend/next/src/app/businesses/[id]/page.tsx` — rewritten: parallel
  `Promise.all` detail + reviews fetch, `notFound()` on `ApiError` 404 or
  missing data, other errors rethrown to the segment boundary; business
  header + `Reviews (n)` + `ReviewList`.

Verification (exact commands): `vendor/bin/pint --dirty` passed;
`php artisan test --compact` green (13 tests / 265 assertions, incl. 3 new);
`npx tsc --noEmit` clean; `npm run lint` clean; `npm run build` passed
(Next 16.4.0, `[id]` dynamic, Laravel-independent); `git diff --check` clean.
Live proofs — API on fresh local `:8001`: list 40/15 uuid ids, detail-by-uuid
200, unknown-uuid 404, garbage 404; Next on `:3101`: two detail pages render
distinct correct businesses (`Kerluke-Towne`; `Bartoletti, Mills and Davis`)
with review content + `Reviews (` headings, list page unchanged, unknown uuid
fires `notFound()` (boundary `"404: This page could not be found."` wired in
payload; server log clean). Serve log corroborates parallel business+reviews
calls and 404s. Temp `.env.local` override restored with final rebuild.
All proof servers stopped. Nothing committed.
Honest limitation (same as D3-09): the not-found UI paints client-side, so its
text is not curl-capturable — boundary wiring proven server-side.
Follow-up: `:8000`/`:3000` Docker images predate this task — rebuild both
before relying on container endpoints for reviews.
