from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict, constr

from ..models.project import ProjectStatus
from .generation import GenerationSummaryResponse, PaginationResponse

# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------

class ProjectCreateRequest(BaseModel):
    """Request payload to create a new project."""
    project_name: str = Field(..., min_length=1, max_length=255, description="Name of the project")
    description: Optional[str] = Field(None, description="Optional detailed description")
    tags: Optional[List[str]] = Field(default_factory=list, description="List of organizational tags")
    cover_image: Optional[str] = Field(None, description="Path to a cover image for the project")
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Project-level defaults and settings")
    project_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary custom metadata")

class ProjectUpdateRequest(BaseModel):
    """Payload to update standard project fields."""
    project_name: Optional[constr(min_length=1, max_length=255)] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image: Optional[str] = None
    project_metadata: Optional[Dict[str, Any]] = None

class ProjectSettingsUpdateRequest(BaseModel):
    """Payload specifically for merging new settings into a project."""
    settings: Dict[str, Any] = Field(..., description="Dictionary of settings to update or merge")

class ProjectArchiveRequest(BaseModel):
    """Payload to update the archive state of a project."""
    status: ProjectStatus = Field(..., description="Status to set, e.g., 'archived' or 'active'")

# -------------------------------------------------------------------------
# Response Models
# -------------------------------------------------------------------------

class ProjectResponse(BaseModel):
    """Standard response model for a project record."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_name: str
    description: Optional[str]
    status: ProjectStatus
    cover_image: Optional[str]
    tags: Optional[List[str]]
    settings: Optional[Dict[str, Any]]
    project_metadata: Optional[Dict[str, Any]]
    
    created_at: datetime
    updated_at: datetime

class ProjectSummaryResponse(BaseModel):
    """Lightweight project representation for lists and sidebars."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_name: str
    status: ProjectStatus
    cover_image: Optional[str]
    updated_at: datetime

class ProjectDetailResponse(ProjectResponse):
    """Detailed project response including a snapshot of recent generations."""
    model_config = ConfigDict(from_attributes=True)
    
    recent_generations: Optional[List[GenerationSummaryResponse]] = Field(
        default=None, 
        description="A lightweight list of recent generations belonging to this project"
    )

# Alias for paginated lists of projects
ProjectListResponse = PaginationResponse[ProjectSummaryResponse]

# -------------------------------------------------------------------------
# Statistics & Analytics Models
# -------------------------------------------------------------------------

class ProjectStatisticsResponse(BaseModel):
    """Analytics for a single project."""
    total_generations: int = Field(0, description="Total number of generations in the project")
    completed_generations: int = Field(0, description="Number of successfully completed generations")
    failed_generations: int = Field(0, description="Number of failed generations")
    total_execution_time_seconds: float = Field(0.0, description="Cumulative execution time of all generations")
    # For a real implementation, storage usage requires os.path.getsize checks, 
    # but we represent the expected API structure here.
    estimated_storage_mb: float = Field(0.0, description="Estimated disk space used by project outputs")

class DashboardSummaryResponse(BaseModel):
    """Global platform aggregation for the main dashboard."""
    active_projects: int = Field(0, description="Count of projects currently active")
    archived_projects: int = Field(0, description="Count of projects currently archived")
    total_generations: int = Field(0, description="Count of all generations across all projects")
    generations_today: int = Field(0, description="Count of generations created today")
    success_rate_percent: float = Field(0.0, description="Global success rate percentage")
    recent_active_projects: List[ProjectSummaryResponse] = Field(default_factory=list, description="Most recently updated projects")
