# Vercel runs the FastAPI backend from here as a serverless function.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))
os.environ.setdefault("UPLOAD_DIR", "/tmp/uploads")  # only /tmp is writable on Vercel

from app.main import app  # noqa: E402,F401
