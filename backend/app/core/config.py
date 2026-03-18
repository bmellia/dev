from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_port: int = 8000
    mariadb_host: str = "db"
    mariadb_port: int = 3306
    mariadb_database: str = "ledger"
    mariadb_user: str = "ledger"
    mariadb_password: str = "change-me"
    sqlalchemy_echo: bool = False
    session_secret_key: str = "change-this-session-secret"
    session_cookie_name: str = "ledger_session"
    session_cookie_secure: bool = False
    session_cookie_samesite: str = "lax"
    session_cookie_max_age: int = 60 * 60 * 24 * 7

    @property
    def sqlalchemy_database_uri(self) -> str:
        return URL.create(
            drivername="mysql+pymysql",
            username=self.mariadb_user,
            password=self.mariadb_password,
            host=self.mariadb_host,
            port=self.mariadb_port,
            database=self.mariadb_database,
        ).render_as_string(hide_password=False)


settings = Settings()
