# Runbook

## Overview
This repository targets a single-admin self-hosted household ledger MVP. The implementation currently includes backend APIs, request-level backend tests, and a Vite/React frontend with login, dashboard, transactions, and settings scaffolds.

## Environment
Environment variables are defined in `/data/dev/.env.example`.

Important variables:
- `BACKEND_PORT`
- `BACKEND_HOST_PORT`
- `FRONTEND_PORT`
- `FRONTEND_HOST_PORT`
- `MARIADB_PORT`
- `MARIADB_HOST_PORT`
- `MARIADB_DATABASE`
- `MARIADB_USER`
- `MARIADB_PASSWORD`
- `MARIADB_ROOT_PASSWORD`
- `SESSION_SECRET_KEY`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_SAMESITE`
- `SESSION_COOKIE_MAX_AGE`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `APP_LOG_DIR`
- `APP_LOG_LEVEL`
- `VITE_API_BASE_URL`

`VITE_API_BASE_URL` can remain empty for local Vite proxy usage. In reverse-proxy or split-origin deployments, set it explicitly.

## Start
From the repository root:

```bash
docker compose -f /data/dev/docker-compose.yml up --build
```

Expected ports:
- Frontend: `3000`
- Backend: `8000`
- MariaDB: `3306`

Default bootstrap admin:
- username: `admin`
- password: `1234*`

Change these values before non-local deployment.

## Health Check
Backend health endpoint:

```bash
curl http://localhost:8000/health
```

## Backend Validation
Request-level backend tests:

```bash
docker run --rm -v /data/dev/backend:/app -w /app python:3.12-slim sh -lc "pip install --no-cache-dir -r requirements-dev.txt && python -m unittest discover -s tests -v"
```

This test suite covers:
- accounts CRUD
- categories CRUD
- transactions CRUD/query
- dashboard summary
- CSV export
- password change API

## Frontend Validation
Frontend build check:

```bash
docker run --rm -v /data/dev/frontend:/app -w /app node:22-alpine sh -lc "npm install && npm run build"
```

## Compose Smoke Test
Use the repository smoke test script for a reproducible startup check:

```bash
/data/dev/scripts/compose-smoke-test.sh
```

This script:
- starts the compose stack with `--build`
- checks backend `/health` from inside the backend container
- checks session login with the bootstrap admin from inside the backend container
- checks frontend HTML from inside the frontend container
- prints recent backend/frontend logs
- tears the stack down on exit

## App Flow Smoke Test
Use the app-flow smoke test when you want to verify the MVP ledger flow on a fresh compose stack:

```bash
/data/dev/scripts/app-flow-smoke-test.sh
```

This script additionally verifies:
- admin login
- account creation
- category creation
- transaction creation
- monthly dashboard summary
- CSV export contents

## Optional Demo Data
For demo or UI review in a running compose stack:

```bash
/data/dev/scripts/seed-demo-data.sh
```

Behavior:
- runs inside the backend container
- bootstraps schema/admin if needed
- inserts sample accounts, categories, and transactions
- skips automatically when transactions already exist

## MVP Exclusions
The following are out of scope for MVP:
- CSV Import
- Transfer
- Stats charts
- Recurring transactions
- Budgeting
- OCR / attachments / notifications

## Operational Notes
- Codex session logs are stored under `/data/log/`.
- Application runtime logs are intended for `/data/log/app/`.
- Backend currently writes to stdout and, when available, to `/data/log/app/backend.log`.
- `/data/log/app/` is for application/runtime logs.
- `/data/log/` and `latest-job.log` are for Codex operational/session logs and should stay separate from app logs.
- Current frontend uses Vite proxy for local API access.
- Current backend validation has been done in isolated Docker runtimes and compose startup/log checks.
