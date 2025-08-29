@echo off
REM Windows Development Starter Script
REM Suppresses deprecation warnings for cleaner development output

echo ======================================
echo   Driver Management System - Dev Mode
echo ======================================
echo.
echo [INFO] Starting development servers...
echo [INFO] Frontend: http://localhost:5173
echo [INFO] Backend:  http://localhost:3001
echo [INFO] API:      http://localhost:3001/api
echo.

REM Set environment variable to suppress deprecation warnings
set NODE_OPTIONS=--no-deprecation

REM Start development servers
npm run dev
