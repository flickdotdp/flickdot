from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, JSON, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .base import BaseModel

class CampaignStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

class Brand(BaseModel):
    """Top-level organizational unit (e.g. Nike, Internal Studio)."""
    __tablename__ = "brands"
    
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    brand_guidelines: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    
    campaigns: Mapped[List["Campaign"]] = relationship("Campaign", back_populates="brand", cascade="all, delete-orphan")

class Campaign(BaseModel):
    """A specific marketing push or creative initiative under a Brand."""
    __tablename__ = "campaigns"
    
    brand_id: Mapped[str] = mapped_column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.PLANNING, index=True)
    
    # Metadata for the campaign
    campaign_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    
    brand: Mapped["Brand"] = relationship("Brand", back_populates="campaigns")
    # projects: Mapped[List["Project"]] = relationship("Project", back_populates="campaign") # Will be added to Project model

class Collection(BaseModel):
    """A logical grouping of Generated Assets (e.g., 'Hero Selects', 'Rejected Concepts')."""
    __tablename__ = "collections"
    
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # generated_assets: relationship established in GeneratedAsset model
