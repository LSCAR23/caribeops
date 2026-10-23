# Plan: Revertir el login 3D e implementar la interfaz "ojo del caribe"

- **Task**: "regresa el login a como estaba antes e implementemos esta interfaz para el login [Image 1] utiliza todos los skills que requieras y buscas librerias que nos podrian ayudar a implementar este tipo de interfaz y proponlas para que el desarrollo y el performance de la web se lo mas optimo posible"
- **Date**: 2026-10-22
- **Status**: Implemented 2026-10-23 — approved and executed ("acepta todo con la opción recomendada… tú terminas"); verified (incl. e2e 1/1), screenshots regenerated, 8 commits on `master` (not pushed)

> Este plan se materializa primero en `C:\Users\larao\.opencode\plan\login-ojo-del-caribe-ui.md` por las restricciones de Plan mode (precedente D7-28/D6-27/figma-3d-redesign). **El primer paso de `/implement` es copiarlo a `docs/plans/login-ojo-del-caribe-ui.md`** y operar desde allí.

## Desired outcome

La página `/login` muestra la interfaz del mockup del usuario (fondo fotográfico nocturno aéreo del Caribe con globo luminoso, tarjeta glassmorphism con Email/Password, toggle de visibilidad de contraseña, botón "Log in" con degradado cian y flecha), con:

1. **Revert** del login 3D actual (escena marea + ola de cristal WebGL) a una base limpia.
2. **UI nueva** construida con **next/image + CSS puro, sin JavaScript de globo/canvas** (decisión del usuario: Opción A de rendimiento).
3. Branding **"ojo del caribe"** en el login (texto y logo del mockup); el resto de la app sigue diciendo CaribeOps.
4. **Sin nav** en el login (decisión del usuario): full-bleed, solo título + subtítulo + tarjeta.
5. Lógica de autenticación intacta (`apiPost("/api/login")` → `setToken` → `router.push("/")`), contrato e2e preservado, y la suite de tests crece con un test nuevo para `LoginForm`.

## Scope

**In scope:**
- `frontend/next/src/app/(auth)/login/page.tsx` — revert + reconstrucción full-bleed con `next/image` de fondo.
- `frontend/next/src/components/LoginForm.tsx` — clases del login (locales, sin tocar `lib/ui.ts`) + toggle de visibilidad de contraseña. **Cero cambios en la lógica de auth.**
- `frontend/next/src/components/__tests__/LoginForm.test.tsx` — nuevo (house style: cada cambio de componente lleva tests).
- Eliminación del código 3D del login que queda huérfano tras el revert (`LoginScene`, `three/GlassWaveHero`, `MareaScene`; ver paso 5 y su condición).
- Asset de fondo: `frontend/next/public/login/` (proveído por el usuario; fallback CSS mientras tanto).

**Non-goals (explícitos):**
- No se toca el resto del rediseño 3D en curso sin commitear: route groups `(app)`/`(auth)`, tokens turquesa de `globals.css`, sidebar `Navigation`, `PageContainer`, `GlassWaveAccent` del shell, ni las dependencias `three`/`@react-three/*` (siguen siendo necesarias para `GlassWaveAccent`).
- No se renombra "CaribeOps" fuera del login; no se añade nav/píldoras al login; no hay modo oscuro en otras vistas.
- No cambios de backend/Laravel/Go, no commits, no push.
- No librerías nuevas (ver "Propuesta de librerías" — la opción elegida no requiere ninguna).

## Analysis carried forward

Del `/analize` en esta sesión (evidencia verificada contra el working tree, no asumida):

