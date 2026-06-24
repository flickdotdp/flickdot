@echo off
title Local AI Platform - Shutdown

echo Stopping Platform Services...

echo - Killing Frontend...
cd frontend
call stop_frontend.bat
cd ..

echo - Killing Backend...
cd backend
call stop_backend.bat
cd ..

echo Platform Stopped.
pause
