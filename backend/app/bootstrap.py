import logging
import time

from sqlalchemy import select

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import get_password_hash, verify_password
from app.db.base import Base
from app.db.session import SessionLocal, check_db_connection, engine
from app.models import AdminUser
from app.services.auth_service import create_admin_user


logger = logging.getLogger(__name__)


def bootstrap() -> None:
    setup_logging()
    _wait_for_database()
    Base.metadata.create_all(bind=engine)
    _ensure_admin_user()


def _wait_for_database(retries: int = 20, delay_seconds: int = 2) -> None:
    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            check_db_connection()
            logger.info("database connection ready")
            return
        except Exception as exc:  # pragma: no cover - container startup path
            last_error = exc
            logger.warning("database not ready yet (attempt %s/%s)", attempt, retries)
            time.sleep(delay_seconds)

    raise RuntimeError("database connection failed during bootstrap") from last_error


def _ensure_admin_user() -> None:
    db = SessionLocal()
    try:
        existing_admin = db.scalar(
            select(AdminUser).where(AdminUser.username == settings.admin_username),
        )
        if existing_admin is not None:
            if not verify_password(settings.admin_password, existing_admin.password_hash):
                existing_admin.password_hash = get_password_hash(settings.admin_password)
                db.add(existing_admin)
                db.commit()
                logger.info("admin user password updated: %s", settings.admin_username)
                return

            logger.info("admin user already exists: %s", settings.admin_username)
            return

        create_admin_user(db, settings.admin_username, settings.admin_password)
        logger.info("admin user created: %s", settings.admin_username)
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap()
