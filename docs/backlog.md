# Backlog

## Scope
This backlog covers **MVP only**.

Excluded from MVP:
- CSV Import
- Transfer
- Stats
- Recurring transactions
- Budgeting
- OCR / attachments / notifications

---

## Ticket 01 — Project scaffold
### Goal
Create the initial repository structure for frontend, backend, docs, and infra.

### Likely files
- `/data/dev/backend/`
- `/data/dev/frontend/`
- `/data/dev/docs/`
- `/data/dev/.gitignore`
- `/data/dev/README.md`

### Acceptance criteria
- Backend and frontend root directories exist
- `docs/` exists
- `.gitignore` exists with Python, Node, env, build, and log ignores
- README contains a short project overview

---

## Ticket 02 — Docker Compose baseline
### Goal
Create a reproducible local/server runtime using Docker Compose.

### Likely files
- `/data/dev/docker-compose.yml`
- `/data/dev/.env.example`

### Acceptance criteria
- Compose file defines at least:
  - app/backend service
  - frontend service
  - MariaDB service
- `.env.example` includes DB-related environment variables
- Service names and ports are documented in comments or README

---

## Ticket 03 — FastAPI backend bootstrap
### Goal
Create the initial FastAPI application skeleton.

### Likely files
- `/data/dev/backend/app/main.py`
- `/data/dev/backend/app/__init__.py`
- `/data/dev/backend/requirements.txt` or `pyproject.toml`
- `/data/dev/backend/Dockerfile`

### Acceptance criteria
- FastAPI app starts successfully
- Basic `/health` endpoint exists
- Backend container can start from Dockerfile

---

## Ticket 04 — MariaDB connection and configuration
### Goal
Set up backend DB configuration and connection management.

### Likely files
- `/data/dev/backend/app/core/config.py`
- `/data/dev/backend/app/db/session.py`
- `/data/dev/backend/app/db/base.py`

### Acceptance criteria
- DB settings are loaded from environment variables
- App can establish a MariaDB connection
- Connection/session pattern is defined

---

## Ticket 05 — Initial database schema
### Goal
Define MVP schema for accounts, categories, transactions, and admin/auth baseline.

### Likely files
- `/data/dev/backend/app/models/account.py`
- `/data/dev/backend/app/models/category.py`
- `/data/dev/backend/app/models/transaction.py`
- `/data/dev/backend/app/models/admin_user.py`
- migration files or schema SQL

### Acceptance criteria
- Tables for accounts, categories, transactions, and admin user are defined
- `transactions` includes:
  - occurred_at
  - transaction_type
  - account_id
  - category_id
  - amount
  - description
  - source_type
  - import_batch_id
  - dedupe_hash
  - created_at
  - updated_at
- No transfer-specific fields are required in MVP

---

## Ticket 06 — Admin authentication model and password hashing
### Goal
Implement the single-admin authentication foundation.

### Likely files
- `/data/dev/backend/app/models/admin_user.py`
- `/data/dev/backend/app/core/security.py`
- `/data/dev/backend/app/services/auth_service.py`

### Acceptance criteria
- Admin user model exists
- Password hashing utility exists
- Password verification utility exists
- Design supports session-cookie login

---

## Ticket 07 — Session-based login API
### Goal
Implement login, logout, and current-session endpoints.

### Likely files
- `/data/dev/backend/app/api/auth.py`
- `/data/dev/backend/app/core/session.py`

### Acceptance criteria
- Login endpoint exists
- Logout endpoint exists
- Session check/me endpoint exists
- Session cookie is HttpOnly and designed for secure deployment

---

## Ticket 08 — Accounts CRUD API
### Goal
Implement CRUD APIs for accounts.

### Likely files
- `/data/dev/backend/app/api/accounts.py`
- `/data/dev/backend/app/schemas/account.py`
- `/data/dev/backend/app/services/account_service.py`

### Acceptance criteria
- Create/read/update account endpoints exist
- Account deactivation is supported
- `account_type` supports:
  - cash
  - bank
  - card
  - ewallet
  - liability

---

## Ticket 09 — Categories CRUD API
### Goal
Implement CRUD APIs for categories.

### Likely files
- `/data/dev/backend/app/api/categories.py`
- `/data/dev/backend/app/schemas/category.py`
- `/data/dev/backend/app/services/category_service.py`

### Acceptance criteria
- Create/read/update category endpoints exist
- Category deactivation is supported
- `category_type` supports:
  - income
  - expense

---

## Ticket 10 — Transactions CRUD API
### Goal
Implement CRUD APIs for transactions.

### Likely files
- `/data/dev/backend/app/api/transactions.py`
- `/data/dev/backend/app/schemas/transaction.py`
- `/data/dev/backend/app/services/transaction_service.py`

### Acceptance criteria
- Create/read/update/delete transaction endpoints exist
- Only `income` and `expense` are supported
- Amount is validated as positive integer
- Account is required
- Category is optional

---

## Ticket 11 — Monthly and daily transaction query API
### Goal
Provide list endpoints for month/day filtering and sorting.

