# Deploy

The application ships with a Docker image (`Dockerfile`) and a Compose stack (`docker-compose.yml`) intended for a single-node Swarm deploy:

```sh
export IMAGE=ghcr.io/madeindjs/immo-trends:latest
docker stack deploy -c docker-compose.yml immo-trends
```

## SQLite in a named volume

The DVF dataset is large (~6 GB raw, several GB once imported into SQLite). Re-downloading and re-importing it on every image release would make upgrades painfully slow. To avoid that, the SQLite database is persisted in a Docker named volume.

- The stack defines a `dvf-data` volume in `docker-compose.yml`, mounted at `/app/data` inside the container. We mount on a **directory** rather than directly on the SQLite file because, when a volume target does not exist in the image, Docker materializes an empty directory at that path — which would otherwise trap us writing the file at `/app/data/dvf.sqlite3/dvf.sqlite3` instead of `/app/data/dvf.sqlite3`.
- The app reads the database via `process.env.DVF_DB_PATH`, which `docker-compose.yml` sets to `/app/data/dvf.sqlite3`. Locally (no env var), the app falls back to `<cwd>/dvf.sqlite3`.
- On first deploy, the volume is empty and `/app/data/dvf.sqlite3` is absent. `docker-entrypoint.sh` detects this, runs `./init.sh` from inside `/app/data` (which downloads the archive into `./data/`, decompresses it, imports into SQLite, builds indexes), then deletes the intermediate files to reclaim space. The result is stored in the volume.
- On subsequent deploys, `/app/data/dvf.sqlite3` is already in the volume, the entrypoint skips the bootstrap entirely, and the Nuxt server starts immediately.

## Resetting the volume

To force a re-import (e.g. after a major DVF schema change), stop the stack and remove the volume:

```sh
docker stack rm immo-trends
docker volume rm immo-trends_dvf-data
docker stack deploy -c docker-compose.yml immo-trends
```

The next start will see an empty volume and re-run `init.sh`.

## Local development

Locally, run `./init.sh` on the host and start the Nuxt dev server as usual; the volume workflow only applies to the containerized deploy.

```sh
./init.sh
npm run dev
```
