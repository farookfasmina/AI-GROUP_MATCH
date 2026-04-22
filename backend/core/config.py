import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Study Group Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Switched back to PostgreSQL for Viva Demo stability
    DATABASE_URL: str = "postgresql://postgres:Fasmina1209@localhost:5000/study_platform"
    
    # JWT Auth Setup
    SECRET_KEY: str = "secure-super-secret-production-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # SMTP Config (For Final Year Project Demo)
    # Default is set to Mailtrap sandbox
    SMTP_HOST: str = "sandbox.smtp.mailtrap.io"
    SMTP_PORT: int = 2525
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_NAME: str = "StudyMatch Hub"
    EMAILS_FROM_EMAIL: str = "noreply@studymatch.edu"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
