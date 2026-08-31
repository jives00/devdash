# DevDash

Personal monitoring dashboard for the NAS-hosted Docker services. Queries the Docker daemon directly via the mounted socket (`dockerode`) — container status, health checks, log streaming, error badges, and MySQL backup status. Single-user, live at `http://synology:3005`.

## Stack & layout

Next.js 14 (App Router) + TypeScript + Tailwind. Single app, no monorepo. pnpm.

- `lib/projects.ts` — **the project registry (source of truth)**. `PROJECTS` (monitored apps), `INFRASTRUCTURE` (shared services), `ONE_SHOT` (scheduled task containers). **When a new Docker project is added to the NAS, register it here** and add a row to README's "Projects monitored" table.
- `lib/docker.ts` — dockerode wrapper (container info, logs, error scraping)
- `app/api/*` — API routes (containers, health/[service], backup-status, logs)
- `components/*` — presentational cards

## Run / build

- Dev: `pnpm dev`. Lint: `pnpm lint`. Build: `pnpm build`.
- No tests exist. No env vars needed — the app only needs the Docker socket and the backups bind mount (see `docker-compose.yml`).
- Local dev on Windows has no `/var/run/docker.sock`; container/health data only works on the NAS (or against Docker Desktop's socket).

## Deploy

GitHub Actions → `ghcr.io/jives00/devdash:latest` → Watchtower auto-deploys to the NAS within ~5 min of merge to `main`. Compose maps port `3005:3000`, mounts `/var/run/docker.sock` and `/volume2/docker/shared/backups` (read-only), joins the external `shared-db` network. Health URLs in `lib/projects.ts` use container-internal hostnames (e.g. `http://trakt-api:3002/health`) — they resolve only on that Docker network.
