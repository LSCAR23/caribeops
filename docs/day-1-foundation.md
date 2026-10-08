# Day 1 — Foundation, Docker, PostgreSQL and Service Bootstrap

## Objective

Build the development environment before adding business logic.

At the end of the day, Docker Compose should start:

- PostgreSQL
- Laravel
- Next.js
- Go

Every application should expose a basic health endpoint or page.

---

## Learning Outcomes

By the end of Day 1 you should understand:

- Why a monorepo can be useful for a small multi-service portfolio project.
- What Docker containers are.
- How Docker Compose connects services.
- How environment variables configure applications.
- How Laravel connects to PostgreSQL.
- How a Go HTTP server is structured at a basic level.
- How Next.js is initialized and served.
- How container DNS/service names work.

---

## D1-01 — Initialize Git Repository

### What to do

Create the project repository and initialize Git.

### How to do it

```bash
git init
```

Create an initial commit after adding the base README and `.gitignore`.

### Test

```bash
git status
git log --oneline
```

### Learning

Git should give you a safe checkpoint system. Your learning project becomes easier to debug when every meaningful step is committed.

---

## D1-02 — Create Project Root

### What to do

Create:

```text
caribeops/
```

### Test

Confirm the directory exists and Git recognizes it.

### Learning

The root directory will contain several independently runnable applications.

---

## D1-03 — Create Monorepo Structure

### What to do

Create:

```text
backend/
frontend/
analytics/
infra/
docs/
README.md
```

### Test

Check the structure with a directory tree command.

### Learning

A monorepo keeps related services together while preserving clear ownership of code.

---

## D1-04 — Create Initial README

### What to do

Document:

- project purpose
- technology stack
- initial architecture

### How to do it

Describe what each technology is responsible for rather than only listing technologies.

### Test

A developer should understand the project in under one minute.

### Learning

Good documentation begins before implementation is complete. It forces you to define boundaries between services.

---

## D1-05 — Create `.gitignore`

### What to do

Include ignores for:

- Laravel dependencies and local configuration
- Node dependencies and build artifacts
- Go binaries
- environment files
- editor files

### Test

Add a temporary `.env` and confirm Git does not stage it.

### Learning

Environment configuration belongs outside source control when it contains secrets or machine-specific values.

---

## D1-06 — Create Docker Compose Skeleton

### What to do

Create `docker-compose.yml` with a valid Compose structure.

### Test

```bash
docker compose config
```

The command should finish without YAML/configuration errors.

### Learning

Docker Compose is a declarative way to describe a group of related containers.

---

## D1-07 — Add PostgreSQL Container

### What to do

Configure a PostgreSQL service with:

- image
- database name
- username
- password
- internal network
- optional host port for local tools

### Test

```bash
docker compose up -d postgres
```

Then verify the container is running.

### Learning

Separate the database from application processes. Containers communicate through the Compose network.

---

## D1-08 — Add PostgreSQL Persistent Volume

### What to do

Create a named volume and mount it to PostgreSQL's data directory.

### Test

1. Start PostgreSQL.
2. Create a small test database object.
3. Stop/remove the container without removing the volume.
4. Start PostgreSQL again.
5. Verify the object remains.

### Learning

Container filesystems are disposable by default. Database persistence requires a volume or another persistent storage mechanism.

---

## D1-09 — Add PostgreSQL Health Check

### What to do

Configure a health check using PostgreSQL readiness tooling.

### Test

Inspect container status and confirm it becomes `healthy`.

### Learning

“Container is running” and “service is ready” are not the same thing. Health checks let dependent services detect readiness.

---

## D1-10 — Create Laravel Application

### What to do

Initialize Laravel inside:

```text
backend/laravel/
```

### Test

Start Laravel locally or through the container and open its application endpoint.

### Learning

Review Laravel's default project structure: routes, controllers, models, migrations, configuration, tests, and application bootstrap.

---

## D1-11 — Connect Laravel to PostgreSQL

### What to do

Configure Laravel's database environment variables to target the PostgreSQL service.

Inside Docker, use the Compose service name as the database host rather than `localhost`.

### Test

```bash
php artisan migrate
```

or execute the equivalent command inside the Laravel container.

### Learning

Inside a container, `localhost` means the current container. To reach PostgreSQL, use the PostgreSQL service name on the Docker network.

---

## D1-12 — Create Laravel Health Endpoint

### What to do

Create:

```text
GET /api/health
```

Return:

```json
{
  "status": "ok"
}
```

### Test

Request the endpoint with curl, Postman, or a browser-capable HTTP client.

Expected: HTTP 200.

### Learning

A health endpoint gives you a tiny deterministic test for application availability.

---

## D1-13 — Create Next.js Application

### What to do

Initialize Next.js inside:

```text
frontend/next/
```

Choose a TypeScript setup.

### Test

Run the development server and verify the default page renders.

### Learning

Review the App Router structure and where pages/components are located.

---

## D1-14 — Create First Next.js Page

### What to do

Replace the default page with a minimal CaribeOps landing/dashboard message.

Example:

```text
CaribeOps
Tourism Operations & Analytics
```

### Test

The application should render without runtime errors.

### Learning

Understand the relationship between routes, pages, and components in Next.js.

---

## D1-15 — Create Go Module

### What to do

Initialize Go inside:

```text
analytics/go/
```

### Test

```bash
go mod tidy
```

### Learning

`go.mod` defines the module and its dependency information.

---

## D1-16 — Create Go HTTP Server

### What to do

Create a minimal Go HTTP server with:

```text
GET /health
```

### Test

Start the Go service and request `/health`.

Expected: HTTP 200.

### Learning

Learn the basic flow of an HTTP service: listener → router/handler → response.

---

## D1-17 — Add All Services to Docker Compose

### What to do

Add:

```text
postgres
laravel
next
analytics/go
```

as Compose services.

### Test

```bash
docker compose up --build
```

All services should start or reach their expected state.

### Learning

Compose lets you develop several services as one local environment.

---

## D1-18 — Verify Container-to-Container Networking

### What to do

Confirm:

- Laravel reaches PostgreSQL.
- Go reaches PostgreSQL.
- Next.js can reach the API using the intended network configuration.

### Test

Use connection attempts from the containers and check logs.

### Learning

Understand Docker's internal DNS and the difference between host networking and container networking.

---

## D1-19 — Create Environment Examples

### What to do

Create `.env.example` files containing required variables without real secrets.

### Test

Review every service and confirm its required configuration is documented.

### Learning

A portfolio project should be reproducible by another developer.

---

## D1-20 — Create Developer Commands

### What to do

Create a simple `Makefile` or equivalent scripts with commands such as:

```bash
make up
make down
make logs
make test
```

### Test

Run every command and confirm it behaves as documented.

### Learning

Small developer commands reduce setup friction and make your project easier to demonstrate.

---

## D1-21 — Commit Day 1

### Commit

```text
chore: initialize project infrastructure
```

### Final Day Checkpoint

You should have:

```text
Docker Compose       ✅
PostgreSQL           ✅
Laravel              ✅
Next.js              ✅
Go                   ✅
Service networking   ✅
Environment examples✅
```

Do not start Day 2 until this environment is stable.