### Likely files
- `/data/dev/backend/app/api/transactions.py`
- `/data/dev/backend/app/services/transaction_query_service.py`

### Acceptance criteria
- Monthly query is supported
- Daily query is supported
- Default sort is newest first
- Basic filter parameters are documented

---

## Ticket 12 — Dashboard summary API
### Goal
Provide dashboard data for monthly totals and account summaries.

### Likely files
- `/data/dev/backend/app/api/dashboard.py`
- `/data/dev/backend/app/services/dashboard_service.py`

### Acceptance criteria
- Monthly income total endpoint exists
- Monthly expense total endpoint exists
- Monthly net total endpoint exists
- Account summary endpoint exists or equivalent response is included

---

## Ticket 13 — CSV Export API
### Goal
Implement CSV export for MVP transactions.

### Likely files
- `/data/dev/backend/app/api/export.py`
- `/data/dev/backend/app/services/export_service.py`

### Acceptance criteria
- CSV download endpoint exists
- Output includes header row
- Output uses standard columns:
  - Date
  - Type
  - Account
  - Category
  - Amount
  - Description
- UTF-8 output is documented

---

## Ticket 14 — React frontend scaffold
### Goal
Create the initial React + Vite frontend structure.

### Likely files
- `/data/dev/frontend/package.json`
- `/data/dev/frontend/src/main.*`
- `/data/dev/frontend/src/App.*`
- `/data/dev/frontend/Dockerfile`

### Acceptance criteria
- Frontend app boots successfully
- Basic routing or page structure exists
- API base configuration exists

---

## Ticket 15 — Login UI
### Goal
Implement the login page and session bootstrap flow.

### Likely files
- `/data/dev/frontend/src/pages/Login.*`
- `/data/dev/frontend/src/services/auth.*`

### Acceptance criteria
- User can submit password to login
- Session state is stored client-side safely
- Failed login message is shown

---

## Ticket 16 — Dashboard UI
### Goal
Implement the MVP dashboard screen.

### Likely files
- `/data/dev/frontend/src/pages/Dashboard.*`
- `/data/dev/frontend/src/components/summary/`

### Acceptance criteria
- Monthly income/expense/net totals are visible
- Account summary is visible
- Recent transactions section exists

---

## Ticket 17 — Transactions list UI
### Goal
Implement list view for transactions with month/day filtering.

### Likely files
- `/data/dev/frontend/src/pages/Transactions.*`
- `/data/dev/frontend/src/components/transactions/`

### Acceptance criteria
- Transactions are listed
- Month filter exists
- Day filter or date filter exists
- Basic sorting and empty-state handling exist

---

## Ticket 18 — Transaction form UI
### Goal
Implement add/edit form for transactions.

### Likely files
- `/data/dev/frontend/src/components/transactions/TransactionForm.*`

### Acceptance criteria
- User can create a transaction
- User can edit a transaction
- Required field validation exists
- Positive integer amount validation exists

---

## Ticket 19 — Settings UI for accounts and categories
### Goal
Implement management UI for accounts and categories.

### Likely files
- `/data/dev/frontend/src/pages/Settings.*`
- `/data/dev/frontend/src/components/settings/AccountsManager.*`
- `/data/dev/frontend/src/components/settings/CategoriesManager.*`

### Acceptance criteria
- Account list/create/edit/deactivate UI exists
- Category list/create/edit/deactivate UI exists

---

## Ticket 20 — Settings UI for CSV export and password change
### Goal
Complete MVP settings features.

### Likely files
- `/data/dev/frontend/src/components/settings/ExportPanel.*`
- `/data/dev/frontend/src/components/settings/PasswordChangeForm.*`

### Acceptance criteria
- User can trigger CSV export from UI
- User can change password
- Success/failure feedback is visible

---

## Ticket 21 — Logging and operational hooks
### Goal
Add baseline operational logging aligned with repo conventions.

### Likely files
- `/data/dev/backend/app/core/logging.py`
- `/data/dev/docs/runbook.md`

### Acceptance criteria
- App logging path/policy is documented
- Runtime logging structure is defined
- `/data/log/app/` usage is documented
- Separation from `/data/log/codex/` is documented

---

## Ticket 22 — README and runbook update
### Goal
Document setup, run, and MVP constraints.

### Likely files
- `/data/dev/README.md`
- `/data/dev/docs/runbook.md`

### Acceptance criteria
- Local/server startup instructions exist
- MVP exclusions are documented
- CSV Export policy is documented
- Transfer exclusion is documented

---

## Suggested implementation order
1. Ticket 01
2. Ticket 02
3. Ticket 03
4. Ticket 04
5. Ticket 05
6. Ticket 06
7. Ticket 07
8. Ticket 08
9. Ticket 09
10. Ticket 10
11. Ticket 11
12. Ticket 12
13. Ticket 13
14. Ticket 14
15. Ticket 15
16. Ticket 16
17. Ticket 17
18. Ticket 18
19. Ticket 19
20. Ticket 20
21. Ticket 21
22. Ticket 22

