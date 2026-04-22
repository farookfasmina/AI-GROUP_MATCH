from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sys
import os

# Ensure the backend root is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
from core.database import engine, Base
from models import all_models # Import models to ensure they are registered with Base.metadata

# Create database tables if they do not exist
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to the database. Ensure postgres is running. Error: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount the static files directory to serve shared chat files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Enable CORS for all local development variants
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
)

@app.get("/")
def root():
    return {
        "message": "Welcome to the AI Study Group Platform API",
        "docs": "Visit /docs for Swagger UI API documentation."
    }

from routes.api_v1 import api_router

# Include the central v1 routing tree
app.include_router(api_router, prefix=settings.API_V1_STR)
