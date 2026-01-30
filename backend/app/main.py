from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .database import engine, get_db, Base
from .models import Plan, Participant, Availability
from .routers import plans, participants, availabilities


@asynccontextmanager
async def lifespan(app: FastAPI):
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
    yield
    await engine.dispose()


app = FastAPI(
    title="Event Planner API",
    description="Find dates that work for everyone",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
