.PHONY: help up down logs status test

COMPOSE := docker compose

help:
	@echo "CaribeOps developer commands"
	@echo "  make up       Start all services in Docker Compose"
	@echo "  make down     Stop and remove containers"
	@echo "  make logs     Follow docker compose logs"
	@echo "  make status   Show running container status"
	@echo "  make test     Run basic smoke checks for all services"

up:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f --tail=100

status:
	$(COMPOSE) ps

test:
	@echo "Checking Laravel health..."
	@curl -fsS http://localhost:8000/api/health
	@echo "\nChecking Go analytics health..."
	@curl -fsS http://localhost:8080/health
	@echo "\nChecking Next.js server..."
	@curl -fsSI http://localhost:3000 | head -n 1
