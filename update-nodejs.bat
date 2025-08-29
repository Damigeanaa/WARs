@echo off
REM Node.js Update Script for Windows - Driver Management System
REM This script helps update Node.js to the latest LTS version on Windows

echo.
echo ======================================
echo   Node.js Update Helper for Windows
echo ======================================
echo.

echo [INFO] Current Node.js version:
node --version 2>nul || echo [ERROR] Node.js not found in PATH

echo.
echo [INFO] Current npm version:
npm --version 2>nul || echo [ERROR] npm not found in PATH

echo.
echo [WARNING] This script will guide you through updating Node.js on Windows.
echo [WARNING] Please follow these steps manually:
echo.

echo 1. Download Node.js 22.x LTS from: https://nodejs.org/en/download/
echo 2. Run the installer as Administrator
echo 3. Restart your command prompt/PowerShell
echo 4. Run this script again to verify the installation

echo.
echo [INFO] Alternative: Use a package manager
echo   - Using Chocolatey: choco install nodejs --version=22.5.4
echo   - Using winget: winget install OpenJS.NodeJS.LTS
echo   - Using scoop: scoop install nodejs-lts

echo.
echo [INFO] After installing Node.js 22.x, run the following commands:
echo.
echo   npm install -g npm@latest
echo   npm install -g pm2@latest
echo.
echo   cd server
echo   npm update
echo   npm run build
echo.
echo   cd ../client  
echo   npm update
echo   npm run build
echo.
echo [INFO] Don't forget to restart your application after the update!

echo.
pause
