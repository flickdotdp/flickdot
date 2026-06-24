from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class WorkflowParameterSchema(BaseModel):
    key: str
    type: str
    required: bool = False
    default: Any = None
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[Any]] = None
    description: Optional[str] = None
    
class WorkflowSchemaResponse(BaseModel):
    workflow_id: str
    name: str
    version: int
    parameters: List[WorkflowParameterSchema]

class WorkflowListResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    tags: List[str]
    author: str
    thumbnail_url: Optional[str] = None
    latest_version: int
    is_featured: bool = False
    
    # Execution Metadata
    complexity: str
    estimated_runtime: int
    supported_models: List[str]
    pricing: Optional[str] = None
    
    # Analytics
    executions: int
    success_rate: int
    average_time: int
    rating: int
    bookmarks: int

class WorkflowDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    tags: List[str]
    author: str
    thumbnail_url: Optional[str] = None
    is_active: bool
    is_featured: bool
    
    # Execution Metadata
    complexity: str
    estimated_runtime: int
    supported_models: List[str]
    pricing: Optional[str] = None
    
    # Analytics
    executions: int
    success_rate: int
    average_time: int
    rating: int
    bookmarks: int
    
    created_at: datetime
    updated_at: datetime
    parameters: List[WorkflowParameterSchema]

class WorkflowVersionResponse(BaseModel):
    id: str
    workflow_id: str
    version_number: int
    created_at: datetime
    # We do not expose the raw comfyui_json here for UI safety, 
    # but could add an export endpoint later.