- **WIP 3D en curso sin commitear** que ya tocó el login: `(auth)/login/page.tsx` usa `LoginScene` (`MareaScene` tone=dusk + `GlassWaveHero` WebGL vía `next/dynamic`, DPR cap 1.75, bloom desktop-only). En HEAD el login era `PageContainer` + `Card` + `SectionHeading` + `LoginForm` (verde/claro).
- **Staged renames**: las 6 rutas movidas a `app/(app)/` y `app/login` → `app/(auth)/login` (URLs sin cambio). Los cambios actuales del login están **en working tree encima del rename en staging** → el revert debe ser por contenido, nunca `git checkout HEAD -- <ruta vieja>`.
- **Dependencias nuevas ya instaladas en el WIP** (`package.json` modificado sin commitear): `three@0.186.1`, `@react-three/fiber@9.8.2`, `@react-three/drei@10.7.9`, `@react-three/postprocessing@3.2.2`. **Se conservan** (las usa `GlassWaveAccent` del shell autenticado).
- **Uso real de los componentes 3D (grep verificado):** `LoginScene` solo lo importa el login; `GlassWaveHero` solo lo importa `LoginScene`; `MareaScene` solo lo importa `LoginScene`; `useParallax` solo lo importa `MareaScene`; `GlassWave` lo usan `GlassWaveHero` **y** `GlassWaveAccent` (este último vive en `(app)/layout.tsx` → **`GlassWave.tsx` se conserva**).
- **Contratos que el nuevo login debe respetar:**
  - `e2e/auth-flow.spec.ts`: `getByLabel("Email")`, `getByLabel("Password")`, `getByRole("button", { name: "Log in" })`, redirect a `/` tras login.
  - `RequireAuth` (root layout): anónimos rebotan a `/login`; autenticados rebotan de `/login` a `/`.
  - `LoginForm` tiene **cero tests unitarios propios** (confirmado por glob y por el plan 3D previo) — su verificación hoy es manual/e2e.
- **`lib/ui.ts` es compartido**: `inputClassName`/`buttonClassName`/`labelClassName` los consumen `BusinessForm`, `SearchInput`, `CategoryFilter`, etc. Restilizarlos reestilizaría toda la app → las clases del login nuevo viven **locales** en `LoginForm.tsx`.
- **`sharp` disponible** (`node_modules/sharp/package.json` existe) y `frontend/next/public/` existe → `next/image` optimizado funciona. `next.config.ts` no define `images` (config por defecto).
- **AGENTS.md del frontend (obligatorio):** Next 16.4.0 con breaking changes; leer `node_modules/next/dist/docs/` (guía de `image`, `font`, `link`) **antes** de editar.
- **Decisiones del usuario (2026-10-22):** (1) revert **solo del login**, conservar el resto del WIP 3D; (2) branding **"ojo del caribe"** en el login; (3) fondo = **foto + CSS, sin globo JS** (next/image + glass CSS); (4) **sin nav** en el login.
- **Investigación de librerías** (el buscador web no devolvió resultados en este entorno; propuestas basadas en conocimiento establecido, tamaños aproximados):
  - **Opción A elegida — cero dependencias nuevas:** `next/image` (incluido; AVIF/WebP + `priority` + placeholder = mejor LCP), `backdrop-filter` CSS localizado con fallback `supports-[backdrop-filter]`, keyframes CSS ya existentes (`anim-breach`, bloque `prefers-reduced-motion`), iconos SVG inline (patrón actual del repo; `lucide-react` ~0.5 KB/icono queda como alternativa no elegida).
  - Opción B descartada por decisión del usuario: globo WebGL reutilizando `three`+`@react-three/*` ya instalados (~150–200 KB gz solo en el chunk del login, lazy-load).
  - Opción C descartada por innecesaria/pesada: `react-globe.gl`/`three-globe`, Spline (`@splinetool/react-viewer`, escenas remotas), `motion`/Framer Motion (~40 KB gz; el sistema CSS existente cubre la coreografía).

## Current-state evidence and relevant files

