# D5-20 — Compare Before and After

**Task:** D5-20 — Compare Before and After
**Date:** 2026-10-13
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-19
> precedent recorded in `MEMORY.md`.

**Desired outcome:** `docs/performance.md` gains a `D5-20` section with the
query, both medians, the index DDL, and honest observations — reproducible by a
third party.

**Scope:** Fresh after-median (warmup + 5, same method) + count proofs + doc
append. Before-numbers reused from record with dataset-sameness proof.

**Non-goals:** No re-measuring "before" (would require dropping the landed index
— forbidden), no new indexes/queries, no app/compose changes, no commit.

## Analysis carried forward

Before 0.251 (D5-17) / after ≈0.29 (D5-19) medians; counts `40|320` proven at
every stage; `performance.md` structure; `git` clean at `7638e66`.

## Current-state evidence

- D5-17 outcome (medians + method), D5-19 outcome (post median + node-identical
  plan)
- `docs/performance.md:1-15+` (voice/structure to match), `postgres.go:150-160`
  (query text)
- `docs/day-5-integration-performance.md:335-357`

## Learning objectives and just-in-time concepts

One-variable comparisons; reusing recorded baselines when dataset-sameness is
proven; negative-result reporting; reproduction recipes as the reproducibility
test.

## Ordered implementation steps

1. Prove same dataset: row counts (`40|320`) + index present (`pg_indexes`) —
   the reproducibility preconditions.
2. Fresh after-median as `analytics`: warmup + 5 timed `EXPLAIN (ANALYZE)` runs
   of the exact UI-default query (same text/role/method as D5-17). Rationale:
   matches D5-17's discipline run-for-run; confirms the after-state rather than
   quoting it.
3. Append `## D5-20` to `docs/performance.md`: query text, before median (D5-17,
   cited), index DDL, after median (step 2), observations (node-identical plans,
   overlapping noise bands, hash-join-rightly-kept verdict, scale caveat), and
   a reproduction recipe (exact commands). Rationale: the spec's five headings,
   in the file's voice.
4. Sanity: counts still `40|320` (read-only throughout).
5. `git diff --check` clean; `git status --short` → only `performance.md` (+
   new plan file).

## Tests and verification commands, plus expected results

- After-median on record; section contains all five spec headings (the task's
  test); a reader can re-run from the recipe.
- Counts intact; `diff --check` clean.

## Risks, dependencies, and unresolved questions

- If the fresh after-median diverges wildly from ≈0.29 (environmental noise),
  record both and say so — never smooth data.
- Daemon down → report blocked.

## Plan check

- Challenged before-reuse vs re-measure: reuse wins — dropping the index to
  re-prove "before" destroys the D5-19 landing it would validate;
  dataset-sameness is proven by repeated count checks, and the after-side is
  freshly re-measured. Methodology stated, not hidden.
- Challenged 3-run vs 5-run after-median: 5 wins — matches D5-17's discipline
  exactly, keeping the comparison apples-to-apples.
- Challenged scope creep (re-analyzing the plan): rejected — D5-18 owns the
  autopsy; D5-20 compares numbers.
- Verified: spec headings, numbers' provenance, file paths, slug free, `git`
  clean, read-only safety, no secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-13, no commit).

**Files changed:** `docs/performance.md` appended (`## D5-20` section, +59
lines); plan file materialized at this path verbatim from the checked inline
deliverable — no scope change. No app/compose/DB changes (read-only throughout).

**Verification (exact commands/results — the task's test):**
- Preconditions: counts `40|320`, `reviews_business_id_index` present (same
  dataset + index proven before measuring).
- Fresh after-median as `analytics` (warmup `0.329` + 5 timed: `0.276 / 0.284 /
  0.298 / 0.282 / 0.274`) → **0.282 ms**, consistent with D5-19's ≈0.29 (no
  wild divergence; both recorded per the never-smooth-data rule).
- Section contains all five spec headings (query / before 0.251 / index DDL /
  after 0.282 / observations) plus a runnable reproduction recipe (the task's
  test: a reader can re-run the exact discipline).
- Observations recorded honestly: node-identical plans, overlapping noise
  bands, hash-join-rightly-kept verdict, scale caveat, dataset-sameness proof,
  and why "before" is reused (dropping the index to re-prove it would destroy
  the landing).
- `git diff --check` clean (LF/CRLF advisory only); `git status --short` → only
  `performance.md` modified (+ new plan file).
