@echo off
color 0A
title Local AI Platform - Backend Setup

echo ===================================================
echo 🛠️  Installing Backend Dependencies
echo ===================================================

echo.
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Python is not installed or not in PATH.
    echo Please install Python 3.10+ and try again.
    pause
    exit /b 1
)
echo ✓ Python found.

echo.
echo [2/4] Setting up Virtual Environment...
if not exist "venv\" (
    python -m venv venv
    echo ✓ Virtual environment created.
) else (
    echo ✓ Virtual environment already exists.
)

echo.
echo [3/4] Activating Virtual Environment and installing requirements...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    color 0C
    echo ❌ ERROR: Failed to install Python dependencies.
    pause
    exit /b 1
)
echo ✓ Dependencies installed.

echo.
echo [4/4] Setting up Environment Configuration...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo ✓ Copied .env.example to .env
    ) else (
        echo ⚠️ WARNING: .env.example not found. You must create a .env file manually.
    )
) else (
    echo ✓ .env file already exists.
)

echo.
echo ===================================================
echo ✨ Backend Installation Complete!
echo ===================================================
pause
