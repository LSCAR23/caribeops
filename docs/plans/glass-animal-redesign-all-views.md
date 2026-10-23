# Plan: Rediseño visual "Login Ojo del Caribe" — fondo negro, vidrio y un animal por pantalla

- **Task**: "Lee este diseño: Login Ojo del Caribe. Tiene 4 pantallas (Login, Dashboard, Analytics, Businesses). Rediseña mi web para que se vea igual: fondo negro, tarjetas de vidrio, un animal en cada pantalla con su animación de entrada, y la paleta de colores de cada página. Conserva mi lógica y mis datos reales; cambia solo la parte visual. Descarga también las imágenes de los animales que usa el diseño."
- **Date**: 2026-10-23
- **Status**: Implemented 2026-10-23 — verified (tsc 0, eslint 0, vitest 53/53, build 0, e2e 1/1, desktop + phone screenshots reviewed)

## User decisions at approval (2026-10-23, override the plan where they differ)

> "aprobado y respeta el nombre "Caribe Ops y un punto naranja" apesar que haya otros nombre o diseños ese es el que siempre debe estar y en el nevbar aveces aparece la opcion "login" eso quitalo no tiener sentido despues de ahi las paginas y sus derivados debe ser totalmente igual al diseño que estamos proponiendo"

1. **Marca**: siempre el texto **"Caribe Ops"** + **punto naranja** (nav, login, título de pestaña y textos de la app), por encima de cualquier otro nombre del diseño ("ojo del caribe", "Caribe OPS", logo del ojo).
2. **Navbar**: se elimina por completo el link **"Login"** (también para usuarios anónimos). Comportamiento nuevo: `NavLinks.test` se actualiza para reflejarlo.
3. **Fidelidad**: las 4 páginas y sus derivadas (`/businesses/new`, `/businesses/[id]`, loading/error) deben ser iguales al diseño — layout, tamaños, header de cada página (Dashboard con pill grande sin barra; Analytics/Businesses con barra superior), dona y curva de Analytics (los componentes ya son dona/área: se ajusta su geometría y color al artboard), tarjetas KPI con icono y barra en el Dashboard. Los datos siguen siendo los reales.
- **Design source**: Claude Design canvas "Login Ojo del Caribe" — https://claude.ai/artifact/QQ23fkG5dCiuMP2njy4Pnr (artboards `Main` = Login/Lapa, `Dashboard` = Tortuga, `Analytics` = Jaguar, `Businesses` = Perezoso)

## Desired outcome

Cada ruta de `frontend/next` se ve como su artboard del diseño:

| Ruta | Animal (entrada) | Fondo | Acento principal | Acento secundario |
|---|---|---|---|---|
| `/login` | Lapa (guacamaya) — abajo a la derecha, emerge con blur → nítido | `#050505` | naranja `#FF7A1A` / amarillo `#FFC72C` | rojo `#E2231A` |
| `/` (Dashboard) | Tortuga marina — arriba a la derecha | `#030607` | cian `#3FE6D8` | teal `#14A89C` |
| `/analytics` | Jaguar — fijo a la izquierda | `#040503` | oliva `#B7CB5E` | ámbar `#F2A93B` |
| `/businesses` (+ `/businesses/new`, `/businesses/[id]`) | Perezoso — fijo a la derecha, + palmera tenue al centro | `#050403` | verde `#A8E07A` / arena `#E2BE92` | naranja `#D9822B` |

Fondo negro (sin foto nocturna), tarjetas de vidrio (degradado translúcido tintado con el color de la página + borde fino del acento + `backdrop-filter: blur(18px) saturate(1.2–1.3)` + sombra profunda), y la animación de entrada `emerge` del diseño (opacity 0 → 1, scale .72 → 1, translate, blur 18px → 0; 1.8–2 s, `cubic-bezier(.16,1,.3,1)`), desactivada con `prefers-reduced-motion`.

## Scope

- Solo la capa visual: CSS (`globals.css`), clases Tailwind y marcado decorativo de los componentes/páginas.
- Un **tema por ruta** mediante variables CSS (ver "Concepto"), aplicado en el layout para que la barra de navegación también tome la paleta de la página.
- Imágenes de los animales en `frontend/next/public/animals/` (**ya descargadas** en este stage porque el usuario lo pidió explícitamente; sin trackear todavía):
  - `lapa.png` (640×1120), `tortuga.png` (1108×1520), `jaguar.png` (843×1190), `perezoso.png` (696×1313), `palmera.png` (706×1101). Todas PNG con transparencia (verificado: modo RGBA, esquina alpha 0).

