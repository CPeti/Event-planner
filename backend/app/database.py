from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings
from tenacity import retry, stop_after_attempt, wait_exponential, before_log, after_log
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """
    Load DATABASE_URL from environment variables (Railway, system env, .env file).
    Priority:
    1. Environment variable: DATABASE_URL
    2. .env file: DATABASE_URL
    3. Default: postgresql+asyncpg://postgres:postgres@localhost:5432/event_planner
    """
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/event_planner"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
# PostgreSQL driver handles async connections natively
connect_args = {}


@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=1, max=16),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.INFO),
)
def create_engine_with_retry():
    """Create database engine with retry logic using tenacity."""
    logger.info(f"Connecting to database: {settings.database_url.split('@')[-1]}")
    return create_async_engine(
        settings.database_url,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True,  # Verify connections before using them
    )


engine = create_engine_with_retry()
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
