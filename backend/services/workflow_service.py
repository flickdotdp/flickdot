import os
import json
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..models.workflow import Workflow, WorkflowVersion
from ..config import settings

logger = logging.getLogger("service.workflow")

class WorkflowService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.workflows_dir = settings.BASE_DIR / "workflows"

    async def run_discovery(self):
        """
        Scans the workflows directory for .json files and .meta.json files.
        Registers any new workflows in the database automatically.
        """
        if not self.workflows_dir.exists():
            os.makedirs(self.workflows_dir, exist_ok=True)
            logger.info("Created workflows directory.")
            
        for filepath in self.workflows_dir.glob("*.json"):
            # Skip meta files during main loop, they are processed alongside their parent
            if filepath.name.endswith(".meta.json"):
                continue
                
            workflow_name = filepath.stem
            meta_filepath = self.workflows_dir / f"{workflow_name}.meta.json"
            
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    comfyui_json = json.load(f)
                    
                ui_meta_json = {}
                if meta_filepath.exists():
                    with open(meta_filepath, "r", encoding="utf-8") as f:
                        ui_meta_json = json.load(f)
                        
                await self._sync_workflow(workflow_name, comfyui_json, ui_meta_json)
                
            except Exception as e:
                logger.error(f"Failed to process workflow {filepath.name}: {e}")
                
        await self.session.commit()

    async def _sync_workflow(self, name: str, comfyui_json: dict, ui_meta_json: dict):
        """Ensure the workflow and its current version exist in the DB."""
        stmt = select(Workflow).where(Workflow.name == name)
        result = await self.session.execute(stmt)
        workflow = result.scalar_one_or_none()
        
        category = ui_meta_json.get("category", "General")
        description = ui_meta_json.get("description", f"Automatically discovered {name} workflow.")
        tags = ui_meta_json.get("tags", [])
        author = ui_meta_json.get("author", "System")
        
        if not workflow:
            logger.info(f"Discovered new workflow: {name}")
            workflow = Workflow(
                name=name,
                description=description,
                category=category,
                tags=tags,
                author=author
            )
            self.session.add(workflow)
            await self.session.flush() # Get ID
            
            # Create v1
            v1 = WorkflowVersion(
                workflow_id=workflow.id,
                version_number=1,
                comfyui_json=comfyui_json,
                ui_meta_json=ui_meta_json.get("parameters", {})
            )
            self.session.add(v1)
        else:
            # Check if we need a new version (simplified: check if JSONs are different)
            # In a robust system, we would compare hashes. Here we just assume discovery
            # only picks up initial drops, and the UI handles version bumps.
            pass
