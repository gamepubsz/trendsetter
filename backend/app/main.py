"""YouTube Channel Manager - FastAPI Application Entry Point."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import create_tables
from app.routers import channels, trends, content, analytics, settings as settings_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
app_settings = get_settings()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{app_settings.rate_limit_per_minute}/minute"],
)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting YouTube Channel Manager API (env=%s)", app_settings.app_env)

    # Security: warn if using default secret in production
    if app_settings.is_production and "dev-secret-key" in app_settings.app_secret_key:
        raise RuntimeError(
            "APP_SECRET_KEY must be changed from the default value in production! "
            "Set a strong random value in your .env file."
        )

    os.makedirs("./data/cache", exist_ok=True)
    create_tables()
    logger.info("Database tables ready")

    if not app_settings.youtube_api_key:
        logger.warning("YOUTUBE_API_KEY not set — YouTube features will be unavailable")
    if not app_settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set — AI features will be unavailable")

    yield
    logger.info("Shutdown complete")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="YouTube Channel Manager API",
    description=(
        "AI-powered tool for managing, analyzing, and growing YouTube channels. "
        "Integrates YouTube Data API, Google Trends, Reddit, and OpenAI."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Disable auto-generated docs in production for security
    docs_url=None if app_settings.is_production else "/docs",
    redoc_url=None if app_settings.is_production else "/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global error handlers
# ---------------------------------------------------------------------------
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(channels.router, prefix=API_PREFIX)
app.include_router(trends.router, prefix=API_PREFIX)
app.include_router(content.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(settings_router.router, prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0", "env": app_settings.app_env}
