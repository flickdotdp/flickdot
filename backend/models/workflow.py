from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from ..database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category = Column(String, default="General")
    tags = Column(JSON, default=list) # List of strings e.g., ["SDXL", "ControlNet"]
    author = Column(String, default="System")
    thumbnail_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Execution Metadata
    complexity = Column(String, default="Beginner")
    estimated_runtime = Column(Integer, default=30) # in seconds
    supported_models = Column(JSON, default=list)
    pricing = Column(String, nullable=True) # e.g. "Free", "Premium", "0.5 Credits"
    
    # Analytics / Metrics
    executions = Column(Integer, default=0)
    success_rate = Column(Integer, default=100) # percentage 0-100
    average_time = Column(Integer, default=30)
    rating = Column(Integer, default=50) # 0-50 mapped to 0.0 - 5.0
    bookmarks = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("WorkflowVersion", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowVersion(Base):
    __tablename__ = "workflow_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    
    # The raw JSON definition required by ComfyUI
    comfyui_json = Column(JSON, nullable=False)
    
    # Metadata defining dynamic UI controls (sliders, selects, inputs) 
    # mapped to the specific nodes inside comfyui_json
    ui_meta_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    workflow = relationship("Workflow", back_populates="versions")

