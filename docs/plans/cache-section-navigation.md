# Plan: Cachear datos y navegación entre secciones

- **Task**: "ahora hay que resolver un problema que observo, cada que cambio de sección las páginas vuelven a cargarse desde cero así como volver hacer peticiones, esto no debería manejarse con cierta cache?"
- **Date**: 2026-10-23
- **Status**: Implemented 2026-10-23 — verified (tsc 0, eslint 0, vitest 58/58, build 0, e2e 1/1, before/after benchmark, live read-your-own-writes check)

## Desired outcome

Moverse entre Dashboard, Businesses y Analytics (y volver) se siente inmediato:

1. **Caché en el servidor (Next)**: las lecturas a Laravel y Go se guardan unos minutos y se comparten entre visitas. Cambiar de sección no vuelve a pedir lo mismo a las APIs mientras el dato siga fresco.
2. **Caché en el navegador**: al volver a una sección visitada hace poco, el router reutiliza lo que ya tiene sin ir al servidor.
3. **Datos frescos tras tus cambios**: al crear un negocio o una reseña, se invalida justo lo afectado y lo ves al instante (read-your-own-writes).

## Scope

- Nueva capa de datos `frontend/next/src/lib/data.ts` con funciones cacheadas (`"use cache"` + `cacheLife` + `cacheTag`).
- Las páginas y las secciones de Analytics llaman a esas funciones en vez de `apiGet`/`analyticsGet` directo; se quita `await connection()`.
- `next.config.ts`: `experimental.staleTimes.dynamic` para el caché del navegador.
- Server Action `src/app/actions/revalidate.ts` que llama a `updateTag` después de las mutaciones; `NewBusinessForm` y `ReviewForm` la invocan tras el POST exitoso.

## Non-goals

- No se cambian las APIs de Laravel/Go, ni la autenticación (el token sigue en `localStorage`; los POST siguen yendo del navegador a Laravel).
- No se cachea nada por usuario: todas las lecturas cacheadas son públicas.
- No se rehace la estructura para "instant navigation" completa (mover `searchParams` dentro de `<Suspense>`, quitar `instant = false`). Es una mejora posible para después.
- La animación de entrada del animal se repite al cambiar de sección **a propósito** (es del diseño). No es una recarga, pero se percibe parecido. Ver "Decisiones".

## Analysis carried forward

Evidencia del repositorio (2026-10-23):

1. **Todo es por request y sin caché.** Cada página (`(app)/page.tsx`, `analytics/page.tsx`, `businesses/page.tsx`, `businesses/[id]/page.tsx`, `businesses/new/page.tsx`) hace `await connection()` y exporta `instant = false`. Con `cacheComponents: true`, `fetch` no se cachea por defecto, y `connection()` obliga a renderizar en cada request. Resultado: cada navegación vuelve a pedir todo a Laravel y Go.
2. **El navegador tampoco reutiliza**: con páginas dinámicas, `staleTimes.dynamic` vale 0 por defecto (Next ≥15), así que el router pide la página al servidor en cada visita.
3. **Las lecturas son públicas y no llevan token en el servidor**: `authHeaders()` (`src/lib/auth.ts`) devuelve `{}` del lado del servidor (no existe `window`), y todas las rutas GET de `backend/laravel/routes/api.php` son públicas (solo `throttle:reads`). Por eso se puede compartir el caché entre usuarios sin riesgo.
4. **Mutaciones actuales**: `NewBusinessForm` hace POST `/api/businesses` y navega al detalle; `ReviewForm` hace POST de la reseña y llama `router.refresh()`. Hoy funcionan porque nada se cachea; con caché, hace falta invalidar.
5. **Beneficio extra**: menos peticiones contra `throttle:reads` de Laravel.

Documentación consultada (Next 16.4.2, `node_modules/next/dist/docs/`): `01-getting-started/08-caching.md`, `09-revalidating.md`, `03-api-reference/.../cacheLife`, `use cache`, `staleTimes`.

## Concepto (just-in-time)

- **`"use cache"`** en una función async guarda su resultado. Los argumentos forman la clave: `getBusinesses({ page: 2 })` y `getBusinesses({ page: 3 })` son entradas distintas.
- **`cacheLife('minutes')`**: el navegador puede usarlo 5 min sin preguntar (`stale`); el servidor lo regenera en segundo plano si tiene más de 1 min (`revalidate`); expira a la hora sin tráfico (`expire`).
- **`cacheTag('businesses')`** le pone una etiqueta. **`updateTag('businesses')`**, desde una Server Action, invalida todo lo que lleve esa etiqueta al instante.
- **`staleTimes.dynamic`**: cuántos segundos el router del navegador reutiliza una página dinámica ya visitada sin volver a pedirla.

