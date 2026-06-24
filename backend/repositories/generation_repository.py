import logging
import datetime
from typing import Any, Dict, List, Optional, Sequence
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from .base_repository import BaseRepository
from ..models.generation import Generation, GenerationStatus, GenerationType
from ..models.project import Project

logger = logging.getLogger("generation_repository")

class GenerationRepository(BaseRepository[Generation]):
    """
    Repository for Generation-specific database operations.
    Handles queue management, statistics, filtering, and relationship loading.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(Generation, session)

    # -------------------------------------------------------------------------
    # Relationship & Retrieval Methods
    # -------------------------------------------------------------------------

    async def get_generation_with_project(self, id: str) -> Optional[Generation]:
        """Fetch a generation along with its parent project."""
        query = (
            select(self.model)
            .where(self.model.id == id, self.model.is_deleted == False)
            .options(selectinload(self.model.project))
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_generations_by_project(self, project_id: str, skip: int = 0, limit: int = 100) -> Sequence[Generation]:
        """Fetch all generations for a specific project."""
        query = (
            select(self.model)
            .where(self.model.project_id == project_id, self.model.is_deleted == False)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_recent_generations(self, limit: int = 50) -> Sequence[Generation]:
        """Get the most recently created generations globally."""
        query = (
            select(self.model)
            .where(self.model.is_deleted == False)
            .order_by(desc(self.model.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    # -------------------------------------------------------------------------
    # Filtering & Search Methods
    # -------------------------------------------------------------------------

    async def search_generations_by_prompt(self, search_term: str, skip: int = 0, limit: int = 50) -> Sequence[Generation]:
        """Search generations where prompt or negative prompt matches term."""
        search_pattern = f"%{search_term}%"
        query = (
            select(self.model)
            .where(
                self.model.is_deleted == False,
                or_(
                    self.model.prompt.ilike(search_pattern),
                    self.model.negative_prompt.ilike(search_pattern)
                )
            )
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_generations_by_status(self, status: GenerationStatus, skip: int = 0, limit: int = 100) -> Sequence[Generation]:
        """Filter generations by status."""
        query = (
            select(self.model)
            .where(self.model.status == status, self.model.is_deleted == False)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()
        
    async def get_generations_by_type(self, gen_type: GenerationType, skip: int = 0, limit: int = 100) -> Sequence[Generation]:
        query = select(self.model).where(self.model.generation_type == gen_type, self.model.is_deleted == False).order_by(desc(self.model.created_at)).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_generation_queue(self) -> Sequence[Generation]:
        """Get all generations currently queued or processing, ordered by creation (oldest first)."""
        query = (
            select(self.model)
            .where(
                self.model.status.in_([
                    GenerationStatus.QUEUED, 
                    GenerationStatus.VALIDATING_WORKFLOW,
                    GenerationStatus.RESOLVING_MODELS,
                    GenerationStatus.LOADING_CHECKPOINTS,
                    GenerationStatus.CONNECTING,
                    GenerationStatus.EXECUTING,
                    GenerationStatus.SAVING_OUTPUTS,
                    GenerationStatus.PROCESSING_ASSETS,
                    GenerationStatus.RETRYING
                ]),
                self.model.is_deleted == False
            )
            .order_by(self.model.created_at.asc())
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    # -------------------------------------------------------------------------
    # Update & Queue Management Methods
    # -------------------------------------------------------------------------

    async def update_generation_status(self, id: str, status: GenerationStatus, error_message: Optional[str] = None) -> Optional[Generation]:
        """Update the status of a generation (e.g., from QUEUED to PROCESSING)."""
        update_data = {"status": status}
        if error_message:
            update_data["error_message"] = error_message
        return await self.update(id, update_data)

    async def assign_comfyui_prompt_id(self, id: str, prompt_id: str) -> Optional[Generation]:
        """Link a local generation to a ComfyUI prompt_id."""
        return await self.update(id, {"comfyui_prompt_id": prompt_id})

    async def update_generation_node(self, id: str, current_node: str) -> Optional[Generation]:
        """Update the currently executing node name."""
        return await self.update(id, {"current_node": current_node})

    async def store_generation_result(self, id: str, output_path: str, thumbnail_path: str, exec_time: float) -> Optional[Generation]:
        """Record the final output paths and execution time when ComfyUI finishes."""
        update_data = {
            "output_image_path": output_path,
            "thumbnail_path": thumbnail_path,
            "execution_time_seconds": exec_time,
            "status": GenerationStatus.COMPLETED
        }
        return await self.update(id, update_data)

    async def toggle_favorite(self, id: str, is_favorite: bool) -> Optional[Generation]:
        """Mark or unmark a generation as a favorite using the metadata JSON field."""
        gen = await self.get_by_id(id)
        if not gen:
            return None
        metadata = gen.generation_metadata or {}
        metadata["is_favorite"] = is_favorite
        return await self.update(id, {"generation_metadata": metadata})

    # -------------------------------------------------------------------------
    # Analytics & Statistics Methods
    # -------------------------------------------------------------------------

    async def get_generation_statistics(self) -> Dict[str, Any]:
        """Get overall generation counts broken down by status."""
        query = select(self.model.status, func.count(self.model.id)).where(self.model.is_deleted == False).group_by(self.model.status)
        result = await self.session.execute(query)
        
        stats = {status.value: 0 for status in GenerationStatus}
        total = 0
        for status, count in result:
            stats[status.value] = count
            total += count
            
        stats["total"] = total
        return stats

    async def get_model_usage_statistics(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Find the most frequently used base models."""
        query = (
            select(self.model.model_name, func.count(self.model.id).label('usage_count'))
            .where(self.model.is_deleted == False, self.model.model_name.isnot(None))
            .group_by(self.model.model_name)
            .order_by(desc('usage_count'))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return [{"model_name": row[0], "count": row[1]} for row in result]
