@echo off
color 0A
title Local AI Platform - Master Launcher

echo ===================================================
echo 🌌 LOCAL AI IMAGE GENERATION PLATFORM
echo ===================================================

echo.
echo [1/5] Verifying ComfyUI Connection (Port 8188)...
curl -s http://127.0.0.1:8188 >nul
if %errorlevel% neq 0 (
    color 0E
    echo ⚠️ WARNING: ComfyUI is not reachable on port 8188.
    echo Please ensure ComfyUI is running before generating images.
    echo Press any key to continue startup anyway...
    pause >nul
) else (
    echo ✓ ComfyUI is online.
)

echo.
echo [2/5] Starting Backend Services (FastAPI + Worker)...
cd backend
start "FastAPI Server" cmd /c "start_backend.bat"
timeout /t 3 /nobreak >nul
start "Generation Worker" cmd /c "start_worker.bat"
cd ..
echo ✓ Backend services launched in separate windows.

echo.
echo [3/5] Waiting for API Health (Port 8000)...
:WAIT_API
curl -s http://127.0.0.1:8000/api/v1/health >nul
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto WAIT_API
)
echo ✓ API is responsive.

echo.
echo [4/5] Starting Frontend Server (Port 4001)...
cd frontend
start "Local AI Platform - Frontend Server" cmd /c "start_frontend.bat"
cd ..
echo ✓ Frontend launched.

echo.
echo [5/5] Waiting for Frontend Ready...
timeout /t 5 /nobreak >nul

echo.
echo ===================================================
echo ✨ Platform is running!
echo 🌐 Opening browser to http://localhost:4001
echo ===================================================
start http://localhost:4001

pause
