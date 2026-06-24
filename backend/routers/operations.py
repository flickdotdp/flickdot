import logging
import time
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..database import get_db
from ..models.event import SystemEvent, EventCategory
from ..services.comfyui_service import ComfyUIService
from ..services.generation_worker import GenerationWorker
from ..websocket.websocket_manager import manager as ws_manager
from ..repositories.generation_repository import GenerationRepository
from ..models.generation import GenerationStatus

logger = logging.getLogger("router.operations")
router = APIRouter(prefix="/operations", tags=["Operations"])

@router.get("/health")
async def get_system_health_score(db: AsyncSession = Depends(get_db)):
    """Calculate the 0-100 System Health Score with predictive diagnostics."""
    score = 100
    alerts = []
    
    # 1. API Gateway
    # Assumed healthy if this endpoint is returning
    
    # 2. ComfyUI Engine (Weight: 40)
    comfy_service = ComfyUIService()
    try:
        stats = await comfy_service.get_system_stats()
        # Predictive VRAM Check
        if stats and "devices" in stats.get("system", {}):
            for dev in stats["system"]["devices"]:
                vram_gb = dev.get("vram_free", 0) / (1024**3)
                if vram_gb < 1.0:
                    score -= 15
                    alerts.append(f"Low VRAM Warning: GPU {dev.get('name')} has {vram_gb:.2f}GB free.")
    except Exception as e:
        score -= 40
        alerts.append(f"ComfyUI Engine Offline: {e}")

    # 3. Queue System (Weight: 30)
    try:
        repo = GenerationRepository(db)
        queue = await repo.get_generation_queue()
        queued_count = sum(1 for q in queue if q.status == GenerationStatus.QUEUED)
        
        if queued_count > 50:
            score -= 10
            alerts.append("Queue Congestion: High number of pending tasks.")
        
        # Dead Letter Check
        dlq_count = await db.scalar(select(db.func.count()).where(repo.model.status == GenerationStatus.DEAD_LETTER)) or 0
        if dlq_count > 5:
            score -= int(min(20, dlq_count * 2))
            alerts.append(f"Dead Letter Accumulation: {dlq_count} failed jobs require attention.")
            
    except Exception as e:
        score -= 30
        alerts.append("Database / Queue System Unreachable.")

    # 4. WebSocket & Worker (Weight: 30)
    if ws_manager.get_stats().get("active_connections", 0) > 1000:
        score -= 5
        alerts.append("High WebSocket connection count.")

    return {
        "score": max(0, score),
        "status": "healthy" if score >= 85 else "degraded" if score >= 50 else "critical",
        "alerts": alerts,
        "recommendations": ["Clear DLQ", "Free VRAM"] if score < 100 else []
    }

@router.get("/events")
async def get_activity_timeline(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """Fetch the centralized activity timeline."""
    query = select(SystemEvent).order_by(desc(SystemEvent.created_at)).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    
    return [e.to_dict() for e in events]
