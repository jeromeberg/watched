-include .env

DEV := -f docker-compose.dev.yml
PROD := -f docker-compose.prod.yml
CLOUD := $(PROD) -f docker-compose.cloud.yml

ENV ?= dev

dev:
	docker compose $(DEV) up --build -d
	@echo "Running on $(DEV_URL)"

prod:
	docker compose $(PROD) up --build -d
	@echo "Running on $(PROD_URL)"

cloud:
	docker compose $(CLOUD) up --build -d
	@echo "Running on $(CLOUD_URL)"

down:
	docker compose $(DEV) down
	docker compose $(PROD) down
	-docker compose $(CLOUD) down

redev: down dev

reprod: down prod

deploy:
	git fetch origin main
	git reset --hard origin/main
	docker compose $(CLOUD) pull
	docker compose $(CLOUD) up -d --remove-orphans
	docker image prune -f

logs:
ifeq ($(ENV),prod)
	docker compose $(PROD) logs -f
else ifeq ($(ENV),cloud)
	docker compose $(CLOUD) logs -f
else
	docker compose $(DEV) logs -f
endif

# --- dev ---

backend-shell:
	docker compose $(DEV) exec -it backend sh

db-shell:
	docker compose $(DEV) exec -it db psql -U postgres -d watched

migrate:
	docker compose $(DEV) exec -it backend npx prisma migrate dev

prisma:
	docker compose $(DEV) exec -it backend npx prisma studio --port 5555 --browser none

# --- utils ---

db-dump:
	@mkdir -p backups
	$(eval TS := $(shell date +%Y%m%d-%H%M%S))
ifeq ($(ENV),prod)
	docker compose $(PROD) exec db pg_dump -U postgres -d watched --no-owner > backups/watched-$(TS).sql
else ifeq ($(ENV),cloud)
	docker compose $(CLOUD) exec db pg_dump -U postgres -d watched --no-owner > backups/watched-$(TS).sql
else
	docker compose $(DEV) exec db pg_dump -U postgres -d watched --no-owner > backups/watched-$(TS).sql
endif
	@echo "Saved to backups/watched-$(TS).sql"

db-restore:
	@test -n "$(FILE)" || (echo "Usage: make db-restore FILE=backups/watched-<timestamp>.sql" && exit 1)
ifeq ($(ENV),prod)
	docker compose $(PROD) exec -T db psql -U postgres -d watched < $(FILE)
else ifeq ($(ENV),cloud)
	docker compose $(CLOUD) exec -T db psql -U postgres -d watched < $(FILE)
else
	docker compose $(DEV) exec -T db psql -U postgres -d watched < $(FILE)
endif

db-wipe:
	@echo "⚠️ WARNING: This will delete the db volume ($(ENV)). All data will be lost."
	@read -p "Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
ifeq ($(ENV),prod)
	docker compose $(PROD) down -v
else ifeq ($(ENV),cloud)
	docker compose $(CLOUD) down -v
else
	docker compose $(DEV) down -v
endif
	@echo "Volume wiped."

tmdb-refresh:
ifeq ($(ENV),prod)
	docker compose $(PROD) exec -T backend node < scripts/tmdb-refresh.js
else ifeq ($(ENV),cloud)
	docker compose $(CLOUD) exec -T backend node < scripts/tmdb-refresh.js
else
	docker compose $(DEV) exec -T backend node < scripts/tmdb-refresh.js
endif

.PHONY: dev prod cloud down redev reprod deploy logs backend-shell db-shell migrate prisma db-dump db-restore db-wipe tmdb-refresh
