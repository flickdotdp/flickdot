@echo off
title Local AI Platform - Backend Services

echo Starting FastAPI Server...
start "FastAPI Server" cmd /c "start_backend.bat"

echo Waiting 3 seconds for database initialization...
timeout /t 3 /nobreak >nul

echo Starting Generation Worker...
start "Generation Worker" cmd /c "start_worker.bat"

echo Backend Services Started in separate windows.
