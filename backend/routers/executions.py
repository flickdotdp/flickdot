from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..repositories.generation_repository import GenerationRepository
from ..models.generation import GenerationStatus
from ..schemas.generation import GenerationResponse, PaginationResponse
from ..services.comfyui_service import ComfyUIService
import logging

logger = logging.getLogger("router.executions")
router = APIRouter(prefix="/executions", tags=["Executions"])

@router.get("", response_model=PaginationResponse[GenerationResponse])
async def list_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[GenerationStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """List execution history with optional filtering by status."""
    repo = GenerationRepository(db)
    # Reusing existing get_project_generations or creating a general list
    # Let's just do a basic query for now
    from sqlalchemy import select, func
    
    query = select(repo.model).where(repo.model.is_deleted == False)
    if status:
        query = query.where(repo.model.status == status)
        
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    query = query.order_by(repo.model.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return PaginationResponse(
        items=[GenerationResponse.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/{id}", response_model=GenerationResponse)
async def get_execution(id: str, db: AsyncSession = Depends(get_db)):
    """Get complete details of a specific execution including lineage and logs."""
    repo = GenerationRepository(db)
    item = await repo.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Execution not found")
    return GenerationResponse.model_validate(item)

@router.post("/{id}/retry", response_model=GenerationResponse)
async def retry_execution(id: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Retry a failed or interrupted execution."""
    repo = GenerationRepository(db)
    item = await repo.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if item.status not in [GenerationStatus.FAILED, GenerationStatus.INTERRUPTED, GenerationStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Cannot retry execution in status: {item.status}")
        
    item = await repo.update(id, {
        "status": GenerationStatus.QUEUED,
        "retry_count": item.retry_count + 1,
        "error_message": None,
        "current_node": None
    })
    
    # We rely on the generation_worker polling loop to pick up the new QUEUED item.
    return GenerationResponse.model_validate(item)

@router.post("/{id}/interrupt")
async def interrupt_execution(id: str, db: AsyncSession = Depends(get_db)):
    """Interrupt a currently running execution."""
    repo = GenerationRepository(db)
    item = await repo.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Execution not found")
        
    if item.status in [GenerationStatus.COMPLETED, GenerationStatus.FAILED, GenerationStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Execution is already finished")
        
    # Send interrupt to ComfyUI
    if item.status == GenerationStatus.EXECUTING:
        try:
            svc = ComfyUIService()
            await svc.interrupt_execution()
        except Exception as e:
            logger.warning(f"Could not interrupt comfyui execution for {id}: {e}")
            
    await repo.update_generation_status(id, GenerationStatus.INTERRUPTED, "Interrupted by user request.")
    return {"status": "interrupted"}
