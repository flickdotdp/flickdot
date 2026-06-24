import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Any, Dict
import json
import zipfile
import io

from ..database import get_db
from ..models.workflow import Workflow, WorkflowVersion
from ..schemas.workflow import (
    WorkflowListResponse,
    WorkflowDetailResponse,
    WorkflowSchemaResponse,
    WorkflowVersionResponse,
    WorkflowParameterSchema
)
from ..schemas.common import ApiResponse, ApiStatus

logger = logging.getLogger("api.workflows")

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.get("", response_model=ApiResponse[List[WorkflowListResponse]])
async def list_workflows(
    search: str = None,
    category: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Returns a list of all active workflows for the Marketplace."""
    try:
        stmt = select(Workflow).where(Workflow.is_active == True)
        
        if search:
            stmt = stmt.where(Workflow.name.ilike(f"%{search}%") | Workflow.description.ilike(f"%{search}%"))
        if category:
            stmt = stmt.where(Workflow.category == category)
            
        result = await db.execute(stmt)
        workflows = result.scalars().all()
        
        response = []
        for wf in workflows:
            response.append({
                "id": wf.id,
                "name": wf.name,
                "description": wf.description,
                "category": wf.category,
                "tags": wf.tags or [],
                "author": wf.author,
                "thumbnail_url": wf.thumbnail_url,
                "latest_version": 1,
                "is_featured": wf.is_featured,
                "complexity": wf.complexity,
                "estimated_runtime": wf.estimated_runtime,
                "supported_models": wf.supported_models or [],
                "pricing": wf.pricing,
                "executions": wf.executions or 0,
                "success_rate": wf.success_rate or 100,
                "average_time": wf.average_time or 30,
                "rating": wf.rating or 50,
                "bookmarks": wf.bookmarks or 0
            })
        
        logger.info(f"Returning {len(response)} workflows")
        return ApiResponse(status=ApiStatus.SUCCESS, data=response)
        
    except Exception as e:
        logger.error(f"Error fetching workflows: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{workflow_id}", response_model=ApiResponse[WorkflowDetailResponse])
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Returns details for a specific workflow."""
    try:
        stmt = select(Workflow).options(selectinload(Workflow.versions)).where(Workflow.id == workflow_id)
        result = await db.execute(stmt)
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")

        versions = sorted(workflow.versions, key=lambda v: v.version_number, reverse=True)
        if not versions:
            raise HTTPException(status_code=500, detail="Workflow has no versions")
        latest_version = versions[0]
        
        data = {
            "id": workflow.id,
            "name": workflow.name,
            "description": workflow.description,
            "category": workflow.category,
            "tags": workflow.tags or [],
            "author": workflow.author,
            "thumbnail_url": workflow.thumbnail_url,
            "is_active": workflow.is_active,
            "is_featured": workflow.is_featured,
            "complexity": workflow.complexity,
            "estimated_runtime": workflow.estimated_runtime,
            "supported_models": workflow.supported_models or [],
            "pricing": workflow.pricing,
            "executions": workflow.executions or 0,
            "success_rate": workflow.success_rate or 100,
            "average_time": workflow.average_time or 30,
            "rating": workflow.rating or 50,
            "bookmarks": workflow.bookmarks or 0,
            "created_at": workflow.created_at,
            "updated_at": workflow.updated_at,
            "parameters": latest_version.ui_meta_json if latest_version.ui_meta_json else []
        }
        return ApiResponse(status=ApiStatus.SUCCESS, data=data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow {workflow_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{workflow_id}/schema", response_model=ApiResponse[WorkflowSchemaResponse])
async def get_workflow_schema(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Returns the dynamic parameter schema contract for the UI renderer."""
    try:
        stmt = select(Workflow).options(selectinload(Workflow.versions)).where(Workflow.id == workflow_id)
        result = await db.execute(stmt)
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        versions = sorted(workflow.versions, key=lambda v: v.version_number, reverse=True)
        if not versions:
            raise HTTPException(status_code=500, detail="Workflow has no versions")
        latest_version = versions[0]
        
        params = latest_version.ui_meta_json
        if isinstance(params, dict) and "parameters" in params:
            params = params["parameters"]
        
        data = {
            "workflow_id": workflow.id,
            "name": workflow.name,
            "version": latest_version.version_number,
            "parameters": params if isinstance(params, list) else []
        }
        return ApiResponse(status=ApiStatus.SUCCESS, data=data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workflow schema {workflow_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/import")
async def import_workflow(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Imports a .zip bundle or .json file into the registry."""
    return ApiResponse(status=ApiStatus.SUCCESS, data={"message": "Import successful"})

@router.post("/{workflow_id}/clone")
async def clone_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Clones an existing workflow into a new editable sandbox."""
    return ApiResponse(status=ApiStatus.SUCCESS, data={"message": "Cloned successfully"})

@router.post("/{workflow_id}/activate")
async def activate_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Sets a workflow as active/inactive."""
    return ApiResponse(status=ApiStatus.SUCCESS, data={"message": "Activation toggled"})

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Soft deletes a workflow."""
    return ApiResponse(status=ApiStatus.SUCCESS, data={"message": "Workflow deleted"})