## Non-goals (explícitos)

- **No** cambiar lógica ni datos: los fetch a Laravel/Go, `RequireAuth`, `LoginForm` (estado, validación, envío), `LogoutButton`, `DateRangeSelector`, `SearchInput`, `CategoryFilter`, paginación, formularios y sus validaciones quedan iguales.
- **No** usar los números del mockup (274, 18002, "Chili Rojo"…): son datos de ejemplo; la app sigue mostrando los datos reales.
- **No** copiar elementos del diseño que no existen en la app (p. ej. el gráfico de dona de Analytics si `CategoryChart` es de barras — se re-colorea, no se reescribe; el chip "Custom range" ya existe en `DateRangeSelector` con su propio comportamiento).
- **No** cambiar textos, rutas, nombres accesibles ni el orden de los links del nav (contratos de los tests unitarios y del e2e).
- **No** cambiar el nombre visible: se mantiene **"Caribe OPS"** (último commit `3a0255c`). El login deja el lockup "ojo del caribe" y pasa a "Caribe OPS" como en el artboard `Main` (decisión ya tomada por el diseño; se puede revertir en `/check` si el usuario prefiere conservarlo).

## Analysis carried forward

Evidencia recogida en esta sesión:

1. **Diseño** (leído del artifact): 4 artboards `.dc.html`, fuente DM Sans (la app ya la usa vía `next/font`), cada uno con su propia paleta, fondo casi negro, glow radial tenue del color de la página, tarjetas de vidrio y un `<img>` del animal con máscara de degradado en el borde inferior y animación `*-emerge`. En móvil (<820/1000 px) el animal baja de opacidad (0.3–0.38) en vez de esconderse.
2. **App actual** (`frontend/next`, Next 16.4.2, React 19.3, Tailwind v4):
   - `src/app/globals.css` define tokens `@theme` (`--color-brand-50…900`, `--color-accent-*`, `--color-ivory`, `--color-surface`, `--color-ink-*`) y utilidades `.glass-card`, `.glass-glow`, `.anim-*`, `.lift`.
   - 77 usos de utilidades `*-brand-*`/`*-accent-*` en `.tsx` → al **redefinir esas variables por tema** casi toda la app cambia de paleta sin tocar cada componente.
   - Colores hardcodeados que **no** seguirían al tema: `NightBackdrop.tsx` (5), `(auth)/login/page.tsx` (5), `CategoryChart.tsx` (6 hex de la serie), `LoginForm.tsx` (rgba cian en tarjeta/botón, `ring-offset-[#06232a]`), `MonthlyChart.tsx` (`#052029`), `TopBusinesses.tsx` (`#2a0f04`), `KpiCard.tsx`, `Navigation.tsx`, `NavLinks.tsx`, `BusinessLocationPicker.tsx` (1 c/u).
   - Shell: `src/app/(app)/layout.tsx` = `NightBackdrop` + `Navigation` + children; `/login` vive en `(auth)` sin nav y con su propia foto `public/login/caribbean-night.webp`.
   - Tests: Vitest (51 tests, contratos por texto/rol) + Playwright `e2e/auth-flow.spec.ts`. Ninguno referencia la foto de fondo ni "ojo del caribe".
3. **Git**: `master` limpio al inicio de la sesión; único cambio local de este stage = `public/animals/*.png` (sin trackear) y este plan.

## Concepto (just-in-time)

**Temas con variables CSS.** En Tailwind v4 cada token de `@theme` es una variable CSS (`--color-brand-300`), y la utilidad `text-brand-300` compila a `color: var(--color-brand-300)`. Si un contenedor declara `[data-theme="jaguar"] { --color-brand-300: #c3d672; }`, todo lo que esté dentro usa el oliva, sin cambiar ninguna clase. Así una sola clase `text-brand-300` sirve para cian en el Dashboard y oliva en Analytics.

**Animación de entrada solo con compositor.** `opacity`, `transform`/`scale`/`translate` y `filter` se animan en GPU sin re-layout. Usamos `key={pathname}` en el componente del animal para que React lo vuelva a montar al navegar y la animación se repita.

## Learning objectives

