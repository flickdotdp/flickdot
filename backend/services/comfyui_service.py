import logging
import json
import asyncio
from typing import Any, Dict, List, Optional
import httpx
from pathlib import Path

from ..config import settings
from ..schemas.generation import GenerationCreateRequest

logger = logging.getLogger("service.comfyui")

class ComfyUIService:
    """
    Primary integration layer between FastAPI and the local ComfyUI instance.
    Handles REST API requests, workflow injection, and queue management.
    """

    def __init__(self):
        self.host = settings.COMFYUI_HOST
        self.port = settings.COMFYUI_PORT
        self.base_url = f"http://{self.host}:{self.port}"
        self.ws_url = f"ws://{self.host}:{self.port}/ws"
        self.timeout = httpx.Timeout(10.0, connect=5.0)
        self.headers = {"Authorization": f"Bearer {settings.COMFYUI_API_KEY}"} if settings.COMFYUI_API_KEY else {}

    # -------------------------------------------------------------------------
    # System & Health
    # -------------------------------------------------------------------------

    async def get_system_stats(self) -> Dict[str, Any]:
        """Fetch system stats to verify ComfyUI is online."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                response = await client.get(f"{self.base_url}/system_stats")
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                logger.error(f"Failed to connect to ComfyUI: {e}")
                raise ConnectionError(f"ComfyUI connection failed: {e}")

    async def get_object_info(self) -> Dict[str, Any]:
        """Fetch node and model information from ComfyUI."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.get(f"{self.base_url}/object_info")
            response.raise_for_status()
            return response.json()

    async def get_models(self, model_type: str) -> List[str]:
        """Fetch list of available models for a specific type (e.g. 'checkpoints', 'loras', 'vae')."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            try:
                response = await client.get(f"{self.base_url}/models/{model_type}")
                if response.status_code == 200:
                    return response.json()
                return []
            except Exception as e:
                logger.warning(f"Could not fetch models for {model_type}: {e}")
                return []

    async def validate_and_resolve_checkpoint(self, requested_model: Optional[str]) -> str:
        """
        Validates if the requested model exists. If not, falls back to a default.
        Raises ValueError if no models are available at all.
        """
        available_checkpoints = await self.get_models("checkpoints")
        if not available_checkpoints:
            # Fallback for systems that don't have the custom /models endpoint
            # We can't strictly validate, so we trust the input or return a safe default.
            return requested_model or "v1-5-pruned-emaonly.safetensors"
            
        if requested_model and requested_model in available_checkpoints:
            return requested_model
            
        # Fallback logic
        default_model = "v1-5-pruned-emaonly.safetensors"
        if default_model in available_checkpoints:
            return default_model
            
        # Absolute fallback to whatever is first
        return available_checkpoints[0]

    # -------------------------------------------------------------------------
    # Workflow Processing
    # -------------------------------------------------------------------------

    def load_workflow_template(self, workflow_name: str) -> Dict[str, Any]:
        """Load a JSON workflow template from the backend/workflows directory."""
        workflow_path = settings.BASE_DIR / "workflows" / f"{workflow_name}.json"
        if not workflow_path.exists():
            # Fallback to a default if the specific one doesn't exist
            workflow_path = settings.BASE_DIR / "workflows" / "default_txt2img.json"
            
        with open(workflow_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def inject_parameters(self, workflow: Dict[str, Any], request: GenerationCreateRequest) -> Dict[str, Any]:
        """
        Dynamically modify the workflow JSON nodes based on the request.
        Note: This assumes standard naming conventions in the workflow JSON.
        In a production environment, nodes should be identified by title or specific class_type mapping.
        """
        # Iterate over nodes to find specific types
        for node_id, node in workflow.items():
            class_type = node.get("class_type", "")
            inputs = node.get("inputs", {})

            # 1. KSampler Injection
            if class_type == "KSampler":
                if request.seed is not None:
                    inputs["seed"] = request.seed
                if request.steps is not None:
                    inputs["steps"] = request.steps
                if request.cfg_scale is not None:
                    inputs["cfg"] = request.cfg_scale
                if request.sampler is not None:
                    inputs["sampler_name"] = request.sampler
                if request.scheduler is not None:
                    inputs["scheduler"] = request.scheduler
                if request.denoise_strength is not None:
                    inputs["denoise"] = request.denoise_strength

            # 2. CLIPTextEncode Injection (Positive/Negative)
            elif class_type == "CLIPTextEncode":
                # A heuristic: if it contains 'positive' in title or similar, else we usually rely on specific ID maps
                title = node.get("_meta", {}).get("title", "").lower()
                if "negative" in title:
                    inputs["text"] = request.negative_prompt or ""
                elif "positive" in title or "prompt" in title:
                    inputs["text"] = request.prompt

            # 3. Checkpoint Loader
            elif class_type == "CheckpointLoaderSimple":
                if request.model_name:
                    inputs["ckpt_name"] = request.model_name

            # 4. EmptyLatentImage (Resolution & Batch)
            elif class_type == "EmptyLatentImage":
                if request.width:
                    inputs["width"] = request.width
                if request.height:
                    inputs["height"] = request.height
                if request.batch_size:
                    inputs["batch_size"] = request.batch_size
                    
            # 5. LoadImage (For Image-to-Image / Inpainting)
            elif class_type == "LoadImage" and request.source_image_path:
                inputs["image"] = request.source_image_path

        # [FUTURE INTEGRATION] LoRA and ControlNet node chain injection would happen here.
        # This requires dynamically adding nodes to the JSON dictionary and relinking the inputs.
        
        return workflow

    # -------------------------------------------------------------------------
    # Queue Management & REST Commands
    # -------------------------------------------------------------------------

    async def queue_prompt(self, workflow_prompt: Dict[str, Any], client_id: Optional[str] = None) -> Dict[str, Any]:
        """Submit the injected workflow to ComfyUI for generation."""
        payload = {"prompt": workflow_prompt}
        if client_id:
            payload["client_id"] = client_id
            
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.post(f"{self.base_url}/prompt", json=payload)
            response.raise_for_status()
            return response.json() # Returns {"prompt_id": "uuid", "number": queue_pos}

    async def interrupt_execution(self) -> bool:
        """Interrupt the currently processing generation."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.post(f"{self.base_url}/interrupt")
            return response.status_code == 200

    async def get_queue(self) -> Dict[str, Any]:
        """Get pending and running jobs from ComfyUI."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.get(f"{self.base_url}/queue")
            response.raise_for_status()
            return response.json()

    async def get_history(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Fetch execution history for a specific prompt_id."""
        async with httpx.AsyncClient(timeout=self.timeout, headers=self.headers) as client:
            response = await client.get(f"{self.base_url}/history/{prompt_id}")
            if response.status_code == 200:
                data = response.json()
                return data.get(prompt_id)
            return None

    # -------------------------------------------------------------------------
    # File Management
    # -------------------------------------------------------------------------

    async def download_image(self, filename: str, subfolder: str = "", folder_type: str = "output") -> bytes:
        """Download an output image directly from the ComfyUI server."""
        params = {"filename": filename, "subfolder": subfolder, "type": folder_type}
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0), headers=self.headers) as client:
            response = await client.get(f"{self.base_url}/view", params=params)
            response.raise_for_status()
            return response.content

    # -------------------------------------------------------------------------
    # Lifecycle Orchestration
    # -------------------------------------------------------------------------

    async def submit_generation(self, request: GenerationCreateRequest) -> str:
        """
        High-level orchestrator: loads template, injects params, and submits to ComfyUI.
        Returns the ComfyUI prompt_id.
        """
        try:
            workflow = self.load_workflow_template(request.workflow_name or "default")
            injected = self.inject_parameters(workflow, request)
            
            # Using a custom client_id helps filter websocket events later
            client_id = "fastapi_backend"
            result = await self.queue_prompt(injected, client_id)
            
            prompt_id = result.get("prompt_id")
            if not prompt_id:
                raise ValueError("ComfyUI did not return a valid prompt_id")
                
            return prompt_id
        except Exception as e:
            logger.error(f"Failed to submit generation to ComfyUI: {e}")
            raise
