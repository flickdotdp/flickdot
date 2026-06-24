import os
import hashlib
import logging
import uuid
from typing import List, Dict, Any
from pathlib import Path
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from ..config import settings
from ..models.asset import AIAsset, AssetType

logger = logging.getLogger("service.assets")

class AssetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        # Base models path configured via settings, fallback to standard ComfyUI paths if missing
        self.models_dir = Path(getattr(settings, 'COMFYUI_MODELS_DIR', "comfyui/models"))
        
        self.directory_mapping = {
            "checkpoints": AssetType.CHECKPOINT,
            "loras": AssetType.LORA,
            "vae": AssetType.VAE,
            "embeddings": AssetType.EMBEDDING,
            "upscale_models": AssetType.UPSCALER
        }

    async def get_all_assets(self, asset_type: AssetType = None) -> List[AIAsset]:
        stmt = select(AIAsset)
        if asset_type:
            stmt = stmt.where(AIAsset.asset_type == asset_type)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    def _hash_file_fast(self, filepath: Path) -> str:
        """
        Hashes only the first 1MB of a file to provide a fast unique identifier.
        Hashing a 6GB safetensors file completely is too slow for routine scanning.
        """
        hasher = hashlib.sha256()
        try:
            with open(filepath, 'rb') as f:
                # Read first 1MB
                chunk = f.read(1024 * 1024)
                hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            logger.error(f"Failed to hash {filepath}: {e}")
            return ""

    def _infer_tags_from_path(self, filepath: Path) -> List[str]:
        """
        Infer compatibility tags (e.g. SDXL, SD1.5) based on subfolder naming.
        """
        tags = []
        path_str = str(filepath).lower()
        if "sdxl" in path_str:
            tags.append("SDXL")
        elif "sd15" in path_str or "sd1.5" in path_str:
            tags.append("SD1.5")
        elif "flux" in path_str:
            tags.append("Flux")
        return tags

    async def scan_and_refresh(self) -> Dict[str, Any]:
        """
        Walks the ComfyUI models directory, hashes new files, and syncs them to the SQLite DB.
        """
        logger.info(f"Starting asset scan in {self.models_dir}")
        if not self.models_dir.exists():
            logger.warning(f"Models directory not found: {self.models_dir}")
            return {"added": 0, "updated": 0, "removed": 0, "error": "Models directory not found"}

        current_files = set()
        added = 0
        updated = 0

        # Fetch all existing assets to cross-reference
        existing_assets = {asset.file_path: asset for asset in await self.get_all_assets()}

        for dir_name, asset_type in self.directory_mapping.items():
            target_dir = self.models_dir / dir_name
            if not target_dir.exists():
                continue

            for root, _, files in os.walk(target_dir):
                for file in files:
                    if file.startswith('.') or not file.endswith(('.safetensors', '.ckpt', '.pt')):
                        continue

                    filepath = Path(root) / file
                    file_path_str = str(filepath)
                    current_files.add(file_path_str)

                    # Get basic stats
                    try:
                        stat = filepath.stat()
                        size_bytes = stat.st_size
                    except Exception:
                        size_bytes = 0

                    existing_asset = existing_assets.get(file_path_str)

                    if not existing_asset:
                        # New asset
                        file_hash = self._hash_file_fast(filepath)
                        tags = self._infer_tags_from_path(filepath)
                        
                        new_asset = AIAsset(
                            id=str(uuid.uuid4()),
                            name=file, # Default name is filename, UI can edit later
                            filename=file,
                            file_path=file_path_str,
                            asset_type=asset_type,
                            file_hash=file_hash,
                            file_size_bytes=size_bytes,
                            compatibility_tags=tags,
                            last_scanned_at=datetime.utcnow()
                        )
                        self.db.add(new_asset)
                        added += 1
                    else:
                        # Existing asset - check if size changed (fast check instead of re-hashing)
                        if existing_asset.file_size_bytes != size_bytes:
                            existing_asset.file_size_bytes = size_bytes
                            existing_asset.file_hash = self._hash_file_fast(filepath)
                            updated += 1
                        existing_asset.last_scanned_at = datetime.utcnow()

        # Mark removed assets
        removed = 0
        for path_str, asset in existing_assets.items():
            if path_str not in current_files:
                await self.db.delete(asset)
                removed += 1

        await self.db.commit()
        logger.info(f"Scan complete. Added: {added}, Updated: {updated}, Removed: {removed}")
        return {"added": added, "updated": updated, "removed": removed}
