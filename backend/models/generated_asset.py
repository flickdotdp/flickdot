from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Boolean, JSON, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .base import BaseModel

class GeneratedAssetType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    MASK = "mask"
    DEPTH_MAP = "depth_map"
    MODEL = "model" # 3D models

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVISION = "needs_revision"

class GeneratedAsset(BaseModel):
    """A specific output file from a generation, managed in the Asset Library."""
    __tablename__ = "generated_assets"
    
    # Core Asset Data
    name: Mapped[str] = mapped_column(String(255), index=True)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False) # Local or URI (e.g. s3://)
    asset_type: Mapped[GeneratedAssetType] = mapped_column(Enum(GeneratedAssetType), default=GeneratedAssetType.IMAGE, index=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Technical Metadata
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Governance & Curation
    approval_status: Mapped[ApprovalStatus] = mapped_column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, index=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    smart_tags: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    
    # Lineage / Provenance
    generation_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("generations.id", ondelete="SET NULL"), index=True, nullable=True)
    workflow_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("workflows.id", ondelete="SET NULL"), nullable=True)
    
    # Versioning & Relationships
    parent_asset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("generated_assets.id", ondelete="SET NULL"), nullable=True)
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    
    # Organization
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=True)
    collection_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("collections.id", ondelete="SET NULL"), index=True, nullable=True)
    
    # Relationships
    # project: Mapped[Optional["Project"]] = relationship("Project")
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "file_path": self.file_path,
            "asset_type": self.asset_type.value,
            "mime_type": self.mime_type,
            "width": self.width,
            "height": self.height,
            "file_size_bytes": self.file_size_bytes,
            "approval_status": self.approval_status.value,
            "is_favorite": self.is_favorite,
            "smart_tags": self.smart_tags,
            "generation_id": self.generation_id,
            "workflow_id": self.workflow_id,
            "parent_asset_id": self.parent_asset_id,
            "version_number": self.version_number,
            "project_id": self.project_id,
            "collection_id": self.collection_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
