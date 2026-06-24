from typing import Optional, Dict, Any
from sqlalchemy import String, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from .base import BaseModel

class EventSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class EventCategory(str, enum.Enum):
    SYSTEM = "system"
    WORKER = "worker"
    GENERATION = "generation"
    SECURITY = "security"

class SystemEvent(BaseModel):
    __tablename__ = "system_events"
    
    trace_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    severity: Mapped[EventSeverity] = mapped_column(Enum(EventSeverity), default=EventSeverity.INFO, index=True)
    category: Mapped[EventCategory] = mapped_column(Enum(EventCategory), default=EventCategory.SYSTEM, index=True)
    
    event_type: Mapped[str] = mapped_column(String(100), index=True) # e.g. "worker_started", "generation_failed"
    message: Mapped[str] = mapped_column(String(500))
    
    # Context
    user_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    generation_id: Mapped[Optional[str]] = mapped_column(String(36), index=True, nullable=True)
    
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "trace_id": self.trace_id,
            "severity": self.severity.value,
            "category": self.category.value,
            "event_type": self.event_type,
            "message": self.message,
            "user_id": self.user_id,
            "generation_id": self.generation_id,
            "metadata": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
