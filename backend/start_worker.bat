@echo off
color 0D
title Local AI Platform - Generation Worker

echo ===================================================
echo ⚙️  Starting Generation Worker
echo ===================================================

if not exist "venv\" (
    color 0C
    echo ❌ ERROR: Virtual environment not found. Please run install_backend.bat first.
    pause
    exit /b 1
)

echo.
echo Activating Virtual Environment...
call venv\Scripts\activate.bat

echo.
echo Starting Worker Process...
cd ..
python -m backend.services.generation_worker

pause
