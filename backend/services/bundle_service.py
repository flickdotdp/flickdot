import os
import json
import zipfile
import uuid
import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..config import settings
from ..models.workflow import Workflow, WorkflowVersion
from ..models.bundle import Bundle

logger = logging.getLogger("service.bundle")

class BundleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.exports_dir = Path(settings.DATA_DIR) / "bundles" / "exports"
        self.imports_dir = Path(settings.DATA_DIR) / "bundles" / "imports"
        
        self.exports_dir.mkdir(parents=True, exist_ok=True)
        self.imports_dir.mkdir(parents=True, exist_ok=True)

    async def export_bundle(self, workflow_id: str) -> str:
        """
        Exports a workflow and its latest version into a self-contained ZIP bundle.
        Returns the absolute path to the generated ZIP.
        """
        stmt = select(Workflow).where(Workflow.id == workflow_id)
        result = await self.db.execute(stmt)
        workflow = result.scalar_one_or_none()
        
        if not workflow:
            raise ValueError("Workflow not found")

        # Get latest version
        stmt = select(WorkflowVersion).where(WorkflowVersion.workflow_id == workflow_id).order_by(WorkflowVersion.version_number.desc())
        result = await self.db.execute(stmt)
        version = result.scalars().first()

        if not version:
            raise ValueError("Workflow has no versions to export")

        bundle_id = str(uuid.uuid4())
        safe_name = "".join(c if c.isalnum() else "_" for c in workflow.name)
        zip_filename = f"{safe_name}_{bundle_id[:8]}.zip"
        zip_path = self.exports_dir / zip_filename

        manifest = {
            "name": workflow.name,
            "version": "1.0.0",
            "author": workflow.author or "System",
            "description": workflow.description or "",
            "tags": workflow.tags or [],
            "required_assets": [] # To be parsed from ui_meta_json in advanced implementation
        }

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('bundle.json', json.dumps(manifest, indent=2))
            zf.writestr('workflow.json', json.dumps(version.comfyui_json, indent=2))
            zf.writestr('workflow.meta.json', json.dumps(version.ui_meta_json, indent=2))
            
            # If thumbnail exists, try to copy it
            if workflow.thumbnail_url:
                thumb_path = Path(workflow.thumbnail_url.replace('/thumbnails/', str(settings.THUMBNAIL_DIR) + '/'))
                if thumb_path.exists():
                    zf.write(thumb_path, 'thumbnail.png')
        
        logger.info(f"Exported bundle to {zip_path}")
        return str(zip_path)

    async def import_bundle(self, zip_path: str) -> Bundle:
        """
        Reads a ZIP bundle, creates a Bundle record, but does not install it into Workflows yet.
        """
        path = Path(zip_path)
        if not path.exists() or not zipfile.is_zipfile(path):
            raise ValueError("Invalid bundle file")

        bundle_id = str(uuid.uuid4())
        extract_dir = self.imports_dir / bundle_id
        extract_dir.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(path, 'r') as zf:
            zf.extractall(extract_dir)

        manifest_path = extract_dir / "bundle.json"
        if not manifest_path.exists():
            shutil.rmtree(extract_dir)
            raise ValueError("Missing bundle.json in package")

        with open(manifest_path, 'r') as f:
            manifest = json.load(f)

        bundle = Bundle(
            id=bundle_id,
            name=manifest.get("name", "Unknown Bundle"),
            version=manifest.get("version", "1.0.0"),
            author=manifest.get("author", "Unknown"),
            description=manifest.get("description", ""),
            tags=manifest.get("tags", []),
            required_assets=manifest.get("required_assets", []),
            file_path=str(path),
            is_installed=False
        )

        self.db.add(bundle)
        await self.db.commit()
        return bundle
