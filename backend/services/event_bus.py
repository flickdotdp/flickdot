import logging
import time
from typing import Optional, Dict, Any
from ..database import AsyncSessionLocal
from ..models.event import SystemEvent, EventSeverity, EventCategory

logger = logging.getLogger("event_bus")

class EventBus:
    """Centralized event emission and tracking for the cluster."""
    
    @classmethod
    async def emit(cls, 
                   event_type: str, 
                   message: str, 
                   category: EventCategory = EventCategory.SYSTEM,
                   severity: EventSeverity = EventSeverity.INFO,
                   trace_id: Optional[str] = None,
                   generation_id: Optional[str] = None,
                   metadata: Optional[Dict[str, Any]] = None):
        """Log an event to the DB for the Activity Timeline."""
        try:
            async with AsyncSessionLocal() as session:
                event = SystemEvent(
                    event_type=event_type,
                    message=message,
                    category=category,
                    severity=severity,
                    trace_id=trace_id,
                    generation_id=generation_id,
                    metadata_json=metadata or {}
                )
                session.add(event)
                await session.commit()
                
                # Optional: We could also push to WebSockets here if it's a live timeline
        except Exception as e:
            logger.error(f"Failed to emit event {event_type}: {e}")

    @classmethod
    async def purge_old_events(cls, days_to_keep: int = 7):
        """Background task to keep the SQLite DB small."""
        try:
            import datetime
            cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days_to_keep)
            async with AsyncSessionLocal() as session:
                from sqlalchemy import delete
                stmt = delete(SystemEvent).where(SystemEvent.created_at < cutoff)
                await session.execute(stmt)
                await session.commit()
        except Exception as e:
            logger.error(f"Failed to purge old events: {e}")
