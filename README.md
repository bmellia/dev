# Self-hosted Web Household Ledger

MVP web household ledger for single-admin self-hosted use. Product scope and constraints are defined in [docs/prd.md](/data/dev/docs/prd.md), and the ticket sequence is tracked in [docs/backlog.md](/data/dev/docs/backlog.md).

Current repository areas:
- `backend/`: FastAPI + SQLAlchemy backend
- `frontend/`: React + Vite frontend
- `docs/`: PRD, backlog, runbook
- `infra/`: reserved infrastructure area
- `scripts/`: Codex session/log helpers

Implemented MVP baseline:
- Session-based admin login API
- Startup admin bootstrap for compose/runtime environments
- Accounts CRUD API
- Categories CRUD API
- Transactions CRUD API
- Monthly/day transaction query API
- Dashboard summary/account summary API
- CSV export API
- React frontend scaffold
- Login UI
- Dashboard UI
- Transactions list UI
- Settings UI for accounts, categories, CSV export, password change
- Backend request-level tests in Docker Python runtime

## Runtime
Compose services and default ports:
- `backend`: `8000`
- `frontend`: `3000`
- `db`: `3306`

Core files:
- `docker-compose.yml`
- `.env.example`
- `backend/Dockerfile`
- `frontend/Dockerfile`

## Local Start
1. Copy `.env.example` to `.env` if you need non-default values.
2. Start the stack:

```bash
docker compose -f /data/dev/docker-compose.yml up --build
```

3. Access:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`

Default bootstrap admin credentials:
- username: `admin`
- password: `1234*`

Change them in `.env` before non-local use.

## Backend Checks
Run backend API tests in Docker:

```bash
docker run --rm -v /data/dev/backend:/app -w /app python:3.12-slim sh -lc "pip install --no-cache-dir -r requirements-dev.txt && python -m unittest discover -s tests -v"
```

## Frontend Checks
Run frontend production build in Docker:

```bash
docker run --rm -v /data/dev/frontend:/app -w /app node:22-alpine sh -lc "npm install && npm run build"
```

## Compose Smoke Test
Run an end-to-end startup and in-container smoke check:

```bash
/data/dev/scripts/compose-smoke-test.sh
```

## MVP Constraints
- Single admin user only
- KRW integer amounts only
- `income` and `expense` only; transfer is excluded from MVP
- CSV Import is excluded from MVP
- Advanced stats, recurring transactions, budgeting, OCR, attachments, notifications are excluded from MVP

Detailed startup, testing, and operational notes are in [docs/runbook.md](/data/dev/docs/runbook.md).
