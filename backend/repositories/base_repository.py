import logging
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Sequence
from sqlalchemy import select, update as sql_update, delete as sql_delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException

from ..models.base import BaseModel

# Define a generic type variable that is bound to our BaseModel
ModelType = TypeVar("ModelType", bound=BaseModel)

logger = logging.getLogger("repository")

class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository providing foundational async CRUD operations.
    Handles standard database access patterns, soft deletion logic, and common queries.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """
        Initialize with the specific SQLAlchemy model and an active AsyncSession.
        """
        self.model = model
        self.session = session

    async def create(self, obj_in: Dict[str, Any], commit: bool = True) -> ModelType:
        """Create a new record."""
        try:
            db_obj = self.model(**obj_in)
            self.session.add(db_obj)
            if commit:
                await self.session.commit()
                await self.session.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            logger.error(f"Error creating {self.model.__name__}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database insertion error.")

    async def get_by_id(self, id: str, include_deleted: bool = False) -> Optional[ModelType]:
        """Retrieve a record by UUID. Optionally include soft-deleted records."""
        query = select(self.model).where(self.model.id == id)
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        include_deleted: bool = False,
        sort_by: str = "created_at",
        sort_desc: bool = True
    ) -> Sequence[ModelType]:
        """Get all records with pagination, sorting, and soft-delete filtering."""
        query = select(self.model)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        # Sorting
        order_col = getattr(self.model, sort_by, self.model.created_at)
        if sort_desc:
            query = query.order_by(order_col.desc())
        else:
            query = query.order_by(order_col.asc())
            
        query = query.offset(skip).limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update(self, id: str, obj_in: Dict[str, Any], commit: bool = True) -> Optional[ModelType]:
        """Update an existing record dynamically."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return None
            
        try:
            for field, value in obj_in.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
                    
            if commit:
                await self.session.commit()
                await self.session.refresh(db_obj)
            return db_obj
        except SQLAlchemyError as e:
            logger.error(f"Error updating {self.model.__name__} {id}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database update error.")

    async def soft_delete(self, id: str, commit: bool = True) -> bool:
        """Mark a record as deleted without dropping from the table."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False
            
        try:
            db_obj.soft_delete() # Calls the helper on BaseModel
            if commit:
                await self.session.commit()
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error soft deleting {self.model.__name__} {id}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database deletion error.")

    async def restore(self, id: str, commit: bool = True) -> bool:
        """Restore a soft-deleted record."""
        # Must explicitly include deleted to find it
        db_obj = await self.get_by_id(id, include_deleted=True)
        if not db_obj or not db_obj.is_deleted:
            return False
            
        try:
            db_obj.is_deleted = False
            if commit:
                await self.session.commit()
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error restoring {self.model.__name__} {id}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database restore error.")

    async def delete(self, id: str, commit: bool = True) -> bool:
        """Permanently delete a record from the database (Hard Delete)."""
        db_obj = await self.get_by_id(id, include_deleted=True)
        if not db_obj:
            return False
            
        try:
            await self.session.delete(db_obj)
            if commit:
                await self.session.commit()
            return True
        except SQLAlchemyError as e:
            logger.error(f"Error hard deleting {self.model.__name__} {id}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database hard deletion error.")

    async def count(self, include_deleted: bool = False) -> int:
        """Count total records."""
        query = select(func.count(self.model.id))
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        result = await self.session.execute(query)
        return result.scalar_one()

    async def exists(self, id: str, include_deleted: bool = False) -> bool:
        """Check if a record exists by ID."""
        db_obj = await self.get_by_id(id, include_deleted)
        return db_obj is not None

    async def bulk_create(self, objs_in: List[Dict[str, Any]], commit: bool = True) -> List[ModelType]:
        """Insert multiple records efficiently."""
        try:
            db_objs = [self.model(**obj) for obj in objs_in]
            self.session.add_all(db_objs)
            if commit:
                await self.session.commit()
                # Note: refreshing multiple objects in async is complex, returning as-is
            return db_objs
        except SQLAlchemyError as e:
            logger.error(f"Error in bulk create for {self.model.__name__}: {e}")
            if commit:
                await self.session.rollback()
            raise HTTPException(status_code=500, detail="Database bulk insertion error.")
