import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..database import get_db
from ..models.agency import AgencyClient, Deal, Invoice
from ..models.generation import Generation

logger = logging.getLogger("router.agency")
router = APIRouter(prefix="/agency", tags=["Agency Operations"])

@router.get("/dashboard")
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    """Fetch aggregated business intelligence for the executive dashboard."""
    
    # Calculate MRR / Pipeline
    pipeline_result = await db.execute(select(func.sum(Deal.value)).where(Deal.stage != 'closed_lost'))
    pipeline_value = pipeline_result.scalar() or 0.0
    
    revenue_result = await db.execute(select(func.sum(Invoice.amount)).where(Invoice.status == 'paid'))
    total_revenue = revenue_result.scalar() or 0.0
    
    # Calculate AI Production Costs (Mock calculation based on generations)
    gens_result = await db.execute(select(func.count(Generation.id)))
    total_generations = gens_result.scalar() or 0
    # Assuming rough compute cost of $0.05 per generation
    gpu_compute_cost = total_generations * 0.05
    
    profitability = total_revenue - gpu_compute_cost
    margin = (profitability / total_revenue * 100) if total_revenue > 0 else 0.0
    
    return {
        "pipeline_value": pipeline_value,
        "total_revenue": total_revenue,
        "gpu_compute_cost": gpu_compute_cost,
        "profitability": profitability,
        "margin_percentage": round(margin, 2),
        "total_generations": total_generations
    }

@router.get("/clients")
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgencyClient))
    return [c.to_dict() for c in result.scalars().all()]

@router.post("/clients")
async def create_client(name: str, industry: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    client = AgencyClient(name=name, industry=industry)
    db.add(client)
    await db.commit()
    return client.to_dict()

@router.get("/deals")
async def list_deals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Deal))
    return [d.to_dict() for d in result.scalars().all()]

@router.post("/deals")
async def create_deal(client_id: str, name: str, value: float, db: AsyncSession = Depends(get_db)):
    deal = Deal(client_id=client_id, name=name, value=value)
    db.add(deal)
    await db.commit()
    return deal.to_dict()
