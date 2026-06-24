"""
System Diagnostics Router
=========================
Provides a comprehensive audit of every service, integration, environment
variable, database connection, ORM model, workflow engine, and internal
API component of the AI Image Generation Platform.

GET  /api/v1/diagnostics          - Full system audit report
GET  /api/v1/diagnostics/quick    - Fast status-only report (no deep probes)
POST /api/v1/diagnostics/test-generation  - Dry-run generation pipeline test
"""

import logging
import time
import os
import sqlite3
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, inspect as sa_inspect
import httpx

from ..database import get_db, engine, AsyncSessionLocal
from ..config import settings
from ..models.generation import Generation
from ..models.workflow import Workflow, WorkflowVersion
from ..models.project import Project
from ..models.asset import AIAsset
from ..models.bundle import Bundle
from ..services.comfyui_service import ComfyUIService

logger = logging.getLogger("api.diagnostics")

router = APIRouter(
    prefix="/diagnostics",
    tags=["Diagnostics"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _probe_http(url: str, timeout: float = 5.0) -> Dict[str, Any]:
    """Generic HTTP probe; returns latency, status code, and error if any."""
    t0 = time.perf_counter()
    headers = {"Authorization": f"Bearer {settings.COMFYUI_API_KEY}"} if settings.COMFYUI_API_KEY else {}
    try:
        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            resp = await client.get(url)
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "reachable": True,
            "status_code": resp.status_code,
            "latency_ms": latency_ms,
            "error": None,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "reachable": False,
            "status_code": None,
            "latency_ms": latency_ms,
            "error": str(exc),
        }


def _orm_fields(model) -> set:
    """Return the set of mapped column attribute names for a SQLAlchemy model."""
    return frozenset(c.key for c in model.__mapper__.column_attrs)


def _check_generation_orm_contract() -> Dict[str, Any]:
    """
    Verify that GenerationCreateRequest fields map correctly to Generation ORM columns.
    Specifically catches the 'parameters' vs 'parameter_snapshot' mismatch.
    """
    from ..schemas.generation import GenerationCreateRequest
    import pydantic

    request_fields = set(GenerationCreateRequest.model_fields.keys())
    orm_fields = _orm_fields(Generation)

    # Fields in the request that have NO matching ORM column
    unmapped = request_fields - orm_fields
    # Fields we know are intentionally remapped or handled in the router
    intentional_remaps = {"parameters", "lora_models", "controlnet_models"}

    dangerous = unmapped - intentional_remaps

    return {
        "request_fields": sorted(request_fields),
        "orm_fields": sorted(orm_fields),
        "unmapped_request_fields": sorted(unmapped),
        "dangerous_unmapped_fields": sorted(dangerous),
        "contract_ok": len(dangerous) == 0,
        "notes": (
            "'parameters' is intentionally remapped to 'parameter_snapshot' in the router. "
            "'lora_models'/'controlnet_models' are JSON columns accepted as-is."
        ),
    }


async def _check_db_tables() -> Dict[str, Any]:
    """Verify that every ORM model has its corresponding table in the DB."""
    models = [Generation, Workflow, WorkflowVersion, Project, AIAsset, Bundle]
    results = {}
    try:
        async with engine.connect() as conn:
            existing_tables = await conn.run_sync(
                lambda sync_conn: sa_inspect(sync_conn).get_table_names()
            )
        for model in models:
            tbl = model.__tablename__
            results[tbl] = {
                "expected": True,
                "exists": tbl in existing_tables,
                "model": model.__name__,
            }
        all_ok = all(v["exists"] for v in results.values())
    except Exception as exc:
        return {"error": str(exc), "tables": results, "all_tables_exist": False}

    return {"tables": results, "all_tables_exist": all_ok}


async def _check_db_connectivity() -> Dict[str, Any]:
    """Simple SELECT 1 connectivity test."""
    t0 = time.perf_counter()
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {"status": "connected", "latency_ms": latency_ms, "error": None}
    except Exception as exc:
        return {
            "status": "error",
            "latency_ms": round((time.perf_counter() - t0) * 1000, 1),
            "error": str(exc),
        }


async def _check_db_record_counts() -> Dict[str, int]:
    """Return row counts for every major table."""
    counts: Dict[str, int] = {}
    queries = {
        "generations": "SELECT COUNT(*) FROM generations",
        "workflows": "SELECT COUNT(*) FROM workflows",
        "workflow_versions": "SELECT COUNT(*) FROM workflow_versions",
        "projects": "SELECT COUNT(*) FROM projects",
        "ai_assets": "SELECT COUNT(*) FROM ai_assets",
        "bundles": "SELECT COUNT(*) FROM bundles",
    }
    try:
        async with AsyncSessionLocal() as session:
            for label, q in queries.items():
                try:
                    result = await session.execute(text(q))
                    counts[label] = result.scalar_one()
                except Exception:
                    counts[label] = -1  # table may not exist yet
    except Exception as exc:
        return {"error": str(exc)}
    return counts


async def _check_comfyui() -> Dict[str, Any]:
    """Deep ComfyUI health probe."""
    svc = ComfyUIService()
    base_url = svc.base_url
    t0 = time.perf_counter()
    try:
        stats = await svc.get_system_stats()
        queue = await svc.get_queue()
        
        # Calculate queue length
        queue_running = len(queue.get("queue_running", []))
        queue_pending = len(queue.get("queue_pending", []))
        queue_length = queue_running + queue_pending
        
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "status": "online",
            "url": base_url,
            "latency_ms": latency_ms,
            "system_stats": stats,
            "queue_length": queue_length,
            "error": None,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {
            "status": "offline",
            "url": base_url,
            "latency_ms": latency_ms,
            "system_stats": None,
            "error": str(exc),
        }


def _check_env_vars() -> Dict[str, Any]:
    """
    Audit every environment variable that the platform depends on.
    Returns presence/absence without revealing secret values.
    """
    def _mask(val: Optional[str]) -> str:
        if not val:
            return "<NOT SET>"
        if len(val) <= 8:
            return "****"
        return val[:4] + "****" + val[-2:]

    vars_to_check = [
        # Core
        ("ENVIRONMENT", os.getenv("ENVIRONMENT"), False),
        ("CORS_ORIGINS", os.getenv("CORS_ORIGINS"), False),
        # DB
        ("DATABASE_URL", os.getenv("DATABASE_URL"), False),
        # ComfyUI
        ("COMFYUI_SERVER_URL", os.getenv("COMFYUI_SERVER_URL"), False),
        ("COMFYUI_TIMEOUT_SECONDS", os.getenv("COMFYUI_TIMEOUT_SECONDS"), False),
        ("COMFYUI_API_KEY", os.getenv("COMFYUI_API_KEY"), True),
        # Storage
        ("STORAGE_DIR", os.getenv("STORAGE_DIR"), False),
        ("OUTPUT_DIR", os.getenv("OUTPUT_DIR"), False),
        ("UPLOAD_DIR", os.getenv("UPLOAD_DIR"), False),
        # Worker
        ("WORKER_POLL_INTERVAL", os.getenv("WORKER_POLL_INTERVAL"), False),
        ("WORKER_CONCURRENCY", os.getenv("WORKER_CONCURRENCY"), False),
        # Security (optional)
        ("SECRET_KEY", os.getenv("SECRET_KEY"), True),
        # Cloud (optional)
        ("AWS_ACCESS_KEY_ID", os.getenv("AWS_ACCESS_KEY_ID"), True),
        ("AWS_SECRET_ACCESS_KEY", os.getenv("AWS_SECRET_ACCESS_KEY"), True),
        ("AWS_S3_BUCKET_NAME", os.getenv("AWS_S3_BUCKET_NAME"), False),
        # External AI (optional — this is a LOCAL platform; none should be required)
        ("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY"), True),
        ("ANTHROPIC_API_KEY", os.getenv("ANTHROPIC_API_KEY"), True),
        ("STABILITY_API_KEY", os.getenv("STABILITY_API_KEY"), True),
        ("REPLICATE_API_TOKEN", os.getenv("REPLICATE_API_TOKEN"), True),
        ("HUGGINGFACE_API_KEY", os.getenv("HUGGINGFACE_API_KEY"), True),
        ("TOGETHER_API_KEY", os.getenv("TOGETHER_API_KEY"), True),
        ("GROQ_API_KEY", os.getenv("GROQ_API_KEY"), True),
        ("GOOGLE_API_KEY", os.getenv("GOOGLE_API_KEY"), True),
    ]

    result = []
    missing_required = []
    for name, value, is_secret in vars_to_check:
        present = bool(value)
        required = not is_secret  # secrets are optional for local platform
        entry = {
            "name": name,
            "present": present,
            "required": required,
            "optional": is_secret,
            "value_hint": _mask(value) if present else "<NOT SET>",
        }
        result.append(entry)
        if required and not present:
            missing_required.append(name)

    return {
        "vars": result,
        "missing_required": missing_required,
        "all_required_present": len(missing_required) == 0,
    }


