# Plan: Rediseño 3D en Figma de todas las vistas de CaribeOps

- **Task**: Usar el MCP de Figma (oficial, remoto) y los skills de diseño instalados (`emil-design-eng`, `impeccable`, `design-taste-frontend`) para crear en Figma un rediseño con animaciones 3D de las 6 vistas de CaribeOps, con aprobación iterativa del usuario (dirección de arte primero, vista por vista después).
- **Date**: 2026-10-22
- **Status**: Superseded 2026-10-23 — never implemented; the user pivoted to the Caribbean-night photographic theme (`login-ojo-del-caribe-ui.md` outcome + `general-caribbean-night.jpg` across all views). Kept for the record.

> Este plan se materializa primero en `C:\Users\larao\.opencode\plan\figma-3d-redesign-all-views.md` por las restricciones de Plan mode (precedente D7-28/D6-27). El primer paso de `/implement` es copiarlo a `docs/plans/figma-3d-redesign-all-views.md` y operar desde allí.

## Desired outcome

Un archivo de Figma (creado vía MCP con la cuenta autenticada del usuario) que contenga:

1. **Página 0 — Design Direction** (aprobada por el usuario antes de continuar): nueva dirección de arte libre (paleta, tipografía, tratamiento 3D, sistema de motion con duraciones/easings) documentada como tokens y muestras, derivada de los 3 skills pero sin atarse a la marca actual.
2. **Una página por vista rediseñada** (6 en total): `/login`, `/` (dashboard), `/businesses`, `/businesses/new`, `/businesses/[id]`, `/analytics` — cada una con el frame desktop rediseñado y **specs de animación 3D**: estados A→B del componente animado, etiquetas de easing/duración/delay, y notas de intención (por qué se mueve así).
3. Cada entregable con **gate de aprobación** del usuario en la conversación; si pide cambios, se itera sobre el mismo frame hasta su aprobación explícita.

## Scope

**In scope (este task):**
- Verificar autenticación Figma (`whoami`) y crear el archivo de diseño vía `create_new_file` + `create_session`.
- Cargar la guía de los skills de diseño locales (`emil-design-eng`, `impeccable`, `design-taste-frontend`) y las skills del MCP de Figma (`/figma-generate-design`, y la obligatoria `/figma-use` antes de `use_figma`, `/figma-design-to-code` no aplica porque el flujo es code→design).
- Capturar la UI actual como referencia (screenshots existentes en `docs/screenshots/` + `/businesses/new` faltante capturado o reconstruido desde el código) y subirlas con `upload_assets` como board de contexto.
- Construir la dirección de arte y las 6 vistas con `use_figma` / `generate_figma_design`, con anotaciones de motion 3D.
- Tomar screenshots vía `get_screenshot` para mostrar al usuario en la conversación y gestionar la aprobación iterativa.

**Non-goals (explícitamente fuera de alcance):**
- Ningún cambio de código de la aplicación (ni frontend, ni backend, ni tests, ni dependencias).
- Implementación real de 3D en código (Three.js/@react-three o similar) — queda para un task futuro cuando el diseño esté aprobado.
- Modificar o descartar los cambios sin commitear de D7-30/D7-31 (se preservan intactos; este task no toca esos archivos).
- Commits, push, ni cambios de configuración adicionales.
- Diseño mobile/tablet (el alcance es desktop 1400×900, igual que los screenshots del README); responsive sería iteración futura si el usuario la pide.
- Rediseño de la identidad de marca en el código (tokens actuales de `globals.css` se quedan como están).

## Analysis carried forward

Del `/analize` (2026-10-22):

- **Vistas actuales (6)** en `frontend/next/src/app/`: `login/page.tsx`, `page.tsx` (dashboard: hero + KPIs + lista de datos), `businesses/page.tsx` (lista con search/filtro/paginación), `businesses/new/page.tsx` (alta con mapa Leaflet), `businesses/[id]/page.tsx` (detalle: owner, amenities, reseñas con formulario de estrellas), `analytics/page.tsx` (KPIs Go, donut categorías, chart mensual, top-10).
- **Lenguaje de diseño actual** (`frontend/next/src/app/globals.css`): brand green `#009B4D`, mandarin `#FFCC00` (acentos), marfil `#FAF5E9`, Fraunces (display) + Geist Sans, light-only, primitivas de motion sutiles (`fade-up`, `bar-grow`, `column-grow`, `draw`) con `prefers-reduced-motion`.
- **Componentes clave**: `Navigation` (server) + `NavLinks` (isla), `KpiCard`, `BusinessList`, `BusinessForm` + `BusinessLocationPicker` (Leaflet client island), `ReviewForm` (radiogroup de estrellas), `CategoryChart`/`MonthlyChart`/`TopBusinesses` (SVG animados).
- **MCP Figma**: `figma` (remoto oficial) y `playwright` conectados en `opencode.json`; OAuth pendiente de verificar.
- **Skills instalados** en `.agents/skills/`: `emil-design-eng` (craft de motion), `impeccable` (dirección de diseño + anti-slop, 23 comandos), `design-taste-frontend` (art direction con dials VARIANCE/MOTION/DENSITY).
- **Cambios sin commitear preservados**: D7-30/D7-31 en staging/working tree (no se tocan).

