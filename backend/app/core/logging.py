import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.config import settings


def setup_logging() -> None:
    handlers: list[logging.Handler] = [logging.StreamHandler()]

    log_dir = Path(settings.app_log_dir)
    try:
        log_dir.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_dir / "backend.log",
            maxBytes=1_048_576,
            backupCount=5,
            encoding="utf-8",
        )
        handlers.append(file_handler)
    except OSError:
        # Keep stdout logging even if the file path is unavailable.
        pass

    logging.basicConfig(
        level=getattr(logging, settings.app_log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        handlers=handlers,
        force=True,
    )
