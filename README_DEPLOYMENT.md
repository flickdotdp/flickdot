# 🚀 Local AI Image Generation Platform Deployment Guide

This guide details how to install and run the Local AI Image Generation Platform on a Windows machine.

## System Prerequisites

1.  **Windows 10/11**
2.  **ComfyUI**: Must be installed and running on `http://127.0.0.1:8188`.
3.  **Python 3.10+**: Must be installed and added to your system `PATH`.
4.  **Node.js 18+**: Must be installed and added to your system `PATH`.

## Fresh Machine Setup (First-Time Launch)

Follow these steps strictly in order:

### 1. Backend Setup
Navigate to the `backend` folder and run the installation script:
```cmd
cd backend
install_backend.bat
```
*This automatically creates a Python virtual environment, installs requirements, and copies `.env.example` to `.env`.*

### 2. Frontend Setup
Navigate to the `frontend` folder and run the installation script:
```cmd
cd frontend
install_frontend.bat
```
*This installs Node dependencies and creates `.env.local`.*

### 3. Start ComfyUI
Ensure your ComfyUI instance is running. The platform communicates with it over `http://127.0.0.1:8188`.

### 4. Launch the Platform
From the root directory, run:
```cmd
start_platform.bat
```
*This will orchestrate the startup of the FastAPI server, the background Generation Worker, and the Next.js frontend, opening your browser automatically when ready.*

## Architecture & Ports

-   **Frontend (Next.js)**: `http://localhost:4001`
-   **Backend (FastAPI)**: `http://127.0.0.1:8000`
-   **AI Engine (ComfyUI)**: `http://127.0.0.1:8188`

## Critical Constraints & Recommendations

### GPU VRAM & Worker Concurrency
By default, the backend limits `WORKER_CONCURRENCY=1` in the `backend/.env` file. 
**DO NOT increase this value** unless you are running multiple powerful GPUs. Sending parallel image generation requests to a single ComfyUI instance will likely result in Out Of Memory (OOM) crashes on standard consumer GPUs.

### Database Location
The platform uses a zero-config SQLite database. It is located at `backend/data/ai_platform.db` and is created automatically on first launch.

### Asset Storage Location
Generated images, source images, and metadata are stored in `backend/storage/`.

## Common Errors & Troubleshooting

1.  **Error: "Python is not installed"**
    *   Install Python and ensure the "Add Python to PATH" checkbox is checked during installation.
2.  **Error: "Virtual environment not found"**
    *   You bypassed the `install_backend.bat` script. Run it first.
3.  **UI says "ComfyUI Offline"**
    *   Verify ComfyUI is actually running and accessible at `http://127.0.0.1:8188` in your browser. Ensure no firewalls are blocking local ports.

## Maintenance Procedures

### Backup
To safely backup your entire platform state, copy:
1.  `backend/data/ai_platform.db` (Database)
2.  `backend/storage/` (Images)

### Stopping the Platform
Use `stop_platform.bat` from the root directory to gracefully kill the API, Worker, and Frontend terminal windows.
