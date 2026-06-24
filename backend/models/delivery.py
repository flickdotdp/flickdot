from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from .base import BaseModel

class DeliverablePackage(BaseModel):
    """A bundled release of assets delivered to a client."""
    __tablename__ = "deliverable_packages"
    
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=True)
    brand_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("brands.id", ondelete="CASCADE"), index=True, nullable=True)
    
    # Store IDs of included assets as JSON for simplicity, or use a junction table for foreign keys
    asset_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # Analytics & Status
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "project_id": self.project_id,
            "brand_id": self.brand_id,
            "asset_ids": self.asset_ids,
            "is_approved": self.is_approved,
            "download_count": self.download_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class ShareLink(BaseModel):
    """Secure, tokenized URL access to a DeliverablePackage or individual Asset."""
    __tablename__ = "share_links"
    
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    
    package_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("deliverable_packages.id", ondelete="CASCADE"), nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("generated_assets.id", ondelete="CASCADE"), nullable=True)
    
    # Permissions
    allow_download: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_approval: Mapped[bool] = mapped_column(Boolean, default=True)
    require_watermark: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Security
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "token": self.token,
            "package_id": self.package_id,
            "asset_id": self.asset_id,
            "allow_download": self.allow_download,
            "allow_comments": self.allow_comments,
            "allow_approval": self.allow_approval,
            "require_watermark": self.require_watermark,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "view_count": self.view_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
