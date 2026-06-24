@echo off
color 0A
title Local AI Platform - Frontend Setup

echo ===================================================
echo 🛠️  Installing Frontend Dependencies
echo ===================================================

echo.
echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ and try again.
    pause
    exit /b 1
)
echo ✓ Node.js found.

echo.
echo [2/3] Installing NPM packages...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Failed to install NPM dependencies.
    pause
    exit /b 1
)
echo ✓ Dependencies installed.

echo.
echo [3/3] Setting up Environment Configuration...
if not exist ".env.local" (
    if exist ".env.example" (
        copy .env.example .env.local >nul
        echo ✓ Copied .env.example to .env.local
    ) else (
        echo ⚠️ WARNING: .env.example not found. You must create .env.local manually.
    )
) else (
    echo ✓ .env.local file already exists.
)

echo.
echo ===================================================
echo ✨ Frontend Installation Complete!
echo ===================================================
pause
