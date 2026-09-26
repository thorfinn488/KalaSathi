FROM python:3.12-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build
COPY requirements-prod.txt ./
RUN python -m pip install --upgrade pip \
    && pip wheel --wheel-dir /wheels -r requirements-prod.txt

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app
RUN groupadd --system app && useradd --system --gid app --home-dir /app app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

COPY --from=builder /wheels /wheels
COPY requirements-prod.txt ./
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements-prod.txt \
    && rm -rf /wheels

COPY --chown=app:app app ./app

USER app
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=3)" || exit 1

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]