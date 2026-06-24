import logging
from typing import Any, Dict, List, Optional, Sequence
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from .base_repository import BaseRepository
from ..models.project import Project, ProjectStatus
from ..models.generation import Generation, GenerationStatus

logger = logging.getLogger("project_repository")

class ProjectRepository(BaseRepository[Project]):
    """
    Repository for Project-specific database operations.
    """

    def __init__(self, session: AsyncSession):
        super().__init__(Project, session)

    async def get_project_with_generations(self, id: str) -> Optional[Project]:
        """Fetch a project along with its generations, optimized for async access."""
        query = (
            select(self.model)
            .where(self.model.id == id, self.model.is_deleted == False)
            .options(selectinload(self.model.generations))
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_recent_projects(self, limit: int = 10) -> Sequence[Project]:
        """Get the most recently updated active projects."""
        query = (
            select(self.model)
            .where(self.model.is_deleted == False, self.model.status != ProjectStatus.ARCHIVED)
            .order_by(self.model.updated_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def search_projects(self, search_term: str, skip: int = 0, limit: int = 50) -> Sequence[Project]:
        """Search projects by name or description."""
        search_pattern = f"%{search_term}%"
        query = (
            select(self.model)
            .where(
                self.model.is_deleted == False,
                or_(
                    self.model.project_name.ilike(search_pattern),
                    self.model.description.ilike(search_pattern)
                )
            )
            .order_by(self.model.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_projects_by_tag(self, tag: str, skip: int = 0, limit: int = 50) -> Sequence[Project]:
        """Filter projects that contain a specific tag."""
        # SQLite JSON search (simulated with LIKE since SQLite JSON functions vary by version)
        # For production Postgres, we'd use array/jsonb operators like model.tags.contains([tag])
        search_pattern = f'%"{tag}"%'
        query = (
            select(self.model)
            .where(
                self.model.is_deleted == False,
                # Cast the JSON column to string to use LIKE
                func.cast(self.model.tags, sqlalchemy.String).like(search_pattern)
            )
            .order_by(self.model.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        # Need to import sqlalchemy inside if not done at top for casting
        import sqlalchemy
        result = await self.session.execute(query)
        return result.scalars().all()

    async def archive_project(self, id: str) -> Optional[Project]:
        """Change project status to ARCHIVED."""
        return await self.update(id, {"status": ProjectStatus.ARCHIVED})

    async def restore_project(self, id: str) -> Optional[Project]:
        """Change project status back to ACTIVE."""
        return await self.update(id, {"status": ProjectStatus.ACTIVE})

    async def update_project_settings(self, id: str, settings: Dict[str, Any]) -> Optional[Project]:
        """Merge new settings into the existing project settings JSON."""
        project = await self.get_by_id(id)
        if not project:
            return None
        
        current_settings = project.settings or {}
        current_settings.update(settings)
        return await self.update(id, {"settings": current_settings})

    async def update_cover_image(self, id: str, image_path: str) -> Optional[Project]:
        """Update the cover image path for a project."""
        return await self.update(id, {"cover_image": image_path})

    async def get_project_statistics(self, id: str) -> Dict[str, int]:
        """Get statistics for a specific project (e.g., generation counts)."""
        # Count all generations tied to this project
        query = select(func.count(Generation.id)).where(
            Generation.project_id == id,
            Generation.is_deleted == False
        )
        total = await self.session.execute(query)
        
        # Count completed generations
        query_completed = select(func.count(Generation.id)).where(
            Generation.project_id == id,
            Generation.status == GenerationStatus.COMPLETED,
            Generation.is_deleted == False
        )
        completed = await self.session.execute(query_completed)
        
        return {
            "total_generations": total.scalar_one(),
            "completed_generations": completed.scalar_one()
        }

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get overall platform statistics for a dashboard view."""
        active_projects_query = select(func.count(self.model.id)).where(
            self.model.is_deleted == False,
            self.model.status == ProjectStatus.ACTIVE
        )
        active_proj_count = await self.session.execute(active_projects_query)
        
        total_generations_query = select(func.count(Generation.id)).where(
            Generation.is_deleted == False
        )
        total_gen_count = await self.session.execute(total_generations_query)
        
        return {
            "active_projects": active_proj_count.scalar_one(),
            "total_generations": total_gen_count.scalar_one()
        }
