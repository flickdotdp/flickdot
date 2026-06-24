@echo off
echo Stopping Frontend Server...
taskkill /FI "WINDOWTITLE eq Local AI Platform - Frontend Server*" /T /F >nul 2>&1
echo Frontend Server Stopped.
