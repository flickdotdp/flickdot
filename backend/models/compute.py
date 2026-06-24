from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, JSON, Enum as SQLEnum, Float, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from datetime import datetime
from sqlalchemy.sql import func

from .base import BaseModel

class WorkerStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class WorkerNode(BaseModel):
    __tablename__ = "worker_nodes"

    hostname: Mapped[str] = mapped_column(String(255), index=True)
    ip_address: Mapped[str] = mapped_column(String(255))
    status: Mapped[WorkerStatus] = mapped_column(SQLEnum(WorkerStatus), default=WorkerStatus.OFFLINE, index=True)
    last_seen: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # JSON metadata for capabilities
    capabilities: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    supported_models: Mapped[List[str]] = mapped_column(JSON, default=list)
    supported_workflow_tags: Mapped[List[str]] = mapped_column(JSON, default=list)

    # Relationships
    gpus: Mapped[List["GPUDevice"]] = relationship("GPUDevice", back_populates="worker", cascade="all, delete-orphan")
    pool_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("execution_pools.id", ondelete="SET NULL"), nullable=True)
    pool: Mapped[Optional["ExecutionPool"]] = relationship("ExecutionPool", back_populates="workers")

class GPUDevice(BaseModel):
    __tablename__ = "gpu_devices"

    worker_id: Mapped[str] = mapped_column(String(36), ForeignKey("worker_nodes.id", ondelete="CASCADE"), index=True)
    
    gpu_name: Mapped[str] = mapped_column(String(255))
    gpu_index: Mapped[int] = mapped_column(Integer, default=0) # Index on the host
    
    vram_total: Mapped[int] = mapped_column(Integer, default=0) # In MB
    vram_used: Mapped[int] = mapped_column(Integer, default=0) # In MB
    utilization: Mapped[float] = mapped_column(Float, default=0.0) # Percentage
    temperature: Mapped[float] = mapped_column(Float, default=0.0) # Celsius
    queue_depth: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    worker: Mapped["WorkerNode"] = relationship("WorkerNode", back_populates="gpus")
    assignments: Mapped[List["QueueAssignment"]] = relationship("QueueAssignment", back_populates="gpu", cascade="all, delete-orphan")

class ExecutionPool(BaseModel):
    __tablename__ = "execution_pools"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    workers: Mapped[List["WorkerNode"]] = relationship("WorkerNode", back_populates="pool")

class AssignmentStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class QueueAssignment(BaseModel):
    __tablename__ = "queue_assignments"

    generation_id: Mapped[str] = mapped_column(String(36), ForeignKey("generations.id", ondelete="CASCADE"), unique=True, index=True)
    gpu_id: Mapped[str] = mapped_column(String(36), ForeignKey("gpu_devices.id", ondelete="CASCADE"), index=True)
    
    status: Mapped[AssignmentStatus] = mapped_column(SQLEnum(AssignmentStatus), default=AssignmentStatus.PENDING, index=True)
    assigned_at: Mapped[datetime] = mapped_column(default=func.now())
    started_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Relationships
    gpu: Mapped["GPUDevice"] = relationship("GPUDevice", back_populates="assignments")
