import os
import enum
from typing import Optional, List, Any, Dict
from sqlalchemy import String, Text, JSON, Enum, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

class GenerationType(str, enum.Enum):
    TEXT_TO_IMAGE = "text_to_image"
    IMAGE_TO_IMAGE = "image_to_image"
    INPAINTING = "inpainting"
    OUTPAINTING = "outpainting"
    UPSCALING = "upscaling"
    CONTROLNET = "controlnet"
    TEXT_TO_VIDEO = "text_to_video"
    IMAGE_TO_VIDEO = "image_to_video"

class GenerationStatus(str, enum.Enum):
    QUEUED = "queued"
    VALIDATING_WORKFLOW = "validating_workflow"
    RESOLVING_MODELS = "resolving_models"
    LOADING_CHECKPOINTS = "loading_checkpoints"
    CONNECTING = "connecting"
    EXECUTING = "executing"
    SAVING_OUTPUTS = "saving_outputs"
    PROCESSING_ASSETS = "processing_assets"
    COMPLETED = "completed"
    FAILED = "failed"
    INTERRUPTED = "interrupted"
    RETRYING = "retrying"
    CANCELLED = "cancelled"
    DEAD_LETTER = "dead_letter"

class Generation(BaseModel):
    __tablename__ = "generations"

    # Core Relationship
    project_id: Mapped[Optional[str]] = mapped_column(
        String(36), 
        ForeignKey("projects.id", ondelete="SET NULL"), 
        index=True, 
        nullable=True
    )

    # State & Type
    generation_type: Mapped[GenerationType] = mapped_column(
        Enum(GenerationType), 
        default=GenerationType.TEXT_TO_IMAGE, 
        index=True, 
        nullable=False
    )
    status: Mapped[GenerationStatus] = mapped_column(
        Enum(GenerationStatus), 
        default=GenerationStatus.QUEUED, 
        index=True, 
        nullable=False
    )
    
    # Prompt Parameters
    # We index the prompt to allow for basic text search. For advanced search, FTS could be used.
    prompt: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    negative_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Generation Parameters
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cfg_scale: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    denoise_strength: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sampler: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    scheduler: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    batch_size: Mapped[Optional[int]] = mapped_column(Integer, default=1, nullable=True)
    
    # Video Parameters
    fps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    frame_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Reproducibility tracking for dynamic workflows
    workflow_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("workflows.id"), nullable=True)
    workflow_version_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("workflow_versions.id"), nullable=True)
    parameter_snapshot: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    workflow_snapshot_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    compiled_workflow_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Models & Assets
    model_name: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    vae_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Lists stored as JSON for dynamic length arrays
    lora_models: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, default=list, nullable=True)
    controlnet_models: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, default=list, nullable=True)

    # Paths (relative to storage roots)
    source_image_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    output_image_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    output_video_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    # Workflow & Engine tracking
    workflow_name: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    workflow_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    comfyui_prompt_id: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    
    # Execution Metrics & Errors
    execution_time_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    queue_position: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_node: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estimated_completion_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Extensible metadata field for everything else
    generation_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="generations")

    def to_dict(self) -> Dict[str, Any]:
        """Serialize generation record to dictionary."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "generation_type": self.generation_type.value if self.generation_type else None,
            "status": self.status.value if self.status else None,
            "prompt": self.prompt,
            "negative_prompt": self.negative_prompt,
            "seed": self.seed,
            "cfg_scale": self.cfg_scale,
            "steps": self.steps,
            "denoise_strength": self.denoise_strength,
            "sampler": self.sampler,
            "scheduler": self.scheduler,
            "width": self.width,
            "height": self.height,
            "batch_size": self.batch_size,
            "fps": self.fps,
            "frame_count": self.frame_count,
            "duration_seconds": self.duration_seconds,
            "model_name": self.model_name,
            "vae_name": self.vae_name,
            "lora_models": self.lora_models,
            "controlnet_models": self.controlnet_models,
            "source_image_path": self.source_image_path,
            "output_image_path": self.output_image_path,
            "output_video_path": self.output_video_path,
            "thumbnail_path": self.thumbnail_path,
            "workflow_name": self.workflow_name,
            "workflow_version": self.workflow_version,
            "comfyui_prompt_id": self.comfyui_prompt_id,
            "execution_time_seconds": self.execution_time_seconds,
            "queue_position": self.queue_position,
            "error_message": self.error_message,
            "current_node": self.current_node,
            "estimated_completion_time": self.estimated_completion_time,
            "retry_count": self.retry_count,
            "generation_metadata": self.generation_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_deleted": self.is_deleted
        }

    def files_exist(self, base_output_dir: str) -> bool:
        """Helper to validate if the actual physical output file exists on disk."""
        if self.output_video_path:
            full_path = os.path.join(base_output_dir, self.output_video_path)
            if os.path.exists(full_path):
                return True
        if not self.output_image_path:
            return False
        full_path = os.path.join(base_output_dir, self.output_image_path)
        return os.path.exists(full_path)
