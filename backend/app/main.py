from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import os

from .database import engine, get_db, Base
from .models import Plan, Participant, Availability
from .routers import plans, participants, availabilities


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Migrations are handled by `alembic upgrade head` in the Dockerfile CMD
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