- `frontend/next/src/app/(auth)/login/page.tsx` — login actual (WIP 3D): `<main>` full-bleed + `LoginScene` + tarjeta glass con `anim-breach`.
- `frontend/next/src/components/LoginForm.tsx` — lógica auth (idle→pending→error|success, `apiPost`, `setToken`, `push("/")`), usa clases de `lib/ui.ts`, sin toggle de ojo.
- `frontend/next/src/components/three/{LoginScene,GlassWaveHero,GlassWaveAccent,GlassWave}.tsx`, `frontend/next/src/components/MareaScene.tsx`, `frontend/next/src/lib/useParallax.ts` — escenas del WIP.
- `frontend/next/src/app/(app)/layout.tsx` — shell autenticado con `Navigation` + `GlassWaveAccent`.
- `frontend/next/e2e/auth-flow.spec.ts` — contrato e2e del login.
- `frontend/next/src/lib/ui.ts` — primitivas compartidas (**no tocar**).
- `frontend/next/src/app/globals.css` — tokens nocturnos turquesa + `anim-breach` + bloque reduced-motion (reutilizables por el login nuevo).
- `frontend/next/public/` — destino del asset de fondo.

## Learning objectives

- **Revert quirúrgico sobre un rename en staging**: restaurar contenido sin destruir el historial de renames (por qué no funciona `git checkout HEAD -- ruta-vieja`).
- **Rendimiento de un hero fotográfico**: `next/image` con `fill`/`sizes`/`priority`, LCP, AVIF/WebP, placeholder difuminado, y por qué una foto optimizada le gana a un canvas WebGL de fondo.
- **Glassmorphism accesible**: `backdrop-filter` localizado, fallback opaco con `supports-[backdrop-filter]`, scrim de contraste para texto WCAG AA sobre foto variable.
- **Estilos locales vs primitivas compartidas**: por qué el login nuevo no toca `lib/ui.ts`.
- **A11y de un toggle de contraseña**: `type="button"`, `aria-label` dinámico ("Show/Hide password"), `aria-pressed`, y por qué no rompe `getByLabel`.
- **Testing de un formulario con mocks** (house style `vi.hoisted` + `vi.mock("next/navigation")`/`@/lib/api-client`).

## Ordered steps

### 0. Copiar el plan a `docs/plans/`
Primer paso de `/implement` (precedente D7-28). Operar desde `docs/plans/login-ojo-del-caribe-ui.md`.

### 1. Leer la documentación de Next 16 (obligatorio, AGENTS.md)
`frontend/next/node_modules/next/dist/docs/` — guías de `image` (y `font`/`link` si se tocan). Confirmar API de `next/image` en 16.4 antes de escribir el componente.

### 2. Revert del login a base limpia (contenido, no git)
Reescribir `frontend/next/src/app/(auth)/login/page.tsx` en el path nuevo con el contenido equivalente al HEAD (sección + `Card` + `LoginForm`), descartando el import de `LoginScene` y la tarjeta glass 3D. Esto deja el árbol compilando y desacopla el login del WebGL. **Rationale:** el usuario pidió "volver a como estaba" como base; hacerlo por contenido preserva el rename `(auth)` ya staged.

### 3. Detener aquí y presentar el estado intermedio (gate rápido)
Confirmar en navegador que `/login` carga la versión base y que el e2e contract sigue vivo antes de construir encima. Si algo falla, se corrige aquí, no en el paso siguiente.

### 4. Asset de fondo (dependencia del usuario)
- El usuario provee la imagen limpia del mockup (foto aérea nocturna del Caribe **con el globo**, sin UI encima) en `frontend/next/public/login/caribbean-night.webp` (jpg/png también sirve; next/image lo transcodará).
- Mientras no exista el asset, la página usa un **fallback CSS** (gradiente nocturno profundo navy→teal coherente con los tokens) para que build/tests no dependan del archivo. El paso 6 reemplaza el fallback por la foto con un solo import.

