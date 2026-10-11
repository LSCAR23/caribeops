# Plan — D3-10: Create Business Details Route

- **Date:** 2026-10-11
- **Status:** `Implemented — verified`
- **Task:** D3-10 — Create Business Details Route
- **Plan path:** `docs/plans/d3-10-create-business-details-route.md`

## Desired outcome

Each business name on `/businesses` links to `/businesses/{id}`, and that URL
renders a route placeholder (heading + identifier) instead of a 404. No data
is fetched yet — D3-11 owns that.

## Scope

### In scope

1. Edit `src/components/BusinessList.tsx`: wrap each business name in
   `next/link` `<Link href={`/businesses/${business.id}`}>`, keeping styles.
2. New `src/app/businesses/[id]/page.tsx`: async Server Component awaiting
   `params`, rendering a "Business {id}" heading + "Details coming soon"
   placeholder in page-matching styles. Per-request rendering like the list
   (`await connection()`), so builds stay Laravel-independent.

### Non-goals

- No `GET /api/businesses/{id}` call, no detail content, no reviews (D3-11/12);
  no `notFound()`/unknown-id handling (D3-11, with the fetch); no
  `generateStaticParams`/prerendering of ids; no loading/error files for the
  segment (inherit segment behavior; D3-11 may add); no Laravel changes;
  no dependencies.

## Analysis carried forward

D3-10 (`docs/day-3-nextjs.md:202-217`) needs the `/businesses/[id]` route with
click-to-URL navigation as its only test. Evidence: no `[id]` directory;
list names are unlinked text; `src/app/api/` empty; tree clean, slug free.
No open material question; fetch stays in D3-11.

## Current-state evidence and relevant files

- Edited: `src/components/BusinessList.tsx:28-30` (link host).
- New: `src/app/businesses/[id]/page.tsx` — sole route addition.
- Untouched: `src/app/businesses/page.tsx`, `loading.tsx`, `error.tsx`,
  `src/types/*`, all Laravel files.
- References: `docs/day-3-nextjs.md:202-231`; version-pinned
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`
  + `dynamic-routes.md` (implement must read before writing, per
  `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Dynamic segments: the `[id]` folder turns a URL part into the `params`
  prop — one route file serves every business id.
- Async `params`: Next 16 passes `params` as a `Promise`; awaiting it keeps
  rendering request-time and build-safe.
- `<Link>`: client-side transition to the new segment (prefetchable), unlike
  `<a>` full reloads.

## Ordered implementation steps

1. Confirm clean tree; re-read BusinessList + list page (read-only).
2. Read the version-pinned `page` + `dynamic-routes` references before writing.
3. Edit `BusinessList`: `import Link from "next/link"`; wrap the name `<p>`
   content in `<Link href={`/businesses/${business.id}`}>` preserving classes
   (link styling: keep text style + hover underline).
4. Create `src/app/businesses/[id]/page.tsx`: `await connection()`;
   `const { id } = await params` (typed `Promise<{ id: string }>`); heading
   `Business {id}` + placeholder line; same container/styles as list page.
5. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`
   (Laravel-independent; `/businesses/[id]` dynamic, no prerendered ids);
   repo-root `git diff --check` + `git status --short` — expect 1 edit + 1 new.
   Live proof (production `next start` on non-`:3000` port, `:8000` Laravel
   healthy): `/businesses` HTML contains `href="/businesses/1"` (or another
   seeded id); opening `/businesses/1` renders the placeholder with that id.
   Rationale: link + shell is the smallest slice proving route mapping while
   leaving D3-11 its natural fetch increment.

## Tests and verification commands

```powershell
# from frontend/next (+ repo root for git)
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Plus the link-href + placeholder proof above. Expected: all checks clean;
diff = 1 edit + 1 new file. No checks run in planning.

## Risks, dependencies, unresolved questions

- `params` must be awaited as a `Promise` — sync access fails type-check.
- Placeholder asserts only the id from the URL (no invented business data).
- Unknown ids (e.g. `/businesses/999999`) render the same placeholder until
  D3-11 adds fetch + `notFound()` — accepted, documented, not a bug for D3-10.
- No open questions.

## Plan check

- Verified paths (no `[id]`, unlinked names, empty `src/app/api`, clean tree,
  free slug) by reads/listings; no code edited.
- Challenged fetching detail data now: rejected — consumes D3-11's scope;
  roadmap test is navigation-only.
- Challenged adding segment loading/error files: rejected — inherit; D3-11
  decides with the fetch in place.
- Challenged `generateStaticParams`: rejected — speculative prerendering
  requiring Laravel at build time.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and
explicitly invoke `/implement "docs/plans/d3-10-create-business-details-route.md"`.
That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-11 as planned; no scope deviation. Note: the plan file did
not exist at `/implement` time (prior Plan-mode session was blocked from writing
`docs/plans/`), so it was first materialized verbatim from the checked inline
deliverable before implementing (same as D3-06–09).

Files:

- `frontend/next/src/components/BusinessList.tsx` — business names wrapped in
  `next/link` `<Link href={`/businesses/${business.id}`}>` (text style kept +
  hover underline). Sole edit.
- `frontend/next/src/app/businesses/[id]/page.tsx` — new: async Server
  Component, `await connection()` (per-request, Laravel-independent builds),
  `const { id } = await params`, `Business {id}` heading + `Details coming
  soon.` placeholder in list-matching styles.

Mechanism note (loud, not silent): the `PageProps<"/businesses/[id]">` helper
fails type-check (`"/businesses/[id]"` does not satisfy `AppRoutes`) — used the
guide's primary manual typing `{ params: Promise<{ id: string }> }` instead.

Verification (exact commands, all from `frontend/next` unless noted):
`npx tsc --noEmit` clean (exit 0); `npm run lint` clean;
`npm run build` passed (Next 16.4.0; `/businesses/[id]` dynamic, no prerendered
ids, Laravel-independent); `git diff --check` clean (LF→CRLF notice on
`BusinessList.tsx` only); `git status --short` shows 1 edit + 1 new route +
1 new plan file. Version-pinned `dynamic-routes` reference read before writing.
No Laravel changes, no dependencies. Nothing committed.

Live proof (production `next start` on `:3101`, `:8000` Laravel healthy with
40 rows): `/businesses` HTML contains `href="/businesses/1"`;
`/businesses/1` returns 200 with `Business <!-- -->1` + `Details coming soon.`
(React SSR comment separators, no invented business data). Proof server
stopped.
