.PHONY: help up down logs build test test-backend test-frontend clean prod-up prod-down

help:
	@echo "KalaSathi Engineering & Operations CLI"
	@echo "--------------------------------------------------------"
	@echo "make up             : Start local dev compose (API, Postgres, Redis)"
	@echo "make down           : Stop local dev compose"
	@echo "make logs           : Tail logs of all running services"
	@echo "make test           : Run all tests (backend and frontend)"
	@echo "make test-backend   : Run Spring Boot Maven test suite"
	@echo "make test-frontend  : Run Vite & TypeScript test suite"
	@echo "make prod-up        : Start full production stack with Nginx Reverse Proxy"
	@echo "make prod-down      : Stop production stack"
	@echo "make clean          : Prune test artifacts and node_modules dist"

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

test: test-backend test-frontend

test-backend:
	mvn -f server/pom.xml clean test

test-frontend:
	npm run test --prefix frontend
	npm run test:ui --prefix frontend

prod-up:
	docker compose -f docker-compose.prod.yml up --build -d

prod-down:
	docker compose -f docker-compose.prod.yml down

clean:
	mvn -f server/pom.xml clean
	rm -rf frontend/dist
