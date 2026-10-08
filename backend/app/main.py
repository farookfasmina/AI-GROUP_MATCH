import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Make the backend folder importable (core, models, routes, services)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import Base, SessionLocal, add_missing_columns, engine
from models import all_models  # noqa: F401 - registers the tables
from routes.api_v1 import api_router
from services.seed import seed

@asynccontextmanager
async def lifespan(_app):
    Base.metadata.create_all(bind=engine)
    add_missing_columns()
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION, lifespan=lifespan,
              openapi_url=f"{settings.API_V1_STR}/openapi.json", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.API_V1_STR)

# Shared chat files. The folder is created if missing (the first version crashed on a fresh
# checkout because static/ did not exist).
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# The built React app (frontend/dist copied to backend/web) is served from the same address,
# so one deployment runs the whole platform.
WEB_DIR = Path(__file__).resolve().parent.parent / "web"
if WEB_DIR.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIR / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith(("api/", "uploads/")):
            raise HTTPException(status_code=404, detail="Not found")
        file = (WEB_DIR / path).resolve()
        if path and file.is_file() and WEB_DIR.resolve() in file.parents:
            return FileResponse(file)
        return FileResponse(WEB_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {"message": "StudyMatch AI API", "docs": "/docs"}
