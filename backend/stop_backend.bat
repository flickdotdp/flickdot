@echo off
echo Stopping Backend Services...
taskkill /FI "WINDOWTITLE eq FastAPI Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Generation Worker*" /T /F >nul 2>&1
echo Backend Services Stopped.
