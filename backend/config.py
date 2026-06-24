from pydantic_settings import BaseSettings
from pydantic import Field
import os
from pathlib import Path

# Base directory of the project (backend folder)
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Local AI Image Generator API"
    VERSION: str = "1.0.0"
    API_PORT: int = 8000
    
    # ComfyUI Settings
    COMFYUI_HOST: str = Field(default="127.0.0.1", description="ComfyUI server host")
    COMFYUI_PORT: int = Field(default=8188, description="ComfyUI server port")
    COMFYUI_API_KEY: str | None = Field(default=None, description="ComfyUI API key (if required)")
    
    # Frontend Settings
    FRONTEND_URL: str = Field(default="http://localhost:4001", description="URL of the Next.js frontend")

    # Storage Paths
    DATA_DIR: Path = BASE_DIR / "data"
    OUTPUT_DIR: Path = DATA_DIR / "outputs"
    THUMBNAIL_DIR: Path = DATA_DIR / "thumbnails"
    INPUT_DIR: Path = DATA_DIR / "inputs"
    DB_PATH: str = "sqlite:///backend/data/app.db"

    # Worker Settings
    WORKER_STALE_JOB_TIMEOUT_MINUTES: int = Field(default=15, description="Timeout for dead jobs")

    class Config:
        env_file = ".env"

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
os.makedirs(settings.THUMBNAIL_DIR, exist_ok=True)
os.makedirs(settings.INPUT_DIR, exist_ok=True)
