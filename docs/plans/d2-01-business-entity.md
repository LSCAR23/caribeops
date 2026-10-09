# Plan — D2-01: Design the Business Entity

- **Date:** 2026-10-09
- **Status:** Implemented
- **Task:** D2-01 — Design the Business Entity

## Desired outcome

Document the proposed PostgreSQL design for a CaribeOps business entity in a Markdown file under `docs/`, then link that design from the D2-01 roadmap entry. The design must distinguish a broad category from a more specific business type and identify every column's database type and nullability before any business migration is written.

## Scope

- Add `docs/business-entity-design.md` with the table design, field meanings, requiredness, and relevant integrity rules.
- Update the D2-01 section in `docs/day-2-laravel-postgresql.md` to point to the design document.
- Treat `website` as the sole nullable business attribute, per the user's clarification.
- Include the planned category relationship as a required `category_id` because D2-03 calls for a category foreign key and the domain defines Category 1-to-many Business.

## Explicit non-goals

- Do not create or modify Laravel migrations, models, routes, API behavior, or tests.
- Do not design categories, amenities, reviews, or business ownership beyond what is needed to explain the business/category relationship.
- Do not change unrelated roadmap or architecture documentation.

## Analysis carried forward

- D2-01 currently lists `id`, `name`, `description`, `type`, `address`, `latitude`, `longitude`, `website`, `phone`, and timestamps, but does not choose types or requiredness. Evidence: `docs/day-2-laravel-postgresql.md`, D2-01.
- The roadmap's next business-schema task (D2-03) requires a foreign key to categories. The project overview describes Category 1-to-many Business in `docs/README.md`.
- There is no business table, model, migration, or business test in the Laravel application yet; the current models and migrations are Laravel starter files. PostgreSQL is the intended Docker database.
- The user clarified that **category** is the broad group (for example, Hotel, Restaurant, Tour) and **type** is the specific kind (for example, Boutique hotel, Hostel, Café, Snorkeling tour). Only `website` may be absent when a business is created. The user wants the design documented in a `.md` file inside `docs/`.
- The user's example table presents Business, Category, and Type as separate concepts; it supports the distinction above but does not establish final database types or validation rules.

## Current-state evidence and relevant files

- `docs/day-2-laravel-postgresql.md` — D2-01 field list and D2-03 category-FK requirement.
- `docs/README.md` — core domain entities and Category 1-to-many Business relationship.
- `backend/laravel/config/database.php` and `docker-compose.yml` — PostgreSQL support and the intended local database connection.
- `backend/laravel/.agents/skills/laravel-best-practices/rules/migrations.md` — guidance on deliberate foreign keys, indexes, and honest schema decisions; relevant context for documenting a design that will later be migrated.

## Learning objectives and just-in-time concepts

- **Relational modeling:** represent the broad category as a foreign key instead of repeating category labels on each business row; use `type` for the more specific kind.
- **Nullability:** `NOT NULL` means the database requires a value; `website` is nullable because it is the one field the user permits to be absent.
- **PostgreSQL types:** use bounded `varchar` for short labels/contact values, `text` for long descriptions and addresses, and `numeric` for decimal geographic coordinates rather than floating-point approximation.
- **Integrity constraints:** document primary/foreign keys and coordinate ranges so later migrations can enforce valid relationships and latitude/longitude bounds.

## Ordered implementation steps

1. Add `docs/business-entity-design.md` with a concise purpose statement and a column table covering name, PostgreSQL type, nullability, meaning, and any constraint.
2. Record the agreed distinction with examples: category is the broad group (Hotel/Restaurant/Tour); type is the specific kind (Boutique hotel/Hostel/Café/Snorkeling tour).
3. Document the recommended initial shape:

   | Column | Proposed PostgreSQL type | Nullable | Notes |
   |---|---|---:|---|
   | `id` | `bigint` identity primary key | No | Laravel-compatible generated identifier. |
   | `category_id` | `bigint` foreign key to `categories.id` | No | Required broad category; relationship specified by D2-03. |
   | `name` | `varchar(255)` | No | Business display name. |
   | `description` | `text` | No | Business description; the user says website is the only optional field. |
   | `type` | `varchar(120)` | No | Specific business kind within its category; keep it as text rather than a fixed database enum for this initial design. |
   | `address` | `text` | No | Address as one required displayable value for this task. |
   | `latitude` | `numeric(10,7)` | No | Add a range constraint from -90 through 90. |
   | `longitude` | `numeric(10,7)` | No | Add a range constraint from -180 through 180. |
   | `website` | `text` | Yes | Optional URL; application-level URL validation belongs to a later API task. |
   | `phone` | `varchar(32)` | No | Text preserves `+` and formatting; no country-specific normalization in this task. |
   | `created_at`, `updated_at` | `timestamp` | No | Laravel-managed timestamps, populated for persisted businesses; distinguish these system-managed values from user-entered fields. |

   Keep the concrete lengths and coordinate precision as proposed design choices for review. Explain that `numeric(10,7)` gives exact decimal storage at the selected precision and that the geographic bounds are integrity constraints, not format validation. In the later migration task, verify Laravel's timestamp-helper nullability and explicitly enforce the design's non-null requirement if needed.
