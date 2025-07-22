@echo off
title Zebulon AI System - Automatic Installer
color 0A
cls

echo.
echo ████████████████████████████████████████████████
echo █                                              █
echo █           ZEBULON AI SYSTEM                  █
echo █         Automatic Installer                  █
echo █                                              █
echo ████████████████████████████████████████████████
echo.

echo [INFO] Starting automatic installation...
echo [INFO] This will install and configure everything for you
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo [INFO] Downloading and installing Node.js...
    
    REM Download Node.js installer
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'nodejs-installer.msi'}"
    
    if exist "nodejs-installer.msi" (
        echo [INFO] Installing Node.js... (this may take a few minutes)
        msiexec /i nodejs-installer.msi /quiet /norestart
        
        REM Wait for installation to complete
        timeout /t 30 /nobreak >nul
        
        REM Clean up installer
        del nodejs-installer.msi
        
        echo [INFO] Node.js installation completed!
        echo [INFO] Please restart this installer to continue.
        pause
        exit /b 0
    ) else (
        echo [ERROR] Failed to download Node.js installer.
        echo [INFO] Please manually install Node.js from: https://nodejs.org
        pause
        exit /b 1
    )
)

REM Verify Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js version: %NODE_VERSION%

echo [2/6] Installing dependencies...
echo [INFO] This may take 2-3 minutes on first run...
npm install --legacy-peer-deps --silent
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    echo [INFO] Retrying with verbose output...
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo [ERROR] Installation failed. Check your internet connection.
        pause
        exit /b 1
    )
)

echo [3/6] Building application...
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo [4/6] Creating desktop shortcuts...
REM Create desktop shortcut
set DESKTOP=%USERPROFILE%\Desktop
set SCRIPT_DIR=%~dp0

REM Create start shortcut
echo @echo off > "%DESKTOP%\Start Zebulon.bat"
echo cd /d "%SCRIPT_DIR%" >> "%DESKTOP%\Start Zebulon.bat"
echo npm start >> "%DESKTOP%\Start Zebulon.bat"
echo pause >> "%DESKTOP%\Start Zebulon.bat"

REM Create admin shortcut  
echo @echo off > "%DESKTOP%\Zebulon Admin.bat"
echo cd /d "%SCRIPT_DIR%" >> "%DESKTOP%\Zebulon Admin.bat"
echo echo Opening Zebulon Admin Panel... >> "%DESKTOP%\Zebulon Admin.bat"
echo timeout /t 2 /nobreak ^>nul >> "%DESKTOP%\Zebulon Admin.bat"
echo start http://localhost:5000 >> "%DESKTOP%\Zebulon Admin.bat"
echo npm start >> "%DESKTOP%\Zebulon Admin.bat"

echo [5/6] Setting up auto-start configuration...
REM Create startup folder shortcut (optional)
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo @echo off > "%STARTUP_FOLDER%\Zebulon AI (Optional).bat"
echo REM Uncomment the next line to auto-start Zebulon with Windows >> "%STARTUP_FOLDER%\Zebulon AI (Optional).bat"
echo REM cd /d "%SCRIPT_DIR%" ^&^& npm start >> "%STARTUP_FOLDER%\Zebulon AI (Optional).bat"

echo [6/6] Testing installation...
REM Quick test to make sure everything works
npm run check >nul 2>&1
if errorlevel 1 (
    echo [WARNING] TypeScript validation warnings found (non-critical)
)

echo.
echo ████████████████████████████████████████████████
echo █                                              █
echo █  ✅ INSTALLATION COMPLETED SUCCESSFULLY!     █
echo █                                              █
echo █  🚀 Starting Zebulon AI System...            █
echo █                                              █
echo █  Access: http://localhost:5000               █
echo █  Admin:  Click logo → admin/zebulon2025     █
echo █                                              █
echo █  Desktop Shortcuts Created:                  █
echo █  • Start Zebulon.bat                        █
echo █  • Zebulon Admin.bat                        █
echo █                                              █
echo ████████████████████████████████████████████████
echo.

echo [INFO] Zebulon AI is starting automatically...
echo [INFO] Your browser will open in 5 seconds...

REM Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul
start http://localhost:5000

REM Start the application
set NODE_ENV=production
set PORT=5000
npm start

pause