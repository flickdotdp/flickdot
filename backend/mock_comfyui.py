"""
Mock ComfyUI Server
===================
A fully-functional mock of the ComfyUI REST API for local development and
integration testing. Simulates queue submission, background processing,
progress tracking, and returns a real PNG image the pipeline can download.

Run:  python backend/mock_comfyui.py
      python -m backend.mock_comfyui
"""
import uuid
import time
import asyncio
import struct
import zlib
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Mock ComfyUI", version="0.4.0-mock")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory state ─────────────────────────────────────────────────────────
history_db: Dict[str, Any] = {}
queue_db: Dict[str, List] = {"queue_running": [], "queue_pending": []}
progress_db: Dict[str, float] = {}   # prompt_id → 0.0-100.0
_start_time = time.time()


# ── Helper: create a real 512x512 gradient PNG ───────────────────────────────
def _make_gradient_png(width: int = 512, height: int = 512) -> bytes:
    """
    Generate an actual PNG (not a placeholder 1x1) so the frontend can render it.
    Creates a blue-to-purple diagonal gradient that clearly looks like output.
    """
    def _pack_chunk(chunk_type: bytes, data: bytes) -> bytes:
        length = struct.pack("!I", len(data))
        crc = struct.pack("!I", zlib.crc32(chunk_type + data) & 0xFFFFFFFF)
        return length + chunk_type + data + crc

    # IHDR: width, height, bit depth 8, colour type 2 (RGB)
    ihdr_data = struct.pack("!IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = _pack_chunk(b"IHDR", ihdr_data)

    # Image data: RGB scanlines with a blue-to-purple diagonal gradient
    raw_rows = []
    for y in range(height):
        row = bytearray([0])   # filter byte = None
        for x in range(width):
            t = (x + y) / (width + height)
            r = int(20 + t * 80)
            g = int(10 + t * 20)
            b = int(200 - t * 80)
            row += bytes([r, g, b])
        raw_rows.append(bytes(row))

    raw_data = b"".join(raw_rows)
    compressed = zlib.compress(raw_data, level=1)
    idat = _pack_chunk(b"IDAT", compressed)

    iend = _pack_chunk(b"IEND", b"")

    signature = b"\x89PNG\r\n\x1a\n"
    return signature + ihdr + idat + iend


_GRADIENT_PNG = _make_gradient_png(512, 512)


# ── Background processing simulation ─────────────────────────────────────────
async def _process_prompt(prompt_id: str, delay: float = 6.0):
    """Simulate ComfyUI running a generation with incremental progress."""
    steps = 20
    progress_db[prompt_id] = 0.0

    for step in range(steps):
        await asyncio.sleep(delay / steps)
        progress_db[prompt_id] = round((step + 1) / steps * 100, 1)

    # Move from running queue to history
    queue_db["queue_running"] = [
        job for job in queue_db["queue_running"] if job[0] != prompt_id
    ]
    progress_db[prompt_id] = 100.0

    history_db[prompt_id] = {
        "outputs": {
            "9": {
                "images": [
                    {
                        "filename": f"mock_{prompt_id[:8]}.png",
                        "subfolder": "",
                        "type": "output",
                    }
                ]
            }
        },
        "status": {"status_str": "success", "completed": True},
        "meta": {"prompt_id": prompt_id},
    }


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/system_stats")
async def get_system_stats():
    """ComfyUI system stats — used by the health check."""
    uptime = round(time.time() - _start_time)
    return {
        "system": {
            "os": "Windows",
            "python_version": "3.11.0 (mock)",
            "embedded_python": False,
            "comfyui_version": "0.4.0-dev (mock)",
            "pytorch_version": "2.3.0+cu121 (mock)",
            "ram_total": 34_359_738_368,
            "ram_free": 20_000_000_000,
            "vram_total": 24_000_000_000,
            "vram_free": 18_000_000_000,
            "uptime_seconds": uptime,
        },
        "devices": [
            {
                "name": "NVIDIA RTX 4090 (mock)",
                "type": "cuda",
                "index": 0,
                "vram_total": 24_000_000_000,
                "vram_free": 18_000_000_000,
                "torch_vram_total": 24_000_000_000,
                "torch_vram_free": 16_000_000_000,
            }
        ],
    }


@app.get("/object_info")
async def get_object_info():
    """Returns node/model info."""
    return {
        "CheckpointLoaderSimple": {
            "input": {
                "required": {
                    "ckpt_name": [
                        ["v1-5-pruned-emaonly.safetensors", "dreamshaper_8.safetensors"]
                    ]
                }
            }
        },
        "KSampler": {
            "input": {
                "required": {
                    "seed": ["INT", {"default": 0}],
                    "steps": ["INT", {"default": 20}],
                    "cfg": ["FLOAT", {"default": 7.0}],
                    "sampler_name": [["euler", "euler_ancestral", "dpmpp_2m"]],
                    "scheduler": [["normal", "karras", "exponential"]],
                    "denoise": ["FLOAT", {"default": 1.0}],
                }
            }
        },
    }


class PromptRequest(BaseModel):
    prompt: dict
    client_id: Optional[str] = None


@app.post("/prompt")
async def queue_prompt(req: PromptRequest):
    """Queue a generation prompt and start background processing."""
    prompt_id = str(uuid.uuid4())
    queue_db["queue_running"].append([prompt_id, req.prompt or {}])
    asyncio.create_task(_process_prompt(prompt_id))
    return {"prompt_id": prompt_id, "number": len(queue_db["queue_running"])}


@app.post("/interrupt")
async def interrupt():
    return {"success": True}


@app.get("/queue")
async def get_queue():
    return queue_db


@app.get("/history/{prompt_id}")
async def get_history(prompt_id: str):
    if prompt_id in history_db:
        return {prompt_id: history_db[prompt_id]}
    return {}


@app.get("/history")
async def get_all_history(max_items: int = Query(default=10)):
    return dict(list(history_db.items())[-max_items:])


@app.get("/progress/{prompt_id}")
async def get_progress(prompt_id: str):
    """Non-standard but useful: per-prompt progress percentage."""
    return {
        "prompt_id": prompt_id,
        "progress": progress_db.get(prompt_id, 0.0),
        "completed": prompt_id in history_db,
    }


@app.get("/view")
async def view_image(
    filename: str = Query(...),
    subfolder: str = Query(default=""),
    type: str = Query(default="output"),
):
    """
    Return the generated image.
    All mock generations return the same 512x512 blue-purple gradient PNG.
    """
    return Response(content=_GRADIENT_PNG, media_type="image/png")


@app.get("/models/checkpoints")
async def list_checkpoints():
    return ["v1-5-pruned-emaonly.safetensors", "dreamshaper_8.safetensors", "SDXL-base-1.0.safetensors"]


@app.get("/models/loras")
async def list_loras():
    return []


@app.get("/models/vae")
async def list_vaes():
    return ["vae-ft-mse-840000-ema-pruned.safetensors"]


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8188, log_level="info")