### Decisiones del usuario (2026-10-22)

1. **Alcance**: solo diseños en Figma. La implementación en código es un task futuro.
2. **Marca**: dirección visual **libre nueva** — no se respeta la identidad verde/marfil/Fraunces; los skills deciden paleta y tipografía.
3. **Ritmo**: **dirección de arte primero** (aprobada antes de cualquier vista), luego vista por vista.

## Current-state evidence and relevant files

- `frontend/next/src/app/**/page.tsx` — las 6 vistas (fuente de verdad del contenido a rediseñar).
- `frontend/next/src/app/globals.css` — tokens actuales y primitivas de motion (referencia de contenido, no de estética, dado el cambio de dirección).
- `frontend/next/src/components/*.tsx` — 30 componentes; los interactivos definen qué estados hay que diseñar animados.
- `docs/screenshots/{login,dashboard,business-list,business-detail,analytics}.png` — capturas desktop 1400×900 del stack corriendo (5 de 6 vistas; falta `/businesses/new`).
- `opencode.json` — servidores MCP `figma` (remote `https://mcp.figma.com/mcp`) y `playwright` (local).
- `.agents/skills/{emil-design-eng,impeccable,design-taste-frontend}/` — skills de diseño instalados.
- `skills-lock.json` — registro de los skills instalados.

## Learning objectives

- **Figma MCP code→design**: `create_new_file` → `create_session` → `search_design_system`/`get_libraries` → `use_figma` (con su skill obligatoria `/figma-use`) y `generate_figma_design` para referencia pixel-perfect; `get_screenshot` para revisión; `upload_assets` para el board de contexto.
- **Design systems en Figma**: componer desde primitivas, tokens como estilos/variables, consistencia entre frames.
- **Craft de motion (Emil)**: cada animación con intención, easing y duración explícitas; nada de movimiento decorativo.
- **Anti-slop (impeccable/taste-skill)**: dirección con POV, evitar templates genéricos de "SaaS AI"; los dials VARIANCE/MOTION/DENSITY como decisiones explícitas.
- **Diseño 3D en Figma**: lograr sensación 3D con isometría/perspectiva, capas con parallax, sombras y gradientes de profundidad, y specs de animación como prototipos A→B (porque Figma no tiene 3D nativo).

## Ordered steps

1. **Copiar este plan a `docs/plans/figma-3d-redesign-all-views.md`** (primer paso de `/implement`, precedente D7-28).
2. **Verificar Figma**: `figma.whoami()`. Si requiere OAuth, guiar al usuario para autenticar y reintentar. No proceeding sin auth confirmada.
3. **Cargar guía de skills**:
   - Leer `SKILL.md` de `emil-design-eng`, `impeccable` y `design-taste-frontend` (con sus `references/`) para fijar la metodología.
   - Leer el recurso `skill://figma/figma-use/SKILL.md` (obligatoria antes de `use_figma`) y `skill://figma/figma-generate-design/SKILL.md` (flujo app→Figma) vía `get_figma_skill`.