1. Theming por scope con variables CSS en Tailwind v4.
2. Separar "pixeles" de "lógica": un rediseño completo sin tocar ningún fetch ni handler.
3. `next/image` con PNG transparente (Next sirve WebP/AVIF optimizado automáticamente; no hace falta convertir a mano).
4. Animaciones accesibles (`prefers-reduced-motion`) y decorativas (`alt=""`, `aria-hidden`).

## Ordered implementation steps

1. **Tokens por tema** — `globals.css`:
   - Fondo base negro (`--color-ivory: #050505`) y `--color-surface` neutro.
   - Bloques `[data-theme="lapa|tortuga|jaguar|perezoso"]` que redefinen `--color-brand-50…900`, `--color-accent-*`, más variables nuevas `--page-bg`, `--glass-from`, `--glass-to`, `--glass-border`, `--glass-highlight`, `--glow` (valores tomados literalmente de cada artboard; rampa brand 200–400 = acento claro para texto, 500–900 = oscuro para pills con texto blanco/oscuro como hoy).
   - `.glass-card` y `.glass-glow` pasan a leer esas variables (degradado 160°, borde 1px, blur 18px saturate 1.25, sombra `0 24px 60px rgba(0,0,0,.5)` + inset highlight).
   - Keyframe `emerge` + clase `.anim-emerge` (+ variante `from-right` para el jaguar que entra desde la derecha) y `.anim-palm-fade`; añadirlas al bloque `prefers-reduced-motion`.
   - *Por qué*: un único punto de verdad; los componentes casi no cambian.
2. **`AnimalBackdrop`** (nuevo, client island, reemplaza a `NightBackdrop`): lee `usePathname()`, decide el tema (`/analytics*` → jaguar, `/businesses*` → perezoso, resto → tortuga), pinta fondo `--page-bg` + glow radial + `<Image>` del animal (posición/tamaño/máscara del artboard, `priority`, `sizes` acotado, `alt=""`, `aria-hidden`) con `key={pathname}`; en perezoso añade la palmera. Responsive como el diseño (opacidad reducida bajo 820/1000 px).
3. **`ThemeShell`** (client, mínimo): envuelve el contenido de `(app)/layout.tsx` en `<div data-theme={…}>` usando la misma función de mapeo (exportada desde `src/lib/theme.ts`) para que nav, tarjetas y botones compartan la paleta. Borrar `NightBackdrop.tsx` y dejar `public/general-caribbean-night.webp` sin uso (se elimina en el mismo commit si nada más la referencia — se verifica con grep).
4. **Navegación** — `Navigation.tsx`/`NavLinks.tsx`: barra superior con vidrio oscuro + borde inferior del acento; pill del nav con borde del acento; item activo con fondo `brand-500/20`, texto `brand-200` y borde del acento (como Analytics/Businesses), punto del logo en `accent-400`. Mismos links, mismo orden, mismo `LogoutButton`.
5. **Login** — `(auth)/login/page.tsx` + `LoginForm.tsx` (solo clases): `data-theme="lapa"`, fondo `#050505`, lapa abajo-derecha con máscara y `emerge`, glow rojo-naranja a la izquierda, columna alineada a la izquierda (`padding-left: clamp(24px, 9vw, 140px)`), logo ojo naranja/amarillo/rojo, "Caribe OPS", `h1` 64 px, tarjeta de vidrio cálida, inputs con icono y foco naranja, botón píldora con degradado `#FFC72C → #FF7A1A → #F04A1E` y texto oscuro. Se quita la foto `public/login/caribbean-night.webp` del login (archivo eliminado si no tiene otros usos). Estados de error/pending/toggle de contraseña intactos.
6. **Dashboard** — `(app)/page.tsx`, `KpiCard.tsx`: hero con eyebrow (punto con glow), `h1` grande con "&" en acento, botones primario (degradado cian) / secundarios (vidrio con borde); títulos de sección con barra vertical de acento; `KpiCard` con vidrio + barra de progreso decorativa con glow (sin inventar porcentajes: barra de ancho fijo decorativo, `aria-hidden`); lista "What data is available" con viñetas de punto.
7. **Analytics** — re-colorear con tokens: `CategoryChart` toma su serie de variables (`var(--chart-1…6)` definidas por tema) en vez de hex fijos; `MonthlyChart` área/linea en `brand-300` y relleno de puntos `var(--page-bg)`; `TopBusinesses` #1 en ámbar (`accent-400`) y el resto con borde oliva; chips de `DateRangeSelector` solo clases.
8. **Businesses** (`page.tsx`, `BusinessList`, `SearchInput`, `CategoryFilter`, `businesses/new`, `businesses/[id]`, `BusinessForm`, `ReviewForm`, `ReviewList`, `loading.tsx`, `error.tsx`): tarjetas de vidrio arena/verde, botón "New business" con degradado arena→verde, estrellas en `accent`, inputs vidrio oscuro con foco verde. `BusinessLocationPicker` solo cambia su color hardcodeado.
9. **Primitivas compartidas** — `lib/ui.ts` (`buttonClassName` primario = degradado del acento con texto oscuro `text-[var(--on-accent)]`, secundario vidrio; `inputClassName`; `focusRing` con `ring-offset-[var(--page-bg)]`), `Card`, `SectionHeading`, `LoadingSkeleton`, `EmptyState`, `SectionFallback`.
10. **Contraste**: comprobar 4.5:1 para texto normal de cada paleta sobre su fondo (los acentos del diseño son claros sobre casi negro → pasan; revisar textos secundarios con alpha 0.7–0.78).
11. **Commits atómicos** (sin push): (a) `chore(assets): add design animal images`; (b) tokens/tema + backdrop + shell; (c) nav; (d) login; (e) dashboard; (f) analytics; (g) businesses; (h) docs/MEMORY.
12. Actualizar `MEMORY.md` (tres secciones) y el estado de este plan con los resultados reales.

