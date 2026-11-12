import mimetypes
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Make the backend folder importable (core, models, routes, services)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import Base, SessionLocal, add_missing_columns, engine, get_db
from models import all_models  # noqa: F401 - registers the tables
from models.all_models import GroupMessage
from routes.api_v1 import api_router
from services.seed import seed

@asynccontextmanager
async def lifespan(_app):
    import time
    for attempt in range(5):
        try:
            Base.metadata.create_all(bind=engine)
            add_missing_columns()
            break
        except Exception as exc:
            if attempt == 4:
                raise
            print(f"Database connecting/waking up (attempt {attempt + 1}/5): {exc}")
            time.sleep(2)
    db = SessionLocal()
    try:
        seed(db)
    except Exception as exc:  # start-up data must never stop the app from starting
        db.rollback()
        print("Start-up data skipped:", exc)
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

@app.get("/uploads/{name}", include_in_schema=False)
def shared_file(name: str, db=Depends(get_db)):
    """A file shared in a group chat, read from the database. (It used to be a folder on the
    server. The hosted site keeps no folder between requests, so shared files could not be
    opened again.) Files shared before this change are still read from the folder."""
    msg = db.query(GroupMessage).filter(GroupMessage.file_url == f"/uploads/{name}").first()
    if msg and msg.file_data is not None:
        return Response(content=msg.file_data, media_type=mimetypes.guess_type(name)[0] or "application/octet-stream",
                        headers={"X-Content-Type-Options": "nosniff"})
    folder = Path(settings.UPLOAD_DIR).resolve()
    old = (folder / name).resolve()
    if msg and old.is_file() and folder in old.parents:
        return FileResponse(old)
    raise HTTPException(status_code=404, detail="This file is no longer available.")

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
