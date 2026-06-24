import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.creative import Brand, Campaign, Collection
from ..models.project import Project

logger = logging.getLogger("router.creative")
router = APIRouter(prefix="/creative", tags=["Creative Project Management"])

@router.get("/brands")
async def list_brands(db: AsyncSession = Depends(get_db)):
    """List all Brands."""
    result = await db.execute(select(Brand).where(Brand.is_deleted == False))
    return [b.to_dict() for b in result.scalars().all()]

@router.get("/brands/{brand_id}/campaigns")
async def list_campaigns(brand_id: str, db: AsyncSession = Depends(get_db)):
    """List all Campaigns for a Brand."""
    result = await db.execute(select(Campaign).where(Campaign.brand_id == brand_id, Campaign.is_deleted == False))
    return [c.to_dict() for c in result.scalars().all()]

@router.get("/campaigns/{campaign_id}/projects")
async def list_projects_for_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """List all Projects under a Campaign."""
    result = await db.execute(select(Project).where(Project.campaign_id == campaign_id, Project.is_deleted == False))
    return [p.to_dict() for p in result.scalars().all()]

@router.post("/brands")
async def create_brand(name: str, db: AsyncSession = Depends(get_db)):
    brand = Brand(name=name)
    db.add(brand)
    await db.commit()
    return brand.to_dict()

@router.post("/campaigns")
async def create_campaign(name: str, brand_id: str, db: AsyncSession = Depends(get_db)):
    camp = Campaign(name=name, brand_id=brand_id)
    db.add(camp)
    await db.commit()
    return camp.to_dict()
