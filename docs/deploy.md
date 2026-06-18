# Deploy

The application ships with a Docker image (`Dockerfile`) and a Compose stack (`docker-compose.yml`) intended for a single-node Swarm deploy:

```sh
export IMAGE=ghcr.io/madeindjs/immo-trends:latest
docker stack deploy -c docker-compose.yml immo-trends
```

## SQLite database

The DVF dataset is large (~6 GB raw, several GB once imported into SQLite). Re-downloading and re-importing it on every image release would make upgrades painfully slow. To avoid that, the SQLite database is persisted via a **bind mount** so it survives image updates.

- The stack mounts `./data:/app/data` in `docker-compose.yml`. This places the SQLite file directly on the host filesystem at `./data/dvf.sqlite3` inside the project directory. Unlike a named Docker volume (stored opaquely under `/var/lib/docker/volumes/`), a bind mount lets you see, back up, or move the database file like any other host file.
- The app reads the database via `process.env.DVF_DB_PATH`, which `docker-compose.yml` sets to `/app/data/dvf.sqlite3`. Locally (no env var), the app falls back to `<cwd>/dvf.sqlite3`.
- On first deploy, the `data/` directory is empty and `/app/data/dvf.sqlite3` is absent. `docker-entrypoint.sh` detects this, runs `./init.sh` from `/app`, then moves `dvf.sqlite3` into `/app/data`. The intermediate files are cleaned up afterward.
- On subsequent deploys, `/app/data/dvf.sqlite3` is already present, the entrypoint skips the bootstrap entirely, and the Nuxt server starts immediately.

> **Note** — If you switch back to a named volume later, remember that `docker stack deploy` creates named volumes automatically on first deploy. With a bind mount, the host directory must exist beforehand (Docker creates it automatically when missing).

## Resetting the database

To force a re-import (e.g. after a major DVF schema change), stop the stack and delete the host-side database file:

```sh
docker stack rm immo-trends
rm -f data/dvf.sqlite3
docker stack deploy -c docker-compose.yml immo-trends
```

The next start will see an empty `data/` directory and re-run `init.sh`.

## Local development

Locally, run `./init.sh` on the host and start the Nuxt dev server as usual; the volume workflow only applies to the containerized deploy.

```sh
./init.sh
npm run dev
```
