# D7-30 — Add review comments + search-as-you-type

**Status:** Checked — awaiting user approval

User request: "add the option to comment to a business and fix the search bar — it must search while the text changes, not with a button."

## Analysis carried forward

### Evidence (gathered 2026-10-20)

1. **No write route for reviews.** `backend/laravel/routes/api.php` exposes `GET /api/businesses/{business}/reviews` (line 83) only. `POST /businesses` (line 87) is the closest write precedent: `StoreBusinessRequest`, `->response()->setStatusCode(201)`, `->middleware(['auth:sanctum', 'can:...'])`, `->whereUuid('business')` on PUT/DELETE (line 97/103).
2. **Reviews schema** (`2026_10_09_223250_create_reviews_table.php`): uuid PK, `business_id` FK cascade, `rating` int (PG CHECK 1–5), `title` string, `content` text, `review_date` date, timestamps. **No author column.** `Review::$fillable` already includes `business_id, rating, title, content, review_date`. `ReviewResource` returns the 8 keys pinned by `BusinessReviewsTest::REVIEW_KEYS`.
3. **Authorization landscape:** only `app/Policies/BusinessPolicy.php` exists (`create` = `role !== 'viewer'`; update/delete = admin/owner). No `ReviewPolicy`, no review-related `can:` gate anywhere. Demo account `test@example.com` is a `viewer`. `RequireAuth` is mounted in the root layout (`app/layout.tsx:40`) → every rendered page is already authenticated; the form needs no auth branching.
4. **Detail page** (`app/businesses/[id]/page.tsx`): server component, `instant = false`, single endpoint supplies `business.user/amenities/reviews`; `ReviewList` renders them under `<SectionHeading>Reviews ({business.reviews.length})</SectionHeading>` (line 132–135). The `load('user', 'amenities', 'reviews')` call (line 76) has **no review ordering** → new rows append at the end of the list.
5. **Search flow:** `SearchInput.tsx` is an uncontrolled input + `Search` submit button → `router.push(buildUrl(...))`. The page mounts it with `key={search ?? ""}` (`app/businesses/page.tsx:97`) — the input remounts on every search change (works for submit-per-search; fatal for typing: focus would be destroyed on each URL update). `buildUrl` preserves `category`, drops `page` (search resets pagination — correct). `CategoryFilter` already receives `currentSearch` and preserves it. Page reads `searchParams.search`; param name stays unchanged.
6. **Write-island conventions:** `NewBusinessForm` pattern = `SubmitStatus` union state (`idle|pending|error`), pending guard + `pointer-events-none opacity-70` wrapper, `apiPost<ApiItemResponse<T>>`, catch → generic `role="alert"` message. `api-client.ts` throws `ApiError(status, message, body)`; `authHeaders()` attached automatically. `router.refresh()` is not used anywhere yet — confirm it exists in this Next version's docs (`node_modules/next/dist/docs/`) before relying on it (frontend AGENTS.md block).
7. **Rate limiting:** `AppServiceProvider` — `reads` = 60/min per IP. Each `/businesses` navigation runs **two** server-side `apiGet`s (businesses + categories). A 300 ms debounce only fires between typing pauses, so typing stays far below the budget; accepted risk.
8. **Test baselines:** backend `php artisan test --compact` = **71/71 passed, 535 assertions, 13 s** (run 2026-10-20). Frontend = **32 tests / 8 files** (post D7-29). `WriteEndpointAuditTest` pins only login/business PUT-DELETE-PATCH cells → adding a review POST breaks nothing. `BusinessDetailsTest::test_business_detail_returns_reviews` asserts `data.reviews.0.title` with exactly one review → order-safe under DESC sort. No `.ai/rules` directory; Boost MCP not connected → artisan CLI.
9. **Docs:** `docs/api.md` documents every `routes/api.php` endpoint as `### METHOD /path` sections; line 27 currently says write endpoints "also require authorization (`can` policy)" — needs a wording touch since the new write endpoint has no policy.

### Decisions (resolved from evidence; surfaced here for the reviewer)

