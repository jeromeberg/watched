# Watched

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

A full-stack movie/TV watchlist app, using the TMDB API.

## Features

- User accounts and profiles
- Library: watched / to watch
- Filter, sort and view library as grid/list
- Collections: organize your library
- Rate titles and add notes
- TV shows: track episodes per season
- Search, get data and posters from TMDB

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

⚠️ A [TMDB API](https://developer.themoviedb.org/docs/getting-started) key is required.

```bash
# copy and fill env
cp .env.example .env

# start in dev mode
make dev

# start in prod mode
make prod
```

### Cloudflare Tunnel

Expose the app publicly via [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/).

`CLOUDFLARE_TOKEN`, `CLOUD_URL` and `CLOUD_API_URL` need to be filled in `.env`.  

Both `CLOUD_URL` and `CLOUD_API_URL` override production values when running `make cloud`.

```bash
# build prod and start tunnel
make cloud
```

⚠️ The API should be exposed on its own domain or **single-level** subdomain (e.g. `api.yourdomain.com`) so it is covered by Cloudflare's SSL certificate.

### Commands

| Command                     | Description              |
| --------------------------- | ------------------------ |
| `make dev`                  | Start in dev mode        |
| `make prod`                 | Start in prod mode       |
| `make cloud`                | Prod + Cloudflare Tunnel |
| `make down`                 | Stop all containers      |
| `make redev`                | Rebuild and start dev    |
| `make reprod`               | Rebuild and start prod   |
| `make recloud`              | Rebuild and start cloud  |
| `make logs`                 | Tail logs (dev)          |
| `make backend-shell`        | Open backend shell (dev) |
| `make db-shell`             | Open db shell (dev)      |
| `make migrate`              | Prisma migration (dev)   |
| `make prisma`               | Open Prisma Studio (dev) |
| `make db-dump`              | Dump database (dev)      |
| `make db-restore FILE=path` | Restore a dump (dev)     |
| `make db-wipe`              | Delete db volume (dev)   |
