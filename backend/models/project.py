from typing import Optional, List, Any, Dict
from sqlalchemy import String, Text, JSON, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .base import BaseModel

class ProjectStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"

class Project(BaseModel):
    __tablename__ = "projects"

    # Core Fields
    project_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), 
        default=ProjectStatus.ACTIVE, 
        index=True, 
        nullable=False
    )
    
    # Asset & Organizational Fields
    campaign_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("campaigns.id", ondelete="SET NULL"), index=True, nullable=True)
    cover_image: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    
    # JSON Fields for dynamic schema and scalability
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)
    settings: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    project_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    # Using string references to avoid circular imports. Generation model will be defined next.
    generations: Mapped[List["Generation"]] = relationship(
        "Generation",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin" # Optimize for async loading
    )

    def to_dict(self) -> Dict[str, Any]:
        """Serialize project to dictionary."""
        return {
            "id": self.id,
            "project_name": self.project_name,
            "description": self.description,
            "status": self.status.value if self.status else None,
            "campaign_id": self.campaign_id,
            "cover_image": self.cover_image,
            "tags": self.tags,
            "settings": self.settings,
            "project_metadata": self.project_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_deleted": self.is_deleted
        }
        
    def get_generation_count(self) -> int:
        """
        Return the number of generations currently loaded into the relationship.
        Note: For large numbers, a repository count query is preferred over this helper.
        """
        if self.generations is not None:
            return len(self.generations)
        return 0
