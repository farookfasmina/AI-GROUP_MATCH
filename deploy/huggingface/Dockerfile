# Hugging Face Space (free, no card): create a Docker Space and add this file as "Dockerfile".
# It builds the app straight from GitHub, so the Space needs no other files.
# Space secrets to set: DATABASE_URL (Neon), SECRET_KEY, ADMIN_PASSWORD.

FROM node:20-alpine AS src
RUN apk add --no-cache git
# Re-download when main changes (busts the build cache)
ADD https://api.github.com/repos/farookfasmina/AI-GROUP_MATCH/git/refs/heads/main /tmp/main.json
RUN git clone --depth 1 https://github.com/farookfasmina/AI-GROUP_MATCH /src
WORKDIR /src/frontend
RUN npm ci && npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    PORT=7860 \
    UPLOAD_DIR=/tmp/uploads \
    DATABASE_URL=sqlite:////tmp/studymatch.db
WORKDIR /app
COPY --from=src /src/backend/requirements.txt .
RUN pip install --no-cache-dir --default-timeout=120 --retries 5 -r requirements.txt
COPY --from=src /src/backend/ ./
COPY --from=src /src/frontend/dist ./web
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