## Learning objectives

1. Diferenciar las dos capas de caché: servidor (`use cache`) y cliente (Client Cache / `staleTimes`).
2. Diseñar claves y etiquetas de caché a partir de los parámetros reales (página, búsqueda, categoría, rango de fechas, id).
3. Invalidación por etiquetas tras una mutación (read-your-own-writes) frente a expiración por tiempo.
4. Por qué solo se cachean datos públicos (nunca algo que dependa del token).

## Ordered implementation steps

1. **Medir antes**: con Playwright sobre un build de producción, contar las peticiones a Laravel/Go y el tiempo al navegar Dashboard → Businesses → Analytics → Dashboard. Sirve de línea base.
2. **`src/lib/data.ts`**: una función cacheada por lectura, con `cacheLife('minutes')` y etiquetas:

   | Función | Origen | Tags |
   |---|---|---|
   | `getDashboardSummary()` | Laravel `/api/dashboard/summary` | `businesses` |
   | `getCategories()` | Laravel `/api/categories` | `categories` |
   | `getBusinesses({category, search, page})` | Laravel `/api/businesses` | `businesses` |
   | `getBusiness(id)` → `Business \| null` | Laravel `/api/businesses/{id}` | `businesses`, `business:{id}` |
   | `getOverview(from, to)` | Go `/analytics/overview` | `analytics` |
   | `getBusinessesByCategory(from, to)` | Go | `analytics` |
   | `getReviewsByMonth(from, to)` | Go | `analytics` |
   | `getTopBusinesses(from, to)` | Go | `analytics` |

   - `getBusiness` devuelve `null` ante un 404 en vez de lanzar el error, para que la página siga llamando a `notFound()` sin depender de que la clase `ApiError` atraviese el límite del caché. Los demás errores se siguen lanzando (no se cachean) y las secciones mantienen su `try/catch` y su aviso de "no disponible".
   - Los argumentos son valores simples (strings/null), nunca promesas de `searchParams`.
3. **Páginas y secciones**: reemplazar las llamadas directas por las de `data.ts` y quitar `await connection()`. Se mantienen `<Suspense>`, los esqueletos y `instant = false`.
4. **Caché del navegador**: `experimental.staleTimes: { dynamic: 30 }` en `next.config.ts`. Volver a una sección visitada en los últimos 30 s no toca el servidor.
5. **Invalidación tras mutaciones**: `src/app/actions/revalidate.ts` (`"use server"`):
   - `afterBusinessCreated()` → `updateTag('businesses')`, `updateTag('analytics')`, `updateTag('categories')`.
   - `afterReviewCreated(id)` → `updateTag('business:' + id)`, `updateTag('businesses')`, `updateTag('analytics')`.
   - `NewBusinessForm` la llama tras el POST exitoso y antes de `router.push`. `ReviewForm`, antes de su `router.refresh()`.
   - La acción solo invalida (no recibe datos ni escribe nada), así que exponerla sin token no permite más que forzar una recarga del caché.
6. **Tests**: nuevos tests de `data.ts` con `fetch` simulado (404 → `null`, error → lanza, parámetros → URL correcta), simulando también `next/cache` (`cacheLife`/`cacheTag` solo funcionan dentro del runtime de Next). Los tests existentes deben seguir 53/53.
7. **Medir después** con el mismo script y comparar.
8. Actualizar este plan y `MEMORY.md` con resultados reales.

## Tests & verification

Desde `frontend/next`:

| Comando | Esperado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` | 0 errores |
| `npm test` | 53 existentes + nuevos de `data.ts`, todos en verde |
| `npm run build` | OK, sin errores `next-request-in-use-cache` |
| `E2E_BASE_URL=http://127.0.0.1:3000 npx playwright test` (+ stub :3101) | 1/1 |
| Script de medición (antes/después) | Menos peticiones a Laravel/Go al repetir secciones y navegación más rápida |
| Manual: crear reseña y negocio | Aparecen de inmediato (la invalidación funciona) |

## Risks, dependencies, open questions

- **Datos con minutos de atraso**: cambios hechos por otros (u otra pestaña, o el seeder) pueden tardar hasta ~1 min en verse en el servidor y hasta 30 s en el navegador. Tus propias altas se ven al instante gracias a `updateTag`.
- **Caché en memoria**: en `next start`/dev el caché vive en la memoria del proceso; se pierde al reiniciar (aceptable en este proyecto).
- **`staleTimes` es experimental** en Next 16.4; si da problemas, se quita sin afectar al caché del servidor.
- **Dev vs prod**: en `next dev` el caché se comporta distinto (HMR); la medición se hace sobre `next build` + `next start`.

## Decisiones (con default recomendado)

