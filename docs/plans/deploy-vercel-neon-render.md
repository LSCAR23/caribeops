# Plan: Desplegar Caribe Ops — Vercel (front) + Neon (base de datos) + Render (Laravel y Go)

- **Task**: "conecta el mcp de vercel para subir los servicios y el front y no sé si puedes conectar el mcp de alguna herramienta como neon para subir la base de datos" → "ya conecté los mcp, sigue la recomendación que propusiste para subir los servicios"
- **Date**: 2026-10-23
- **Status**: Checked — awaiting user approval

## Desired outcome

Caribe Ops accesible en internet, con todo en planes gratuitos y en la misma región (Ohio, `us-east-2`) para que las llamadas entre servicios sean rápidas:

| Pieza | Dónde | Cómo se crea |
|---|---|---|
| Frontend Next.js | **Vercel** (Hobby), región `cle1` (Cleveland) | Vercel MCP: proyecto conectado al repo de GitHub, raíz `frontend/next` |
| PostgreSQL 16 | **Neon** (Free), región `aws-us-east-2` | Neon MCP: proyecto nuevo `caribeops` + rol `analytics` de solo lectura |
| API Laravel + servicio Go | **Render** (Free), región `ohio` | `render.yaml` (Blueprint) en el repo; **tú** lo activas una vez desde el panel de Render |

## Scope

- Crear el proyecto Neon, la base `caribeops`, el rol `analytics` con sus permisos (equivalente a `docker/postgres-init/*`).
- Correr migraciones y el seed de demo de Laravel contra Neon **desde tu máquina** (PHP de Herd), una sola vez.
- Agregar `render.yaml` y ajustar el arranque de los Dockerfiles para que usen el `PORT` que asigna Render (y `migrate --force` en Laravel).
- Crear el proyecto en Vercel con sus variables de entorno, desplegar y verificar.
- Configurar CORS de Laravel con la URL final de Vercel.

## Non-goals

- Dominio propio, CI/CD extra, monitoreo pago. Se usan las URLs gratuitas (`*.vercel.app`, `*.onrender.com`).
- Cambiar código de la app más allá del arranque de los contenedores.
- Migrar datos locales tal cual: en Neon se siembran los datos de demo con los seeders existentes.

## Analysis carried forward

Evidencia (2026-10-23):

1. **Cuentas**: Vercel `lscar23`, plan **Hobby**, sin equipos; ningún proyecto de Caribe Ops todavía. Neon org "Oscar" (`org-noisy-bonus-13793933`), plan **Free**, 2 proyectos existentes (`ten-porcent-control`, `imp_and_consu_api_with_next`), ambos en `aws-us-east-2`. **No se tocan.**
2. **Repo**: `github.com/LSCAR23/caribeops`, **público**, rama `master`, al día con `origin` hasta `49c70a4`. Solo se versionan `.env.example` (sin secretos).
3. **Pendiente de commit**: el trabajo del caché (`docs/plans/cache-section-navigation.md`, 18 archivos). Vercel y Render despliegan desde GitHub, así que hay que **commitearlo y hacer push** antes.
4. **Laravel**: Dockerfile `php:8.4-cli-alpine` con `php artisan serve` en el puerto 8000 fijo. Soporta `DB_URL` y `DB_SSLMODE` (`config/database.php`). CORS lee `CORS_ALLOWED_ORIGINS`. Seeders: `DatabaseSeeder`, `BusinessDataSeeder`, `CaribbeanVolumeSeeder`, `CategorySeeder`, `AmenitySeeder`.
5. **Go**: lee `DATABASE_URL` y `PORT` opcional (`internal/config/config.go`), así que funciona en Render sin cambios de código.
6. **Rol `analytics`**: hoy lo crean `docker/postgres-init/01-analytics-role.sh` y `02-analytics-grants.sql` (USAGE en `public`, SELECT en `businesses/categories/reviews`, privilegios por defecto). En Neon hay que replicarlo a mano.
7. **Next**: necesita `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_ANALYTICS_URL`. El caché `"use cache"` vive en memoria por instancia de Vercel (aceptable).
8. **Sin MCP para Render/Railway/Fly** y sin sus CLI instaladas. Render es el único que despliega desde un archivo del repo sin CLI ni tarjeta de crédito; activarlo requiere un paso tuyo en su panel.

