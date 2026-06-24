@echo off
color 0E
title Local AI Platform - Frontend Server

echo ===================================================
echo 🖥️  Starting Frontend Server
echo ===================================================

if not exist "node_modules\" (
    color 0C
    echo ❌ ERROR: node_modules not found. Please run install_frontend.bat first.
    pause
    exit /b 1
)

echo.
echo Starting Next.js...
call npm run dev -- -p 4001

pause
