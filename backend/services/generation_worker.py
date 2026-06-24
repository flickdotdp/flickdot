import asyncio
import logging
import time
import os
from io import BytesIO
from typing import Optional, Dict, Any
try:
    from PIL import Image
except ImportError:
    Image = None

import websockets
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from ..database import AsyncSessionLocal
from ..models.generation import GenerationStatus
from ..repositories.generation_repository import GenerationRepository
from ..schemas.common import ProgressUpdateMessage, WsEventType
from ..schemas.generation import GenerationCreateRequest
from .comfyui_service import ComfyUIService
from ..websocket.websocket_manager import manager as ws_manager
from .event_bus import EventBus
from ..models.event import EventCategory, EventSeverity
from ..models.generated_asset import GeneratedAsset, GeneratedAssetType
from ..config import settings

logger = logging.getLogger("worker.generation")

class GenerationWorker:
    """
    Central orchestration engine processing the background generation queue.
    Bridges the database, ComfyUI, and WebSockets.
    """

    def __init__(self, comfy_service: ComfyUIService, polling_interval: float = 2.0):
        self.comfy_service = comfy_service
        self.polling_interval = polling_interval
        self._is_running = False
        self._worker_task: Optional[asyncio.Task] = None
        
        # Concurrency limit for how many jobs are sent to ComfyUI simultaneously
        self.concurrency_limit = 1 
        self.active_jobs = 0

    async def start(self):
        """Start the background processing loop."""
        if self._is_running:
            return
            
        logger.info("Starting Generation Worker...")
        self._is_running = True
        
        # Recover orphaned jobs first
        await self.recover_orphaned_jobs()
        
        # Start main loop
        self._worker_task = asyncio.create_task(self._process_queue_loop())

    async def stop(self):
        """Gracefully stop the worker."""
        logger.info("Stopping Generation Worker...")
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Generation Worker stopped.")

    async def recover_orphaned_jobs(self):
        """Reset PROCESSING jobs back to QUEUED on startup if they aren't actively running in ComfyUI."""
        async with AsyncSessionLocal() as session:
            repo = GenerationRepository(session)
            queue = await repo.get_generation_queue()
            
            # Fetch active queue from ComfyUI to cross-reference
            try:
                comfy_queue = await self.comfy_service.get_queue()
                running_ids = []
                for q_type in ["queue_running", "queue_pending"]:
                    for item in comfy_queue.get(q_type, []):
                        running_ids.append(item[1]) # prompt_id is usually item[1] in the tuple
            except Exception as e:
                logger.warning(f"Could not fetch ComfyUI queue for recovery: {e}")
                running_ids = []

            recovered_count = 0
            for gen in queue:
                if gen.status in [
                    GenerationStatus.VALIDATING_WORKFLOW,
                    GenerationStatus.RESOLVING_MODELS,
                    GenerationStatus.LOADING_CHECKPOINTS,
                    GenerationStatus.CONNECTING,
                    GenerationStatus.EXECUTING
                ]:
                    if gen.comfyui_prompt_id not in running_ids:
                        await repo.update_generation_status(gen.id, GenerationStatus.QUEUED, "Recovered from orphaned processing state.")
                        recovered_count += 1
            
            if recovered_count > 0:
                logger.info(f"Recovered {recovered_count} orphaned jobs.")

    async def _process_queue_loop(self):
        """Continuous polling loop."""
        while self._is_running:
            try:
                if self.active_jobs < self.concurrency_limit:
                    await self._check_and_process_next_job()
            except Exception as e:
                logger.error(f"Error in worker loop: {e}", exc_info=True)
                
            # Yield control back to the event loop
            await asyncio.sleep(self.polling_interval)

    async def _check_and_process_next_job(self):
        """Find the next queued job and process it."""
        async with AsyncSessionLocal() as session:
            repo = GenerationRepository(session)
            queue = await repo.get_generation_queue()
            
            # Find the oldest QUEUED or RETRYING item
            next_job = next((job for job in queue if job.status in [GenerationStatus.QUEUED, GenerationStatus.RETRYING]), None)
            
            if not next_job:
                return

            self.active_jobs += 1
            # Mark as validating immediately to lock it
            await repo.update_generation_status(next_job.id, GenerationStatus.VALIDATING_WORKFLOW)
            
            # Create a separate task so the polling loop isn't blocked by the ComfyUI submission/wait
            asyncio.create_task(self._execute_job(next_job.id))

    async def _execute_job(self, generation_id: str):
        """Full lifecycle management for a single generation job."""
        start_time = time.time()
        prompt_id = None
        
        try:
            async with AsyncSessionLocal() as session:
                repo = GenerationRepository(session)
                gen = await repo.get_by_id(generation_id)
                if not gen:
                    return

                # State 1: VALIDATING_WORKFLOW
                await repo.update_generation_status(generation_id, GenerationStatus.VALIDATING_WORKFLOW)
                
                # State 2: RESOLVING_MODELS
                await repo.update_generation_status(generation_id, GenerationStatus.RESOLVING_MODELS)
                
                # State 3: CONNECTING
                await repo.update_generation_status(generation_id, GenerationStatus.CONNECTING)
                
                # Check System VRAM Availability (Intelligent Resource Management)
                try:
                    stats = await self.comfy_service.get_system_stats()
                    if stats and "devices" in stats.get("system", {}):
                        devices = stats["system"]["devices"]
                        for dev in devices:
                            if dev.get("vram_free", 0) < 1.5 * 1024 * 1024 * 1024:  # Require at least 1.5GB free
                                logger.warning(f"Low VRAM detected before execution: {dev.get('vram_free')} free")
                                # We proceed but log a warning. In a full system, we might requeue.
                except Exception as e:
                    logger.debug(f"Could not fetch VRAM stats before execution: {e}")

                # Submit to ComfyUI
                try:
                    if gen.compiled_workflow_json:
                        client_id = "fastapi_backend"
                        result = await self.comfy_service.queue_prompt(gen.compiled_workflow_json, client_id)
                        prompt_id = result.get("prompt_id")
                        if not prompt_id:
                            raise ValueError("ComfyUI did not return a valid prompt_id")
                    else:
                        request = GenerationCreateRequest.model_validate(gen, from_attributes=True)
                        # Optional: Here we could call validate_and_resolve_checkpoint
                        prompt_id = await self.comfy_service.submit_generation(request)
                        
                    await repo.assign_comfyui_prompt_id(generation_id, prompt_id)
                except Exception as e:
                    await repo.update_generation_status(generation_id, GenerationStatus.FAILED, f"Submission failed: {e}")
                    return

                # State 4: EXECUTING
                await repo.update_generation_status(generation_id, GenerationStatus.EXECUTING)
                await EventBus.emit(
                    event_type="generation_executing",
                    message=f"Generation {generation_id} started execution on ComfyUI.",
                    category=EventCategory.GENERATION,
                    generation_id=generation_id
                )

            # 2. Broadcast Start Event
            await ws_manager.publish_event(
                WsEventType.GENERATION_PROGRESS, 
                ProgressUpdateMessage(
                    generation_id=generation_id, 
                    comfyui_prompt_id=prompt_id, 
                    progress_percent=0.0, 
                    current_step=0, 
                    max_steps=gen.steps or 20
                ),
                target_type="generation",
                target_id=generation_id
            )

            # 3. Monitor Progress via WebSocket
            is_completed = False
            history_data = None
            timeout_seconds = settings.WORKER_STALE_JOB_TIMEOUT_MINUTES * 60
            client_id = "fastapi_backend"
            ws_url = f"{self.comfy_service.ws_url}?clientId={client_id}"
            
            try:
                async with websockets.connect(ws_url) as ws:
                    while self._is_running and not is_completed:
                        if time.time() - start_time > timeout_seconds:
                            raise TimeoutError(f"Job exceeded {settings.WORKER_STALE_JOB_TIMEOUT_MINUTES} minute timeout.")
                            
                        # Check DB for cancellation occasionally
                        if int(time.time()) % 5 == 0:
                            async with AsyncSessionLocal() as session:
                                repo = GenerationRepository(session)
                                current_gen = await repo.get_by_id(generation_id)
                                if current_gen and current_gen.status in [GenerationStatus.CANCELLED, GenerationStatus.FAILED]:
                                    return # Job was externally stopped
                        
                        try:
                            # Wait for message with short timeout to allow cancellation checks
                            msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                            if isinstance(msg, str):
                                data = json.loads(msg)
                                event_type = data.get("type")
                                event_data = data.get("data", {})
                                
                                # ComfyUI only sends events for the prompt if it matches our submission or we check prompt_id
                                if event_type == "progress":
                                    # {"type": "progress", "data": {"value": 1, "max": 20, "prompt_id": "..."}}
                                    if event_data.get("prompt_id") == prompt_id or not event_data.get("prompt_id"):
                                        val = event_data.get("value", 0)
                                        max_val = event_data.get("max", 20)
                                        pct = min(100.0, (val / max_val) * 100.0) if max_val > 0 else 0.0
                                        await ws_manager.publish_event(
                                            WsEventType.GENERATION_PROGRESS, 
                                            ProgressUpdateMessage(
                                                generation_id=generation_id, 
                                                comfyui_prompt_id=prompt_id, 
                                                progress_percent=pct, 
                                                current_step=val, 
                                                max_steps=max_val
                                            ),
                                            target_type="generation",
                                            target_id=generation_id
                                        )
                                        
                                        # Update current node tracking in DB/WebSocket
                                        await repo.update_generation_node(generation_id, event_data.get("node", "executing"))
                                        await ws_manager.publish_event(
                                            WsEventType.GENERATION_PROGRESS, 
                                            {"generation_id": generation_id, "current_node": event_data.get("node")},
                                            target_type="generation",
                                            target_id=generation_id
                                        )
                                
                                elif event_type == "executed":
                                    # {"type": "executed", "data": {"prompt_id": "...", "node": "...", "output": {...}}}
                                    if event_data.get("prompt_id") == prompt_id:
                                        # It's done, we can fetch history
                                        history_data = await self.comfy_service.get_history(prompt_id)
                                        if history_data:
                                            is_completed = True
                                            break
                                            
                                elif event_type == "execution_error":
                                    if event_data.get("prompt_id") == prompt_id:
                                        err_msg = event_data.get("exception_message", "Unknown execution error in ComfyUI")
                                        raise RuntimeError(f"ComfyUI Error: {err_msg}")
                                        
                                elif event_type == "execution_interrupted":
                                    if event_data.get("prompt_id") == prompt_id:
                                        raise RuntimeError("ComfyUI execution was interrupted.")
                                        
                        except asyncio.TimeoutError:
                            continue # Just loop to check timeout/cancellation
                            
            except Exception as ws_err:
                # Fallback to polling if websocket fails
                logger.warning(f"WebSocket tracking failed, falling back to polling: {ws_err}")
                while self._is_running and not is_completed:
                    if time.time() - start_time > timeout_seconds:
                        raise TimeoutError(f"Job exceeded {settings.WORKER_STALE_JOB_TIMEOUT_MINUTES} minute timeout.")

                    history_data = await self.comfy_service.get_history(prompt_id)
                    if history_data:
                        is_completed = True
                        break
                        
                    async with AsyncSessionLocal() as session:
                        repo = GenerationRepository(session)
                        current_gen = await repo.get_by_id(generation_id)
                        if current_gen and current_gen.status in [GenerationStatus.CANCELLED, GenerationStatus.FAILED]:
                            return
                            
                    await asyncio.sleep(2.0)

            # 4. Post-Processing & Validation
            if history_data:
                exec_time = time.time() - start_time
                async with AsyncSessionLocal() as session:
                    repo = GenerationRepository(session)
                    await repo.update_generation_status(generation_id, GenerationStatus.SAVING_OUTPUTS)
                
                await self._handle_successful_job(generation_id, prompt_id, history_data, exec_time)

        except Exception as e:
            logger.error(f"Job execution failed for {generation_id}: {e}", exc_info=True)
            async with AsyncSessionLocal() as session:
                repo = GenerationRepository(session)
                gen = await repo.get_by_id(generation_id)
                if gen and gen.retry_count < settings.WORKER_MAX_RETRIES:
                    await repo.update_generation_status(generation_id, GenerationStatus.RETRYING, str(e))
                    await EventBus.emit("generation_retrying", f"Generation {generation_id} failed, retrying.", EventCategory.GENERATION, EventSeverity.WARNING, generation_id=generation_id)
                else:
                    await repo.update_generation_status(generation_id, GenerationStatus.DEAD_LETTER, f"Dead Letter (Max Retries Exhausted): {str(e)}")
                    await EventBus.emit("generation_dead_letter", f"Generation {generation_id} moved to DLQ: {str(e)}", EventCategory.GENERATION, EventSeverity.ERROR, generation_id=generation_id)
                
            await ws_manager.publish_event(WsEventType.GENERATION_FAILED, {"generation_id": generation_id, "error": str(e)}, target_type="all")

        finally:
            self.active_jobs -= 1

    async def _handle_successful_job(self, generation_id: str, prompt_id: str, history_data: Dict[str, Any], exec_time: float):
        """Parse ComfyUI output, download/link images, and update DB."""
        try:
            # ComfyUI history format: outputs -> node_id -> { images: [{filename, subfolder, type}] }
            outputs = history_data.get("outputs", {})
            
            # Find the first output node that has images (e.g., SaveImage node)
            first_image_data = None
            for node_id, node_data in outputs.items():
                if "images" in node_data and len(node_data["images"]) > 0:
                    first_image_data = node_data["images"][0]
                    break
                    
            if not first_image_data:
                raise ValueError("No images found in ComfyUI output history.")

            filename = first_image_data.get("filename")
            subfolder = first_image_data.get("subfolder", "")
            
            # Download the image from ComfyUI
            image_bytes = await self.comfy_service.download_image(filename, subfolder)
            
            # Save original image locally
            local_filename = f"{generation_id}_{filename}"
            output_filepath = settings.OUTPUT_DIR / local_filename
            with open(output_filepath, "wb") as f:
                f.write(image_bytes)
                
            async with AsyncSessionLocal() as session:
                repo = GenerationRepository(session)
                await repo.update_generation_status(generation_id, GenerationStatus.PROCESSING_ASSETS)
                await EventBus.emit("generation_completed", f"Generation {generation_id} successfully completed and saved.", EventCategory.GENERATION, generation_id=generation_id)
                
                # Fetch gen to get project_id
                gen = await repo.get_by_id(generation_id)
                
                # Create GeneratedAsset entry
                asset = GeneratedAsset(
                    name=f"Generated Asset {generation_id[-6:]}",
                    file_path=str(local_filename),
                    asset_type=GeneratedAssetType.IMAGE if output_type == "image" else GeneratedAssetType.VIDEO,
                    generation_id=generation_id,
                    project_id=gen.project_id if gen else None,
                    workflow_id=gen.workflow_id if gen else None
                )
                session.add(asset)
                await session.commit()
                
            # Generate thumbnail
            thumb_filename = f"thumb_{local_filename}"
            thumb_filepath = settings.THUMBNAIL_DIR / thumb_filename
            
            if Image:
                try:
                    with Image.open(BytesIO(image_bytes)) as img:
                        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
                        if img.mode in ("RGBA", "P"):
                            img = img.convert("RGB")
                        # Compress to save bandwidth
                        img.save(thumb_filepath, format="JPEG", quality=75)
                except Exception as e:
                    logger.warning(f"Failed to generate thumbnail for {generation_id}: {e}")
                    with open(thumb_filepath, "wb") as f:
                        f.write(image_bytes)
            else:
                with open(thumb_filepath, "wb") as f:
                    f.write(image_bytes)

            output_path = f"/outputs/{local_filename}"
            thumbnail_path = f"/thumbnails/{thumb_filename}"

            async with AsyncSessionLocal() as session:
                repo = GenerationRepository(session)
                await repo.store_generation_result(generation_id, output_path, thumbnail_path, exec_time)
                gen = await repo.get_generation_with_project(generation_id)

            # Broadcast Success
            await ws_manager.publish_event(
                WsEventType.GENERATION_COMPLETED,
                {"generation_id": generation_id, "output_path": output_path},
                target_type="all"
            )
            
            # Broadcast Gallery/Project Update
            if gen and gen.project_id:
                await ws_manager.publish_event(WsEventType.QUEUE_UPDATE, {"project_id": gen.project_id}, target_type="project", target_id=gen.project_id)

        except Exception as e:
            logger.error(f"Post-processing failed for {generation_id}: {e}")
            async with AsyncSessionLocal() as session:
                repo = GenerationRepository(session)
                await repo.update_generation_status(generation_id, GenerationStatus.FAILED, f"Post-processing failed: {e}")