### 5. Limpieza del código 3D huérfano del login (borrado condicional)
Eliminar `frontend/next/src/components/three/LoginScene.tsx`, `three/GlassWaveHero.tsx` y `frontend/next/src/components/MareaScene.tsx` (quedan sin importadores tras el paso 2). **Conservar** `three/GlassWave.tsx` y `three/GlassWaveAccent.tsx` (los usa el shell autenticado) y `lib/useParallax.ts` **solo si** tras el borrado queda sin importadores (grep antes de borrar). No tocar `package.json`. *Si el usuario prefiere conservar los archivos sin uso, este paso se salta sin más cambios.*

### 6. UI nueva del login (foto + CSS, sin JS de escena)
**`app/(auth)/login/page.tsx`** (server component, sigue siendo estático — build sin Laravel):
- `<main>` full-bleed `relative min-h-dvh`; fondo con `next/image` (`fill`, `sizes="100vw"`, `priority`, `object-cover`, `alt=""` decorativo) + scrim vertical (gradiente navy translúcido) garantizando contraste AA del texto blanco; `aria-hidden` en la capa decorativa.
- Contenido centrado (`relative z-10`, `max-w-md`, responsive): logo approximado del mockup (SVG inline de ola/ojo, `aria-hidden`) + wordmark "ojo del caribe", `<h1>Log in</h1>`, subtítulo "Sign in with your ojo del caribe account.".
- La tarjeta glass y el form viven dentro de `LoginForm` (paso 7) para no partir el island en dos archivos de server/cliente.

**`components/LoginForm.tsx`** (isla client; lógica intacta):
- Tarjeta glass: `rounded-2xl border border-white/25 bg-[rgba(6,25,32,0.55)] p-7 shadow-…` + `supports-[backdrop-filter]:backdrop-blur` (fallback opaco = el mismo bg sin alpha; patrón de la casa).
- Campos con icono leading (mail / lock, SVG inline, `aria-hidden`), inputs con borde claro y foco cian, **toggle trailing para el password**: `<button type="button">` con `aria-label` dinámico `Show password`/`Hide password` que alterna `type="text"|"password"`. No rompe `getByLabel("Password")` (button ≠ textbox).
- Botón submit píldora con degradado cian y flecha →; copy "Log in" / estado pending "Logging in…" (contrato e2e intacto).
- Alertas `role="alert"` ("Invalid email or password.") y `role="status"` **sin tocar su copy** (el backend responde igual para email desconocido y password errónea — D6-02).
- **Clases locales** definidas en el propio archivo; `lib/ui.ts` queda intacto para el resto de la app.
- Entrada con `anim-breach` + respeto al bloque `prefers-reduced-motion` ya existente.

### 7. Tests nuevos: `components/__tests__/LoginForm.test.tsx`
House style (`vi.hoisted` + `vi.mock("next/navigation")` + `vi.mock("@/lib/api-client")`, `@testing-library/react`):
1. Renderiza `Email`/`Password`/`Log in` y el botón de toggle con `aria-label="Show password"`.
2. Toggle cambia el tipo del input a `text` y el `aria-label` a `Hide password` (y viceversa).
3. Happy path: submit → `apiPost` con `{email, password}` → `setToken` → `router.push("/")`.
4. Rechazo de la API → `role="alert"` genérico, sin verter el cuerpo de la respuesta.
5. Doble submit con pendiente → una sola llamada (guard existente).

### 8. Verificación completa (desde `frontend/next/`)
- `npm test` — 46 existentes + ~5 nuevos, 0 fallos.
- `npx tsc --noEmit` — exit 0.
- `npm run lint` — exit 0, sin warnings ni disables nuevos.
- `npm run build` — exit 0 (el login sigue estático; three.js ya no entra en su chunk).
- `git diff --check` — exit 0.
- Preview en navegador (dev server en host con `$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"` + `$env:NEXT_PUBLIC_ANALYTICS_URL="http://127.0.0.1:8080"`, per AGENTS.md): fondo/scrim/gradiente, glass con y sin `backdrop-filter`, foco de teclado visible, toggle, error genérico, login real con `test@example.com`/`password` → redirect a `/`, y **emulación de `prefers-reduced-motion`**.
- E2E opcional si el stack está arriba: `npm run test:e2e` (1/1 esperado).

