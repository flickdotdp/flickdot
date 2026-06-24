from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import Column, DateTime, Boolean, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """
    SQLAlchemy 2.0 Declarative Base class.
    All models will inherit from this class.
    """
    pass

class BaseModel(Base):
    """
    Abstract base model providing common fields for all tables:
    - id: UUID-based primary key
    - created_at: Timestamp of creation
    - updated_at: Timestamp of last update
    - is_deleted: Soft delete flag
    """
    __abstract__ = True

    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False,
        index=True
    )

    def soft_delete(self):
        """Mark the record as deleted without removing it from the database."""
        self.is_deleted = True
        self.updated_at = datetime.now(timezone.utc)
