import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..database import get_db
from ..models.bundle import Bundle
from ..services.bundle_service import BundleService
from ..schemas.common import ApiResponse, ApiStatus
import shutil
from pathlib import Path

logger = logging.getLogger("api.bundles")

router = APIRouter(
    prefix="/bundles",
    tags=["Bundles"]
)

@router.get("/", response_model=ApiResponse[List])
async def list_bundles(db: AsyncSession = Depends(get_db)):
    """List all available workflow bundles."""
    try:
        from sqlalchemy.future import select
        result = await db.execute(select(Bundle))
        bundles = result.scalars().all()
        # Serialize to dicts to avoid ORM serialization issues
        data = [
            {
                "id": b.id,
                "name": b.name,
                "version": b.version,
                "author": b.author,
                "description": b.description,
                "tags": b.tags or [],
                "is_installed": b.is_installed,
                "installed_workflow_id": b.installed_workflow_id,
                "thumbnail_url": b.thumbnail_url,
                "created_at": str(b.created_at),
                "updated_at": str(b.updated_at),
            }
            for b in bundles
        ]
        return ApiResponse(status=ApiStatus.SUCCESS, data=data)
    except Exception as e:
        logger.error(f"Error listing bundles: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/import")
async def import_bundle(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """Upload a .zip workflow bundle."""
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Must be a .zip file")

    try:
        service = BundleService(db)
        temp_path = service.imports_dir / file.filename
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        bundle = await service.import_bundle(str(temp_path))
        return ApiResponse(status=ApiStatus.SUCCESS, data={"status": "success", "bundle_id": bundle.id})
    except HTTPException:
        raise
    except Exception as e:
        if 'temp_path' in locals() and Path(temp_path).exists():
            Path(temp_path).unlink()
        logger.error(f"Error importing bundle: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/export")
async def export_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """Export an existing workflow into a .zip bundle."""
    try:
        service = BundleService(db)
        zip_path = await service.export_bundle(workflow_id)
        return ApiResponse(status=ApiStatus.SUCCESS, data={"status": "success", "file_path": zip_path})
    except Exception as e:
        logger.error(f"Error exporting bundle {workflow_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{bundle_id}/install")
async def install_bundle(bundle_id: str, db: AsyncSession = Depends(get_db)):
    """Install a bundle, creating its workflow entry."""
    try:
        service = BundleService(db)
        workflow = await service.install_bundle(bundle_id)
        return ApiResponse(status=ApiStatus.SUCCESS, data={"workflow_id": workflow.id if workflow else None})
    except Exception as e:
        logger.error(f"Error installing bundle {bundle_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{bundle_id}")
async def delete_bundle(bundle_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a bundle from the registry."""
    try:
        from sqlalchemy.future import select
        result = await db.execute(select(Bundle).where(Bundle.id == bundle_id))
        bundle = result.scalar_one_or_none()
        if not bundle:
            raise HTTPException(status_code=404, detail="Bundle not found")
        await db.delete(bundle)
        await db.commit()
        return ApiResponse(status=ApiStatus.SUCCESS, data={"deleted": True})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bundle {bundle_id}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

