from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from ..database import get_db
from ..models.asset import AssetType, AIAsset
from ..services.asset_service import AssetService

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)

# -------------------------------------------------------------------------
# Schemas
# -------------------------------------------------------------------------
from pydantic import BaseModel
from datetime import datetime

class AIAssetResponse(BaseModel):
    id: str
    name: str
    filename: str
    asset_type: str
    file_size_bytes: int
    compatibility_tags: List[str]
    thumbnail_url: str | None
    description: str | None
    is_favorite: bool

    class Config:
        from_attributes = True

# -------------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------------

@router.get("/models", response_model=List[AIAssetResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    """Return all Checkpoint models."""
    service = AssetService(db)
    assets = await service.get_all_assets(AssetType.CHECKPOINT)
    return assets

@router.get("/loras", response_model=List[AIAssetResponse])
async def list_loras(db: AsyncSession = Depends(get_db)):
    """Return all LoRA models."""
    service = AssetService(db)
    assets = await service.get_all_assets(AssetType.LORA)
    return assets

@router.post("/refresh")
async def refresh_registry(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Trigger a manual filesystem scan."""
    service = AssetService(db)
    # Perform scan synchronously to return immediate result
    # In a very large setup, this could be sent to background_tasks
    result = await service.scan_and_refresh()
    return {"status": "success", "data": result}