| # | Decision | Rationale |
|---|---|---|
| D1 | Any authenticated user (including `viewer`) may post a comment: route middleware `auth:sanctum` only, no policy. | Comments are content, not business management; no `ReviewPolicy` exists; the demo account is a viewer and must be able to use the feature. Pinned by an explicit test. |
| D2 | Comment = review with **rating + title + content**, all required; `review_date` set server-side to today. | Schema NOT NULLs + rating CHECK force it; nothing is fabricated server-side. |
| D3 | Comments stay anonymous. | No author column; adding one is a migration (non-goal). |
| D4 | Detail endpoint eager-loads reviews `orderByDesc('review_date')`. | The just-posted comment (dated today) must appear on top; aligns with `GET .../reviews` (line 84); existing test assertion order-safe. |
| D5 | Response = **201** + `ReviewResource`. | Matches `POST /businesses` (line 90) and `BusinessCreationTest::assertCreated()`. |
| D6 | Live search = controlled input + **300 ms debounce** → `router.replace`, but `push` when transitioning from an empty search (ref-tracked, reset by the prop-sync effect). | Typing must not flood history; first search stays back-button-safe per the code's documented intent; external changes (Clear link, back) flow down through the prop-sync effect without a remount. |
| D7 | Remove `key={search ?? ""}` from the page. | Remount-per-search destroys focus while typing; the controlled input now handles external changes. |
| D8 | Comment form sits directly under the `Reviews (n)` heading, above the list. | Discoverability ("add the option" must be obvious) + the refreshed list shows the new comment on top right below the form. |
| D9 | Generic error messages (client empty-field guard + `role="alert"` fallback), `role="status"` success + `router.refresh()`. | Mirrors `NewBusinessForm` (no per-field server-error mapping exists anywhere). |
| D10 | New write endpoint gets **no** new rate limiter. | Sibling `POST /businesses` has none; conventions say no new infra. |

### Non-goals

- No Go/analytics changes; no new dependencies; no database migrations (anonymous comments D3); no `ReviewPolicy`/auth-lib/`RequireAuth` changes; no comment edit/delete; no review pagination or infinite scroll; no screenshot recapture; no search-param rename (`search` stays).
- `docs/api.md` update is limited to **one new endpoint section + the line-27 wording touch** (keeping the existing "every endpoint" claim true); no other docs are created.

### Concepts (what this task teaches)

- Uncontrolled vs controlled inputs; why a `key` remount breaks typing and how prop→state sync replaces it.
- Debounce with `setTimeout` cleanup in an effect; `router.replace` vs `push` history semantics.
- RSC post-mutation refresh: `router.refresh()` re-runs the server component instead of client cache juggling.
- Laravel nested-resource POST: route binding + `FormRequest` + relation `create()` + 201 resource response; middleware auth vs policy authorization as separate layers.
- Eager-load ordering as part of the API contract.

### Questions

None blocking. D1 is the only reversible fork that could have gone either way; it is pinned by a dedicated test and flagged for the plan review.

## Plan

### Part A — comment on a business

**A1. Backend request class.** `php artisan make:request StoreReviewRequest --no-interaction`, then mirror `StoreBusinessRequest` (header comments adjusted):
- `authorize(): true` — with a comment: auth happens in route middleware; no policy by design (D1).
- `rules()`: `rating` → `required|integer|between:1,5`; `title` → `required|string|max:255`; `content` → `required|string`. (`business_id` and `review_date` are not accepted from the client.)

**A2. Route.** In `routes/api.php`: add `use App\Http\Requests\StoreReviewRequest;` (alphabetical, after `StoreBusinessRequest`) and, directly after the `GET /businesses/{business}/reviews` route (line 83–85):

```php
Route::post('/businesses/{business}/reviews', function (StoreReviewRequest $request, Business $business) {
    $review = $business->reviews()->create([
        ...$request->validated(),
        'review_date' => now()->toDateString(),
    ]);

    return (new ReviewResource($review))->response()->setStatusCode(201);
})->whereUuid('business')->middleware('auth:sanctum');
```

**A3. Order detail reviews DESC (D4).** Same file, line 76: change the load to
`$business->load('user', 'amenities', ['reviews' => fn ($query) => $query->orderByDesc('review_date')]);`
(Pint decides the final closure style.)

**A4. Feature test.** `php artisan make:test --phpunit ReviewCreationTest --no-interaction`; model it on `BusinessReviewsTest`/`WriteEndpointAuditTest` (login helper + Bearer header, `RefreshDatabase`, `CategorySeeder` where the factory needs it):
1. authenticated + valid payload → `assertCreated()`, `REVIEW_KEYS` shape, echoed `rating/title/content`, `review_date` == today, `assertDatabaseCount('reviews', n+1)` linked to the route business.
2. **viewer role → 201** (pins D1).
3. anonymous → `assertUnauthorized()`, count unchanged.
4. empty payload → `assertUnprocessable()` + `assertJsonValidationErrors(['rating', 'title', 'content'])`.
5. `rating => 6` → `assertUnprocessable()` + validation error on `rating`.
6. unknown business UUID → `assertNotFound()`, count unchanged; non-UUID segment → `assertNotFound()` (matches `whereUuid` write convention).

