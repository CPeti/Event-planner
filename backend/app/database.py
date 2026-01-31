from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings


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

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args,
)
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
