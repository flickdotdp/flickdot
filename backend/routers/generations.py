import logging
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models.generation import GenerationStatus, GenerationType, Generation
from ..models.workflow import Workflow
from ..repositories.generation_repository import GenerationRepository
from ..repositories.project_repository import ProjectRepository
from ..services.workflow_validator import WorkflowValidator
from ..services.workflow_execution_service import WorkflowExecutionService
from ..schemas.generation import (
    GenerationCreateRequest,
    GenerationStatusUpdateRequest,
    GenerationResponse,
    GenerationSummaryResponse,
    GalleryItemResponse,
    QueueItemResponse,
    GenerationStatisticsResponse,
    ModelUsageStatisticsResponse,
    PaginationResponse
)
from ..schemas.common import ApiResponse, PaginatedResponse, ApiStatus

logger = logging.getLogger("api.generations")

# All valid column names on the Generation ORM model (used for payload sanitisation)
_GENERATION_ORM_FIELDS = frozenset({
    c.key for c in Generation.__mapper__.column_attrs
})

router = APIRouter(
    prefix="/generations",
    tags=["Generations"],
    responses={404: {"description": "Generation record not found"}}
)

# -------------------------------------------------------------------------
# Core Endpoints
# -------------------------------------------------------------------------

@router.post("/", response_model=ApiResponse[GenerationResponse], status_code=status.HTTP_201_CREATED)
async def create_generation(
    request: GenerationCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Queue a new generation request.
    Validates the project (if provided) and creates a database record.
    Prepares for ComfyUI workflow submission.
    """
    gen_repo = GenerationRepository(db)
    
    logger.info(
        "POST /api/v1/generations — incoming request: workflow_id=%s, prompt=%.80s, "
        "generation_type=%s, width=%s, height=%s, steps=%s",
        request.workflow_id,
        request.prompt,
        request.generation_type,
        request.width,
        request.height,
        request.steps,
    )

    # 1. Validation
    if request.project_id:
        proj_repo = ProjectRepository(db)
        if not await proj_repo.exists(request.project_id):
            raise HTTPException(status_code=400, detail="Provided project_id does not exist")
            
    # 2. Workflow Orchestration
    dump = request.model_dump(exclude_unset=True)
    
    if request.workflow_id:
        # Load active workflow version
        stmt = select(Workflow).options(selectinload(Workflow.versions)).where(Workflow.id == request.workflow_id)
        result = await db.execute(stmt)
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        if not workflow.is_active:
            raise HTTPException(status_code=400, detail="Workflow is inactive")
            
        versions = sorted(workflow.versions, key=lambda v: v.version_number, reverse=True)
        if not versions:
            raise HTTPException(status_code=500, detail="Workflow has no versions")
        active_version = versions[0]
        
        # Load meta schema and validate
        ui_meta = active_version.ui_meta_json or {}
        raw_params = request.parameters or {}
        
        try:
            validated_params = WorkflowValidator.validate_parameters(ui_meta, raw_params)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
            
        # Execute / Compile JSON
        comfyui_json = active_version.comfyui_json
        compiled_workflow = WorkflowExecutionService.inject_parameters(comfyui_json, ui_meta, validated_params)
        snapshot_hash = WorkflowExecutionService.hash_snapshot(compiled_workflow)
        
        # Inject reproducibility data into the dump using the correct ORM column names
        dump["workflow_id"] = workflow.id
        dump["workflow_name"] = workflow.name
        dump["workflow_version_id"] = active_version.id
        dump["parameter_snapshot"] = validated_params   # ← correct ORM field name
        dump["workflow_snapshot_hash"] = snapshot_hash
        dump["compiled_workflow_json"] = compiled_workflow
        
    else:
        logger.warning("LEGACY: Generation requested without workflow_id. This is deprecated.")

    # 3. Sanitise dump — strip any keys that are NOT valid Generation ORM columns.
    #    The primary culprit is `parameters` (from GenerationCreateRequest) which does
    #    not exist on the Generation model; its validated equivalent is stored in
    #    `parameter_snapshot` above.
    unknown_keys = [k for k in list(dump.keys()) if k not in _GENERATION_ORM_FIELDS]
    if unknown_keys:
        logger.warning(
            "Stripping unknown Generation fields from insert payload (not ORM columns): %s",
            unknown_keys,
        )
        for k in unknown_keys:
            dump.pop(k, None)

    logger.info(
        "Creating Generation DB record with fields: %s",
        list(dump.keys()),
    )

    # 4. Database Record Creation (Initial state: QUEUED)
    # The background queue worker will pick up 'compiled_workflow_json' if present.
    generation = await gen_repo.create(dump)
    
    logger.info(
        "Generation created successfully: id=%s, status=%s",
        generation.id,
        generation.status,
    )

    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Generation queued successfully",
        data=GenerationResponse.model_validate(generation)
    )

# -------------------------------------------------------------------------
# Listing & Queues
# -------------------------------------------------------------------------

@router.get("/", response_model=PaginatedResponse[GenerationSummaryResponse])
async def list_generations(
    project_id: Optional[str] = Query(None),
    status_filter: Optional[GenerationStatus] = Query(None, alias="status"),
    gen_type: Optional[GenerationType] = Query(None, alias="type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List generations with powerful filtering options."""
    gen_repo = GenerationRepository(db)
    
    # In a full implementation, BaseRepository would dynamically accept kwargs.
    # For now, we route to the optimized repo methods.
    if project_id:
        gens = await gen_repo.get_generations_by_project(project_id, skip, limit)
    elif status_filter:
        gens = await gen_repo.get_generations_by_status(status_filter, skip, limit)
    elif gen_type:
        gens = await gen_repo.get_generations_by_type(gen_type, skip, limit)
    else:
        gens = await gen_repo.get_recent_generations(limit) # using limit as implicit max

    return PaginatedResponse(
        status=ApiStatus.SUCCESS,
        data=[GenerationSummaryResponse.model_validate(g) for g in gens],
        total=await gen_repo.count(), # Note: approximated total without filters
        skip=skip,
        limit=limit
    )

@router.get("/action/search", response_model=PaginatedResponse[GenerationSummaryResponse])
async def search_generations(
    q: str = Query(..., description="Prompt or negative prompt content"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Search generations by prompt text."""
    gen_repo = GenerationRepository(db)
    gens = await gen_repo.search_generations_by_prompt(q, skip, limit)
    return PaginatedResponse(
        status=ApiStatus.SUCCESS,
        data=[GenerationSummaryResponse.model_validate(g) for g in gens],
        total=len(gens),
        skip=skip,
        limit=limit
    )

@router.get("/action/queue", response_model=ApiResponse[List[QueueItemResponse]])
async def get_generation_queue(db: AsyncSession = Depends(get_db)):
    """Get all items currently queued or processing."""
    gen_repo = GenerationRepository(db)
    queue = await gen_repo.get_generation_queue()
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=[QueueItemResponse.model_validate(q) for q in queue]
    )

@router.get("/action/gallery", response_model=PaginatedResponse[GalleryItemResponse])
async def get_gallery(
    favorites_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Optimized endpoint for frontend image galleries."""
    gen_repo = GenerationRepository(db)
    # Using recent generations; favorites filtering would be added via JSON metadata filtering
    gens = await gen_repo.get_recent_generations(limit=skip+limit)
    gens = gens[skip:skip+limit]
    
    results = []
    for g in gens:
        # Check metadata for favorite status
        is_fav = g.generation_metadata.get("is_favorite", False) if g.generation_metadata else False
        if favorites_only and not is_fav:
            continue
            
        item = GalleryItemResponse.model_validate(g)
        item.is_favorite = is_fav
        results.append(item)

    return PaginatedResponse(
        status=ApiStatus.SUCCESS,
        data=results,
        total=await gen_repo.count(),
        skip=skip,
        limit=limit
    )

# -------------------------------------------------------------------------
# Lifecycle & State Management
# -------------------------------------------------------------------------

@router.put("/{generation_id}/status", response_model=ApiResponse[GenerationResponse])
async def update_status(
    generation_id: str = Path(...),
    request: GenerationStatusUpdateRequest = ...,
    db: AsyncSession = Depends(get_db)
):
    """Internal/Worker endpoint to update generation state."""
    gen_repo = GenerationRepository(db)
    
    update_data = request.model_dump(exclude_unset=True)
    updated = await gen_repo.update(generation_id, update_data)
    
    if not updated:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    # [FUTURE INTEGRATION POINT] Broadcast WebSocket event here
    
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        message="Status updated",
        data=GenerationResponse.model_validate(updated)
    )

@router.post("/{generation_id}/cancel", response_model=ApiResponse[bool])
async def cancel_generation(
    generation_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a queued or processing generation."""
    gen_repo = GenerationRepository(db)
    gen = await gen_repo.get_by_id(generation_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    if gen.status in [GenerationStatus.COMPLETED, GenerationStatus.FAILED, GenerationStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel a finalized generation")
        
    # [FUTURE INTEGRATION POINT] comfy_service.interrupt_prompt(gen.comfyui_prompt_id)
    
    await gen_repo.update_generation_status(generation_id, GenerationStatus.CANCELLED)
    return ApiResponse(status=ApiStatus.SUCCESS, message="Generation cancelled", data=True)

@router.post("/{generation_id}/favorite", response_model=ApiResponse[bool])
async def toggle_favorite(
    generation_id: str = Path(...),
    is_favorite: bool = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Mark or unmark an image as a favorite."""
    gen_repo = GenerationRepository(db)
    updated = await gen_repo.toggle_favorite(generation_id, is_favorite)
    if not updated:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    return ApiResponse(status=ApiStatus.SUCCESS, message="Favorite status updated", data=is_favorite)

@router.delete("/{generation_id}", response_model=ApiResponse[bool])
async def delete_generation(
    generation_id: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a generation record."""
    gen_repo = GenerationRepository(db)
    success = await gen_repo.soft_delete(generation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    return ApiResponse(status=ApiStatus.SUCCESS, message="Generation deleted", data=True)

# -------------------------------------------------------------------------
# Statistics
# -------------------------------------------------------------------------

@router.get("/stats/overall", response_model=ApiResponse[GenerationStatisticsResponse])
async def get_overall_statistics(db: AsyncSession = Depends(get_db)):
    gen_repo = GenerationRepository(db)
    stats = await gen_repo.get_generation_statistics()
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=GenerationStatisticsResponse(**stats)
    )

@router.get("/stats/models", response_model=ApiResponse[List[ModelUsageStatisticsResponse]])
async def get_model_statistics(db: AsyncSession = Depends(get_db)):
    gen_repo = GenerationRepository(db)
    stats = await gen_repo.get_model_usage_statistics()
    return ApiResponse(
        status=ApiStatus.SUCCESS,
        data=[ModelUsageStatisticsResponse(**s) for s in stats]
    )
