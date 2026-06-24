from datetime import datetime, timezone
import enum
from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field, ConfigDict
import uuid

T = TypeVar("T")

# -------------------------------------------------------------------------
# Enums
# -------------------------------------------------------------------------

class ApiStatus(str, enum.Enum):
    SUCCESS = "success"
    ERROR = "error"
    FAIL = "fail"

class HealthState(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"

class WsEventType(str, enum.Enum):
    SYSTEM_STATUS = "system_status"
    GENERATION_PROGRESS = "generation_progress"
    GENERATION_COMPLETED = "generation_completed"
    GENERATION_FAILED = "generation_failed"
    QUEUE_UPDATE = "queue_update"

# -------------------------------------------------------------------------
# Base API Wrappers
# -------------------------------------------------------------------------

class ApiBase(BaseModel):
    """Base fields for all API responses."""
    status: ApiStatus
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the request tracing")
    correlation_id: Optional[str] = Field(None, description="Optional ID for tracking requests across microservices")

class SuccessResponse(ApiBase):
    """Generic success response with no specific payload."""
    status: ApiStatus = ApiStatus.SUCCESS
    message: Optional[str] = Field(None, description="Human readable success message")

class ApiResponse(ApiBase, Generic[T]):
    """Standard wrapper for successful API responses containing a payload."""
    status: ApiStatus = ApiStatus.SUCCESS
    data: T = Field(description="The actual payload data")
    message: Optional[str] = None

class PaginatedResponse(ApiBase, Generic[T]):
    """Standard wrapper for paginated lists."""
    status: ApiStatus = ApiStatus.SUCCESS
    data: List[T]
    total: int = Field(description="Total number of available items")
    skip: int = Field(description="Number of items skipped")
    limit: int = Field(description="Max number of items returned")

class ErrorResponse(ApiBase):
    """Standard wrapper for API errors."""
    status: ApiStatus = ApiStatus.ERROR
    message: str = Field(description="Human readable error message")
    error_code: Optional[str] = Field(None, description="Internal error code for frontend mapping")
    details: Optional[Any] = Field(None, description="Detailed error information or stack traces")

class ValidationErrorDetail(BaseModel):
    """Specific detail item for Pydantic validation errors."""
    loc: List[str]
    msg: str
    type: str

class ValidationErrorResponse(ApiBase):
    """Wrapper for 422 Unprocessable Entity errors."""
    status: ApiStatus = ApiStatus.FAIL
    message: str = "Validation Error"
    errors: List[ValidationErrorDetail]

# -------------------------------------------------------------------------
# Health & Status Models
# -------------------------------------------------------------------------

class DatabaseHealthResponse(BaseModel):
    status: HealthState
    message: Optional[str] = None

class ComfyUIHealthResponse(BaseModel):
    status: HealthState
    engine_version: Optional[str] = None
    connected_clients: Optional[int] = None
    message: Optional[str] = None
    stats: Optional[Dict[str, Any]] = None

class HealthCheckResponse(ApiBase):
    """Overall API Health."""
    status: ApiStatus = ApiStatus.SUCCESS
    api_version: str
    uptime_seconds: float
    database: DatabaseHealthResponse
    comfyui: ComfyUIHealthResponse

class SystemStatusResponse(ApiBase):
    """Dashboard-level system status."""
    status: ApiStatus = ApiStatus.SUCCESS
    system_health: HealthState
    active_jobs: int
    queued_jobs: int

# -------------------------------------------------------------------------
# WebSocket Messages
# -------------------------------------------------------------------------

class WebSocketMessage(BaseModel, Generic[T]):
    """Base format for all WebSocket payloads."""
    event: WsEventType
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: T

class ProgressUpdateMessage(BaseModel):
    """Payload for generation progress events."""
    generation_id: str
    comfyui_prompt_id: Optional[str]
    progress_percent: float = Field(..., ge=0.0, le=100.0)
    current_step: int
    max_steps: int
    current_node: Optional[str] = None
    estimated_time_remaining: Optional[float] = None

class QueueStatusMessage(BaseModel):
    """Payload for queue status broadcast."""
    items_in_queue: int
    processing_items: int
    average_wait_time_seconds: Optional[float] = None
