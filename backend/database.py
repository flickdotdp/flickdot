import logging
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

# Import the configuration
from .config import settings

# Import Base and all models to ensure they are registered with Base.metadata before creation
from .models.base import Base
from .models.project import Project
from .models.generation import Generation
from .models.workflow import Workflow, WorkflowVersion
from .models.asset import AIAsset
from .models.bundle import Bundle
from .models.compute import WorkerNode, GPUDevice, ExecutionPool, QueueAssignment
from .models.event import SystemEvent
from .models.creative import Brand, Campaign, Collection
from .models.generated_asset import GeneratedAsset
from .models.review import AssetComment
from .models.delivery import DeliverablePackage, ShareLink
from .models.agency import AgencyClient, Deal, Invoice

logger = logging.getLogger("database")

# Format SQLite URL for aiosqlite driver
# e.g., sqlite:///data/app.db -> sqlite+aiosqlite:///data/app.db
DB_URL = settings.DB_PATH.replace("sqlite:///", "sqlite+aiosqlite:///")

# Create Async Engine
# echo=False for production. Setting check_same_thread=False is required for SQLite in async contexts.
engine = create_async_engine(
    DB_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")
    cursor.close()

# Create Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def init_db() -> None:
    """
    Initialize the database by creating all tables.
    Includes basic retry logic to handle initial connection issues.
    """
    retries = 3
    for attempt in range(retries):
        try:
            async with engine.begin() as conn:
                # In a purely production environment, alembic migrations should be used instead of create_all.
                # However, for local deployments, create_all is acceptable to bootstrap.
                logger.info(f"Initializing database tables (Attempt {attempt + 1}/{retries})...")
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database initialization successful.")
            return
        except SQLAlchemyError as e:
            logger.error(f"Database initialization failed: {e}")
            if attempt < retries - 1:
                await asyncio.sleep(2)
            else:
                raise RuntimeError("Could not initialize database after multiple attempts.")

async def close_db() -> None:
    """Gracefully close the database engine."""
    logger.info("Closing database engine...")
    await engine.dispose()
    logger.info("Database engine closed.")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for injecting database sessions.
    Handles automatic transaction commit and rollback on exceptions.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            logger.error(f"Session rollback due to exception: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

async def check_db_health() -> dict:
    """
    Health check function to verify database connectivity.
    Executes a simple query to ensure the database is responsive.
    """
    try:
        async with AsyncSessionLocal() as session:
            # Execute a lightweight query to check connection
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
            return {"status": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "error", "message": str(e)}
