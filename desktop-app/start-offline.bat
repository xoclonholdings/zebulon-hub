@echo off
title Zebulon AI System - Offline Mode
color 0A

echo.
echo ████████████████████████████████████████████████
echo █                                              █
echo █           ZEBULON AI SYSTEM                  █
echo █          Offline Desktop Mode                █
echo █                                              █
echo ████████████████████████████████████████████████
echo.

echo [INFO] Starting Zebulon AI System...
echo [INFO] Mode: Offline Desktop
echo [INFO] Port: 5000
echo [INFO] Access URL: http://localhost:5000
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ first.
    echo [INFO] Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist node_modules (
    echo [INFO] Installing dependencies (requires internet for first run)...
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
)

REM Build if needed
if not exist dist (
    echo [INFO] Building application...
    npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
)

echo [INFO] Zebulon AI is now starting...
echo.
echo ████████████████████████████████████████████████
echo █                                              █
echo █  🚀 ZEBULON AI ONLINE - OFFLINE MODE         █
echo █                                              █
echo █  Access: http://localhost:5000               █
echo █  Admin:  Click logo → admin/zebulon2025     █
echo █                                              █
echo █  Press Ctrl+C to stop the server            █
echo █                                              █
echo ████████████████████████████████████████████████
echo.

REM Set environment variables for offline mode
set NODE_ENV=production
set PORT=5000
set OFFLINE_MODE=true

REM Start the application
npm start

pause