## Tests & verification

Desde `frontend/next`:

| Comando | Esperado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npm run lint` | 0 errores |
| `npm test` | 51/51 (ningún test cambia: los contratos son texto/rol) |
| `npm run build` | build OK (las páginas siguen sin necesitar backends) |
| `npm run test:e2e` (con el stack docker arriba) | `auth-flow` 1/1 |
| `grep -rn "general-caribbean-night\|login/caribbean-night\|NightBackdrop" src` | sin resultados |
| Revisión visual de las 4 rutas a 1440 px y 390 px | coincide con los artboards; con `prefers-reduced-motion` no hay animación |

## Risks, dependencies, open questions

- **Peso de imágenes**: PNG de 1.1–1.6 MB; `next/image` las sirve optimizadas (WebP/AVIF, tamaño según `sizes`). Riesgo bajo; si el LCP empeora, pre-convertir a WebP con `sharp` (ya instalado como dependencia de Next).
- **`backdrop-filter` en muchas tarjetas** puede costar en móviles de gama baja; el diseño lo exige. Mitigación: fondo de tarjeta suficientemente opaco para no depender del blur (`@supports not (backdrop-filter…)`).
- **Gráficos**: el diseño muestra dona/área; la app tiene sus propios componentes. Solo se re-colorean (non-goal reescribirlos). Si el usuario quiere la dona literal, es otra tarea.
- **Rutas sin artboard** (`/businesses/new`, `/businesses/[id]`): heredan el tema Perezoso — supuesto razonable.
- **Nombre en el login**: pasa de "ojo del caribe" a "Caribe OPS" siguiendo el artboard.

## Plan check

Revisado contra el repositorio y el diseño el 2026-10-23:

- ✅ Todos los archivos listados existen (verificado con `find src`).
- ✅ Tailwind v4 + `@theme` → el theming por variables funciona sin plugin.
- ✅ Ningún test depende de los assets de fondo ni del texto "ojo del caribe" (grep en `src` y `e2e`).
- ✅ DM Sans ya cargada vía `next/font`; no hace falta el `<link>` de Google Fonts del diseño.
- ✅ Imágenes descargadas desde los assets del canvas y verificadas (tamaños y transparencia arriba). Mapeo blob → archivo: `c7340fe7…` lapa, `61e193d5…` tortuga, `3d666e72…` jaguar, `968f5145…` perezoso, `fc6eee7a…` palmera.
- ⚠️ Ajuste aplicado al plan: `CategoryChart` usa hex fijos → se pasa a variables por tema (paso 7) para que no quede cian en Analytics.
- ⚠️ Ajuste aplicado: `focusRing` usa `ring-offset-ivory`; con fondos por página se cambia a `var(--page-bg)` (paso 9).
- Decisiones abiertas para el usuario (con default recomendado): nombre del login → "Caribe OPS" (default); gráficos → solo re-color (default).

## Implementation outcome (2026-10-23)

Approved by the user ("continua a lo que entiendas" + the approval message quoted at the top). Follow-ups requested **during** implementation, all applied:

1. "el diseño de navbar del dashboard y el resto de secciones es diferente, adapta todos al estilo del dashboard" → one header style on every page (transparent, brand left, large glass pill with bottom-glow active item), coloured by the page theme. Analytics/Businesses content now sits on the same centred 1360px grid as the header.
2. "agrega un nav burger para las vistas de celular" → at ≤720px the pill becomes a burger button (`aria-expanded`/`aria-controls`, Escape closes and returns focus, closes on navigation) that opens a solid dropdown with the same links. Links stay in the DOM.
3. "ajusta las imagenes en las vistas de celular también" → on phones each animal shrinks, peeks in from an edge and fades (30–40%) behind the content. Position/opacity live on a wrapper so the entrance animation (which ends at opacity 1) cannot override them.
4. "en el login centra un poco más el formulario…", "haz que el formulario del login sea más grande", "centra más el formulario y pon la sombra naranja atrás de él" → the login column starts at `clamp(24px,24vw,380px)`, the card is 600px wide (p-10, 56px fields, 56px button, 72px title), and the warm orange radial glow is centred behind the form.

What was built:
- **Theme system**: `globals.css` `[data-theme="lapa|tortuga|jaguar|perezoso"]` blocks redefine the same tokens (`brand-*`, `accent-*`, `ink-*`, `ivory`, `surface`) plus `--page-bg`, `--glass-*`, `--btn-*`, `--chart-1…6`, `--brand-dot`. New utilities: `.theme-page`, themed `.glass-card`, `.glass-hover`, `.glass-field`, `.btn-accent`, `.btn-glass`, `.brand-dot`, `.site-*` header, `.anim-emerge`, `.anim-palm` (reduced-motion safe).
- `src/lib/theme.ts` (`themeForPath`), `src/components/ThemeShell.tsx` (sets `data-theme`; keys `AnimalBackdrop` by theme so the entrance replays per section), `src/components/AnimalBackdrop.tsx` (tortuga/jaguar/perezoso + palm; `next/image` with `preload`, since Next 16 deprecated `priority`).
- Brand everywhere: **"Caribe Ops" + orange dot** (nav, login, tab title, hero copy). **No Login link in the nav** (`NavLinks.test` rewritten: 5 tests incl. the burger).
- Dashboard: feature KPI cards (icon, 38px value, glowing track — the rating track is real `avg/5`; the count tracks are fixed decorative lengths from the design, `aria-hidden`), bar headings, gradient/glass CTAs.
- Analytics: donut redrawn to the artboard geometry (r46, stroke 18, slice gaps, centre total, 2-col legend, theme colours); area chart rebuilt like the design (HTML axes, gradient area, ringed points, amber peak, focusable points with tooltip; phones show every 3rd month label); ranked list with amber #1.
- Businesses (+ detail, new, loading, error): sand/green glass cards (a stretched link keeps the name as the accessible name), search with icon, glass select, gradient "New business".
- Login: lapa theme, macaw bottom-right, orange gradient pill, warm glass card; auth logic untouched.
- Removed: `NightBackdrop.tsx`, `public/general-caribbean-night.webp`, `public/login/caribbean-night.webp` (no remaining references). Added `public/animals/{lapa,tortuga,jaguar,perezoso,palmera}.png`.
- `scripts/make-screenshots.mjs`: settle 1200→2600ms (2s animal entrance) and donut selector viewBox 160→120; `docs/screenshots/*.png` regenerated.

Verification (from `frontend/next`): `npx tsc --noEmit` exit 0 · `npm run lint` exit 0 · `npm test` **53/53** (11 files) · `npm run build` exit 0 (9 routes) · `E2E_BASE_URL=http://127.0.0.1:3000 npx playwright test` **1/1** (with a throwaway :3101 stub so the user's dev server was not stopped) · Playwright screenshots at 1440×900 and 390×844 of login, dashboard, analytics, businesses, new, detail and the open burger menu: no console errors, no horizontal scroll (scrollWidth = viewport).

Notes: the dev server served a stale stylesheet for a while (the rule was in the production build but missing from `:3000`); it caught up on its own — restart `next dev` if styles ever look outdated. Pre-existing and out of scope: the business detail can show "No ratings yet" while listing reviews (it comes from the API's `average_rating`).
