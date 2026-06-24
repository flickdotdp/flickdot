import logging
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from ..services.comfyui_service import ComfyUIService

logger = logging.getLogger("router.models")
router = APIRouter(prefix="/models", tags=["Models"])

@router.get("/checkpoints", response_model=List[str])
async def list_checkpoints():
    """List all available base model checkpoints."""
    try:
        svc = ComfyUIService()
        return await svc.get_models("checkpoints")
    except Exception as e:
        logger.error(f"Failed to fetch checkpoints: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch checkpoints")

@router.get("/loras", response_model=List[str])
async def list_loras():
    """List all available LoRA models."""
    try:
        svc = ComfyUIService()
        return await svc.get_models("loras")
    except Exception as e:
        logger.error(f"Failed to fetch loras: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch loras")

@router.get("/vae", response_model=List[str])
async def list_vaes():
    """List all available VAE models."""
    try:
        svc = ComfyUIService()
        return await svc.get_models("vae")
    except Exception as e:
        logger.error(f"Failed to fetch vaes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch vaes")