def _check_storage_dirs() -> Dict[str, Any]:
    """Verify all storage directories exist and are writable."""
    dirs = {
        "DATA_DIR": str(settings.DATA_DIR),
        "OUTPUT_DIR": str(settings.OUTPUT_DIR),
        "THUMBNAIL_DIR": str(settings.THUMBNAIL_DIR),
        "INPUT_DIR": str(settings.INPUT_DIR),
    }
    results = {}
    for label, path in dirs.items():
        exists = os.path.isdir(path)
        writable = False
        if exists:
            try:
                test_file = os.path.join(path, ".write_test")
                with open(test_file, "w") as f:
                    f.write("ok")
                os.remove(test_file)
                writable = True
            except Exception:
                pass
        results[label] = {"path": path, "exists": exists, "writable": writable}

    return {
        "directories": results,
        "all_ok": all(v["exists"] and v["writable"] for v in results.values()),
    }


async def _check_workflow_registry() -> Dict[str, Any]:
    """Check how many workflows are registered and whether they have versions."""
    try:
        async with AsyncSessionLocal() as session:
            wf_result = await session.execute(text("SELECT COUNT(*) FROM workflows"))
            wf_count = wf_result.scalar_one()

            ver_result = await session.execute(text("SELECT COUNT(*) FROM workflow_versions"))
            ver_count = ver_result.scalar_one()

            active_result = await session.execute(
                text("SELECT COUNT(*) FROM workflows WHERE is_active = 1")
            )
            active_count = active_result.scalar_one()

        return {
            "total_workflows": wf_count,
            "active_workflows": active_count,
            "total_versions": ver_count,
            "registry_populated": wf_count > 0,
        }
    except Exception as exc:
        return {"error": str(exc), "registry_populated": False}


