from sqlalchemy import Column, String, Integer, Boolean, Enum as SQLEnum, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
import enum
from datetime import datetime

from ..database import Base

class AssetType(str, enum.Enum):
    CHECKPOINT = "checkpoint"
    LORA = "lora"
    VAE = "vae"
    EMBEDDING = "embedding"
    UPSCALER = "upscaler"
    VIDEO_MODEL = "video_model"

class AIAsset(Base):
    """
    Unified model for all AI filesystem assets (Models, LoRAs, VAEs, etc.).
    Provides a registry cache mapping the local ComfyUI filesystem into SQL.
    """
    __tablename__ = "ai_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    filename: Mapped[str] = mapped_column(String(255), index=True)
    file_path: Mapped[str] = mapped_column(String(1024))
    
    asset_type: Mapped[AssetType] = mapped_column(SQLEnum(AssetType), index=True)
    
    # Lightweight hash of the first 1MB to detect file changes/moves without huge memory overhead
    file_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=True)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=True)
    
    compatibility_tags: Mapped[list[str]] = mapped_column(JSON, default=list) # e.g. ["SD1.5", "SDXL"]
    
    thumbnail_url: Mapped[str] = mapped_column(String(1024), nullable=True)
    description: Mapped[str] = mapped_column(String(2000), nullable=True)
    
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    
    last_scanned_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
