from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Integer, Float, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from .base import BaseModel

class AgencyClient(BaseModel):
    """An external organization or brand in the CRM."""
    __tablename__ = "agency_clients"
    
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active") # active, lead, churned
    total_revenue: Mapped[float] = mapped_column(Float, default=0.0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "industry": self.industry,
            "status": self.status,
            "total_revenue": self.total_revenue,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Deal(BaseModel):
    """A sales pipeline opportunity for an AI production project."""
    __tablename__ = "agency_deals"
    
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("agency_clients.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float] = mapped_column(Float, default=0.0)
    stage: Mapped[str] = mapped_column(String(50), default="prospecting") # prospecting, proposal, negotiation, closed_won, closed_lost
    probability: Mapped[int] = mapped_column(Integer, default=50) # 0-100%

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "name": self.name,
            "value": self.value,
            "stage": self.stage,
            "probability": self.probability,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Invoice(BaseModel):
    """Financial tracking tying revenue to client campaigns."""
    __tablename__ = "agency_invoices"
    
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("agency_clients.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft") # draft, sent, paid, overdue
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "project_id": self.project_id,
            "amount": self.amount,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
