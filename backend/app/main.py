from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from tenacity import retry, stop_after_attempt, wait_exponential, before_log, after_log
import logging
import os

from .database import engine, get_db, Base
from .models import Plan, Participant, Availability
from .routers import plans, participants, availabilities

logger = logging.getLogger(__name__)


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=16),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.INFO),
)
async def initialize_database():
    """Initialize database with retry logic using tenacity."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add share_token to existing plans table (SQLite) if missing
        if "sqlite" in str(engine.url):
            def add_share_token_if_missing(sync_conn):
                cur = sync_conn.execute(
                    text("SELECT name FROM pragma_table_info('plans') WHERE name = 'share_token'")
                )
                if cur.fetchone() is None:
                    sync_conn.execute(text("ALTER TABLE plans ADD COLUMN share_token VARCHAR(64)"))
            await conn.run_sync(add_share_token_if_missing)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_database()
    yield
    await engine.dispose()


app = FastAPI(
    title="Event Planner API",
    description="Find dates that work for everyone",
    lifespan=lifespan,
)

# Load allowed origins from environment variable or use defaults
allowed_origins = [
    "http://localhost:5173",  # Local Vite dev server
    "http://localhost:4173",  # Local Vite preview
]

# Add production frontend URL from Railway env var if present
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(participants.router, prefix="/api/plans", tags=["participants"])
app.include_router(availabilities.router, prefix="/api/plans", tags=["availabilities"])


@app.get("/api/health")
async def health():
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return {"status": "ok"}


