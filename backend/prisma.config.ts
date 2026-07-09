import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // `prisma generate` runs at Docker build time, before DATABASE_URL exists;
    // it only reads the schema and never connects, so a missing/placeholder
    // value here is fine. `migrate`/`studio` run at container start, when the
    // real DATABASE_URL is injected by docker-compose.
    url: process.env.DATABASE_URL,
  },
});