1. **Frescura**: `cacheLife('minutes')` + `staleTimes.dynamic: 30` (default). Alternativa más agresiva: `hours`.
2. **Animación del animal al cambiar de sección**: se mantiene (default). Alternativa: que aparezca solo la primera vez por sesión.

## Plan check

Revisado contra el repositorio el 2026-10-23:

- ✅ `cacheComponents: true` y `partialPrefetching: true` ya están activos en `next.config.ts`; `use cache`, `cacheLife`, `cacheTag` y `updateTag` están disponibles en Next 16.4.2 (docs locales).
- ✅ Las 5 páginas con `await connection()` y las 4 secciones de Analytics que llaman a `analyticsGet` existen.
- ✅ No hay lecturas autenticadas del lado del servidor: el caché compartido es seguro.
- ✅ `searchParams`/`params` se leen en la página (fuera del caché) y se pasan como strings: cumple la restricción de `use cache`.
- ⚠️ Ajuste aplicado: `getBusiness` devuelve `null` en 404 (en vez de depender de `instanceof ApiError` a través del caché).
- ⚠️ Ajuste aplicado: la invalidación usa `updateTag` (solo en Server Actions), por eso se agrega una acción en vez de llamar desde el cliente.
- Medición antes/después incluida, para no afirmar mejoras sin evidencia.

## Implementation outcome (2026-10-23)

Approved by the user: "aprobado, implementalo ade que cuando termines quiero que actualices laravel".

Built:
- `frontend/next/src/lib/data.ts`: 8 cached reads (`"use cache"` + `cacheLife("minutes")` + tags `businesses`, `business:{id}`, `categories`, `analytics`). `getBusiness` returns `null` on 404.
- Pages/sections now read through it: `(app)/page.tsx`, `analytics/page.tsx`, `businesses/page.tsx`, `businesses/[id]/page.tsx`, `businesses/new/page.tsx`, `GoKpiSection`, `CategorySection`, `MonthlySection`, `TopSection`.
- **Deviation from step 3 (found while implementing):** `await connection()` stays on the Dashboard and New business pages. They read no URL data, so without it Next would prerender them at build time and the build would need Laravel/Go running. Rendering stays per request; the cached reads are reused across requests. Removed it from Analytics, Businesses list and detail (they already read `searchParams`/`params`).
- `next.config.ts`: `experimental.staleTimes.dynamic: 30`.
- `src/app/actions/revalidate.ts`: `afterBusinessCreated()` / `afterReviewCreated(id)` with `updateTag`; called (best-effort) by `NewBusinessForm` before `router.push` and by `ReviewForm` before `router.refresh()`.
- Tests: new `src/lib/__tests__/data.test.ts` (5 tests: URL building, 404 → null, 500 throws, range query, tags); `ReviewForm.test` mocks the action and asserts it runs with the business id.

Benchmark (production build on :3200, token injected, nav clicks Businesses → Analytics → Dashboard ×2; time until h1 present and no `aria-busy`):

| | Businesses | Analytics | Dashboard | Businesses | Analytics | Dashboard | Laravel reads |
|---|---|---|---|---|---|---|---|
| Before (no cache) | 447 ms | 194 ms | 398 ms | 363 ms | 388 ms | 383 ms | 7 |
| After, cold cache | 443 ms | 184 ms | 90 ms | 47 ms | 53 ms | 47 ms | 3 |
| After, warm cache | 381 ms | 143 ms | 63 ms | 53 ms | 48 ms | 49 ms | 0 |

Repeat visits went from ~360–400 ms to ~50 ms. The first visit to a section in a new browser session still costs ~400 ms (loading that route's code + first data). Go requests are not counted (the Go service does not log requests).

Read-your-own-writes, live on the dev server (:3000): posted a review through the UI → "Reviews (13)" became "Reviews (14)" immediately and stayed 14 after navigating away and back. The temporary review ("CACHE-CHECK temp review") was then deleted from Postgres (`DELETE 1`). The business-creation path uses the same mechanism but was not exercised live (to avoid creating data).

Verification (from `frontend/next`): `npx tsc --noEmit` exit 0 · `npm run lint` exit 0 · `npm test` **58/58** (12 files) · `npm run build` exit 0 (9 routes, `staleTimes` listed as experiment) · `E2E_BASE_URL=http://127.0.0.1:3000 npx playwright test` **1/1** (throwaway :3101 stub).

Laravel update (requested after this task): `composer update --dry-run` → "Nothing to modify in lock file", no security advisories; `laravel/framework` is already **v13.38.0 = latest** (released 2026-10-20); the container reports `Laravel Framework 13.38.0`. The only newer direct package is `phpunit/phpunit` 12.5.40 → 13.4.3 (major, dev-only), not applied.
