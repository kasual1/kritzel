# Docker Compose Dev Commands

Useful commands for running the development stack with docker-compose.dev.yml.
Run all commands from `apps/app` (or use the `app:*` scripts from the monorepo root).

## About This Setup

This development environment matches production architecture exactly:
- **nginx** serves as the single entry point on port 8080, routing traffic to all backend services
- **api**, **websocket** and **postgres** are accessible only through the internal Docker network
- The **Angular client** is not a container in dev: it runs on the host via `npm run app:client` (from the monorepo root) so it can use the local upmade libraries. nginx proxies `/` to `host.docker.internal:4200`
- This ensures you test the same routing and reverse proxy behavior as production

### Accessing Services

| Service | URL | Notes |
|---------|-----|-------|
| **Angular Client** | http://localhost:8080 | Served through nginx from the host dev server (`npm run app:client`) |
| **API REST endpoints** | http://localhost:8080/api/* | Proxied to api:3000 |
| **WebSocket** | ws://localhost:8080/ws | Proxied to websocket:1234, WebSocket upgrade headers handled by nginx |
| **Direct service access** | Not available | All services are internal-only (production parity) |
| **PostgreSQL CLI** | Inside postgres container | Use `docker compose exec postgres` commands |

## Start

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

Then start the client from the monorepo root (builds the upmade libraries, installs them into the client and runs `ng serve`):

```bash
npm run app:client
```

After changing a library, rebuild it and refresh the client's copy with `npm run app:client:refresh`.

## Quick start (no rebuild)

Use this when images are already built and you just want to bring services back up fast.

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d
```

## Start with live logs

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

## Stop

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml down
```

## Stop and remove volumes (fresh DB)

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml down -v
```

## Status

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml ps
```

## Logs

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f postgres
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f websocket
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f api
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f nginx
```

## Service-only logs (short form)

Use these when you only need one service log stream and do not need explicit env-file flags.

```bash
docker compose -f docker-compose.dev.yml logs -f websocket
```

```bash
docker compose -f docker-compose.dev.yml logs -f postgres
```

```bash
docker compose -f docker-compose.dev.yml logs -f api
```

```bash
docker compose -f docker-compose.dev.yml logs -f nginx
```

## Restart one service

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart postgres
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart websocket
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart api
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart nginx
```

## Rebuild one service

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build -V postgres
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build -V websocket
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build -V api
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build -V nginx
```

## Open shell in containers

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec websocket sh
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec api sh
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres sh
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec nginx sh
```

## Postgres checks

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -l
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -d upmade -c "\\dt"
```

## API migrations (TypeORM)

Migrations live in the api and run automatically when it starts (`migrationsRun`); websocket waits until the api is healthy.

Show migration status:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec api sh -lc "npm run typeorm -- migration:show"
```

Run pending migrations manually:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec api sh -lc "npm run migration:run"
```

Revert the latest migration:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec api sh -lc "npm run migration:revert"
```

Show applied migration history in the DB:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -d upmade -c "SELECT id, timestamp, name FROM migrations ORDER BY id"
```

Auto-apply pending migrations by restarting the api (startup runs migrations first):

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart api
```

## Local setup from before the rename

The dev compose project is now `upmade-app`, so `app:dev` starts with a fresh `upmade-app_pgdata_dev` volume and the database `upmade`. Earlier setups used `updraw-app` (volume `updraw-app_pgdata_dev`, database `updraw`) or, before that, `kritzel-app` (volume `kritzel-app_pgdata_dev`, database `kritzel`).

- In `.env.dev`, change the database name at the end of `DATABASE_URL` to `upmade`. Otherwise the api cannot connect, never becomes healthy, and websocket does not start.
- To keep your old local data, copy the old volume before the first start, then rename the database, as shown below. If you don't need it, skip all this: the fresh volume is ready to use. On its first start the api moves the documents to the `upmade-…` names; a Kritzel-era database gets both rebrand migrations.

Copy the newest one you used: `updraw-app_pgdata_dev`, or `kritzel-app_pgdata_dev` if you never ran the Updraw setup.

First stop the old stack. `npm run app:stop` and the commands in this file only reach `upmade-app` now, so a running `updraw-app` or `kritzel-app` stack would keep writing to the volume you copy and keep ports 5432 and 8080, and `up -d postgres` below would fail with `port is already allocated`:

```bash
docker compose -p updraw-app down    # no -v: the old volume is what you copy
docker compose -p kritzel-app down   # Kritzel-era setups; does nothing if there is no such stack
docker volume ls | grep pgdata_dev
```

If `upmade-app_pgdata_dev` is already listed, `app:dev` ran before the copy. Unless you need its data, remove it first: `docker compose --env-file .env.dev -f docker-compose.dev.yml down -v` (this deletes `upmade-app_pgdata_dev` only).

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml create postgres
```

```bash
OLD_VOLUME=updraw-app_pgdata_dev   # or kritzel-app_pgdata_dev
docker run --rm -v "$OLD_VOLUME":/from:ro -v upmade-app_pgdata_dev:/to alpine sh -c 'cp -a /from/. /to/'
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d postgres
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -l   # updraw or kritzel
```

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -d postgres -c 'ALTER DATABASE updraw RENAME TO upmade'   # or kritzel
```

The old volumes stay as they were; remove them with `docker volume rm` once you no longer need them.

## Clean restart flow (good for DB init issues)

1. docker compose --env-file .env.dev -f docker-compose.dev.yml down -v
2. docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
3. docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f postgres api websocket