## Concepto (just-in-time)

- **Blueprint de Render (`render.yaml`)**: describe los servicios (Dockerfile, región, plan, variables). Al conectarlo, Render crea los servicios y redepliega en cada push.
- **Variables secretas**: en `render.yaml` se declaran con `sync: false`. El archivo no lleva el valor; lo pegas tú en el panel. En Vercel se cargan por MCP como variables del proyecto, no en el repo.
- **Rol de solo lectura**: Go se conecta con `analytics`, que solo puede leer. Así, aunque el servicio se comprometa, no puede modificar datos.

## Ordered implementation steps

1. **Commit + push** del trabajo de caché (2 commits: feature y docs). *Requiere tu OK explícito para el push.*
2. **Neon** (MCP):
   1. `create_project` → nombre `caribeops`, región `aws-us-east-2`, PostgreSQL 16, org "Oscar".
   2. Crear la base `caribeops` y usar el rol dueño que crea Neon para Laravel.
   3. `create_postgres_role` → `analytics`; `run_sql` con los GRANT de `02-analytics-grants.sql` adaptados al nombre real del rol dueño.
   4. Obtener las dos cadenas de conexión (dueño y `analytics`) con `sslmode=require`. **No se imprimen en el chat**: se escriben directo a variables de entorno de cada servicio.
3. **Migrar y sembrar Neon desde tu máquina**: `php artisan migrate --force` + `php artisan db:seed --force` con `DB_URL` apuntando a Neon (variable de entorno temporal, sin guardarla en `.env`). Después, `run_sql` para confirmar los conteos de `businesses/categories/reviews` y que `analytics` puede leer.
4. **Render**:
   1. Dockerfiles: Laravel arranca con `php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}` (en local, el puerto sigue siendo 8000). Go no cambia.
   2. `render.yaml` con dos servicios Docker (`caribeops-api` → `backend/laravel`, `caribeops-analytics` → `analytics/go`), región `ohio`, plan `free`, `healthCheckPath` `/api/health` y `/health`. Variables no secretas en el archivo (`APP_ENV=production`, `APP_DEBUG=false`, `DB_CONNECTION=pgsql`, `DB_SSLMODE=require`, `LOG_CHANNEL=stderr`, `CACHE_STORE=file`, `SESSION_DRIVER=file`, `QUEUE_CONNECTION=sync`); secretas con `sync: false` (`APP_KEY`, `DB_URL`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `APP_URL`).
   3. **Paso tuyo**: en dashboard.render.com → New → Blueprint → elegir el repo. Pegar los secretos que te entregaré en un archivo local fuera del repo (scratchpad), nunca en el chat.
5. **Vercel** (MCP): `create_git_project` desde el repo, raíz `frontend/next`, framework Next.js, región de funciones `cle1`. Variables `NEXT_PUBLIC_API_URL` = URL de Render de Laravel y `NEXT_PUBLIC_ANALYTICS_URL` = URL de Render de Go. Desplegar y revisar el log del build.
6. **Cerrar el círculo**: poner la URL de producción de Vercel en `CORS_ALLOWED_ORIGINS` y `APP_URL` de Laravel (panel de Render) y redeplegar.
7. **Verificar** (abajo) y actualizar este plan y `MEMORY.md`.

## Tests & verification

| Chequeo | Esperado |
|---|---|
| `GET https://<api>.onrender.com/api/health` | 200 |
| `GET https://<analytics>.onrender.com/health` | 200 |
| `run_sql` en Neon | conteos > 0; `SET ROLE analytics; SELECT count(*) FROM reviews` funciona y un `INSERT` falla |
| Build en Vercel | estado READY, sin errores (revisado con `get_deployment` + logs) |
| Navegador sobre `https://<proyecto>.vercel.app` | login con la cuenta demo, Dashboard/Analytics/Businesses con datos, sin errores de CORS |
| `E2E_BASE_URL=https://<proyecto>.vercel.app npx playwright test` | 1/1 |

## Risks, dependencies, open questions

