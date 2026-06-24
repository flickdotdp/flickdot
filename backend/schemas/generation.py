from datetime import datetime
from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict, conint, confloat, constr

# We'll redefine enums here for schema independence, or import them from models.
# Importing from models ensures strict consistency.
from ..models.generation import GenerationType, GenerationStatus

T = TypeVar('T')

class PaginationResponse(BaseModel, Generic[T]):
    """Generic pagination wrapper for listing responses."""
    items: List[T]
    total: int = Field(description="Total number of items available")
    skip: int = Field(description="Number of items skipped")
    limit: int = Field(description="Max number of items requested")

class LoraModelConfig(BaseModel):
    """Configuration for a loaded LoRA model."""
    name: str = Field(description="Filename of the LoRA model")
    strength_model: float = Field(default=1.0, ge=-10.0, le=10.0, description="Strength applied to the model")
    strength_clip: float = Field(default=1.0, ge=-10.0, le=10.0, description="Strength applied to the CLIP")

class ControlNetConfig(BaseModel):
    """Configuration for a ControlNet layer."""
    name: str = Field(description="Filename of the ControlNet model")
    image_path: str = Field(description="Path or base64 of the conditioning image")
    strength: float = Field(default=1.0, ge=0.0, le=2.0)
    start_percent: float = Field(default=0.0, ge=0.0, le=1.0)
    end_percent: float = Field(default=1.0, ge=0.0, le=1.0)

# -------------------------------------------------------------------------
# Request Models
# -------------------------------------------------------------------------

class GenerationCreateRequest(BaseModel):
    """Request payload to initiate a new generation."""
    project_id: Optional[str] = Field(None, description="Optional UUID of the project this belongs to")
    generation_type: GenerationType = Field(default=GenerationType.TEXT_TO_IMAGE)
    
    # Dynamic Workflow Fields
    workflow_id: Optional[str] = Field(None, description="Dynamic workflow ID from the registry")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Dynamic parameters for the workflow")
    
    # Legacy / Static Workflow Fields
    prompt: Optional[str] = Field(None, max_length=10000, description="The positive prompt")
    negative_prompt: Optional[str] = Field(None, max_length=10000, description="The negative prompt")
    
    seed: Optional[conint(ge=0)] = Field(None, description="Random seed. If null, a random one is generated")
    cfg_scale: Optional[confloat(ge=1.0, le=30.0)] = Field(7.5, description="Classifier Free Guidance scale")
    steps: Optional[conint(ge=1, le=150)] = Field(20, description="Number of sampling steps")
    denoise_strength: Optional[confloat(ge=0.0, le=1.0)] = Field(1.0, description="Denoising strength for img2img")
    
    sampler: Optional[str] = Field("euler_ancestral", description="Sampler name")
    scheduler: Optional[str] = Field("normal", description="Scheduler name")
    
    width: Optional[conint(ge=64, le=4096)] = Field(512, description="Output width in pixels")
    height: Optional[conint(ge=64, le=4096)] = Field(512, description="Output height in pixels")
    batch_size: Optional[conint(ge=1, le=100)] = Field(1, description="Number of images to generate")
    
    model_name: Optional[str] = Field(None, description="Checkpoint model filename")
    vae_name: Optional[str] = Field(None, description="VAE filename if overriding baked VAE")
    
    lora_models: Optional[List[LoraModelConfig]] = Field(default_factory=list)
    controlnet_models: Optional[List[ControlNetConfig]] = Field(default_factory=list)
    
    source_image_path: Optional[str] = Field(None, description="Path to input image for img2img/inpainting")
    workflow_name: Optional[str] = Field("default_txt2img", description="Name of the ComfyUI workflow JSON to use")
    
    generation_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary custom data")

class GenerationUpdateRequest(BaseModel):
    """Payload to update arbitrary generation metadata or favorites."""
    generation_metadata: Optional[Dict[str, Any]] = None
    is_favorite: Optional[bool] = None

class GenerationStatusUpdateRequest(BaseModel):
    """Payload typically used internally or by workers to update state."""
    status: GenerationStatus
    error_message: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    output_image_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    comfyui_prompt_id: Optional[str] = None

# -------------------------------------------------------------------------
# Response Models
# -------------------------------------------------------------------------

class GenerationResponse(BaseModel):
    """Complete generation record response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: Optional[str]
    generation_type: GenerationType
    status: GenerationStatus
    
    prompt: Optional[str]
    negative_prompt: Optional[str]
    seed: Optional[int]
    cfg_scale: Optional[float]
    steps: Optional[int]
    denoise_strength: Optional[float]
    sampler: Optional[str]
    scheduler: Optional[str]
    width: Optional[int]
    height: Optional[int]
    batch_size: Optional[int]
    
    model_name: Optional[str]
    vae_name: Optional[str]
    lora_models: Optional[List[Dict[str, Any]]]
    controlnet_models: Optional[List[Dict[str, Any]]]
    
    source_image_path: Optional[str]
    output_image_path: Optional[str]
    thumbnail_path: Optional[str]
    
    # Workflow & Reproducibility Fields
    workflow_id: Optional[str]
    workflow_version_id: Optional[str]
    parameter_snapshot: Optional[Dict[str, Any]]
    workflow_snapshot_hash: Optional[str]
    compiled_workflow_json: Optional[Dict[str, Any]]
    
    workflow_name: Optional[str]
    workflow_version: Optional[str]
    comfyui_prompt_id: Optional[str]
    
    execution_time_seconds: Optional[float]
    queue_position: Optional[int]
    error_message: Optional[str]
    current_node: Optional[str] = None
    estimated_completion_time: Optional[float] = None
    retry_count: int = 0
    generation_metadata: Optional[Dict[str, Any]]
    
    created_at: datetime
    updated_at: datetime

class GenerationSummaryResponse(BaseModel):
    """Lightweight summary of a generation for lists/galleries."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    status: GenerationStatus
    thumbnail_path: Optional[str]
    output_image_path: Optional[str]
    prompt: Optional[str]
    created_at: datetime

class QueueItemResponse(BaseModel):
    """Represents an item currently in the generation queue."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    status: GenerationStatus
    prompt: Optional[str]
    workflow_name: Optional[str]
    comfyui_prompt_id: Optional[str]
    created_at: datetime

class GalleryItemResponse(GenerationSummaryResponse):
    """Specifically tailored for frontend gallery views."""
    model_config = ConfigDict(from_attributes=True)
    
    is_favorite: bool = False
    width: Optional[int]
    height: Optional[int]
    model_name: Optional[str]

class GenerationProgressResponse(BaseModel):
    """WebSocket/Polling response for active generation progress."""
    id: str
    status: GenerationStatus
    comfyui_prompt_id: Optional[str]
    progress_percent: float
    current_step: int
    max_steps: int
    current_node: Optional[str] = None
    eta: Optional[float] = None
    execution_logs: Optional[List[str]] = None

# -------------------------------------------------------------------------
# Statistics Models
# -------------------------------------------------------------------------

class GenerationStatisticsResponse(BaseModel):
    total: int
    queued: int
    processing: int
    completed: int
    failed: int
    cancelled: int

class ModelUsageStatisticsResponse(BaseModel):
    model_name: str
    count: int

class WorkflowUsageStatisticsResponse(BaseModel):
    workflow_name: str
    count: int
