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
