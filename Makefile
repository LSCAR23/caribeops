.PHONY: help up down logs status test test-e2e smoke

COMPOSE := docker compose

help:
	@echo "CaribeOps developer commands"
	@echo "  make up       Start all services in Docker Compose"
	@echo "  make down     Stop and remove containers"
	@echo "  make logs     Follow docker compose logs"
	@echo "  make status   Show running container status"
	@echo "  make test     Run all test suites (Laravel + Go + vitest)"
	@echo "  make test-e2e Run the Playwright user flow (needs stack + E2E_* env)"
	@echo "  make smoke    Run basic smoke checks for all services"

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f --tail=100

status:
	$(COMPOSE) ps

test:
	cd backend/laravel && php artisan test --compact
	cd analytics/go && go test -count=1 ./...
	cd frontend/next && npm test

test-e2e:
	@echo "Requires: artisan serve :8000, next dev :3101, seeded PG, E2E_EMAIL/E2E_PASSWORD (see docs/plans/d6-26-e2e-user-flow.md)"
	cd frontend/next && npm run test:e2e

smoke:
	@echo "Checking Laravel health..."
	@curl -fsS http://localhost:8000/api/health
	@echo "\nChecking Go analytics health..."
	@curl -fsS http://localhost:8080/health
	@echo "\nChecking Next.js server..."
	@curl -fsSI http://localhost:3000 | head -n 1