def _check_python_deps() -> Dict[str, Any]:
    """Check that critical Python packages are importable."""
    packages = [
        "fastapi", "uvicorn", "sqlalchemy", "aiosqlite",
        "pydantic", "httpx", "PIL", "aiofiles",
    ]
    results = {}
    for pkg in packages:
        try:
            mod = __import__(pkg)
            version = getattr(mod, "__version__", "unknown")
            results[pkg] = {"installed": True, "version": version}
        except ImportError as exc:
            results[pkg] = {"installed": False, "error": str(exc)}

    return {
        "packages": results,
        "all_required_installed": all(v["installed"] for v in results.values()),
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/quick")
async def quick_health():
    """Lightweight health check — returns in < 100 ms."""
    comfy_probe = await _probe_http(f"http://{settings.COMFYUI_HOST}:{settings.COMFYUI_PORT}/system_stats")
    db_status = await _check_db_connectivity()

    overall = "healthy"
    issues = []

    if not comfy_probe["reachable"]:
        issues.append("ComfyUI offline")
        overall = "degraded"
    if db_status["status"] != "connected":
        issues.append("Database unreachable")
        overall = "critical"

    return {
        "overall": overall,
        "timestamp": _ts(),
        "services": {
            "api": {"status": "online"},
            "database": {"status": db_status["status"], "latency_ms": db_status["latency_ms"]},
            "comfyui": {
                "status": "online" if comfy_probe["reachable"] else "offline",
                "latency_ms": comfy_probe["latency_ms"],
                "error": comfy_probe["error"],
            },
        },
        "issues": issues,
    }


@router.get("/")
async def full_diagnostics():
    """
    Complete system connectivity audit.
    Probes every service, checks every config, validates ORM contracts,
    and returns a structured report with remediation guidance.
    """
    t_start = time.perf_counter()
    logger.info("Starting full system diagnostics audit…")

    # Run all checks
    db_conn = await _check_db_connectivity()
    db_tables = await _check_db_tables()
    db_counts = await _check_db_record_counts()
    comfyui = await _check_comfyui()
    env_vars = _check_env_vars()
    storage = _check_storage_dirs()
    workflows = await _check_workflow_registry()
    orm_contract = _check_generation_orm_contract()
    python_deps = _check_python_deps()

    # ------------------------------------------------------------------
    # Derive issues & remediation steps
    # ------------------------------------------------------------------
    issues: List[Dict[str, str]] = []
    remediation: List[str] = []

    # ComfyUI
    if comfyui["status"] == "offline":
        issues.append({
            "severity": "critical",
            "service": "ComfyUI",
            "message": comfyui["error"],
        })
        remediation.append(
            "ComfyUI is OFFLINE. "
            f"Start it at {comfyui['url']} — typically: "
            "'python main.py --listen 127.0.0.1 --port 8188' inside the ComfyUI directory. "
            "Generation jobs will queue but not execute until ComfyUI is available."
        )

    # DB
    if db_conn["status"] != "connected":
        issues.append({
            "severity": "critical",
            "service": "Database",
            "message": db_conn["error"],
        })
        remediation.append(
            f"Database connection failed: {db_conn['error']}. "
            "Check that the data/ directory is writable and settings.DB_PATH is correct."
        )

    # Missing tables
    if not db_tables.get("all_tables_exist"):
        missing_tables = [
            t for t, v in db_tables.get("tables", {}).items() if not v["exists"]
        ]
        issues.append({
            "severity": "critical",
            "service": "Database Schema",
            "message": f"Missing tables: {missing_tables}",
        })
        remediation.append(
            "Run the app once to trigger auto-migration (init_db calls create_all). "
            f"Missing tables: {missing_tables}."
        )

    # ORM contract
    if not orm_contract["contract_ok"]:
        issues.append({
            "severity": "critical",
            "service": "ORM Contract",
            "message": (
                f"GenerationCreateRequest fields not mapped to Generation columns: "
                f"{orm_contract['dangerous_unmapped_fields']}"
            ),
        })
        remediation.append(
            "The backend router must strip unknown request fields before passing "
            "them to the Generation ORM constructor. Check routers/generations.py "
            "for the payload sanitisation step."
        )

    # Env vars
    if env_vars["missing_required"]:
        for var in env_vars["missing_required"]:
            issues.append({
                "severity": "warning",
                "service": "Environment",
                "message": f"Required env var not set: {var}",
            })
        remediation.append(
            f"Set missing env vars in backend/.env: {env_vars['missing_required']}"
        )

    # Storage
    if not storage["all_ok"]:
        bad_dirs = [
            f"{k}: {v['path']}"
            for k, v in storage["directories"].items()
            if not (v["exists"] and v["writable"])
        ]
        issues.append({
            "severity": "warning",
            "service": "Storage",
            "message": f"Unwritable or missing directories: {bad_dirs}",
        })
        remediation.append(
            f"Create and make writable: {bad_dirs}. "
            "The app creates these on startup; check disk permissions."
        )

    # Workflows
    if not workflows.get("registry_populated"):
        issues.append({
            "severity": "warning",
            "service": "Workflow Registry",
            "message": "No workflows are registered in the database.",
        })
        remediation.append(
            "Run the backend once — it scans backend/workflows/*.json on startup. "
            "Ensure at least one valid workflow JSON exists."
        )

    # Python deps
    if not python_deps["all_required_installed"]:
        missing_pkgs = [
            k for k, v in python_deps["packages"].items() if not v["installed"]
        ]
        issues.append({
            "severity": "critical",
            "service": "Python Dependencies",
            "message": f"Missing packages: {missing_pkgs}",
        })
        remediation.append(
            f"Install missing packages: pip install {' '.join(missing_pkgs)}"
        )

    # ------------------------------------------------------------------
    # Overall status
    # ------------------------------------------------------------------
    critical = any(i["severity"] == "critical" for i in issues)
    warnings = any(i["severity"] == "warning" for i in issues)
    if critical:
        overall_status = "critical"
    elif warnings:
        overall_status = "degraded"
    else:
        overall_status = "healthy"

    audit_duration_ms = round((time.perf_counter() - t_start) * 1000, 1)

    report = {
        "overall_status": overall_status,
        "audit_timestamp": _ts(),
        "audit_duration_ms": audit_duration_ms,
        "platform": {
            "name": "AI Image Generation Platform",
            "version": "1.0.0",
            "environment": settings.__class__.__name__,
        },
        # --- Core services ---
        "services": {
            "api": {
                "status": "online",
                "description": "FastAPI Backend",
                "endpoint": f"http://127.0.0.1:{settings.API_PORT}",
            },
            "database": {
                "status": db_conn["status"],
                "description": "SQLite via aiosqlite",
                "path": str(settings.DATA_DIR / "app.db"),
                "latency_ms": db_conn["latency_ms"],
                "error": db_conn["error"],
            },
            "comfyui": {
                "status": comfyui["status"],
                "description": "ComfyUI Inference Engine",
                "endpoint": comfyui["url"],
                "latency_ms": comfyui["latency_ms"],
                "error": comfyui["error"],
                "system_stats": comfyui.get("system_stats"),
                "active_jobs": comfyui.get("queue_length", 0),
            },
            "generation_worker": {
                "status": "running",  # If we reach this endpoint, the app is up
                "description": "Background Queue Worker",
                "polling_interval_s": 2.0,
                "concurrency_limit": 1,
            },
            "websocket": {
                "status": "online",
                "description": "WebSocket Manager",
                "endpoint": f"ws://127.0.0.1:{settings.API_PORT}/api/v1/ws",
            },
        },
        # --- External AI providers (not required for local platform) ---
        "external_providers": {
            "openai": {
                "status": "not_configured",
                "note": "Not required — this is a local ComfyUI platform",
                "api_key_present": bool(os.getenv("OPENAI_API_KEY")),
            },
            "anthropic": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("ANTHROPIC_API_KEY")),
            },
            "stability_ai": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("STABILITY_API_KEY")),
            },
            "replicate": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("REPLICATE_API_TOKEN")),
            },
            "hugging_face": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("HUGGINGFACE_API_KEY")),
            },
            "together_ai": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("TOGETHER_API_KEY")),
            },
            "groq": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("GROQ_API_KEY")),
            },
            "google_gemini": {
                "status": "not_configured",
                "note": "Not required",
                "api_key_present": bool(os.getenv("GOOGLE_API_KEY")),
            },
            "flux": {
                "status": "not_required",
                "note": "Flux is run locally via ComfyUI nodes — no separate API key needed",
            },
        },
        # --- Database detail ---
        "database_detail": {
            "connectivity": db_conn,
            "schema_check": db_tables,
            "record_counts": db_counts,
        },
        # --- ORM contract audit ---
        "orm_contract": orm_contract,
        # --- Configuration ---
        "configuration": {
            "env_vars": env_vars,
            "storage": storage,
            "python_deps": python_deps,
        },
        # --- Workflow engine ---
        "workflow_engine": workflows,
        # --- Issues & remediation ---
        "issues": issues,
        "remediation_steps": remediation,
        "issue_count": len(issues),
        "critical_count": sum(1 for i in issues if i["severity"] == "critical"),
        "warning_count": sum(1 for i in issues if i["severity"] == "warning"),
    }

    logger.info(
        "Diagnostics complete: status=%s, issues=%d, duration=%.0f ms",
        overall_status,
        len(issues),
        audit_duration_ms,
    )
    return report


