import os
import tempfile
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.settings import settings
from app.database import engine, Base
from app.middleware.error_handler import setup_exception_handlers
from app.middleware.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import auth, products, dashboard, admin

# Create database tables on startup if not already created
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SIH 26090 - AI-Driven Market Linkage Backend",
    description="Backend API for AI-Driven Market Linkage & Smart Cataloging Mobile Application for Marginalized Artisans.",
    version="1.0.0",
)

# Rate Limiter state & error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global custom exception handlers for standard response envelope
setup_exception_handlers(app)

# Ensure the upload directory is writable in serverless deployments.
upload_dir = settings.UPLOAD_DIR
if os.getenv("VERCEL") and not os.path.isabs(upload_dir):
    upload_dir = os.path.join(tempfile.gettempdir(), upload_dir)
os.makedirs(upload_dir, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include API v1 routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/healthz", tags=["Health"])
@app.get("/health", tags=["Health"], include_in_schema=False)
def health_check():
    return {
        "status": "healthy",
        "service": "SIH 26090 Backend",
        "storage_backend": settings.STORAGE_BACKEND,
    }


# Mount Frontend production build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