- **Render Free se duerme** tras ~15 min sin tráfico. La primera visita después tarda ~30–60 s mientras despierta Laravel/Go, y el front puede mostrar el aviso de "no disponible" en Analytics. Se evita con un plan pago (~7 USD/mes por servicio) o un "ping" periódico.
- **Neon Free** suspende la base tras inactividad (despierta en ~1 s) y tiene un límite de 1 GB por rama (visto en tus proyectos actuales); el seed de demo cabe de sobra.
- **Cuenta demo pública**: `test@example.com` / `password` queda accesible para cualquiera en internet. Conviene cambiar la contraseña después (o no sembrar ese usuario).
- **Seed de volumen**: `CaribbeanVolumeSeeder` genera muchas reseñas; si tarda demasiado contra Neon, se siembra solo `DatabaseSeeder`.
- **Ubicación del caché**: en Vercel cada instancia tiene su propio caché en memoria, así que puede haber diferencias de hasta un minuto entre instancias. Aceptable para un demo.

## Decisiones (default recomendado)

1. **Host de Laravel/Go**: Render Free (default). Alternativas: Railway (prueba con crédito) o Fly.io (pide tarjeta).
2. **Datos en Neon**: seed de demo completo (default) vs. solo datos base.
3. **Push a GitHub** del trabajo de caché: necesario para desplegar. Lo hago al ejecutar, con tu OK.

## Plan check

Revisado contra el repo y las cuentas el 2026-10-23:

- ✅ Vercel y Neon MCP autenticados; cuentas Hobby/Free; nada existente con el nombre `caribeops`.
- ✅ Go ya soporta `PORT`; Laravel ya soporta `DB_URL`/`DB_SSLMODE` y `CORS_ALLOWED_ORIGINS`: no hace falta tocar código de la app.
- ✅ PHP 8.4 (Herd) disponible localmente para migrar y sembrar Neon.
- ⚠️ Ajuste: Laravel debe escuchar en `$PORT` en Render → cambio mínimo en el `CMD` del Dockerfile, compatible con Docker Compose.
- ⚠️ Ajuste: Render no tiene MCP ni CLI aquí → un paso manual tuyo (activar el Blueprint y pegar secretos).
- ⚠️ Secretos: nunca se imprimen en el chat ni se commitean; van directo a Vercel por MCP o a un archivo local fuera del repo para pegarlos en Render.

## Implementation progress (2026-10-23, in progress)

Approved: "aprobado, sigue con el plan".

Done:
1. Cache work committed and pushed (`0b1f0ae`, `535822f`).
2. **Neon**: project `caribeops` (`snowy-cell-10004804`), `aws-us-east-2`, PG 16, branch `main` (`br-young-sea-b5zinuqs`), database + owner role `caribeops`.
   - **Deviation**: roles created through the Neon API inherit `neon_superuser` → `pg_write_all_data`, so the API-created `analytics` role was **not** read-only, and Neon refuses `REVOKE neon_superuser` / `ALTER ROLE … NOLOGIN` from the owner. A SQL-created role `analytics_reader` (no memberships) is used instead, with `SELECT` only on `businesses, categories, reviews` (same as local). Verified as that role: reads OK, `users` denied (42501), writes denied (42501). The unused API role `analytics` remains → ask the user before deleting it (destructive).
   - Secrets were generated/stored in a local scratchpad file, never in the repo; the reader password never went through the chat.
3. Migrated + seeded Neon from the local machine (`SEED_VOLUME=true`): 3 categories, 314 businesses, 18,323 reviews, 101 users. (Local Docker DB shows 274 businesses: Neon also has `BusinessDataSeeder`'s 40.)
4. `render.yaml` + Dockerfile changes (Laravel `$PORT` + `RUN_MIGRATIONS`, Go root CAs), pushed as `366ec4a`. Verified locally first: both production images ran against Neon → `/api/health` 200, `/health` 200, real data from both APIs, CORS header OK, "Nothing to migrate", config/routes cached.

Blocked / pending:
- **Vercel MCP**: `create_project` and `list_projects` return 403 for scope `oscars-projects-f04a604f` (the account's personal team), and `authorize_team_access` is refused for this token. The user must re-authenticate the Vercel MCP and grant that scope.
- **Render**: the user must create the Blueprint in the dashboard and paste the values from the local file `RENDER-valores-para-pegar.txt` (scratchpad).
- Then: Vercel project + env vars + deploy, CORS final, end-to-end verification.