## Tests and verification commands

| Comando | Resultado esperado |
|---|---|
| `npm test` (en `frontend/next/`) | 51/51 (46 previos + 5 LoginForm) |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0, 0 warnings |
| `npm run build` | exit 0; sin chunk three.js en `/login` |
| `git diff --check` | exit 0 |
| Preview manual :3000 | mockup reproducido, AA verificado, toggle OK, login real redirige a `/` |
| `npm run test:e2e` (stack arriba) | 1/1 |

## Risks, dependencies, and unresolved questions

- **Dependencia principal:** el asset de fondo. Sin él se entrega con el fallback CSS gradiente (seguirá viéndose bien pero no es el mockup). Se pedirá al usuario al inicio del paso 4.
- **Contraste sobre foto variable:** el scrim es obligatorio; si la foto que llegue es muy clara en la zona del texto, se ajusta el scrim (no el tamaño de fuente).
- **Borrado de archivos (paso 5):** acción destructiva sobre WIP del usuario; queda condicionada y marcada para que pueda vetarla al revisar el plan.
- **Renames en staging + cambios en working tree:** el paso 2 los respeta haciendo el revert por contenido.
- **Docker:** el contenedor `next` está parado (el dev corre en host); la imagen de producción necesita `sharp` — fuera de alcance aquí, se anota si se retoma el deploy Docker.
- **Logo exacto del mockup:** se aproxima con SVG inline; si el usuario provee el SVG original, se sustituye en un minuto (mismo paso 6).

## Approval reminder

La implementación **no está autorizada** hasta que el usuario revise este plan y ejecute `/implement "docs/plans/login-ojo-del-caribe-ui.md"` (o la ruta staged equivalente) de forma explícita.

## Plan check

Revisión hecha contra el repositorio actual en esta misma sesión (evidencia, no supuestos):

1. **Rutas verificadas:** `(auth)/login/page.tsx`, `LoginForm.tsx`, los 4 archivos three/ + `MareaScene` + `useParallax`, `e2e/auth-flow.spec.ts`, `lib/ui.ts`, `public/`, `sharp` — todas existen como se describe. ✔
2. **Revert por contenido, no por git:** confirmado que el HEAD guarda el login en la ruta vieja (`app/login/`) mientras el working tree lo tiene ya renombrado; `git checkout HEAD --` destruiría el rename staged. El paso 2 lo hace por escritura de contenido. ✔ (corregido respecto al borrador inicial)
3. **Alcance del borrado:** el grep de importadores confirma que `GlassWave.tsx` y `GlassWaveAccent` **no** se pueden borrar (las usa `(app)/layout.tsx`), y que `useParallax` queda huérfano solo si se borra `MareaScene` — el paso 5 quedó ajustado con condición de grep. ✔
4. **`lib/ui.ts` compartido:** confirmado por grep que otras vistas lo consumen; las clases del login se mantienen locales. ✔ (corregido respecto al borrador inicial)
5. **Contrato e2e:** los selectores `getByLabel("Email"/"Password")` y `getByRole("button", { name: "Log in" })` se preservan; el toggle añadido usa `aria-label` propio y no colisiona. ✔
6. **Asset:** el usuario aún no ha provisto la imagen; el plan no depende del build para entregar (fallback CSS) y la dependencia queda explícita. ✔
7. **Librerías:** la opción elegida confirma **cero dependencias nuevas** (consistente con la regla de aprobación de deps); la investigación web no corrió (el buscador no devolvió resultados) — los tamaños citados son aproximados de conocimiento establecido y no se presentan como medidos. ✔
8. **Ajuste de scope:** se añadió el gate rápido del paso 3 para no construir la UI nueva sobre una base rota, y los tests de `LoginForm` (antes inexistentes) para cubrir el único comportamiento nuevo (el toggle). ✔