4. **Crear el archivo de diseño**: `create_new_file` con nombre "CaribeOps — 3D Redesign" → `create_session` con el fileKey devuelto; reusar el `sessionId` en todas las operaciones posteriores.
5. **Board de contexto**: subir los 5 screenshots de `docs/screenshots/` con `upload_assets` a una página "00 — Current UI" (capturas 1400×900; los frames de diseño usarán el estándar desktop **1440×900**, no afecta la referencia). Para `/businesses/new` (sin screenshot): usar `generate_figma_design` solo si el stack dev está corriendo (:3000 con sesión); si no, reconstruir el contenido leyendo `BusinessForm.tsx`/`businesses/new/page.tsx` (campos, categorías, mapa) como frame de referencia. En ningún caso levantar ni rebuildar el stack solo para esto.
6. **Dirección de arte (gate de aprobación #1)**: en la página "01 — Design Direction", construir con `use_figma`: paleta nueva (tokens con nombres), tipografía (display + body), tratamiento 3D (cómo se representan la profundidad, materiales, sombras), y el sistema de motion (duraciones base, familias de easing, stagger, y política `prefers-reduced-motion` como nota). Aplicar la metodología de los 3 skills (brief → dirección → anti-slop pass). **Screenshot → mostrar al usuario → esperar aprobación explícita.** Si pide cambios, iterar; no avanzar sin aprobación.
7. **Vistas 1-6 (gates #2-#7)**: para cada vista, en su propia página: frame desktop rediseñado + specs de animación 3D (estados A→B del elemento animado, easing/duración/delay/intención anotados). Orden: `login` → `dashboard` → `businesses` → `businesses/new` → `businesses/[id]` → `analytics`. Tras cada una: `get_screenshot` → mostrar → esperar aprobación o iterar con sus correcciones. Cada vista reutiliza los tokens de la dirección aprobada (consistencia).
8. **Cierre**: resumen final de la conversación con el enlace/nombre del archivo, índice de páginas, y checklist de aprobaciones. Actualizar el plan con el outcome real (páginas creadas, aprobaciones obtenidas, iteraciones). Actualizar `MEMORY.md` (sección `Last task implemented` + `What the system does now`) indicando claramente que es trabajo de diseño en Figma, sin cambios de aplicación.

## Tests and verification

Este task no toca código, por lo que no hay suites que correr. Verificación aplicable:

| Check | Cómo | Resultado esperado |
|---|---|---|
| Auth Figma | `figma.whoami()` | Handle/email del usuario autenticado |
| Archivo creado | `create_new_file` devuelve fileKey; `get_metadata` lo confirma | FileKey válido, páginas visibles |
| Board de referencia | `upload_assets` + `get_screenshot` de la página 00 | 5 screenshots + nota de `/businesses/new` |
| Dirección aprobada | Screenshot en conversación + aprobación explícita del usuario | Gate #1 cerrado antes de vista alguna |
| 6 vistas entregadas | `get_screenshot` por página, mostradas y aprobadas una a una | Gates #2-#7 cerrados |
| Sin cambios de app | `git status` al final | idéntico al actual (solo docs/plans + MEMORY.md agregados) |

Los screenshots de Figma se muestran en la conversación; la fuente de verdad de aprobación es el usuario, no un test.

## Risks, dependencies, unresolved questions

- **Dependencia dura: OAuth de Figma.** Si el usuario no autentica, el task no puede avanzar más allá del paso 2. Mitigación: verificarlo temprano (paso 2).
- **`use_figma` exige la skill `/figma-use` leída antes.** Mitigación: paso 3 obligatorio; sin ella, no se llama.
- **Alcance largo**: 6 vistas + dirección con 7 gates de aprobación pueden extenderse en tiempo. Mitigación: gates por vista permiten parar en cualquier punto sin trabajo desperdiciado.
- **Figma no tiene 3D nativo real**: la sensación 3D es convención visual (perspectiva/capas/parallax/prototipos), no geometría 3D. Dejado explícito en el non-goal de implementación de código; la expectativa del usuario quedó alineada.
- **Pérdida de contexto del MCP entre sesiones**: si el server se reinicia, el `sessionId` puede caducar; mitigación: reusar fileKey y reconectar sesión desde el archivo existente (`create_session` sobre el mismo fileKey).
- **Cambios sin commitear de D7-30/D7-31**: preservados; el único archivo de repo que se agrega en implementación es `docs/plans/...` + `MEMORY.md`.

## Plan check

Realizado el 2026-10-22 contra el repo actual (MEMORY.md, `git status`, fuentes, screenshots e instrucciones). Hallazgos y cambios aplicados:

1. **Slug sin colisión** — no existe `docs/plans/figma-3d-redesign-all-views.md` (verificado con glob de `docs/plans/`). ✅ sin cambios.
2. **Screenshots verificados** — los 5 PNG de `docs/screenshots/` existen (login 69 KB → business-detail 684 KB); el plan los referenciaba correctamente. ✅ sin cambios.
3. **`/businesses/new` sin captura** — el plan asumía solo reconstrucción desde código. Revisado: se refina (paso 5) a **mejor esfuerzo**: `generate_figma_design` si el stack dev está vivo, si no reconstrucción desde `BusinessForm.tsx`/`page.tsx`; explícitamente **no** se levanta el stack solo para la referencia.
4. **Tamaño de frame ambiguo** — el scope decía "desktop 1400×900" (tamaño de las capturas). Aclarado en el paso 5: los frames de diseño usan **1440×900** (estándar Figma); las capturas de referencia quedan como están.
5. **Riesgo OAuth ya mitigado en el plan** — el paso 2 verifica `whoami` antes de cualquier operación de archivo y el plan no avanza sin auth. ✅ sin cambios.
6. **Alcance de movimiento preservado** — se confirmó con el usuario: solo Figma (non-goal de código), dirección libre y ritmo por gate. El plan refleja las tres decisiones. ✅ sin cambios.
7. **Verificación débil corregida** — se agregó a la tabla el "sin cambios de app" (`git status` idéntico) y el gate de aprobación explícita por vista; la fuente de verdad de aprobación es el usuario en la conversación.
8. **`MEMORY.md`** — el paso 8 exige actualizar las tres secciones indicando que es trabajo de diseño en Figma, no implementación de aplicación. ✅ consistente con la skill `implement`.

Sin decisiones materiales pendientes para el usuario más allá de las ya respondidas (alcance solo-Figma, dirección libre, ritmo dirección-primero).

## Approval reminder

La implementación de este plan (crear el archivo Figma, la dirección y las vistas) **no está autorizada** hasta que el usuario revise este plan y ejecute explícitamente `/implement "docs/plans/figma-3d-redesign-all-views.md"` (tras copiarlo a `docs/plans/` en el flujo). Hasta entonces, este stage es solo planificación.
