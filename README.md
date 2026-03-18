# Self-hosted Web Household Ledger

Initial scaffold for the MVP web household ledger described in [docs/prd.md](/data/dev/docs/prd.md).

Current scope in this repository:
- `backend/`: backend application area
- `frontend/`: frontend application area
- `docs/`: product and backlog documents
- `infra/`: infrastructure-related files
- `scripts/`: local operational helpers

Current baseline runtime files:
- `docker-compose.yml`: local/server container baseline
- `.env.example`: database and port environment template
- `backend/Dockerfile`: backend container image definition
- `backend/app/main.py`: FastAPI bootstrap with `/health`
- `backend/app/core/config.py`: environment-based backend settings
- `backend/app/db/session.py`: SQLAlchemy engine and session pattern

You can copy `.env.example` to `.env` later, but the current Compose file also has safe defaults so the baseline file can be reviewed without app code in place.

Compose services and default ports:
- `backend`: `8000`
- `frontend`: `3000`
- `db` (MariaDB): `3306`

Current repository state remains scaffold-first. Application code, API logic, and framework-specific bootstrap are deferred to later tickets.
