#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="/data/dev"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"

docker compose -f "${COMPOSE_FILE}" exec -T backend python -m app.seed_demo