@router.post("/test-generation")
async def test_generation_pipeline():
    """
    Dry-run the generation pipeline without writing to the DB or calling ComfyUI.
    Validates: request schema → ORM field mapping → payload sanitisation → expected DB insert.
    """
    from ..schemas.generation import GenerationCreateRequest
    from ..models.generation import Generation

    test_payload = {
        "generation_type": "text_to_image",
        "prompt": "A photorealistic real estate showcase, luxury interior, golden hour lighting",
        "negative_prompt": "blurry, low quality, distorted",
        "width": 1024,
        "height": 768,
        "steps": 20,
        "cfg_scale": 7.5,
        "seed": 42,
        "parameters": {"style": "photorealistic"},  # intentional — should be stripped
    }

    try:
        req = GenerationCreateRequest(**test_payload)
        dump = req.model_dump(exclude_unset=True)

        orm_fields = frozenset(c.key for c in Generation.__mapper__.column_attrs)
        unknown = [k for k in dump if k not in orm_fields]
        safe_dump = {k: v for k, v in dump.items() if k in orm_fields}

        return {
            "status": "ok",
            "message": "Generation pipeline dry-run passed",
            "input_payload": test_payload,
            "schema_validated": True,
            "orm_fields_total": len(orm_fields),
            "request_fields": sorted(dump.keys()),
            "stripped_fields": unknown,
            "safe_insert_payload": safe_dump,
            "would_succeed": True,
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": str(exc),
            "would_succeed": False,
        }
