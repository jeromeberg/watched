# Watched

A full-stack movie/TV show watchlist app, using the TMDB API.

## Features

- User accounts
- Library: watched / to watch
- Collections: organize your library
- Rate titles and add notes
- TV shows: track episodes per season
- Search from TMDB

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: NestJS
- Database: PostgreSQL
- ORM: Prisma
- Containerization: Docker, Docker Compose
- Nginx

## Instructions

Requires Docker and Docker Compose.

### Quick start

⚠️ A [TMDB](https://www.themoviedb.org/) API key is required.

```bash
# copy and fill env
cp .env.example .env

# start in dev mode
make dev

# start in prod mode
make prod
```

### Commands

| Command                     | Description              |
| --------------------------- | ------------------------ |
| `make dev`                  | Start in dev mode        |
| `make prod`                 | Start in prod mode       |
| `make down`                 | Stop all containers      |
| `make redev`                | Rebuild and restart dev  |
| `make reprod`               | Rebuild and restart prod |
| `make logs`                 | Get logs (dev only)      |
| `make backend-shell`        | Open backend shell       |
| `make db-shell`             | Open db shell            |
| `make migrate`              | Run Prisma migration     |
| `make prisma`               | Open Prisma Studio       |
| `make db-dump`              | Dump database            |
| `make db-restore FILE=path` | Restore a dump           |
| `make db-wipe`              | Delete db volume         |