4. Add a short relationship/integrity section describing `categories.id` as the referenced key and the category delete policy as a point for D2-03 migration review rather than silently assuming cascade behavior.
5. Update D2-01 in `docs/day-2-laravel-postgresql.md` to link to `docs/business-entity-design.md` and identify it as the design artifact to review before D2-03 creates the businesses table.
6. Read both edited documents together and check that the roadmap field list, category/type semantics, sole optional field, and proposed design are consistent.

## Tests and verification

This is a documentation-only task; Laravel tests and migrations are out of scope.

- Run `git diff --check` — expect no whitespace errors in tracked-file edits.
- Inspect `git status --short` and read the complete new `docs/business-entity-design.md` plus the edited D2-01 roadmap section — expect the two planned documentation paths only, and verify the untracked new file directly (ordinary `git diff` does not include it).
- Verify manually that all listed fields are covered, only `website` is nullable among business attributes, `category_id` is documented as required, and coordinate ranges match latitude/longitude conventions.
- Do not claim that `git diff --check` validates the untracked design document; review its contents and whitespace directly before staging.

## Risks, dependencies, and unresolved questions

- D2-03 must implement the documented category foreign key; its delete behavior should be chosen deliberately there. The design document will flag this instead of implying cascade deletion.
- The roadmap asks for fields, PostgreSQL types, and requiredness but does not prescribe exact string bounds or coordinate precision. The values above are recommendations for review, not existing repository facts.
- The `type` value is planned as bounded text rather than a database enum or separate lookup table; if type values later need a controlled vocabulary, that decision can be revisited with domain evidence.
- Laravel's `timestamps()` helper may create nullable columns by convention. Since the design marks persisted-record timestamps as required, the later migration task must confirm the installed framework behavior and enforce non-null timestamps explicitly if that helper does not satisfy the design. Timestamp values are system-managed, not user-supplied creation fields.
- Requiring coordinates and a category follows the user's “only website” optionality answer plus the established category relationship. If the user intends an exception for `category_id` or coordinates, resolve it during `/check` before implementation.
- Address is modeled as one required `text` value for this microtask; splitting it into structured address fields is outside current evidence and scope.

## Plan check

- Confirmed that the proposed documentation paths exist within the established `docs/` structure and that no prior plan uses this path.
- Confirmed D2-03 is the roadmap evidence for including required `category_id`, while `docs/README.md` specifies Category 1-to-many Business. Preserved this dependency without pulling category-table implementation into D2-01.
- Kept database field widths, coordinate precision, and the text representation of `type` explicitly framed as design recommendations rather than repository-established facts.
- Corrected verification: an ordinary `git diff` omits an untracked new document, so the plan now requires direct review of the new file and checks `git status`.
- Called out the Laravel timestamp nullability convention as an implementation detail for the later migration, while preserving the agreed expectation that persisted businesses have managed timestamps.
- No unresolved preference is blocking the documentation task; no application code or tests are in scope.

## Authorization checkpoint

The checked plan was approved when the user invoked `/implement "docs/plans/d2-01-business-entity.md"`.

## Implementation outcome

- Added `docs/business-entity-design.md` with the proposed business columns, PostgreSQL types, nullability, category/type meanings, coordinate bounds, and migration considerations.
- Updated the D2-01 entry in `docs/day-2-laravel-postgresql.md` to link to the design and summarize the agreed field semantics.
- Updated `MEMORY.md` with the actual documentation-only outcome and verification status.
- Verification: `git diff --check` passed for tracked edits. The new design document was separately checked for required columns, the sole nullable user-provided attribute, and coordinate bounds; no Laravel tests or migrations were run because runtime code did not change.