Sin decisiones materiales pendientes: el alcance, branding, fondo y nav fueron respondidos por el usuario en esta sesión.

## Implementation outcome (2026-10-23)

**Delivered and verified in the browser:** `/login` renders the mockup design — full-bleed aerial night photo with a vivid (non-opaque) glowing globe on the right, "ojo del caribe" eye/wave SVG wordmark, `<h1>Log in</h1>`, subtitle, glass card with Email/Password fields, working show/hide toggle, cyan-gradient "Log in" pill with arrow. Auth logic byte-identical in behavior (`apiPost` → `setToken` → `push("/")`, alert copy untouched).

**Verification results (all run from `frontend/next/`):**

| Check | Result |
|---|---|
| `npm test` | **51/51 pass** (incl. 5 new `LoginForm` tests) |
| `npx tsc --noEmit` | exit 0 |
| `npx eslint src` | exit 0, no warnings |
| `npm run build` | exit 0 — 9 routes, no three.js in `/login` chunk |
| `scripts/make-screenshots.mjs` | 5/5 captured (login, dashboard, business-list, business-detail, analytics) |

**Scope that grew beyond this plan (driven by follow-up user requests the same night):**
- *"haz que la esfera resalte más"* → login backdrop moved to a shared root-level `NightBackdrop` (`general-caribbean-night.jpg`) with a light radial wash instead of the vertical scrim, so the globe pops.
- *"continúa con el resto de vistas…"* → the night theme extended to **every** view (glass pill top nav, glass KPI cards, dark tokens in `globals.css` with token names kept and values inverted, contrast fixes across charts/lists/date-picker). Consequently the plan's non-goal *"no se toca `lib/ui.ts`"* was **superseded** — `ui.ts` was restyled app-wide as part of the approved theme; the login comment was updated to match.
- The 3D cleanup (step 5) went further than planned: the whole abandoned WebGL WIP was dropped (`three/*`, `MareaScene`, `useParallax`, `three`/`@react-three/*` deps pruned — 57 packages). Nothing 3D ever entered git history.

**Deviations from the plan's mechanics (all intentional, none change the outcome):**
- Background asset = `public/general-caribbean-night.jpg` via shared `NightBackdrop` (one cached download for login + app) rather than `public/login/caribbean-night.webp`; the provided webp stays on disk unused/uncommitted.
- Password toggle's name comes from **`title`**, not `aria-label`: the screenshot/e2e run exposed that Playwright's `getByLabel("Password")` case-insensitively substring-matches `aria-label="Show password"` (strict-mode violation). `title` keeps the exact accessible name for `getByRole`/assistive tech while `getByLabel("Password")` resolves to the input alone. Test line 72's `aria-label` note is stale on this point.
- E2E: run for the first time since D7-01 → **1/1 passed (4.1s)** after one fix: the nav step's `getByRole('link',{name:'Businesses'})` was a pre-existing strict-mode break (the dashboard's "View businesses" CTA and inline "Businesses" bullet substring-matched too — 3 elements since D7-01, unrelated to this work); the click is now scoped to `getByRole('navigation',{name:'Primary'})`, same contract semantics. The login selectors (`getByLabel("Email"/"Password")`, `Log in` button) work exactly as written — validated by both the e2e and the screenshot run.

**Commits (8, `master`, not pushed):** `6905235` Next.js 16.4.2 upgrade · `20e6d75` route groups `(app)`/`(auth)` · `4691e99` night theme foundation · `7954a31` theme applied to views · `71174fe` toggle `title` contract fix · `bf51fa7` regenerated screenshots · `1221380` plan/MEMORY bookkeeping · plus the e2e nav-step fix with the bookkeeping amendment in this file.
