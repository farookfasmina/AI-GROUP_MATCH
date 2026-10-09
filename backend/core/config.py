import secrets
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """All settings come from environment variables (or backend/.env locally).

    Nothing secret is written in the code: the database password, JWT key and
    SMTP login are set on the server or in a local .env file (see .env.example).
    """

    PROJECT_NAME: str = "StudyMatch AI"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # SQLite needs no setup for local development; the hosted version uses PostgreSQL.
    DATABASE_URL: str = f"sqlite:///{BACKEND_DIR / 'studymatch.db'}"

    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Where the website runs - used in password-reset emails and CORS.
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Uploaded chat files
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")
    MAX_UPLOAD_MB: int = 10

    # First admin, created on start-up when there is no admin yet.
    ADMIN_EMAIL: str = "admin@studymatch.lk"
    ADMIN_PASSWORD: str = ""

    # Fill an empty database with demo students (flagged so they can be removed in one click).
    SEED_DEMO: bool = True

    # Email (SMTP). Gmail: SMTP_USER = the Gmail address, SMTP_PASSWORD = a Google "app password".
    # When SMTP_USER/SMTP_PASSWORD are empty, no email is sent and new accounts need no email code.
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_NAME: str = "StudyMatch AI"
    EMAILS_FROM_EMAIL: str = ""

    model_config = SettingsConfigDict(env_file=str(BACKEND_DIR / ".env"), case_sensitive=True, extra="ignore")

    @property
    def email_enabled(self) -> bool:
        return bool(self.SMTP_USER and self.SMTP_PASSWORD)

    @property
    def database_url(self) -> str:
        url = self.DATABASE_URL.strip().rstrip(";")
        # Hosts hand out postgres:// or postgresql:// URLs. Name the installed driver (psycopg2)
        # explicitly - newer SQLAlchemy versions otherwise look for psycopg 3 and fail to start.
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                url = "postgresql+psycopg2://" + url[len(prefix):]
        return url


settings = Settings()

if not settings.SECRET_KEY:
    settings.SECRET_KEY = secrets.token_urlsafe(48)
    print("WARNING: SECRET_KEY is not set - using a random key, so everyone is signed out on restart.")
