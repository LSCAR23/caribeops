# Plan — D3-03: Define Business Type

- **Date:** 2026-10-10
- **Status:** `Implemented — verified`
- **Task:** D3-03 — Define Business Type
- **Plan path:** `docs/plans/d3-03-define-business-type.md`

## Desired outcome

One `export interface Business` in `frontend/next/src/types/business.ts` declares the 12-key Laravel contract, with zero runtime code and `tsc`/`build`/`lint` green.

## Scope

### In scope

1. New `frontend/next/src/types/business.ts` with `Business` matching `BusinessResource` keys and nullability.
2. Re-export-safe, `isolatedModules`-compatible syntax; `@/`-importable.
3. Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`, `git diff --check`.

### Non-goals

- No API client (D3-05), no env config (D3-04), no list/detail UI (D3-06+), no validation logic (D3-14), no Laravel changes (no casts/model/Resource/migration), no dependencies, no `category`/`amenity`/`review` nested objects.

## Analysis carried forward

D3-03 (`docs/day-3-nextjs.md:67-80`) needs a TS shape for the Laravel business response. Evidence: `BusinessResource.php:17-30` 12 keys; migration types + nullable-only-`website`; `StoreBusinessRequest` formats; envelope `{data}` / `{data,links,meta}` from D2-28; no existing business type in `src/`; `tsconfig` strict + `@/*`; `businesses/page.tsx` stub untouched; tree clean. Decimal-serialization ambiguity and envelope-scope risk carried as check items below.

## Current-state evidence and relevant files

- `backend/laravel/app/Http/Resources/BusinessResource.php:17-30` — contract source, no edit.
- `backend/laravel/database/migrations/2026_10_09_213759_create_businesses_table.php:15-28` — types/nullability source.
- New: `frontend/next/src/types/business.ts` — only file created.
- Untouched: `layout.tsx`, `Navigation.tsx`, `businesses/page.tsx`, `tsconfig.json`, all Laravel files.
- References: `docs/day-3-nextjs.md:67-80`; Next.js version-pinned `dist/docs` (implement stage must read before editing per `frontend/next/AGENTS.md`).

## Learning objectives and just-in-time concepts

- Interfaces as API boundaries: one field wrong (`website: string` vs `string | null`) is a compile-time catch instead of a runtime `null` crash.
- `number` vs `string` for decimals; ISO-string timestamps; `export interface` + `isolatedModules` safety.

## Ordered implementation steps

1. Confirm clean tree; re-read `BusinessResource.php`, migration, `tsconfig.json` paths (read-only).
2. Read the version-pinned Next.js `dist/docs` guide on project structure/imports before writing (per `frontend/next/AGENTS.md`).
3. Create `src/types/business.ts`:
```ts
export interface Business {
  id: number;
  category_id: number;
  name: string;
  description: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  website: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
}
```
Keep type-only, no runtime exports, no enums/helpers.
4. From `frontend/next`: `npx tsc --noEmit`, `npm run lint`, `npm run build`; fix only type-file issues.
5. Optional read-only runtime probe against dev API (`GET /api/businesses/1`) to confirm `latitude`/`longitude` JSON primitive; if string, return plan to `/check` instead of silently widening.
6. `git diff --check` + `git status --short` — expect one new file only.

Rationale: smallest increment satisfying the roadmap test; numeric coordinates match validation/factory/test usage; `string | null` is the only nullability the DB allows; no envelopes keeps D3-05 scope intact.

## Tests and verification commands

From `frontend/next`:

```powershell
npx tsc --noEmit
npm run lint
npm run build
git diff --check
git status --short
```

Expected: `tsc` clean; `lint` clean; `build` passes (Next 16.4 Turbopack, routes `/`, `/businesses`, `/analytics` intact); diff = 1 new file. No checks run in planning; these are expectations, not claims.

## Risks, dependencies, unresolved questions

- Decimal mismatch: if probe shows string coordinates, the correct fix is a `/check` revision (widen or normalize in D3-05), not a silent plan deviation.
- Over-typing (envelopes, branded IDs, `Category` unions) rejected as D3-05/D3-06 scope.
- No Laravel drift: any Resource key change returns plan to `/check`.

## Plan check

- Verified paths (Resource 12 keys, migration nullability, no existing type, `@/*` mapping, stub pages, clean tree) by reads; no code edited, no verification commands run beyond reads + `git status`.
- Challenged `latitude`/`longitude: number`: accepted with probe guard — matches `numeric` validation and test payloads; string-observed case explicitly routes back to `/check`.
- Challenged adding `ApiResponse<T>`/paginated wrappers: rejected — D3-05 owns the client; single-interface increment is the roadmap test.
- Challenged `website: string` (non-null): rejected — DB + validation say nullable; `string | null` required.
- Challenged `type` field naming collision with TS keyword: no issue as a property name.
- Status set to `Checked — awaiting user approval`.

## Implementation authorization reminder

Implementation is **not** authorized until you review this checked plan and explicitly invoke `/implement "docs/plans/d3-03-define-business-type.md"`. That invocation is the approval to proceed.

## Implementation outcome

Implemented 2026-10-10 as a type-only increment per plan with no scope change. Note: the plan file did not exist at `/implement` time (prior Plan-mode session was blocked from writing `docs/plans/`), so it was first materialized verbatim from the checked inline deliverable before implementing.

Files:

- `frontend/next/src/types/business.ts` — new `export interface Business` with the 12 `BusinessResource` keys (`id: number`, `category_id: number`, `name/description/type/address/phone: string`, `latitude/longitude: number`, `website: string | null`, `created_at/updated_at: string`); type-only, no runtime exports.
- `frontend/next/src/app/businesses/page.tsx`, `layout.tsx`, `Navigation.tsx`, `tsconfig.json`, all Laravel files — untouched.

Verification (exact commands, all from `frontend/next` unless noted): `npx tsc --noEmit` passed (exit 0, clean); `npm run lint` passed (exit 0, clean); `npm run build` passed (Next 16.4.0 Turbopack, compiled + TypeScript clean, route table `○ /`, `○ /analytics`, `○ /businesses`, `○ /_not-found`); `git diff --check` clean (exit 0); `git status --short` shows only `docs/plans/d3-03-define-business-type.md` + `frontend/next/src/types/` untracked, no tracked modifications. Read version-pinned `node_modules/next/dist/docs/` guides `02-project-structure.md` + `06-fetching-data.md` before writing, per `frontend/next/AGENTS.md`. Optional live-API coordinate probe not run (no serve/PG interaction); `number` typing kept per `numeric` validation + test payloads, with the plan's `/check`-return guard intact if a string is ever observed. No dependencies added; nothing committed.
