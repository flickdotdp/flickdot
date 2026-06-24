from typing import Optional, Dict, Any
from sqlalchemy import String, Text, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

class AssetComment(BaseModel):
    """A comment or annotation placed on a Generated Asset."""
    __tablename__ = "asset_comments"

    asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("generated_assets.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # E.g., user ID
    author_name: Mapped[str] = mapped_column(String(100), default="Unknown")
    
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Point-based image annotation
    point_x: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Percentage (0-1) across the image
    point_y: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Percentage (0-1) down the image
    
    # Threading
    parent_comment_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("asset_comments.id", ondelete="CASCADE"), nullable=True)
    
    # Metadata
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "asset_id": self.asset_id,
            "author_id": self.author_id,
            "author_name": self.author_name,
            "content": self.content,
            "point_x": self.point_x,
            "point_y": self.point_y,
            "parent_comment_id": self.parent_comment_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
