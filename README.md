# DevDash

Personal monitoring dashboard for NAS-hosted Docker services.

## What it does

- Shows container status (running / stopped / restarting) for all projects
- HTTP health checks with DB connectivity for Pulse and Trakt
- Live log streaming per container with time range selector and filter
- Error count badges surfaced from recent logs
- Infrastructure section (MySQL, Watchtower, Adminer)
- Auto-refreshes every 10 seconds

## Projects monitored

| Project | Containers | Health check |
|---|---|---|
| Quest | quest-web, quest-api | `/health` with DB ping |
| Trakt | trakt-web, trakt-api | `/health` with DB ping |
| Pulse | pulse-server, pulse-web | `/api/health` with DB ping |
| Travel | travel-web, travel-api | `/health` |
| Vault | vault-web, vault-api | `/health` |
| AlpacaBot | alpacabot | container status only |
| BigEastBot | bigeastbot | container status only |
| BSNSFWBot | bsnsfwbot | container status only |

## Stack

Next.js 14 · TypeScript · Tailwind CSS · dockerode (Docker socket)

## Deploy

Runs at `http://synology:3005`. Mounts `/var/run/docker.sock` to query the local Docker daemon. Watchtower auto-deploys on push to `main`.
