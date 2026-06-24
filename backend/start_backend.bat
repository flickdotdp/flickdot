@echo off
color 0B
title Local AI Platform - FastAPI Server

echo ===================================================
echo 🚀 Starting FastAPI Server
echo ===================================================

if not exist "venv\" (
    color 0C
    echo ❌ ERROR: Virtual environment not found. Please run install_backend.bat first.
    pause
    exit /b 1
)

if not exist ".env" (
    color 0E
    echo ⚠️ WARNING: .env file missing. Using system defaults.
)

if not exist "data\" (
    mkdir data
    echo ✓ Created data directory for SQLite database.
)

echo.
echo Activating Virtual Environment...
call venv\Scripts\activate.bat

echo.
echo Starting Uvicorn...
cd ..
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

pause
