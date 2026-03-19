from fastapi import FastAPI

from app.api.accounts import router as accounts_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.dashboard import router as dashboard_router
from app.api.exports import router as exports_router
from app.api.transactions import router as transactions_router
from app.core.config import settings

app = FastAPI(title="Self-hosted Web Household Ledger API")
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(categories_router)
app.include_router(dashboard_router)
app.include_router(exports_router)
app.include_router(transactions_router)


@app.get("/health")
def healthcheck() -> dict[str, str | int]:
    return {"status": "ok", "port": settings.backend_port}