**A5. Comment form island.** New `frontend/next/src/components/ReviewForm.tsx` (`"use client"`), props `{ businessId: string }`:
- Fields: `Rating` select (empty placeholder + 1–5, `required`), `Title` text input (`required`, `maxLength={255}`), `Comment` textarea (`required`); shared `labelClassName`/`inputClassName`, `buttonClassName("primary")` "Post comment".
- State per `NewBusinessForm`: `SubmitStatus` union; pending guard + disabled button + `pointer-events-none opacity-70` wrapper.
- Submit: client guard (any field blank/whitespace → `role="alert"` "Please fill in all fields.", no request) → `apiPost<ApiItemResponse<Review>>(`/api/businesses/${businessId}/reviews`, { rating: Number(...), title.trim(), content.trim() })` → clear fields, `role="status"` "Comment posted.", `router.refresh()` (confirmed in bundled `use-router.md` line 46: re-fetches data + re-renders Server Components without losing client state) → catch → `role="alert"` "Could not post your comment. Please try again."

**A6. Mount it.** `app/businesses/[id]/page.tsx`: import `ReviewForm`, render `<ReviewForm businessId={business.id} />` between the `Reviews (n)` heading and `<ReviewList>` (server component renders the island as-is; no state on the server).

**A7. Frontend test.** New `frontend/next/src/components/__tests__/ReviewForm.test.tsx` (mock `next/navigation` → refresh spy; mock `@/lib/api-client` → apiPost spy), ~4 tests: renders the three labeled fields + button; blank submit → alert + apiPost not called; happy path → apiPost payload `{rating: 5, title, content}`, success `role="status"`, `refresh()` called, fields cleared; apiPost rejection → `role="alert"`.

**A8. Docs (existing file only).** `docs/api.md`: insert `### POST /businesses/{business}/reviews` after the `GET .../reviews` section (auth required, request-body table, 201 example, 401/404/422 cases — no 403, no policy), and scope line 27's sentence to business write endpoints.

**A9. Backend verification.** `vendor/bin/pint --dirty --format agent` → then `php artisan test --compact` (baseline 71 → expect **77**, all green).

### Part B — search while typing (no button)

**B1. `SearchInput.tsx` rewrite:**
- Module-level pure `buildUrl(search: string, categorySlug: string | null)` (keeps effect deps clean).
- `const [value, setValue] = useState(currentSearch ?? "")` + sync effect `useEffect(() => setValue(currentSearch ?? ""), [currentSearch])` (Clear link / back / external prop changes flow in without a remount).
- Controlled input: `value={value}` + `onChange` → `setValue` (drop `defaultValue`), same id/label/placeholder/`type="search"`.
- **Remove the `Search` button**; keep `<form role="search" onSubmit>` so Enter flushes immediately: cancel the pending timer (ref) then navigate.
- Debounce effect: on `value` change, if `value.trim() === (currentSearch ?? "")` → no-op; else `setTimeout(300 ms)` → navigate with the trimmed text; cleanup clears the timer on every keystroke/unmount.
- Navigation (D6): `push` when the ref says we came from an empty search, `replace` afterwards; the ref resets to "empty" only inside the prop-sync effect (so Clear/back restore push-ability). Never include `page` in the URL (existing behavior).
- Keep the `Clear search` Link and the label; replace the stale "submit (no debounce)" comment with one describing the live-search contract.

**B2. Page.** `app/businesses/page.tsx`: delete `key={search ?? ""}` (line 97); props unchanged.

**B3. Tests.** `SearchInput.test.tsx`: keep tests 2–3 as-is; adjust test 1 (drop the button assertion); add with `vi.useFakeTimers` + `useRouter` spies: (a) typing "beach" → no navigation yet → advance 300 ms → correct URL; (b) empty→text uses `push`, text→text uses `replace`; (c) `fireEvent.submit` (Enter) navigates without advancing timers; (d) `rerender` with `currentSearch=""` clears the input (Clear/back regression). Unmount/other suites must not leak fake timers.

**B4. Verification.** Frontend: `npm test` (9 files; expect ~41 green), `npx tsc --noEmit`, `npm run lint` (0 warnings), `npm run build` (8-route table unchanged), `git diff --check`.

### Stage 3 — live spot-check + memory (after implement)

