import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models.project import ProjectStatus
from ..repositories.project_repository import ProjectRepository
from ..schemas.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectSettingsUpdateRequest,
    ProjectResponse,
    ProjectSummaryResponse,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectStatisticsResponse,
    DashboardSummaryResponse
)
from ..schemas.common import ApiResponse, PaginatedResponse, ApiStatus

logger = logging.getLogger("api.projects")

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
    responses={404: {"description": "Project not found"}}
)

# Optional dependency hook for future authentication
# async def get_current_user(...): pass
# user = Depends(get_current_user)

@router.post("/", response_model=ApiResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    request: ProjectCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project."""
    repo = ProjectRepository(db)
    project = await repo.create(request.model_dump(exclude_unset=True))
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project created successfully",
        data=ProjectResponse.model_validate(project)
    )

@router.get("/dashboard-summary", response_model=ApiResponse[DashboardSummaryResponse])
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Get global platform aggregation for the dashboard."""
    repo = ProjectRepository(db)
    summary_data = await repo.get_dashboard_summary()
    
    # Also fetch recent projects
    recent_projects_db = await repo.get_recent_projects(limit=5)
    recent_projects_dto = [ProjectSummaryResponse.model_validate(p) for p in recent_projects_db]
    
    # Construct combined response
    summary_data["recent_active_projects"] = recent_projects_dto
    # Note: generations_today and success_rate_percent would require more complex queries,
    # mapping to defaults for now as placeholders.
    summary_data["generations_today"] = 0
    summary_data["success_rate_percent"] = 100.0
    
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=DashboardSummaryResponse.model_validate(summary_data)
    )

@router.get("/search", response_model=PaginatedResponse[ProjectSummaryResponse])
async def search_projects(
    q: str = Query(..., description="Search term for name or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search active projects by name or description."""
    repo = ProjectRepository(db)
    projects = await repo.search_projects(search_term=q, skip=skip, limit=limit)
    return PaginatedResponse(
        status=ApiStatus.SUCCESS,
        data=[ProjectSummaryResponse.model_validate(p) for p in projects],
        total=len(projects), # Note: Real total requires a count query, simplified here
        skip=skip,
        limit=limit
    )

@router.get("/", response_model=PaginatedResponse[ProjectSummaryResponse])
async def list_projects(
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    tag: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List projects with pagination, optional status filtering, and tag filtering."""
    repo = ProjectRepository(db)
    
    # If tag is provided, use the tag search
    if tag:
        projects = await repo.get_projects_by_tag(tag=tag, skip=skip, limit=limit)
        total = await repo.count() # Approximated
    else:
        # standard retrieval
        # Note: In a full app, BaseRepository should accept filters. Handled manually for simplicity.
        projects = await repo.get_all(skip=skip, limit=limit)
        if status_filter:
            projects = [p for p in projects if p.status == status_filter]
        total = await repo.count()

    return PaginatedResponse(
        status=ApiStatus.SUCCESS,
        data=[ProjectSummaryResponse.model_validate(p) for p in projects],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def get_project(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Get a project by its ID."""
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=ProjectResponse.model_validate(project)
    )

@router.get("/{project_id}/with-generations", response_model=ApiResponse[ProjectDetailResponse])
async def get_project_with_generations(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Get a project and load its associated generations."""
    repo = ProjectRepository(db)
    project = await repo.get_project_with_generations(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    response_data = ProjectDetailResponse.model_validate(project)
    response_data.recent_generations = [
        # using the models relationship 'generations' loaded via selectinload
        gen for gen in project.generations 
    ]
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=response_data
    )

@router.get("/{project_id}/statistics", response_model=ApiResponse[ProjectStatisticsResponse])
async def get_project_statistics(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics and counts for a specific project."""
    repo = ProjectRepository(db)
    exists = await repo.exists(project_id)
    if not exists:
        raise HTTPException(status_code=404, detail="Project not found")
        
    stats = await repo.get_project_statistics(project_id)
    
    # Mapping to response model
    response_stats = ProjectStatisticsResponse(
        total_generations=stats.get("total_generations", 0),
        completed_generations=stats.get("completed_generations", 0),
        failed_generations=stats.get("total_generations", 0) - stats.get("completed_generations", 0),
        total_execution_time_seconds=0.0, # Placeholder
        estimated_storage_mb=0.0 # Placeholder
    )
    
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=response_stats
    )

@router.put("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def update_project(
    project_id: str = Path(...),
    request: ProjectUpdateRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """Update standard fields of a project."""
    repo = ProjectRepository(db)
    update_data = request.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    updated_project = await repo.update(project_id, update_data)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project updated successfully",
        data=ProjectResponse.model_validate(updated_project)
    )

@router.patch("/{project_id}/settings", response_model=ApiResponse[ProjectResponse])
async def update_project_settings(
    project_id: str = Path(...),
    request: ProjectSettingsUpdateRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """Merge new settings into the existing project settings."""
    repo = ProjectRepository(db)
    updated_project = await repo.update_project_settings(project_id, request.settings)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project settings updated",
        data=ProjectResponse.model_validate(updated_project)
    )

@router.patch("/{project_id}/cover-image", response_model=ApiResponse[ProjectResponse])
async def update_cover_image(
    project_id: str = Path(...),
    cover_image: str = Query(..., description="Path or URL to the new cover image"),
    db: AsyncSession = Depends(get_db)
):
    """Update the cover image for a project."""
    repo = ProjectRepository(db)
    updated_project = await repo.update_cover_image(project_id, cover_image)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Cover image updated",
        data=ProjectResponse.model_validate(updated_project)
    )

@router.post("/{project_id}/archive", response_model=ApiResponse[ProjectResponse])
async def archive_project(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Archive a project."""
    repo = ProjectRepository(db)
    archived_project = await repo.archive_project(project_id)
    if not archived_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project archived",
        data=ProjectResponse.model_validate(archived_project)
    )

@router.post("/{project_id}/restore", response_model=ApiResponse[ProjectResponse])
async def restore_project(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Restore an archived project back to active status."""
    repo = ProjectRepository(db)
    restored_project = await repo.restore_project(project_id)
    if not restored_project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project restored",
        data=ProjectResponse.model_validate(restored_project)
    )

@router.delete("/{project_id}", response_model=ApiResponse[bool])
async def delete_project(
    project_id: str = Path(...),
    hard_delete: bool = Query(False, description="If true, permanently delete from DB"),
    db: AsyncSession = Depends(get_db)
):
    """Delete a project (soft delete by default)."""
    repo = ProjectRepository(db)
    
    if hard_delete:
        success = await repo.delete(project_id)
    else:
        success = await repo.soft_delete(project_id)
        
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Project permanently deleted" if hard_delete else "Project deleted",
        data=True
    )
