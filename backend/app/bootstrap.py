import logging
import time

from sqlalchemy import inspect, select, text

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
    admin_user_id = _ensure_admin_user()
    _ensure_admin_scoped_columns(admin_user_id)


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


def _ensure_admin_user() -> int:
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
                db.refresh(existing_admin)
                logger.info("admin user password updated: %s", settings.admin_username)
                return existing_admin.id

            logger.info("admin user already exists: %s", settings.admin_username)
            return existing_admin.id

        admin_user = create_admin_user(db, settings.admin_username, settings.admin_password)
        logger.info("admin user created: %s", settings.admin_username)
        return admin_user.id
    finally:
        db.close()


def _ensure_admin_scoped_columns(admin_user_id: int) -> None:
    inspector = inspect(engine)
    for table_name in ("accounts", "categories", "transactions"):
        if not inspector.has_table(table_name):
            continue

        column_names = {column["name"] for column in inspector.get_columns(table_name)}
        if "admin_user_id" in column_names:
            continue

        _add_admin_user_id_column(table_name, admin_user_id)
        logger.info("admin scope column added: %s.admin_user_id", table_name)


def _add_admin_user_id_column(table_name: str, admin_user_id: int) -> None:
    dialect_name = engine.dialect.name
    add_column_sql = "ADD COLUMN admin_user_id INTEGER NULL"
    set_not_null_sql = None
    if dialect_name in {"mysql", "mariadb"}:
        add_column_sql = "ADD COLUMN admin_user_id BIGINT NULL"
        set_not_null_sql = "MODIFY admin_user_id BIGINT NOT NULL"

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} {add_column_sql}"))
        connection.execute(
            text(f"UPDATE {table_name} SET admin_user_id = :admin_user_id"),
            {"admin_user_id": admin_user_id},
        )
        if set_not_null_sql is not None:
            connection.execute(text(f"ALTER TABLE {table_name} {set_not_null_sql}"))

    _ensure_admin_user_id_index(table_name)


def _ensure_admin_user_id_index(table_name: str) -> None:
    index_name = f"ix_{table_name}_admin_user_id"
    inspector = inspect(engine)
    existing_indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if index_name in existing_indexes:
        return

    with engine.begin() as connection:
        connection.execute(text(f"CREATE INDEX {index_name} ON {table_name} (admin_user_id)"))


if __name__ == "__main__":
    bootstrap()
