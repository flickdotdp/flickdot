@echo off
color 0B
title Local AI Platform - Build Frontend

echo ===================================================
echo 🏗️  Building Frontend for Production
echo ===================================================

call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Frontend build failed.
    pause
    exit /b 1
)

echo.
echo ✓ Build complete.
pause
