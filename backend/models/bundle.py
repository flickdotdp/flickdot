from sqlalchemy import Column, String, JSON, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from ..database import Base

class Bundle(Base):
    """
    Represents a Workflow Bundle package stored in the platform.
    """
    __tablename__ = "bundles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    version: Mapped[str] = mapped_column(String(50), default="1.0.0")
    author: Mapped[str] = mapped_column(String(255), default="System")
    description: Mapped[str] = mapped_column(String(2000), nullable=True)
    
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    
    # Dependencies mapped from bundle.json
    required_assets: Mapped[list[dict]] = mapped_column(JSON, default=list) # e.g. [{"asset_type": "checkpoint", "name": "juggernaut.safetensors"}]
    
    # If installed, this links to the actual workflow ID created
    installed_workflow_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)
    is_installed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Path where the bundle ZIP is stored locally
    file_path: Mapped[str] = mapped_column(String(1024), nullable=True)
    thumbnail_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
