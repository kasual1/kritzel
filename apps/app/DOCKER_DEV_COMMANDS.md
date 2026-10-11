# Docker Compose Dev Commands

Useful commands for running the development stack with docker-compose.dev.yml.
Run all commands from the repository root.

## About This Setup

This development environment matches production architecture exactly:
- **nginx** serves as the single entry point on port 8080, routing traffic to all backend services
- **api**, **websocket**, **client**, and **postgres** are accessible only through the internal Docker network
- This ensures you test the same routing and reverse proxy behavior as production

### Accessing Services

| Service | URL | Notes |
|---------|-----|-------|
| **Angular Client** | http://localhost:8080 | Served through nginx |
| **API REST endpoints** | http://localhost:8080/api/* | Proxied to api:3000 |
| **WebSocket** | ws://localhost:8080/ws | Proxied to websocket:1234, WebSocket upgrade headers handled by nginx |
| **Direct service access** | Not available | All services are internal-only (production parity) |
| **PostgreSQL CLI** | Inside postgres container | Use `docker compose exec postgres` commands |

## Start

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
```

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
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f client
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
docker compose -f docker-compose.dev.yml logs -f client
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
docker compose --env-file .env.dev -f docker-compose.dev.yml restart client
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
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build -V client
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
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -d kritzel_yjs -c "\\dt"
```

## WebSocket migrations (TypeORM)

Show migration status:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec websocket sh -lc "npm run migration:show"
```

Run pending migrations manually:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec websocket sh -lc "npm run migration:run"
```

Revert the latest migration:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec websocket sh -lc "npm run migration:revert"
```

Show applied migration history in the DB:

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml exec postgres psql -U postgres -d kritzel_yjs -c "SELECT id, timestamp, name FROM migrations ORDER BY id"
```

Auto-apply pending migrations by restarting websocket (startup runs migrations first):

```bash
docker compose --env-file .env.dev -f docker-compose.dev.yml restart websocket
```

## Clean restart flow (good for DB init issues)

1. docker compose --env-file .env.dev -f docker-compose.dev.yml down -v
2. docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build
3. docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f postgres websocket
