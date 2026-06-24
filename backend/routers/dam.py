import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from ..database import get_db
from ..models.generated_asset import GeneratedAsset, ApprovalStatus
from ..models.review import AssetComment
from ..models.generation import Generation
from ..models.workflow import Workflow
from ..models.project import Project
from ..models.creative import Campaign, Brand
from pydantic import BaseModel as PydanticBaseModel

class CommentCreate(PydanticBaseModel):
    content: str
    author_name: str = "Unknown"
    point_x: Optional[float] = None
    point_y: Optional[float] = None


logger = logging.getLogger("router.dam")
router = APIRouter(prefix="/dam", tags=["Digital Asset Management"])

@router.get("/assets")
async def list_assets(
    project_id: Optional[str] = None,
    approval_status: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Search and filter the generated asset library."""
    query = select(GeneratedAsset).where(GeneratedAsset.is_deleted == False)
    
    if project_id:
        query = query.where(GeneratedAsset.project_id == project_id)
    if approval_status:
        query = query.where(GeneratedAsset.approval_status == approval_status)
    if is_favorite is not None:
        query = query.where(GeneratedAsset.is_favorite == is_favorite)
        
    query = query.order_by(desc(GeneratedAsset.created_at)).limit(limit)
    result = await db.execute(query)
    return [a.to_dict() for a in result.scalars().all()]

@router.post("/assets/{asset_id}/approve")
async def approve_asset(asset_id: str, status: ApprovalStatus, db: AsyncSession = Depends(get_db)):
    asset = await db.get(GeneratedAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.approval_status = status
    await db.commit()
    return asset.to_dict()

@router.post("/assets/{asset_id}/favorite")
async def toggle_favorite(asset_id: str, db: AsyncSession = Depends(get_db)):
    asset = await db.get(GeneratedAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.is_favorite = not asset.is_favorite
    await db.commit()
    return asset.to_dict()

@router.get("/assets/{asset_id}/lineage")
async def get_asset_lineage(asset_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch the full origin lineage of an asset."""
    asset = await db.get(GeneratedAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    lineage = {
        "asset": asset.to_dict(),
        "generation": None,
        "workflow": None,
        "project": None,
        "campaign": None,
        "brand": None
    }
    
    if asset.generation_id:
        gen = await db.get(Generation, asset.generation_id)
        if gen:
            lineage["generation"] = gen.to_dict()
            if gen.workflow_id:
                wf = await db.get(Workflow, gen.workflow_id)
                if wf:
                    lineage["workflow"] = wf.to_dict()
            if gen.project_id:
                proj = await db.get(Project, gen.project_id)
                if proj:
                    lineage["project"] = proj.to_dict()
                    if proj.campaign_id:
                        camp = await db.get(Campaign, proj.campaign_id)
                        if camp:
                            lineage["campaign"] = camp.to_dict()
                            if camp.brand_id:
                                brand = await db.get(Brand, camp.brand_id)
                                if brand:
                                    lineage["brand"] = brand.to_dict()
    return lineage

@router.get("/assets/{asset_id}/comments")
async def get_comments(asset_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AssetComment).where(AssetComment.asset_id == asset_id).order_by(AssetComment.created_at))
    return [c.to_dict() for c in result.scalars().all()]

@router.post("/assets/{asset_id}/comments")
async def add_comment(asset_id: str, data: CommentCreate, db: AsyncSession = Depends(get_db)):
    asset = await db.get(GeneratedAsset, asset_id)
    if not asset:
        raise HTTPException(status_code=404)
        
    comment = AssetComment(
        asset_id=asset_id,
        author_name=data.author_name,
        content=data.content,
        point_x=data.point_x,
        point_y=data.point_y
    )
    db.add(comment)
    await db.commit()
    
    # Broadcast to WebSockets
    from ..websocket.websocket_manager import manager as ws_manager
    await ws_manager.publish_event("asset_commented", {"asset_id": asset_id, "comment": comment.to_dict()})
    
    return comment.to_dict()
