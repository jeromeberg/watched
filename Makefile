-include .env

DEV := -f docker-compose.dev.yml
PROD := -f docker-compose.prod.yml
CLOUD := $(PROD) -f docker-compose.cloud.yml

dev:
	docker compose $(DEV) up --build -d
	@echo "Running on $(DEV_URL)"

prod:
	docker compose $(PROD) up --build -d
	@echo "Running on $(PROD_URL)"

cloud:
	PROD_API_URL=$(CLOUD_API_URL) PROD_URL=$(CLOUD_URL) docker compose $(CLOUD) up --build -d
	@echo "Running on $(CLOUD_URL)"

down:
	docker compose $(DEV) down
	docker compose $(PROD) down
	-docker compose $(CLOUD) down

redev: down dev

reprod: down prod

recloud: down cloud

logs:
	docker compose $(DEV) logs -f

backend-shell:
	docker compose $(DEV) exec -it backend sh

db-shell:
	docker compose $(DEV) exec -it db psql -U postgres -d watched

migrate:
	docker compose $(DEV) exec -it backend npx prisma migrate dev

prisma:
	docker compose $(DEV) exec -it backend npx prisma studio --port 5555 --browser none

db-dump:
	@mkdir -p backups
	$(eval TS := $(shell date +%Y%m%d-%H%M%S))
	docker compose $(DEV) exec db pg_dump -U postgres -d watched --no-owner > backups/watched-$(TS).sql
	@echo "Saved to backups/watched-$(TS).sql"

db-restore:
	@test -n "$(FILE)" || (echo "Usage: make db-restore FILE=backups/watched-<timestamp>.sql" && exit 1)
	docker compose $(DEV) exec -T db psql -U postgres -d watched < $(FILE)

db-wipe:
	@echo "⚠️ WARNING: This will delete database volume. All data will be lost."
	@read -p "Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ] || (echo "Aborted." && exit 1)
	docker compose $(DEV) down -v
	@echo "Volume wiped."

.PHONY: dev prod cloud down redev reprod recloud logs backend-shell db-shell migrate prisma db-dump db-restore db-wipe
