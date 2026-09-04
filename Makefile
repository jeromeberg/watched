-include .env

DC := docker compose

DEV := -f docker-compose.dev.yml
PROD := -f docker-compose.prod.yml
CLOUD := $(PROD) -f docker-compose.cloud.yml

dev:
	$(DC) $(DEV) up --build -d

redev: down dev

prod:
	$(DC) $(PROD) up --build -d

cloud:
	$(DC) $(CLOUD) up --build -d

deploy:
	git fetch origin main
	git reset --hard origin/main
	$(DC) $(CLOUD) pull
	$(DC) $(CLOUD) up -d --remove-orphans
	docker image prune -f

down:
	$(DC) $(DEV) down --remove-orphans

logs:
	$(DC) $(DEV) logs -f

shback:
	$(DC) $(DEV) exec -it backend sh

shdb:
	$(DC) $(DEV) exec -it db psql -U postgres -d watched

prisma:
	$(DC) $(DEV) exec -it backend npx prisma studio --port 5555 --browser none

.PHONY: dev prod cloud down redev deploy logs shback shdb prisma
