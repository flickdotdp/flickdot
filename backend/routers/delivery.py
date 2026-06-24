import logging
import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models.delivery import DeliverablePackage, ShareLink
from ..models.generated_asset import GeneratedAsset

logger = logging.getLogger("router.delivery")
router = APIRouter(prefix="/delivery", tags=["Delivery & Client Portal"])

@router.post("/packages")
async def create_package(name: str, asset_ids: List[str], db: AsyncSession = Depends(get_db)):
    """Create a new deliverable package bundled with assets."""
    package = DeliverablePackage(name=name, asset_ids=asset_ids)
    db.add(package)
    await db.commit()
    return package.to_dict()

@router.post("/links")
async def create_share_link(package_id: Optional[str] = None, asset_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Generate a secure magic link token for external clients."""
    if not package_id and not asset_id:
        raise HTTPException(status_code=400, detail="Must provide package_id or asset_id")
        
    token = secrets.token_urlsafe(32)
    link = ShareLink(token=token, package_id=package_id, asset_id=asset_id)
    db.add(link)
    await db.commit()
    return link.to_dict()

@router.get("/portal/{token}")
async def get_portal_content(token: str, db: AsyncSession = Depends(get_db)):
    """The main entrypoint for the Client Portal. Validates the token and returns the payload."""
    result = await db.execute(select(ShareLink).where(ShareLink.token == token))
    link = result.scalars().first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Invalid or expired secure link.")
        
    # Increment view count
    link.view_count += 1
    await db.commit()
    
    payload = {"link": link.to_dict(), "assets": [], "package": None}
    
    # Resolve Payload
    if link.package_id:
        pkg = await db.get(DeliverablePackage, link.package_id)
        if pkg:
            payload["package"] = pkg.to_dict()
            # Fetch all assets
            assets_result = await db.execute(select(GeneratedAsset).where(GeneratedAsset.id.in_(pkg.asset_ids)))
            payload["assets"] = [a.to_dict() for a in assets_result.scalars().all()]
            
    elif link.asset_id:
        asset = await db.get(GeneratedAsset, link.asset_id)
        if asset:
            payload["assets"] = [asset.to_dict()]
            
    return payload
