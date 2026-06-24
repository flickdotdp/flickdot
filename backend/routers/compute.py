from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend.models.compute import WorkerNode, GPUDevice, ExecutionPool, QueueAssignment, WorkerStatus
from backend.models.generation import Generation, GenerationStatus

router = APIRouter(prefix="/compute", tags=["Compute"])

@router.get("/workers")
async def list_workers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkerNode))
    workers = result.scalars().all()
    return workers

@router.get("/gpus")
async def list_gpus(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GPUDevice))
    gpus = result.scalars().all()
    return gpus

@router.get("/pools")
async def list_pools(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExecutionPool))
    pools = result.scalars().all()
    return pools

@router.get("/queue")
async def get_queue_assignments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QueueAssignment))
    assignments = result.scalars().all()
    return assignments

@router.get("/metrics")
async def get_compute_metrics(db: AsyncSession = Depends(get_db)):
    workers_online = await db.scalar(select(func.count(WorkerNode.id)).where(WorkerNode.status == WorkerStatus.ONLINE))
    gpus_online = await db.scalar(select(func.count(GPUDevice.id))) # Simplified assuming all GPUs on online workers are online
    
    queue_depth = await db.scalar(select(func.count(Generation.id)).where(Generation.status == GenerationStatus.QUEUED))
    running_jobs = await db.scalar(select(func.count(Generation.id)).where(Generation.status == GenerationStatus.PROCESSING))
    
    return {
        "workers_online": workers_online or 0,
        "gpus_online": gpus_online or 0,
        "queue_depth": queue_depth or 0,
        "running_jobs": running_jobs or 0
    }
