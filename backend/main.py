import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn
from logging.handlers import RotatingFileHandler
import time
from fastapi.staticfiles import StaticFiles

# Imports for initialization
from backend.config import settings
from backend.database import init_db, close_db
from backend.services.comfyui_service import ComfyUIService
from backend.services.generation_worker import GenerationWorker
from backend.services.workflow_registry import scan_and_register_workflows
from backend.websocket.websocket_manager import manager as ws_manager

from backend.routers import projects, generations, websocket, workflows, assets, bundles, compute, models, executions, operations, creative, dam, delivery, agency
from backend.routers.diagnostics import router as diagnostics_router

# Setup structured logging
log_dir = Path(__file__).resolve().parent / "logs"
os.makedirs(log_dir, exist_ok=True)

audit_handler = RotatingFileHandler(log_dir / "audit.log", maxBytes=5_000_000, backupCount=5)
audit_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))

logging.basicConfig(
    level=logging.INFO,
    handlers=[audit_handler, stream_handler]
)
logger = logging.getLogger("main")

# Global instances
comfy_service = ComfyUIService()
# Set polling_interval slightly higher for local dev to reduce CPU if desired
generation_worker = GenerationWorker(comfy_service=comfy_service, polling_interval=2.0)

def create_storage_dirs():
    """Ensure all required storage directories exist."""
    dirs = [settings.INPUT_DIR, settings.OUTPUT_DIR, settings.DATA_DIR]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        logger.info(f"Storage directory ensured: {d}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup Actions ---
    logger.info("Starting up Local AI Image Generator API...")
    create_storage_dirs()
    
    # 1. Initialize SQLite Database (creates tables if missing)
    await init_db()
    
    # 1.5 Scan and Register Workflows into DB
    try:
        await scan_and_register_workflows()
        logger.info("Successfully scanned and registered workflows.")
    except Exception as e:
        logger.error(f"Failed to register workflows: {e}", exc_info=True)
    
    # 2. Check ComfyUI Connectivity
    try:
        stats = await comfy_service.get_system_stats()
        logger.info("Successfully connected to ComfyUI instance.")
    except Exception as e:
        logger.warning(f"Failed to connect to ComfyUI on startup: {e}. Is it running at {settings.COMFYUI_HOST}:{settings.COMFYUI_PORT}?")
    
    # 3. Start Background Worker
    await generation_worker.start()
    
    yield
    
    # --- Shutdown Actions ---
    logger.info("Shutting down Local AI Image Generator API...")
    
    # 1. Stop Background Worker
    await generation_worker.stop()
    
    # 2. Clean up WebSockets (optional, disconnects all)
    # 3. Close Database Engine
    await close_db()

app = FastAPI(
    title="Local AI Image Generator API",
    description="Production-ready FastAPI backend for ComfyUI Image-to-Image Generation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allow all local development origins
CORS_ORIGINS = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:4001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4001",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register Routers
app.include_router(projects.router, prefix="/api/v1")
app.include_router(generations.router, prefix="/api/v1")
app.include_router(websocket.router, prefix="/api/v1")
app.include_router(workflows.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(bundles.router, prefix="/api/v1")
app.include_router(compute.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
app.include_router(executions.router, prefix="/api/v1")
app.include_router(operations.router, prefix="/api/v1")
app.include_router(creative.router, prefix="/api/v1")
app.include_router(dam.router, prefix="/api/v1")
app.include_router(delivery.router, prefix="/api/v1")
app.include_router(agency.router, prefix="/api/v1")
app.include_router(diagnostics_router, prefix="/api/v1")

# Mount Static Files for outputs and thumbnails
app.mount("/outputs", StaticFiles(directory=settings.OUTPUT_DIR), name="outputs")
app.mount("/thumbnails", StaticFiles(directory=settings.THUMBNAIL_DIR), name="thumbnails")

from collections import defaultdict
import asyncio

# Basic in-memory rate limiting dictionary: {ip: [timestamp1, timestamp2, ...]}
rate_limit_records = defaultdict(list)
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60 # seconds

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Clean up old records for this IP
    rate_limit_records[client_ip] = [t for t in rate_limit_records[client_ip] if now - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_records[client_ip]) >= RATE_LIMIT_REQUESTS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})
        
    rate_limit_records[client_ip].append(now)
    return await call_next(request)

# Audit Logging Middleware
# Audit Logging Middleware
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    # Unique trace ID for the request
    trace_id = os.urandom(8).hex()
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"AUDIT [{trace_id}]: {request.client.host if request.client else 'local'} - {request.method} {request.url.path} - Status: {response.status_code} - Duration: {process_time:.3f}s")
        response.headers["X-Trace-Id"] = trace_id
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"AUDIT [{trace_id}]: {request.client.host if request.client else 'local'} - {request.method} {request.url.path} - FAILED: {str(e)} - Duration: {process_time:.3f}s")
        raise

# Global Exception Handler - logs full stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "message": str(exc), "path": str(request.url.path)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Endpoints
@app.get("/", tags=["System"])
async def root():
    """Root endpoint for basic status."""
    return {
        "name": app.title,
        "version": app.version,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/v1/system/health", tags=["System"])
async def system_health():
    """Comprehensive system health including worker and ComfyUI status."""
    comfy_status = "offline"
    failure_reason = None
    response_time_ms = 0.0
    endpoint_url = f"http://{settings.COMFYUI_HOST}:{settings.COMFYUI_PORT}"
    
    try:
        start_time = time.time()
        await comfy_service.get_system_stats()
        response_time_ms = round((time.time() - start_time) * 1000, 2)
        comfy_status = "online"
    except Exception as e:
        response_time_ms = round((time.time() - start_time) * 1000, 2)
        failure_reason = str(e)
        
    return {
        "status": "healthy",
        "api_version": app.version,
        "comfyui": comfy_status,
        "comfyui_endpoint": endpoint_url,
        "comfyui_response_time_ms": response_time_ms,
        "comfyui_error": failure_reason,
        "worker": {
            "is_running": generation_worker._is_running,
            "active_jobs": generation_worker.active_jobs,
            "concurrency_limit": generation_worker.concurrency_limit
        },
        "websocket": ws_manager.get_stats()
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