Dev stack on :3000/:8000 (already up; `npm run dev` background if down), user `test@example.com` / `password`:
1. `/businesses`: **no button**; type slowly → input keeps focus, URL updates per pause, results change; `Clear search` works; category survives typing; new search drops `page`; back button behaves (one step to pre-search state after the first search).
2. Business detail: fill comment → **Post comment** → success status + the comment appears **on top** of the list + `Reviews (n)` increments; full reload persists it.
3. Watch for a 429 during typing (reads budget) — note if seen.

Then update `MEMORY.md` (three sections: files modified, task implemented with the exact test/lint/build results, what the system does now) and flip this plan's status to `Implemented — verified`.

### Files touched (expected)

| File | Change |
|---|---|
| `backend/laravel/app/Http/Requests/StoreReviewRequest.php` | new |
| `backend/laravel/routes/api.php` | new POST route + DESC review load + import |
| `backend/laravel/tests/Feature/ReviewCreationTest.php` | new (~6 tests) |
| `frontend/next/src/components/ReviewForm.tsx` | new |
| `frontend/next/src/components/__tests__/ReviewForm.test.tsx` | new (~4 tests) |
| `frontend/next/src/app/businesses/[id]/page.tsx` | mount form |
| `frontend/next/src/components/SearchInput.tsx` | live search rewrite |
| `frontend/next/src/components/__tests__/SearchInput.test.tsx` | update + ~4 new tests |
| `frontend/next/src/app/businesses/page.tsx` | remove `key` |
| `docs/api.md` | +1 endpoint section, line-27 wording |
| `docs/plans/d7-30-...md`, `MEMORY.md` | workflow artifacts |

No overlap with the uncommitted D7-29 files (`NavLinks.tsx`, `LogoutButton.tsx`, their tests) beyond `MEMORY.md` (append-only edits).

## Plan check

**Verdict: ✅ implementable as written.** Run 2026-10-20, read-only — no application code touched.

Re-verified against the codebase:
- **Line anchors**: `routes/api.php` (detail load line 76, `GET .../reviews` 83–85, `POST /businesses` 87–91 with `setStatusCode(201)` + `can:create`, `whereUuid` on 97/103); businesses page `key={search ?? ""}` at line 97; detail page Reviews section at 132–135; `docs/api.md` GET-reviews section ends at line 241 (insert point right before `### POST /businesses` at 243) and the line-27 policy wording.
- **Rate limit claim**: `AppServiceProvider` = `Limit::perMinute(60)->by($request->ip())` for `reads` — the plan's risk statement is accurate.
- **Next router API**: bundled `use-router.md` (lines 44–46) confirms `push`, `replace`, and `refresh()` exist in this Next version; `refresh()` explicitly re-fetches data and re-renders Server Components without losing client state → the A5 fallback line was removed.
- **Artisan flags**: `make:test --phpunit` + `--no-interaction` confirmed via `--help`; `make:request` uses the global `-n`.
- **Test conventions**: `vi.mock("next/navigation")` appears in 4 existing test files; `vi.mock("@/lib/api-client")` precedent at `LogoutButton.test.tsx:22` — planned mocks match house style.
- **Backend seams**: `Business::reviews()` relation exists (`routes/api.php:83–84` uses it); `Review` fillable covers the create payload; `BusinessDetailsTest` review assertion is single-index (order-safe under DESC); `WriteEndpointAuditTest` contains no review-write cells; backend baseline re-run today = **71/71, 535 assertions, 13 s**.

Contingencies recorded (no structural change needed):
1. `react-hooks/set-state-in-effect` may flag the prop→state sync in B1 (`setValue(currentSearch ?? "")`). D7-29 precedent: a justified `eslint-disable-next-line` is acceptable; fallback is React's previous-prop render-adjustment pattern. `npm run lint` at 0 warnings is the gate either way.
2. Enter-without-button: SearchInput will have exactly one implicit-submission-blocking field, which per the HTML spec still submits on Enter (unlike multi-field forms). Verified live in Stage 3; explicit keydown flush is the one-line fallback.
3. `fireEvent.submit` bypasses jsdom constraint validation → the client-side empty-field guard in A5 (not the `required` attributes) is what the unit test exercises; both are kept.
4. Search navigations keep default scroll-to-top: the search box sits at the top of the page, so typing implies position ≈ top.

Git hygiene: planned edits do not overlap the uncommitted D7-29 files (`NavLinks.tsx`, `LogoutButton.tsx`, their two test files); `MEMORY.md` is already dirty and receives only the usual append-style post-implement update.

## Outcome

_Not implemented._
