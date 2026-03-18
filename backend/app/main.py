from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.core.config import settings

app = FastAPI(title="Self-hosted Web Household Ledger API")
app.include_router(auth_router)


@app.get("/health")
def healthcheck() -> dict[str, str | int]:
    return {"status": "ok", "port": settings.backend_port}
