@echo off
REM DevPossible.Ton Documentation Launcher
REM Copyright (c) 2024 DevPossible, LLC

echo =========================================
echo   DevPossible.Ton Documentation Server
echo   (c) 2024 DevPossible, LLC
echo =========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if documentation exists
if not exist "doc\doc-html\index.html" (
    echo ERROR: Documentation not found at doc\doc-html\index.html
    pause
    exit /b 1
)

echo Starting documentation server on http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the browser after a delay
start /min cmd /c "timeout /t 2 >nul & start http://localhost:8080"

REM Start the server
cd doc\doc-html
npx --yes http-server . -p 8080 -c-1 --cors

echo.
echo Server stopped
pause