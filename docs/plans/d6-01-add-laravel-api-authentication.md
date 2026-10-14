# D6-01 — Add Laravel API Authentication

**Task:** D6-01 — Add Laravel API Authentication
**Date:** 2026-10-14
**Status:** `Checked — awaiting user approval`

> Note: this plan was orchestrated in a Plan-mode session that was blocked from
> writing `docs/plans/`, so the checked inline deliverable is materialized here
> verbatim before implementation (no scope change), following the D4-03…D5-21
> precedent recorded in `MEMORY.md`.

**Desired outcome:** Sanctum installed, configured, and migrated; every
boot/init path exits clean — the capability exists, nothing is enforced yet.

**Scope:** Sanctum via the framework's install flow + `personal_access_tokens`
migration on dev DB + full-suite green + compose image rebuild for vendor
parity.

**Non-goals:** No `HasApiTokens` trait (inert without issuance — D6-02 owns
first token issuance; kept only if the installer adds it as framework-default),
no route middleware, no login/logout/me endpoints (D6-02/03/04), no `APP_KEY`
generation (flagged Day-6 follow-up), no frontend changes, no commit.

## Analysis carried forward

No auth package/routes/trait; users table + factory ready; `APP_KEY` blank
(Bearer-safe, flagged); `git` clean at `e0553df`.

## Current-state evidence

- `composer.json:8-22` (no auth package), `routes/api.php` (all public),
  `User.php:10-18` (stock)
- `database/migrations/` (no tokens table),
  `docs/day-6-security-testing.md:27-58`

## Learning objectives and just-in-time concepts

Authn-vs-authz split; Bearer tokens for service consumers; install flows
(`install:api`) vs manual wiring; vendor parity between host and image.

## Ordered implementation steps

1. Inspect the installer contract first: `php artisan install:api --help` (and
   `composer show laravel/sanctum` if already resolvable) — follow the
   framework's documented flow, manual `composer require` + publish only as
   fallback. **Never hand-pin a Sanctum major** — composer owns Laravel-13
   compatibility. Rationale: framework flows stay correct across versions;
   guesses rot.
2. Run the install (adds package + `config/sanctum.php` + tokens migration, or
   documented equivalent); record the installed version (`composer show
   laravel/sanctum`) in the outcome. Then `php -l` on touched PHP +
   `vendor/bin/pint --dirty --format agent` (Boost rules).
3. `php artisan migrate --database=pgsql --no-interaction` (additive tokens
   table; dev data untouched) + `migrate:status` shows it applied.
4. Boot-clean proof (the task's test): `php artisan route:list` exit 0; `php
   artisan test --compact` (full suite — guards the added provider/config
   against regressions).
5. Compose parity (D5-11 lesson): `docker compose build laravel && up -d
   laravel` (vendor/ is baked into the image) → `healthy` + `:8000/api/businesses`
   200 live rows.
6. `git diff --check` clean; `git status --short` → package/config/migration
   files (+ new plan file).

## Tests and verification commands, plus expected results

- Installer exit 0; migration applied; `route:list` exit 0; full suite green.
- Rebuilt container healthy, API live. `git diff --check` clean.

## Risks, dependencies, and unresolved questions

- Packagist unreachable → report blocked (no code change).
- `install:api` shape differs on Laravel 13 → follow `--help`, record actual
  commands in outcome (plan adapts, scope doesn't).
- `APP_KEY` still blank — recorded follow-up, not this task.

## Plan check

- **Revision 1:** added explicit never-hand-pin rule — version compatibility is
  composer's job; a pinned wrong major is the classic auth-install footgun.
- **Revision 2:** added `composer show` version recording (Boost foundation
  rule: confirm installed versions, don't assume).
- **Revision 3:** added compose rebuild + health re-proof — vendor/ is
  image-baked, so dependency changes otherwise leave the serving container
  stale (D5-11 lesson applied proactively).
- Challenged trait inclusion: deferred (inert without issuance; D6-02 owns it)
  unless the installer adds it by default.
- Challenged Sanctum-vs-alternatives: spec's own suggestion + Bearer fit for
  the Next consumer; flagged, not silent.
- Verified: absence evidence on all three axes (package/routes/trait), chain/
  test-DB safety (additive table, suite covers), slug free, `git` clean, no
  secrets.

## Reminder

Implementation is not authorized until the user reviews this checked plan and
explicitly invokes `/implement` with this plan path — which, note, also approves
the Sanctum dependency addition.

## Implementation outcome

**Status:** `Implemented — verified` (2026-10-14, no commit).

**Files changed:** `backend/laravel/composer.json` (+1 line:
`laravel/sanctum ^4.0`, composer-resolved) + `composer.lock` (sanctum `v4.3.3`
locked; incidental `framework` 13.35→13.36 + `prompts` bump via
`--with-all-dependencies`) + new `config/sanctum.php` + new migration
`2026_10_13_181728_create_personal_access_tokens_table.php`; plan file
materialized at this path verbatim from the checked inline deliverable — no
scope change. Existing `routes/api.php` preserved (installer refused to
overwrite); `HasApiTokens` NOT added (installer instructs it; deferred to D6-02
per plan — inert without issuance).

**Verification (exact commands/results — the task's test):**
- `php artisan install:api --without-migration-prompt --no-interaction` → exit
  0 (contract inspected via `--help` first; no version hand-pinned).
- `composer show laravel/sanctum` → `v4.3.3`; provider auto-discovered
  (`package:discover` lists sanctum).
- `php -l` on the new migration → clean; `vendor/bin/pint --dirty --format
  agent` → passed.
- `php artisan migrate --database=pgsql` → tokens migration `DONE` (batch 3);
  `migrate:status` chain intact (dev data untouched).
- `php artisan route:list` → exit 0 (`LASTEXITCODE=0`; route table unchanged).
- `php artisan test --compact` → **18/18 green, 309 assertions**.
- `docker compose build laravel && up -d laravel` (vendor parity) →
  `healthy`; `:8000/api/businesses` 200 live rows.
- `git diff --check` clean; `git status --short` → exactly the 4 intended paths
  (+ new plan file).
