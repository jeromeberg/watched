DEV := -f docker-compose.dev.yml
PROD := -f docker-compose.prod.yml

dev:
	docker compose $(DEV) up --build -d

prod:
	docker compose $(PROD) up --build -d

down:
	docker compose $(DEV) down
	docker compose $(PROD) down

redev: down dev

reprod: down prod

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

.PHONY: dev prod down redev reprod logs restart backend-shell db-shell migrate prisma db-dump db-restore db-wipe
